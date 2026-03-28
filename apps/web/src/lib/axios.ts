import axios from 'axios';
import { getUserFriendlyErrorMessage } from '@/src/lib/error-message';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const sanitized = new Error(getUserFriendlyErrorMessage(error));
        return Promise.reject(sanitized);
    },
);

export default apiClient;