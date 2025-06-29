import { useState, useRef, useEffect } from 'react';

export const useAudioPlayer = () => {
  const audioRef = useRef(null);
  const [playerState, setPlayerState] = useState({
    currentSong: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playlist: [],
    currentIndex: -1,
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setPlayerState(prev => ({
        ...prev,
        currentTime: audio.currentTime,
        duration: audio.duration || 0,
      }));
    };

    const handleEnded = () => {
      playNext();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const playSong = (song, playlist = []) => {
    const audio = audioRef.current;
    if (!audio) return;

    const index = playlist.findIndex(s => s.id === song.id);
    
    setPlayerState(prev => ({
      ...prev,
      currentSong: song,
      playlist: playlist.length > 0 ? playlist : prev.playlist,
      currentIndex: index >= 0 ? index : prev.currentIndex,
    }));

    audio.src = song.file_url;
    audio.load();
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !playerState.currentSong) return;

    try {
      if (playerState.isPlaying) {
        audio.pause();
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
      } else {
        await audio.play();
        setPlayerState(prev => ({ ...prev, isPlaying: true }));
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const playNext = () => {
    const { playlist, currentIndex } = playerState;
    if (playlist.length === 0 || currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextSong = playlist[nextIndex];
    
    if (nextSong) {
      playSong(nextSong, playlist);
    }
  };

  const playPrevious = () => {
    const { playlist, currentIndex } = playerState;
    if (playlist.length === 0 || currentIndex === -1) return;

    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    const prevSong = playlist[prevIndex];
    
    if (prevSong) {
      playSong(prevSong, playlist);
    }
  };

  const seekTo = (time) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
  };

  const setVolume = (volume) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    setPlayerState(prev => ({ ...prev, volume }));
  };

  return {
    audioRef,
    playerState,
    playSong,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
  };
};