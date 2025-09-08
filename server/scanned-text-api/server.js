const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
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

// POST - Insert a new text
app.post('/texts', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    // Convert object to string before saving to DB
    const textString = JSON.stringify(text);
    
    const result = await pool.query(
      'INSERT INTO texts (content, status) VALUES ($1, $2) RETURNING id, content, status, created_at',
      [textString, false]
    );
    res.status(201).json({
      id: result.rows[0].id,
      text: result.rows[0].content,
      status: result.rows[0].status,
      createdAt: result.rows[0].created_at
    });
  } catch (err) {
    console.error('❌ Insert error:', err);
    res.status(500).json({ error: 'Failed to insert text' });
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
