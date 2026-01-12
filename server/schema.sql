-- Bible Flow Database Schema
-- PostgreSQL 12+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Books table
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id VARCHAR(100) NOT NULL, -- e.g., "Genesis", "Matthew"
  book_name VARCHAR(255),
  book_title VARCHAR(255),
  key_verse TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, book_id) -- Each user can have one version of each book
);

-- Paragraphs table
CREATE TABLE paragraphs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_uuid UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  start_verse VARCHAR(50) NOT NULL,
  end_verse VARCHAR(50) NOT NULL,
  title TEXT,
  verse_text TEXT,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Divisions table
CREATE TABLE divisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_uuid UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  start_para INTEGER NOT NULL,
  end_para INTEGER NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sections table
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_uuid UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  start_para INTEGER NOT NULL,
  end_para INTEGER NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Segments table
CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_uuid UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  start_para INTEGER NOT NULL,
  end_para INTEGER NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme_preset VARCHAR(50) DEFAULT 'green',
  custom_colors JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_book_id ON books(book_id);
CREATE INDEX idx_paragraphs_book_uuid ON paragraphs(book_uuid);
CREATE INDEX idx_divisions_book_uuid ON divisions(book_uuid);
CREATE INDEX idx_sections_book_uuid ON sections(book_uuid);
CREATE INDEX idx_segments_book_uuid ON segments(book_uuid);
CREATE INDEX idx_users_email ON users(email);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();