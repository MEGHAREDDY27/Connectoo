// models/Hype.js
const db = require('../config/db');

function has(userId, reportId) {
  return !!db.prepare('SELECT 1 FROM hypes WHERE user_id = ? AND report_id = ?').get(userId, reportId);
}

// Insert or delete the hype row and adjust reports.hype_count atomically.
const toggle = db.transaction((userId, reportId) => {
  const existing = db.prepare('SELECT id FROM hypes WHERE user_id = ? AND report_id = ?').get(userId, reportId);
  let hyped;
  if (existing) {
    db.prepare('DELETE FROM hypes WHERE id = ?').run(existing.id);
    db.prepare('UPDATE reports SET hype_count = MAX(hype_count - 1, 0) WHERE id = ?').run(reportId);
    hyped = false;
  } else {
    db.prepare('INSERT INTO hypes (user_id, report_id) VALUES (?, ?)').run(userId, reportId);
    db.prepare('UPDATE reports SET hype_count = hype_count + 1 WHERE id = ?').run(reportId);
    hyped = true;
  }
  const count = db.prepare('SELECT hype_count FROM reports WHERE id = ?').get(reportId).hype_count;
  return { hyped, count };
});

function findReportsByUser(userId) {
  return db
    .prepare(
      `SELECT r.*, u.username AS author, h.created_at AS hyped_at
       FROM hypes h
       JOIN reports r ON r.id = h.report_id
       JOIN users u ON u.id = r.user_id
       WHERE h.user_id = ?
       ORDER BY h.created_at DESC, h.id DESC`
    )
    .all(userId);
}

module.exports = { has, toggle, findReportsByUser };
