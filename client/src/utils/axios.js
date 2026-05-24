import axios from 'axios';

const api = axios.create({
  baseURL: 'https://drivex-jxzt.onrender.com/api', // Pointing to local backend
});

// Interceptor to add token to headers
api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
