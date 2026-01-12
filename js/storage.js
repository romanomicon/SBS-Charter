// storage.js - API-based storage (replaces localStorage)
import { API_BASE_URL, getAuthHeaders } from './api.js';
import { state } from './state.js';

/**
 * List all books for current user
 * Returns: { bookId: { bookTitle, bookName, lastModified }, ... }
 */
export async function listBooks() {
  try {
    const response = await fetch(`${API_BASE_URL}/books`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login.html';
        return {};
      }
      throw new Error('Failed to fetch books');
    }

    const data = await response.json();
    return data.books || {};

  } catch (error) {
    console.error('Error listing books:', error);
    return {};
  }
}

/**
 * Load a specific book by ID
 * Returns: Complete book object with paragraphs, divisions, etc.
 */
export async function loadBook(bookId) {
  try {
    const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login.html';
        return null;
      }
      if (response.status === 404) {
        return null; // Book doesn't exist
      }
      throw new Error('Failed to load book');
    }

    const book = await response.json();
    return book;

  } catch (error) {
    console.error('Error loading book:', error);
    return null;
  }
}

/**
 * Save current book state
 */
export async function saveBook() {
  try {
    if (!state.bookId) {
      console.error('No bookId in state');
      return false;
    }

    const payload = {
      bookName: state.bookName,
      bookTitle: state.bookTitle,
      keyVerse: state.keyVerse,
      paragraphs: state.paragraphs.map((p, idx) => ({
        startVerse: p.startVerse,
        endVerse: p.endVerse,
        title: p.title || '',
        verseText: p.verseText || ''
      })),
      divisions: state.divisions.map(d => ({
        title: d.title,
        startPara: d.startPara,
        endPara: d.endPara
      })),
      sections: state.sections.map(s => ({
        title: s.title,
        startPara: s.startPara,
        endPara: s.endPara
      })),
      segments: state.segments.map(seg => ({
        title: seg.title,
        startPara: seg.startPara,
        endPara: seg.endPara
      }))
    };

    const response = await fetch(`${API_BASE_URL}/books/${state.bookId}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login.html';
        return false;
      }
      throw new Error('Failed to save book');
    }

    console.log('Book saved successfully');
    return true;

  } catch (error) {
    console.error('Error saving book:', error);
    alert('Failed to save book. Please try again.');
    return false;
  }
}

/**
 * Delete a book
 */
export async function deleteBook(bookId) {
  try {
    const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login.html';
        return false;
      }
      throw new Error('Failed to delete book');
    }

    return true;

  } catch (error) {
    console.error('Error deleting book:', error);
    return false;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!localStorage.getItem('authToken');
}

/**
 * Get current user info from token
 */
export function getCurrentUser() {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
}