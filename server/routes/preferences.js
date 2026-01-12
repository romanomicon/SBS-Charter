// routes/preferences.js - User preferences (theme, settings)
import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get user preferences
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT theme_preset, custom_colors FROM user_preferences WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      // Create default preferences
      await query(
        `INSERT INTO user_preferences (user_id, theme_preset) 
         VALUES ($1, 'green') 
         RETURNING theme_preset, custom_colors`,
        [req.user.id]
      );
      return res.json({ themePreset: 'green', customColors: null });
    }

    res.json({
      themePreset: result.rows[0].theme_preset,
      customColors: result.rows[0].custom_colors
    });

  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update preferences
router.post('/', async (req, res) => {
  try {
    const { themePreset, customColors } = req.body;

    await query(
      `INSERT INTO user_preferences (user_id, theme_preset, custom_colors) 
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         theme_preset = $2,
         custom_colors = $3,
         updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, themePreset || 'green', customColors || null]
    );

    res.json({ message: 'Preferences saved successfully' });

  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

export default router;