// models/Acknowledgement.js
const db = require('../config/db');

function create({ report_id, official_id, note }) {
  const info = db
    .prepare('INSERT INTO acknowledgements (report_id, official_id, note) VALUES (?, ?, ?)')
    .run(report_id, official_id, note || null);
  return info.lastInsertRowid;
}

function findByReport(reportId) {
  return db
    .prepare(
      `SELECT a.*, u.username AS official
       FROM acknowledgements a JOIN users u ON u.id = a.official_id
       WHERE a.report_id = ?
       ORDER BY a.created_at DESC, a.id DESC`
    )
    .all(reportId);
}

module.exports = { create, findByReport };
