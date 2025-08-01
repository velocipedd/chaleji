const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./chaleji.db', (err) => {
  if (err) {
    console.error('SQLite connection error:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database for seeding');
});

// Initial Data
const initialSections = [
  {
    type: 'hero',
    content: {
      title: 'Move, Breathe, Discover',
      subtitle: 'Hotels and adventures, designed together.',
    },
  },
];

const initialDestinations = [
  {
    name: 'Manali',
    description: 'Snowy peaks, cozy cafes, and thrilling adventures.',
    image: 'https://source.unsplash.com/random/400x300?manali',
  },
  {
    name: 'Leh-Ladakh',
    description: 'Himalayan vistas and epic bike journeys.',
    image: 'https://source.unsplash.com/random/400x300?ladakh',
  },
  {
    name: 'Kasol',
    description: 'Riverside hostels with vibrant backpacker vibes.',
    image: 'https://source.unsplash.com/random/400x300?kasol',
  },
  {
    name: 'Spiti Valley',
    description: 'Rugged landscapes and ancient monasteries.',
    image: 'https://source.unsplash.com/random/400x300?spiti',
  },
];

// Seed Function
async function seedDatabase() {
  try {
    // Create tables if not exists
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS sections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          content TEXT NOT NULL,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS destinations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          image TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Clear existing data
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM sections', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM destinations', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Insert sections
    for (const section of initialSections) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO sections (type, content) VALUES (?, ?)',
          [section.type, JSON.stringify(section.content)],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    console.log('Sections seeded successfully');

    // Insert destinations
    for (const dest of initialDestinations) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO destinations (name, description, image) VALUES (?, ?, ?)',
          [dest.name, dest.description, dest.image],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    console.log('Destinations seeded successfully');

    // Close database
    db.close((err) => {
      if (err) console.error('Error closing SQLite database:', err.message);
      console.log('SQLite database closed');
    });
  } catch (error) {
    console.error('Error seeding database:', error.message);
    db.close();
  }
}

seedDatabase();