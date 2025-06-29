import React, { useState, useEffect } from 'react';
import { Music, Plus, Search, Library, AlertCircle } from 'lucide-react';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { musicAPI } from './services/api';
import MusicPlayer from './components/MusicPlayer';
import SongList from './components/SongList';
import UploadModal from './components/UploadModal';

function App() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  const {
    audioRef,
    playerState,
    playSong,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
  } = useAudioPlayer();

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      await musicAPI.healthCheck();
      setBackendStatus('connected');
      loadSongs();
    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendStatus('disconnected');
      setError('Backend server is not running. Please start the Flask backend on port 5000.');
      setLoading(false);
    }
  };

  const loadSongs = async () => {
    try {
      setLoading(true);
      const data = await musicAPI.getSongs();
      setSongs(data);
      setError(null);
    } catch (error) {
      console.error('Failed to load songs:', error);
      setError(error.message || 'Failed to load songs. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSongSelect = (song) => {
    playSong(song, songs);
  };

  const handleUpload = async (formData) => {
    try {
      await musicAPI.uploadSong(formData);
      await loadSongs(); // Reload songs after upload
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error(error.message || 'Upload failed. Please try again.');
    }
  };

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.album.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Music className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Music Player</h1>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-600">Your personal music library</p>
                  <div className={`w-2 h-2 rounded-full ${
                    backendStatus === 'connected' ? 'bg-green-500' : 
                    backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} title={`Backend: ${backendStatus}`} />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search songs, artists, albums..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
              
              <button
                onClick={() => setShowUploadModal(true)}
                disabled={backendStatus !== 'connected'}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={20} />
                <span>Upload</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 pb-32">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="text-red-500" size={20} />
              <div>
                <h3 className="font-medium text-red-800">Connection Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
                <div className="mt-2 space-x-2">
                  <button
                    onClick={checkBackendHealth}
                    className="text-red-600 hover:text-red-800 text-sm underline"
                  >
                    Try again
                  </button>
                  {backendStatus === 'disconnected' && (
                    <span className="text-red-600 text-sm">
                      • Make sure to run: <code className="bg-red-100 px-1 rounded">python backend/app.py</code>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading your music...</span>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="text-center py-12">
            <Library size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No songs found' : 'No music in your library'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Upload your first song to get started'
              }
            </p>
            {!searchTerm && backendStatus === 'connected' && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Upload Music
              </button>
            )}
          </div>
        ) : (
          <SongList
            songs={filteredSongs}
            currentSong={playerState.currentSong}
            isPlaying={playerState.isPlaying}
            onSongSelect={handleSongSelect}
            onSongPlay={togglePlay}
          />
        )}
      </main>

      {/* Music Player */}
      <MusicPlayer
        playerState={playerState}
        togglePlay={togglePlay}
        playNext={playNext}
        playPrevious={playPrevious}
        seekTo={seekTo}
        setVolume={setVolume}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}

export default App;