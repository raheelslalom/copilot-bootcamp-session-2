const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Use file-based DB in production, in-memory in tests
const isTest = process.env.NODE_ENV === 'test';
let dbPath;

if (isTest) {
  dbPath = ':memory:';
} else {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  dbPath = path.join(dataDir, 'todos.db');
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    priority TEXT NOT NULL DEFAULT 'Medium',
    due_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed sample data only for in-memory (test) instances
if (isTest) {
  const seed = db.prepare('INSERT INTO items (name, priority) VALUES (?, ?)');
  seed.run('Item 1', 'Medium');
  seed.run('Item 2', 'High');
  seed.run('Item 3', 'Low');
  console.log('In-memory database initialized with sample data');
}

const VALID_PRIORITIES = ['High', 'Medium', 'Low'];

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running' });
});

// GET all items
app.get('/api/items', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM items ORDER BY created_at DESC').all();
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// POST new item
app.post('/api/items', (req, res) => {
  try {
    const { name, priority = 'Medium', due_date } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Item name is required' });
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: 'Priority must be High, Medium, or Low' });
    }

    const stmt = db.prepare('INSERT INTO items (name, priority, due_date) VALUES (?, ?, ?)');
    const result = stmt.run(name.trim(), priority, due_date || null);
    const newItem = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PUT update item (name, priority, due_date)
app.put('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, priority, due_date } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return res.status(400).json({ error: 'Item name cannot be empty' });
    }

    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: 'Priority must be High, Medium, or Low' });
    }

    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedPriority = priority !== undefined ? priority : existing.priority;
    const updatedDueDate = due_date !== undefined ? (due_date || null) : existing.due_date;

    db.prepare('UPDATE items SET name = ?, priority = ?, due_date = ? WHERE id = ?')
      .run(updatedName, updatedPriority, updatedDueDate, id);

    const updatedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// PATCH toggle completion — must be defined before DELETE /api/items/:id
app.patch('/api/items/:id/complete', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const newCompleted = existing.completed ? 0 : 1;
    db.prepare('UPDATE items SET completed = ? WHERE id = ?').run(newCompleted, id);

    const updatedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error toggling completion:', error);
    res.status(500).json({ error: 'Failed to toggle completion' });
  }
});

// DELETE all completed items — must be defined before DELETE /api/items/:id
app.delete('/api/items/completed', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM items WHERE completed = 1').run();
    res.json({ message: 'Completed items deleted', count: result.changes });
  } catch (error) {
    console.error('Error clearing completed items:', error);
    res.status(500).json({ error: 'Failed to clear completed items' });
  }
});

// DELETE item by id
app.delete('/api/items/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const result = db.prepare('DELETE FROM items WHERE id = ?').run(id);
    if (result.changes > 0) {
      res.json({ message: 'Item deleted successfully', id: parseInt(id) });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = { app, db };