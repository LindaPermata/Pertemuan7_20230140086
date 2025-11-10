const express = require('express');
const path = require('path');
const app = express();
const crypto = require('crypto');
const mysql = require('mysql2');
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'kripik879',
  database: 'apikey_db',
  port: 3308
});

db.connect((err) => {
  if (err) console.error('Koneksi database gagal:', err);
  else console.log('Terhubung ke database MySQL');
});

function saveKey(key, callback) {
  const query = 'INSERT INTO api_keys (key_value) VALUES (?)';
  db.query(query, [key], (err, result) => {
    if (err) {
      console.error('Gagal menyimpan ke database:', err);
      return callback(err);
    }
    console.log('API key disimpan ke database:', key);
    callback(null, result);
  });
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/create', (req, res) => {
  const key = crypto.randomBytes(16).toString('hex');
  saveKey(key, (err) => {
    if (err) return res.status(500).json({ error: 'Gagal menyimpan API key' });
    res.json({ key });
  });
});

// ✅ Route baru untuk menguji API key
app.get('/test', (req, res) => {
  const apiKey = req.header('x-api-key'); // Ambil key dari header

  if (!apiKey) {
    return res.status(400).json({ valid: false, message: 'API key tidak ditemukan di header' });
  }

  const query = 'SELECT * FROM api_keys WHERE key_value = ?';
  db.query(query, [apiKey], (err, results) => {
    if (err) {
      console.error('Kesalahan database:', err);
      return res.status(500).json({ valid: false, message: 'Kesalahan server' });
    }

    if (results.length === 0) {
      return res.status(401).json({ valid: false, message: 'API key tidak valid' });
    }

    res.json({ valid: true, message: 'API key valid' });
  });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
