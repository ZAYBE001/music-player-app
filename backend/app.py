from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import sqlite3
import os
import uuid
from werkzeug.utils import secure_filename
import mutagen
from mutagen.mp3 import MP3
from mutagen.flac import FLAC
from mutagen.mp4 import MP4
import cloudinary
import cloudinary.uploader
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'aac', 'm4a'}
DATABASE = 'music.db'

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Configure Cloudinary (you'll need to set these environment variables)
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME', 'your_cloud_name'),
    api_key=os.getenv('CLOUDINARY_API_KEY', 'your_api_key'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET', 'your_api_secret')
)

def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Create songs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            artist TEXT NOT NULL,
            album TEXT NOT NULL,
            duration REAL NOT NULL,
            file_url TEXT NOT NULL,
            cover_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create playlists table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS playlists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create playlist_songs junction table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS playlist_songs (
            playlist_id INTEGER,
            song_id INTEGER,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (playlist_id) REFERENCES playlists (id),
            FOREIGN KEY (song_id) REFERENCES songs (id),
            PRIMARY KEY (playlist_id, song_id)
        )
    ''')
    
    conn.commit()
    conn.close()

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_metadata(file_path):
    """Extract metadata from audio file"""
    try:
        audio_file = mutagen.File(file_path)
        if audio_file is None:
            return None
        
        title = audio_file.get('TIT2', [str(audio_file.get('TITLE', ['Unknown']))])[0]
        artist = audio_file.get('TPE1', [str(audio_file.get('ARTIST', ['Unknown']))])[0]
        album = audio_file.get('TALB', [str(audio_file.get('ALBUM', ['Unknown']))])[0]
        duration = audio_file.info.length if hasattr(audio_file, 'info') else 0
        
        # Handle different tag formats
        if isinstance(title, list):
            title = title[0] if title else 'Unknown'
        if isinstance(artist, list):
            artist = artist[0] if artist else 'Unknown'
        if isinstance(album, list):
            album = album[0] if album else 'Unknown'
            
        return {
            'title': str(title),
            'artist': str(artist),
            'album': str(album),
            'duration': float(duration)
        }
    except Exception as e:
        print(f"Error extracting metadata: {e}")
        return {
            'title': 'Unknown',
            'artist': 'Unknown',
            'album': 'Unknown',
            'duration': 0.0
        }

@app.route('/api/songs', methods=['GET'])
def get_songs():
    """Get all songs"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, title, artist, album, duration, file_url, cover_url, created_at
        FROM songs
        ORDER BY created_at DESC
    ''')
    
    songs = []
    for row in cursor.fetchall():
        songs.append({
            'id': row[0],
            'title': row[1],
            'artist': row[2],
            'album': row[3],
            'duration': row[4],
            'file_url': row[5],
            'cover_url': row[6],
            'created_at': row[7]
        })
    
    conn.close()
    return jsonify(songs)

@app.route('/api/songs/<int:song_id>', methods=['GET'])
def get_song(song_id):
    """Get a specific song"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, title, artist, album, duration, file_url, cover_url, created_at
        FROM songs WHERE id = ?
    ''', (song_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        song = {
            'id': row[0],
            'title': row[1],
            'artist': row[2],
            'album': row[3],
            'duration': row[4],
            'file_url': row[5],
            'cover_url': row[6],
            'created_at': row[7]
        }
        return jsonify(song)
    else:
        return jsonify({'error': 'Song not found'}), 404

@app.route('/api/songs/upload', methods=['POST'])
def upload_song():
    """Upload a new song"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    
    try:
        # Save file temporarily
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        temp_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(temp_path)
        
        # Extract metadata
        metadata = extract_metadata(temp_path)
        if not metadata:
            os.remove(temp_path)
            return jsonify({'error': 'Could not extract metadata'}), 400
        
        # Upload to Cloudinary
        try:
            upload_result = cloudinary.uploader.upload(
                temp_path,
                resource_type="video",  # Use "video" for audio files
                folder="music_player",
                public_id=unique_filename.split('.')[0]
            )
            file_url = upload_result['secure_url']
        except Exception as e:
            # Fallback: serve from local storage
            print(f"Cloudinary upload failed: {e}")
            file_url = f"/api/files/{unique_filename}"
        
        # Save to database
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO songs (title, artist, album, duration, file_url, cover_url)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            metadata['title'],
            metadata['artist'],
            metadata['album'],
            metadata['duration'],
            file_url,
            None  # Cover URL can be added later
        ))
        
        song_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Clean up temp file if uploaded to cloud
        if file_url.startswith('http'):
            os.remove(temp_path)
        
        return jsonify({
            'id': song_id,
            'message': 'Song uploaded successfully',
            'song': {
                'id': song_id,
                'title': metadata['title'],
                'artist': metadata['artist'],
                'album': metadata['album'],
                'duration': metadata['duration'],
                'file_url': file_url,
                'cover_url': None
            }
        }), 201
        
    except Exception as e:
        # Clean up on error
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@app.route('/api/files/<filename>')
def serve_file(filename):
    """Serve uploaded files (fallback for local storage)"""
    try:
        return send_file(os.path.join(UPLOAD_FOLDER, filename))
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404

@app.route('/api/songs/<int:song_id>', methods=['DELETE'])
def delete_song(song_id):
    """Delete a song"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Get song info first
    cursor.execute('SELECT file_url FROM songs WHERE id = ?', (song_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return jsonify({'error': 'Song not found'}), 404
    
    file_url = row[0]
    
    # Delete from database
    cursor.execute('DELETE FROM songs WHERE id = ?', (song_id,))
    cursor.execute('DELETE FROM playlist_songs WHERE song_id = ?', (song_id,))
    conn.commit()
    conn.close()
    
    # Delete file if stored locally
    if not file_url.startswith('http'):
        filename = file_url.split('/')[-1]
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
    
    return jsonify({'message': 'Song deleted successfully'})

@app.route('/api/playlists', methods=['GET'])
def get_playlists():
    """Get all playlists"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT p.id, p.name, p.description, p.created_at,
               COUNT(ps.song_id) as song_count
        FROM playlists p
        LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
        GROUP BY p.id, p.name, p.description, p.created_at
        ORDER BY p.created_at DESC
    ''')
    
    playlists = []
    for row in cursor.fetchall():
        playlists.append({
            'id': row[0],
            'name': row[1],
            'description': row[2],
            'created_at': row[3],
            'song_count': row[4]
        })
    
    conn.close()
    return jsonify(playlists)

@app.route('/api/playlists', methods=['POST'])
def create_playlist():
    """Create a new playlist"""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Playlist name is required'}), 400
    
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO playlists (name, description)
        VALUES (?, ?)
    ''', (data['name'], data.get('description', '')))
    
    playlist_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({
        'id': playlist_id,
        'name': data['name'],
        'description': data.get('description', ''),
        'message': 'Playlist created successfully'
    }), 201

@app.route('/api/playlists/<int:playlist_id>/songs', methods=['POST'])
def add_to_playlist(playlist_id):
    """Add a song to a playlist"""
    data = request.get_json()
    
    if not data or 'song_id' not in data:
        return jsonify({'error': 'Song ID is required'}), 400
    
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO playlist_songs (playlist_id, song_id)
            VALUES (?, ?)
        ''', (playlist_id, data['song_id']))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Song added to playlist successfully'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Song already in playlist'}), 400

@app.route('/api/playlists/<int:playlist_id>/songs/<int:song_id>', methods=['DELETE'])
def remove_from_playlist(playlist_id, song_id):
    """Remove a song from a playlist"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        DELETE FROM playlist_songs
        WHERE playlist_id = ? AND song_id = ?
    ''', (playlist_id, song_id))
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Song not found in playlist'}), 404
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Song removed from playlist successfully'})

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Music Player API is running'})

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)