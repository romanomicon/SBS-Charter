// api.js - API configuration and helpers

// API Base URL - change this for production
export const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : 'https://your-domain.com/api'; // Update with your production API URL

/**
 * Get authorization headers with JWT token
 */
export function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Save auth token and user info
 */
export function saveAuth(token, user) {
  localStorage.setItem('authToken', token);
  localStorage.setItem('currentUser', JSON.stringify(user));
}

/**
 * Clear auth data (logout)
 */
export function clearAuth() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!localStorage.getItem('authToken');
}

/**
 * Get current user
 */
export function getCurrentUser() {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
}

/**
 * Verify token with backend
 */
export async function verifyAuth() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      clearAuth();
      return false;
    }

    const data = await response.json();
    if (data.valid) {
      // Update user info if it changed
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      return true;
    }

    clearAuth();
    return false;

  } catch (error) {
    console.error('Auth verification error:', error);
    return false;
  }
}

/**
 * API request helper with automatic auth handling
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);

    // Handle 401 - redirect to login
    if (response.status === 401) {
      clearAuth();
      window.location.href = '/login.html';
      throw new Error('Unauthorized');
    }

    // Parse response
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;

  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}