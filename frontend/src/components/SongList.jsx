import React from 'react';
import { Play, Pause, MoreVertical, Clock } from 'lucide-react';

const SongList = ({ songs, currentSong, isPlaying, onSongSelect, onSongPlay }) => {
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Your Music</h2>
        <p className="text-gray-600 mt-1">{songs.length} songs</p>
      </div>

      <div className="overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm font-medium text-gray-500 border-b border-gray-100">
          <div className="col-span-1">#</div>
          <div className="col-span-5">Title</div>
          <div className="col-span-3">Artist</div>
          <div className="col-span-2">Album</div>
          <div className="col-span-1 flex justify-center">
            <Clock size={16} />
          </div>
        </div>

        {/* Song List */}
        <div className="max-h-96 overflow-y-auto">
          {songs.map((song, index) => {
            const isCurrentSong = currentSong?.id === song.id;
            
            return (
              <div
                key={song.id}
                className={`grid grid-cols-12 gap-4 px-6 py-3 hover:bg-gray-50 cursor-pointer group transition-colors ${
                  isCurrentSong ? 'bg-blue-50' : ''
                }`}
                onClick={() => onSongSelect(song)}
              >
                <div className="col-span-1 flex items-center">
                  <div className="w-6 h-6 flex items-center justify-center">
                    {isCurrentSong && isPlaying ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSongPlay();
                        }}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        <Pause size={16} />
                      </button>
                    ) : isCurrentSong ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSongPlay();
                        }}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        <Play size={16} />
                      </button>
                    ) : (
                      <span className="text-gray-400 group-hover:hidden text-sm">
                        {index + 1}
                      </span>
                    )}
                    {!isCurrentSong && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSongSelect(song);
                          onSongPlay();
                        }}
                        className="hidden group-hover:block text-gray-600 hover:text-gray-900"
                      >
                        <Play size={16} />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="col-span-5 flex items-center min-w-0">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                      {song.cover_url ? (
                        <img 
                          src={song.cover_url} 
                          alt={song.title}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">♪</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-medium truncate ${isCurrentSong ? 'text-blue-600' : 'text-gray-900'}`}>
                        {song.title}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-3 flex items-center">
                  <p className="text-gray-600 truncate">{song.artist}</p>
                </div>
                
                <div className="col-span-2 flex items-center">
                  <p className="text-gray-600 truncate">{song.album}</p>
                </div>
                
                <div className="col-span-1 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">{formatDuration(song.duration)}</span>
                  <button className="ml-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SongList;