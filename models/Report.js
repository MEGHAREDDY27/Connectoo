// models/Report.js
const db = require('../config/db');

const BASE_SELECT = `SELECT r.*, COALESCE(u.display_name, u.username) AS author FROM reports r JOIN users u ON u.id = r.user_id`;

function create({ user_id, title, description, location, ward, category, latitude, longitude, image_path }) {
  const info = db
    .prepare(`INSERT INTO reports
      (user_id, title, description, location, ward, category, latitude, longitude, image_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(user_id, title, description, location, ward, category || 'Other', latitude, longitude, image_path || null);
  return info.lastInsertRowid;
}

function findById(id) {
  return db.prepare(BASE_SELECT + ' WHERE r.id = ?').get(id);
}

function findPage(limit, offset) {
  return db
    .prepare(BASE_SELECT + ' ORDER BY r.hype_count DESC, r.created_at DESC, r.id DESC LIMIT ? OFFSET ?')
    .all(limit, offset);
}

function findAll() {
  return db.prepare(BASE_SELECT + ' ORDER BY r.hype_count DESC, r.created_at DESC, r.id DESC').all();
}

function count() {
  return db.prepare('SELECT COUNT(*) AS n FROM reports').get().n;
}

function findByUser(userId) {
  return db.prepare(BASE_SELECT + ' WHERE r.user_id = ? ORDER BY r.created_at DESC, r.id DESC').all(userId);
}

// Deletes only if the report belongs to userId. Returns the deleted row (for image cleanup) or null.
function deleteOwned(id, userId) {
  const row = db.prepare('SELECT * FROM reports WHERE id = ? AND user_id = ?').get(id, userId);
  if (!row) return null;
  db.prepare('DELETE FROM reports WHERE id = ?').run(id);
  return row;
}

function updateStatus(id, status) {
  return db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(status, id).changes > 0;
}

function findFieldTasks(workerId) {
  return db.prepare(BASE_SELECT + ' WHERE r.assigned_to = ? ORDER BY r.created_at DESC, r.id DESC').all(workerId);
}

function findAssignable() {
  return db.prepare(BASE_SELECT + " WHERE r.status IN ('open', 'acknowledged') ORDER BY r.created_at ASC").all();
}

function assign(id, workerId) {
  return db.prepare("UPDATE reports SET assigned_to = ?, status = 'assigned' WHERE id = ? AND status IN ('open', 'acknowledged')").run(workerId, id).changes > 0;
}

function resolveTask(id, workerId, proofImage, proofNote) {
  return db.prepare(`UPDATE reports
    SET status = 'resolved', proof_image = ?, proof_note = ?
    WHERE id = ? AND assigned_to = ? AND status = 'assigned'`)
    .run(proofImage || null, proofNote || null, id, workerId).changes > 0;
}

function dashboardData() {
  return {
    categories: db.prepare('SELECT category AS label, COUNT(*) AS count FROM reports GROUP BY category ORDER BY count DESC').all(),
    wards: db.prepare('SELECT ward AS label, COUNT(*) AS count FROM reports GROUP BY ward ORDER BY count DESC LIMIT 10').all(),
    locations: db.prepare('SELECT id, title, location, ward, status, latitude, longitude FROM reports WHERE latitude IS NOT NULL AND longitude IS NOT NULL').all(),
    workers: db.prepare("SELECT id, username FROM users WHERE role = 'field_worker' ORDER BY username").all(),
  };
}

function stats() {
  const out = { open: 0, acknowledged: 0, assigned: 0, resolved: 0 };
  db.prepare('SELECT status, COUNT(*) AS n FROM reports GROUP BY status')
    .all()
    .forEach((r) => {
      if (r.status in out) out[r.status] = r.n;
    });
  return out;
}

module.exports = {
  create, findById, findPage, findAll, count, findByUser, deleteOwned, updateStatus,
  findFieldTasks, findAssignable, assign, resolveTask, dashboardData, stats,
};
