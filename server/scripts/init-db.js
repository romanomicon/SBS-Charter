// scripts/init-db.js - Initialize database schema
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create connection using DATABASE_URL or individual vars
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'bible_flow',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

async function initDatabase() {
  try {
    console.log('🔄 Initializing database...');

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await pool.query(schema);

    console.log('✅ Database initialized successfully!');
    console.log('📊 Tables created:');
    console.log('   - users');
    console.log('   - books');
    console.log('   - paragraphs');
    console.log('   - divisions');
    console.log('   - sections');
    console.log('   - segments');
    console.log('   - user_preferences');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();