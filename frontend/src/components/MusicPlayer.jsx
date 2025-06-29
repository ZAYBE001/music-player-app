import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart } from 'lucide-react';

const MusicPlayer = ({ playerState, togglePlay, playNext, playPrevious, seekTo, setVolume }) => {
  const { currentSong, isPlaying, currentTime, duration, volume } = playerState;

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seekTo(percent * duration);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  if (!currentSong) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4">
        <div className="flex items-center justify-center">
          <p className="text-gray-400">No song selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg">
      <div className="max-w-6xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-4">
          <div 
            className="w-full bg-gray-700 h-1 rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-100"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Song Info */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
              {currentSong.cover_url ? (
                <img 
                  src={currentSong.cover_url} 
                  alt={currentSong.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-gray-400 text-xs">♪</div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-medium truncate">{currentSong.title}</h3>
              <p className="text-sm text-gray-400 truncate">{currentSong.artist}</p>
            </div>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Heart size={20} />
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={playPrevious}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <SkipBack size={24} />
            </button>
            
            <button 
              onClick={togglePlay}
              className="bg-blue-500 hover:bg-blue-600 rounded-full p-3 transition-colors"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            
            <button 
              onClick={playNext}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <SkipForward size={24} />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center space-x-2 flex-1 justify-end">
            <Volume2 size={20} className="text-gray-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 accent-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;