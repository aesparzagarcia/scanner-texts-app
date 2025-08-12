const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const path = require('path');
app.use(express.static(path.join(__dirname, '../../../client/scanned-text-web/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../client/scanned-text-web/build', 'index.html'));
});

const db = new sqlite3.Database('./texts.db', (err) => {
  if (err) {
    console.error('Error opening DB', err);
  } else {
    db.run(`CREATE TABLE IF NOT EXISTS texts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

app.post('/texts', (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const stmt = db.prepare('INSERT INTO texts (content) VALUES (?)');
  stmt.run(text, function(err) {
    if (err) {
      res.status(500).json({ error: 'Failed to insert text' });
    } else {
      res.status(201).json({ id: this.lastID, text });
    }
  });
  stmt.finalize();
});

app.delete('/texts', (req, res) => {
  db.run('DELETE FROM texts', function(err) {
    if (err) {
      res.status(500).json({ error: 'Failed to delete texts' });
    } else {
      res.json({ message: 'All texts deleted' });
    }
  });
});

/*app.get('/texts', (req, res) => {
  db.all('SELECT * FROM texts ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Failed to fetch texts' });
    } else {
      res.json(rows);
    }
  });
});*/

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

app.get('/texts', (req, res) => {
  db.all('SELECT * FROM texts ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Failed to fetch texts' });
    } else {
      const mappedRows = rows.map(row => ({
        id: row.id,
        text: row.content,
        createdAt: row.created_at
      }));
      res.json(mappedRows);
    }
  });
});


/*
  In terminal Look for scanned-text-api (at same place as documents/downloads) back run it with node server.js (backs file name)
  In other terminal Look for scanned-text-web (at same place as documents/downloads) front run it with npm 
*/
