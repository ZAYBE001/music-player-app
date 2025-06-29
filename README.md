# Music Player - Full Stack Application

A modern music player application built with React frontend and Flask backend, featuring file upload, metadata extraction, and cloud storage integration.

## Features

- 🎵 Upload and play music files (MP3, WAV, FLAC, AAC)
- 🎨 Beautiful, responsive UI with Tailwind CSS
- 📱 Mobile-friendly design
- 🔍 Search functionality
- 📊 Automatic metadata extraction
- ☁️ Cloud storage with Cloudinary
- 🗄️ SQLite database for metadata
- 🎛️ Full audio controls (play, pause, seek, volume)
- 📋 Playlist management

## Tech Stack

### Frontend
- React 18
- Tailwind CSS
- Lucide React (icons)
- Axios (API calls)
- Vite (build tool)

### Backend
- Flask
- SQLite
- Mutagen (metadata extraction)
- Cloudinary (file storage)
- Flask-CORS

## Local Development

### Prerequisites
- Node.js 16+
- Python 3.8+
- Cloudinary account (optional, for cloud storage)

### Frontend Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set environment variables (optional):
   ```bash
   export CLOUDINARY_CLOUD_NAME=your_cloud_name
   export CLOUDINARY_API_KEY=your_api_key
   export CLOUDINARY_API_SECRET=your_api_secret
   ```

5. Start Flask server:
   ```bash
   python app.py
   ```

## Deployment to Render

### Backend Deployment
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
4. Add environment variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

### Frontend Deployment
1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Set the following:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add environment variable:
   - `VITE_API_URL`: Your backend URL (e.g., `https://your-backend.onrender.com/api`)

## API Endpoints

### Songs
- `GET /api/songs` - Get all songs
- `GET /api/songs/:id` - Get specific song
- `POST /api/songs/upload` - Upload new song
- `DELETE /api/songs/:id` - Delete song

### Playlists
- `GET /api/playlists` - Get all playlists
- `POST /api/playlists` - Create playlist
- `POST /api/playlists/:id/songs` - Add song to playlist
- `DELETE /api/playlists/:id/songs/:songId` - Remove song from playlist

### Health
- `GET /api/health` - Health check

## File Storage

The application supports two storage modes:

1. **Cloud Storage (Recommended)**: Files are uploaded to Cloudinary
2. **Local Storage (Fallback)**: Files are stored on the server filesystem

For production deployment, configure Cloudinary credentials for reliable file storage.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request