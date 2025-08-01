javascript
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors({
  origin: '*', // Allow all origins for testing; restrict in production
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// SQLite database setup (file-based)
const db = new sqlite3.Database('./chaleji.db', (err) => {
  if (err) {
    console.error('SQLite connection error:', err.message);
  } else {
    console.log('Connected to SQLite database (chaleji.db)');
    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS destinations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        image TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        destinationId INTEGER NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (destinationId) REFERENCES destinations(id)
      )
    `);
    // Seed initial data
    const initialSections = [
      { type: 'hero', content: JSON.stringify({ title: 'Move, Breathe, Discover', subtitle: 'Hotels and adventures, designed together.' }) },
    ];
    const initialDestinations = [
      { name: 'Manali', description: 'Snowy peaks, cozy cafes, and thrilling adventures.', image: 'https://source.unsplash.com/random/400x300?manali' },
      { name: 'Leh-Ladakh', description: 'Himalayan vistas and epic bike journeys.', image: 'https://source.unsplash.com/random/400x300?ladakh' },
      { name: 'Kasol', description: 'Riverside hostels with vibrant backpacker vibes.', image: 'https://source.unsplash.com/random/400x300?kasol' },
      { name: 'Spiti Valley', description: 'Rugged landscapes and ancient monasteries.', image: 'https://source.unsplash.com/random/400x300?spiti' },
    ];
    initialSections.forEach(section => {
      db.run('INSERT OR IGNORE INTO sections (type, content) VALUES (?, ?)', [section.type, section.content]);
    });
    initialDestinations.forEach(dest => {
      db.run('INSERT OR IGNORE INTO destinations (name, description, image) VALUES (?, ?, ?)', [dest.name, dest.description, dest.image]);
    });
  }
});

// API Routes
app.get('/api/sections', (req, res) => {
  console.log('GET /api/sections requested from:', req.ip);
  db.all('SELECT * FROM sections', [], (err, sections) => {
    if (err) {
      console.error('Error fetching sections:', err.message);
      return res.status(500).json({ error: 'Server error', message: err.message });
    }
    db.all('SELECT * FROM destinations', [], (err, destinations) => {
      if (err) {
        console.error('Error fetching destinations:', err.message);
        return res.status(500).json({ error: 'Server error', message: err.message });
      }
      const destinationSection = {
        type: 'destinations',
        content: destinations.map(dest => ({ ...dest, image: dest.image || null })),
      };
      res.json([
        ...sections.map(section => ({ ...section, content: JSON.parse(section.content) })),
        destinationSection,
      ]);
    });
  });
});

app.post('/api/sections', (req, res) => {
  console.log('POST /api/sections requested:', req.body);
  const { type, content } = req.body;
  if (!type || !content) {
    return res.status(400).json({ error: 'Type and content are required' });
  }
  db.run('INSERT INTO sections (type, content) VALUES (?, ?)', [type, JSON.stringify(content)], function (err) {
    if (err) {
      console.error('Error adding section:', err.message);
      return res.status(500).json({ error: 'Server error', message: err.message });
    }
    res.status(201).json({ id: this.lastID, type, content });
  });
});

app.post('/api/destinations', (req, res) => {
  console.log('POST /api/destinations requested:', req.body);
  const { name, description, image } = req.body;
  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description are required' });
  }
  db.run('INSERT INTO destinations (name, description, image) VALUES (?, ?, ?)', [name, description, image || null], function (err) {
    if (err) {
      console.error('Error adding destination:', err.message);
      return res.status(500).json({ error: 'Server error', message: err.message });
    }
    res.status(201).json({ id: this.lastID, name, description, image });
  });
});

app.post('/api/bookings', (req, res) => {
  console.log('POST /api/bookings requested:', req.body);
  const { email, destinationId } = req.body;
  if (!email || !destinationId) {
    return res.status(400).json({ error: 'Email and destinationId are required' });
  }
  db.run('INSERT INTO bookings (email, destinationId) VALUES (?, ?)', [email, destinationId], function (err) {
    if (err) {
      console.error('Error creating booking:', err.message);
      return res.status(500).json({ error: 'Server error', message: err.message });
    }
    res.status(201).json({ id: this.lastID, email, destinationId, createdAt: new Date().toISOString() });
  });
});

// Serve index.html for all non-API routes
app.get('*', (req, res) => {
  console.log('Serving index.html for route:', req.path);
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Close database on process exit
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error('Error closing SQLite database:', err.message);
    console.log('SQLite database closed');
    process.exit(0);
  });
});