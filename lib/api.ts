import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This allows cookies to be sent with requests
});

// Request interceptor for adding the access token
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 Unauthorized and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Call the refresh token endpoint
        await apiClient.post('/refresh-token');
        
        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const api = {
  // Auth
  login: (email: string, password: string) => 
    apiClient.post('/token', new URLSearchParams({ 
      'username': email, 
      'password': password 
    })),
  
  loginWithGoogle: () => 
    apiClient.get('/login/google'),
  
  logout: () => 
    apiClient.post('/logout'),
  
  refreshToken: () => 
    apiClient.post('/refresh-token'),
  
  // User
  getCurrentUser: () => 
    apiClient.get('/users/me'),
  
  updateProfile: (data: any) => 
    apiClient.patch('/users/me', data),
  
  // Protected routes example
  getProtectedData: () => 
    apiClient.get('/protected'),
  
  getAdminData: () => 
    apiClient.get('/admin'),
};

export default api; 