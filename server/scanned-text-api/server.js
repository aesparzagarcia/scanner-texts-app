const authMiddleware = require('./authMiddleware');
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

console.log('Has private key:', !!process.env.FIREBASE_PRIVATE_KEY);

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
app.post('/texts', authMiddleware, async (req, res) => {
  const { text } = req.body; // text is an object

  if (!text || !text.nombre || !text.telefono) {
    return res.status(400).json({ error: 'Nombre y telefono son requeridos' });
  }

  try {
    // Check if a scan with same phone OR same name+seccion+colonia exists
    const existing = await pool.query(
      `SELECT id FROM texts
       WHERE content->>'telefono' = $1
          OR (
            content->>'nombre' = $2
            AND content->>'seccion' = $3
            AND content->>'colonia' = $4
          )`,
      [text.telefono, text.nombre, text.seccion, text.colonia]
    );

    const isExisting = existing.rows.length > 0;

    const statusToSave = false;
    const duplicatedToSave = isExisting;

    // Insert the scan
    const result = await pool.query(
      `INSERT INTO texts (content, status, duplicated)
       VALUES ($1::jsonb, $2, $3)
       RETURNING id, content, status, duplicated, created_at`,
      [text, statusToSave, duplicatedToSave]
    );

    res.status(201).json({
      id: result.rows[0].id,
      text: result.rows[0].content,
      status: result.rows[0].status,
      duplicated: result.rows[0].duplicated,
      createdAt: result.rows[0].created_at,
      message: isExisting 
        ? '¡Este registro ya existe!' 
        : '¡Registro guardado correctamente!'
    });

  } catch (err) {
    console.error('❌ Insert error:', err);
    res.status(500).json({ error: 'Failed to insert text' });
  }
});

// DELETE - Remove all texts
app.delete('/texts', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM texts');
    res.json({ message: 'All texts deleted' });
  } catch (err) {
    console.error('❌ Delete error:', err);
    res.status(500).json({ error: 'Failed to delete texts' });
  }
});

// GET - Retrieve all texts
app.get('/texts', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, content, status, duplicated, created_at FROM texts ORDER BY created_at DESC'
    );
    const mappedRows = result.rows.map(row => ({
      id: row.id,
      text: row.content,
      status: row.status,
      duplicated: row.duplicated,
      createdAt: row.created_at
    }));
    res.json(mappedRows);
  } catch (err) {
    console.error('❌ Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch texts' });
  }
});

// PATCH - Update status
app.patch('/texts/:id/status', authMiddleware, async (req, res) => {
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
