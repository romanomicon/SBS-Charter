// authCheck.js - Protect pages that require authentication
// Include this at the top of protected pages

import { isAuthenticated, verifyAuth, getCurrentUser, clearAuth } from './api.js';

// Check if user is authenticated
if (!isAuthenticated()) {
  // Redirect to login with return URL
  const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/login.html?return=${returnUrl}`;
} else {
  // Verify token is still valid
  verifyAuth().then(isValid => {
    if (!isValid) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login.html?return=${returnUrl}`;
    }
  });
}

// Add logout functionality to navigation
document.addEventListener('DOMContentLoaded', () => {
  // Add user info to nav if element exists
  const userInfoEl = document.getElementById('userInfo');
  if (userInfoEl) {
    const user = getCurrentUser();
    if (user) {
      userInfoEl.textContent = user.username || user.email;
    }
  }

  // Add logout button handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        clearAuth();
        window.location.href = '/login.html';
      }
    });
  }
});