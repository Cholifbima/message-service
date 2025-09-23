import axios from 'axios';

// Prefer current origin in production to avoid stale env/config
const originBase = typeof window !== 'undefined' ? window.location.origin : '';
const API_BASE_URL = process.env.REACT_APP_API_URL || (originBase ? `${originBase}/api` : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    if (error.response) {
      // Server responded with error status
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject({ 
        success: false, 
        error: 'No response from server' 
      });
    } else {
      // Something else happened
      return Promise.reject({ 
        success: false, 
        error: error.message 
      });
    }
  }
);

// Channel API
export const channelAPI = {
  getAll: () => api.get('/channels'),
  
  getByPublisher: (publisherId) => api.get(`/channels?publisherId=${publisherId}`),
  
  getForSubscriber: () => api.get('/channels?forSubscriber=true'),
  
  getById: (channelId) => api.get(`/channels/${channelId}`),
  
  create: (channelData) => api.post('/channels', channelData),
  
  update: (channelId, updateData) => api.put(`/channels/${channelId}`, updateData),
  
  delete: (channelId) => api.delete(`/channels/${channelId}`),
  
  getStats: (channelId) => api.get(`/channels/${channelId}/stats`),
  
  getMessages: (channelId, loadFromSQS = false) => 
    api.get(`/channels/${channelId}/messages?loadFromSQS=${loadFromSQS}`)
};

// Message API
export const messageAPI = {
  send: (messageData) => api.post('/messages/send', messageData),
  
  broadcast: (messageData) => api.post('/messages/broadcast', messageData),
  
  getChannelMessages: (channelId, limit = 50) => 
    api.get(`/messages/channel/${channelId}?limit=${limit}`),
  
  poll: (pollData) => api.post('/messages/poll', pollData),
  
  acknowledge: (ackData) => api.post('/messages/ack', ackData)
};

// Subscription API
export const subscriptionAPI = {
  subscribe: (subscriptionData) => api.post('/subscriptions/subscribe', subscriptionData),
  
  unsubscribe: (subscriptionData) => api.post('/subscriptions/unsubscribe', subscriptionData),
  
  getUserSubscriptions: (userId) => api.get(`/subscriptions/user/${userId}`),
  
  getChannelSubscribers: (channelId) => api.get(`/subscriptions/channel/${channelId}`),
  
  checkSubscription: (userId, channelId) => 
    api.get(`/subscriptions/check/${userId}/${channelId}`),
  
  getStats: () => api.get('/subscriptions/stats')
};

// User API
export const userAPI = {
  loginOrCreate: (userData) => api.post('/users/login', userData),
  
  getProfile: (userId) => api.get(`/users/${userId}`),
  
  updateProfile: (userId, updateData) => api.put(`/users/${userId}`, updateData),
  
  getAllUsers: () => api.get('/users'),
  
  getUserStats: (userId) => api.get(`/users/${userId}/stats`)
};

export default api;
