// models/Comment.js
const db = require('../config/db');

function create({ report_id, user_id, parent_id, body }) {
  const info = db
    .prepare('INSERT INTO comments (report_id, user_id, parent_id, body) VALUES (?, ?, ?, ?)')
    .run(report_id, user_id, parent_id || null, body);
  return info.lastInsertRowid;
}

function findById(id) {
  return db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
}

// Flat list, oldest first; the view partial nests it.
function findByReport(reportId) {
  return db
    .prepare(
      `SELECT c.*, u.username AS author
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.report_id = ?
       ORDER BY c.created_at ASC, c.id ASC`
    )
    .all(reportId);
}

function findByUser(userId) {
  return db
    .prepare(
      `SELECT c.*, r.title AS report_title
       FROM comments c JOIN reports r ON r.id = c.report_id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC, c.id DESC`
    )
    .all(userId);
}

module.exports = { create, findById, findByReport, findByUser };
