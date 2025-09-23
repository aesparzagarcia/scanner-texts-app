const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required by Render
});

// Create table if it doesn't exist
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS texts (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        status BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ PostgreSQL table ready');
  } catch (err) {
    console.error('❌ Error creating table', err);
  }
})();

// Routes

function normalizeText(s = '') {
  return s
    .trim()
    .replace(/\s+/g, ' ')           // collapse multiple spaces
    .replace(/[^\p{L}\p{N}\s]/gu, '') // remove punctuation (unicode safe)
    .toLowerCase();
}

app.post('/texts', async (req, res) => {
  // Accept a structured object from client:
  // { text: "extracted text...", source: "camera", language: "es", meta: {...} }
  const { text, source, language, meta } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text (string) is required' });
  }

  try {
    // 1) Normalize and compute fingerprint
    const normalized = normalizeText(text);
    const contentHash = crypto.createHash('md5').update(normalized).digest('hex'); // 32 chars

    // 2) Try insert with ON CONFLICT on content_hash
    const result = await pool.query(
      `INSERT INTO texts (content, status, content_hash, source, language, meta)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (content_hash) DO NOTHING
       RETURNING id, content, status, created_at`,
      [text, false, contentHash, source || null, language || null, meta || null]
    );

    if (result.rowCount === 0) {
      // Duplicate detected (hash collision or exact duplicate)
      // Optionally fetch and return the existing row
      const existing = await pool.query(
        'SELECT id, content, status, created_at FROM texts WHERE content_hash = $1',
        [contentHash]
      );
      return res.status(409).json({
        error: 'This text already exists',
        existing: existing.rows[0]
      });
    }

    // inserted successfully
    const row = result.rows[0];
    return res.status(201).json({
      id: row.id,
      text: row.content,
      status: row.status,
      createdAt: row.created_at
    });
  } catch (err) {
    console.error('Insert error:', err);
    return res.status(500).json({ error: 'Failed to insert text' });
  }
});



// DELETE - Remove all texts
app.delete('/texts', async (req, res) => {
  try {
    await pool.query('DELETE FROM texts');
    res.json({ message: 'All texts deleted' });
  } catch (err) {
    console.error('❌ Delete error:', err);
    res.status(500).json({ error: 'Failed to delete texts' });
  }
});

// GET - Retrieve all texts
app.get('/texts', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, content, status, created_at FROM texts ORDER BY created_at DESC'
    );
    const mappedRows = result.rows.map(row => ({
      id: row.id,
      text: row.content,
      status: row.status,
      createdAt: row.created_at
    }));
    res.json(mappedRows);
  } catch (err) {
    console.error('❌ Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch texts' });
  }
});

// PATCH - Update status
app.patch('/texts/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      'UPDATE texts SET status = $1 WHERE id = $2 RETURNING id, content, status, created_at',
      [status, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Text not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server listening at http://localhost:${port}`);
});



/*
  In terminal Look for scanned-text-api (at same place as documents/downloads) back run it with node server.js (backs file name)
  In other terminal Look for scanned-text-web (at same place as documents/downloads) front run it with npm 
*/
