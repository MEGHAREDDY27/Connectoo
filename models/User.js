// models/User.js
const db = require('../config/db');

function findByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function findByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function findById(id) {
  return db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?').get(id);
}

function create({ username, email, password_hash, role }) {
  const accountRole = role || 'citizen';
  if (!['citizen', 'authority', 'field_worker'].includes(accountRole)) {
    throw new TypeError('Invalid user role.');
  }
  const info = db
    .prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(username, email, password_hash, accountRole);
  return info.lastInsertRowid;
}

module.exports = { findByUsername, findByEmail, findById, create };
