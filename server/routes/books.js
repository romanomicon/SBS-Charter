// routes/books.js - Books CRUD Routes
import express from 'express';
import { body, validationResult } from 'express-validator';
import { query, transaction } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all books for current user (index/list)
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT book_id, book_title, book_name, key_verse, updated_at 
       FROM books 
       WHERE user_id = $1 
       ORDER BY book_id`,
      [req.user.id]
    );

    // Format as index object (like your current listBooks function)
    const index = {};
    result.rows.forEach(book => {
      index[book.book_id] = {
        bookTitle: book.book_title,
        bookName: book.book_name,
        keyVerse: book.key_verse,
        lastModified: book.updated_at
      };
    });

    res.json({ books: index });

  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// Get single book with all data
router.get('/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;

    // Get book data
    const bookResult = await query(
      `SELECT id, book_id, book_name, book_title, key_verse, updated_at 
       FROM books 
       WHERE user_id = $1 AND book_id = $2`,
      [req.user.id, bookId]
    );

    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const book = bookResult.rows[0];
    const bookUuid = book.id;

    // Get paragraphs
    const paragraphsResult = await query(
      `SELECT start_verse, end_verse, title, verse_text, position 
       FROM paragraphs 
       WHERE book_uuid = $1 
       ORDER BY position`,
      [bookUuid]
    );

    // Get divisions
    const divisionsResult = await query(
      `SELECT title, start_para, end_para, position 
       FROM divisions 
       WHERE book_uuid = $1 
       ORDER BY position`,
      [bookUuid]
    );

    // Get sections
    const sectionsResult = await query(
      `SELECT title, start_para, end_para, position 
       FROM sections 
       WHERE book_uuid = $1 
       ORDER BY position`,
      [bookUuid]
    );

    // Get segments
    const segmentsResult = await query(
      `SELECT title, start_para, end_para, position 
       FROM segments 
       WHERE book_uuid = $1 
       ORDER BY position`,
      [bookUuid]
    );

    // Format response to match your current data structure
    res.json({
      bookId: book.book_id,
      bookName: book.book_name,
      bookTitle: book.book_title,
      keyVerse: book.key_verse,
      lastModified: book.updated_at,
      paragraphs: paragraphsResult.rows,
      divisions: divisionsResult.rows,
      sections: sectionsResult.rows,
      segments: segmentsResult.rows
    });

  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// Save/update book (create or update)
router.post('/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    const { bookName, bookTitle, keyVerse, paragraphs, divisions, sections, segments } = req.body;

    await transaction(async (client) => {
      // Upsert book
      const bookResult = await client.query(
        `INSERT INTO books (user_id, book_id, book_name, book_title, key_verse) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, book_id) 
         DO UPDATE SET 
           book_name = $3,
           book_title = $4,
           key_verse = $5,
           updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [req.user.id, bookId, bookName, bookTitle, keyVerse]
      );

      const bookUuid = bookResult.rows[0].id;

      // Delete existing related data
      await client.query('DELETE FROM paragraphs WHERE book_uuid = $1', [bookUuid]);
      await client.query('DELETE FROM divisions WHERE book_uuid = $1', [bookUuid]);
      await client.query('DELETE FROM sections WHERE book_uuid = $1', [bookUuid]);
      await client.query('DELETE FROM segments WHERE book_uuid = $1', [bookUuid]);

      // Insert paragraphs
      if (paragraphs && paragraphs.length > 0) {
        for (let i = 0; i < paragraphs.length; i++) {
          const p = paragraphs[i];
          await client.query(
            `INSERT INTO paragraphs (book_uuid, start_verse, end_verse, title, verse_text, position) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [bookUuid, p.startVerse, p.endVerse, p.title || '', p.verseText || '', i]
          );
        }
      }

      // Insert divisions
      if (divisions && divisions.length > 0) {
        for (let i = 0; i < divisions.length; i++) {
          const d = divisions[i];
          await client.query(
            `INSERT INTO divisions (book_uuid, title, start_para, end_para, position) 
             VALUES ($1, $2, $3, $4, $5)`,
            [bookUuid, d.title, d.startPara, d.endPara, i]
          );
        }
      }

      // Insert sections
      if (sections && sections.length > 0) {
        for (let i = 0; i < sections.length; i++) {
          const s = sections[i];
          await client.query(
            `INSERT INTO sections (book_uuid, title, start_para, end_para, position) 
             VALUES ($1, $2, $3, $4, $5)`,
            [bookUuid, s.title, s.startPara, s.endPara, i]
          );
        }
      }

      // Insert segments
      if (segments && segments.length > 0) {
        for (let i = 0; i < segments.length; i++) {
          const seg = segments[i];
          await client.query(
            `INSERT INTO segments (book_uuid, title, start_para, end_para, position) 
             VALUES ($1, $2, $3, $4, $5)`,
            [bookUuid, seg.title, seg.startPara, seg.endPara, i]
          );
        }
      }
    });

    res.json({ 
      message: 'Book saved successfully',
      bookId 
    });

  } catch (error) {
    console.error('Error saving book:', error);
    res.status(500).json({ error: 'Failed to save book' });
  }
});

// Delete book
router.delete('/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;

    const result = await query(
      'DELETE FROM books WHERE user_id = $1 AND book_id = $2 RETURNING id',
      [req.user.id, bookId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ message: 'Book deleted successfully' });

  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

export default router;