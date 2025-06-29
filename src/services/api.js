import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for file uploads
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      throw new Error('Backend server is not running. Please start the Flask backend.');
    }
    
    if (error.response?.status === 413) {
      throw new Error('File too large. Please choose a smaller file.');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw error;
  }
);

export const musicAPI = {
  getSongs: async () => {
    const response = await api.get('/songs');
    return response.data;
  },

  getSong: async (id) => {
    const response = await api.get(`/songs/${id}`);
    return response.data;
  },

  uploadSong: async (formData) => {
    const response = await api.post('/songs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for uploads
    });
    return response.data;
  },

  deleteSong: async (id) => {
    const response = await api.delete(`/songs/${id}`);
    return response.data;
  },

  getPlaylists: async () => {
    const response = await api.get('/playlists');
    return response.data;
  },

  createPlaylist: async (data) => {
    const response = await api.post('/playlists', data);
    return response.data;
  },

  addToPlaylist: async (playlistId, songId) => {
    const response = await api.post(`/playlists/${playlistId}/songs`, { song_id: songId });
    return response.data;
  },

  removeFromPlaylist: async (playlistId, songId) => {
    const response = await api.delete(`/playlists/${playlistId}/songs/${songId}`);
    return response.data;
  },

  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};