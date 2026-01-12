// login.js - Authentication page logic
import { API_BASE_URL, saveAuth, isAuthenticated } from './api.js';

// Redirect if already logged in
if (isAuthenticated()) {
  window.location.href = '/index.html';
}

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');

// Toggle between login and register forms
showRegisterLink.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.style.display = 'none';
  registerForm.style.display = 'flex';
  clearErrors();
});

showLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  registerForm.style.display = 'none';
  loginForm.style.display = 'flex';
  clearErrors();
});

// Login form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  if (!email || !password) {
    showError('loginError', 'Please fill in all fields');
    return;
  }

  setLoading('login', true);
  clearErrors();

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Save token and user info
    saveAuth(data.token, data.user);

    // Redirect to home
    window.location.href = '/index.html';

  } catch (error) {
    console.error('Login error:', error);
    showError('loginError', error.message || 'Login failed. Please try again.');
  } finally {
    setLoading('login', false);
  }
});

// Register form submission
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('registerEmail').value.trim();
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value;
  const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
  
  // Validation
  if (!email || !password) {
    showError('registerError', 'Please fill in all required fields');
    return;
  }

  if (password.length < 6) {
    showError('registerError', 'Password must be at least 6 characters');
    return;
  }

  if (password !== passwordConfirm) {
    showError('registerError', 'Passwords do not match');
    return;
  }

  setLoading('register', true);
  clearErrors();

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        password,
        username: username || undefined
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    // Save token and user info
    saveAuth(data.token, data.user);

    // Redirect to home
    window.location.href = '/index.html';

  } catch (error) {
    console.error('Registration error:', error);
    showError('registerError', error.message || 'Registration failed. Please try again.');
  } finally {
    setLoading('register', false);
  }
});

// Helper functions
function showError(elementId, message) {
  const errorEl = document.getElementById(elementId);
  errorEl.textContent = message;
  errorEl.classList.add('show');
}

function clearErrors() {
  document.querySelectorAll('.error-message').forEach(el => {
    el.textContent = '';
    el.classList.remove('show');
  });
}

function setLoading(formType, isLoading) {
  const btnText = document.getElementById(`${formType}BtnText`);
  const spinner = document.getElementById(`${formType}Spinner`);
  const form = document.getElementById(`${formType}Form`);
  const submitBtn = form.querySelector('button[type="submit"]');
  
  if (isLoading) {
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';
    submitBtn.disabled = true;
  } else {
    btnText.style.display = 'inline';
    spinner.style.display = 'none';
    submitBtn.disabled = false;
  }
}