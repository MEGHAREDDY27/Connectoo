// config/db.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.resolve(process.env.DB_PATH || path.join(__dirname, '..', 'database', 'connectoo.db'));
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
db.exec(schema);

const userColumns = new Set(db.pragma('table_info(users)').map((column) => column.name));
if (!userColumns.has('display_name')) db.exec('ALTER TABLE users ADD COLUMN display_name TEXT');

const reportColumns = new Set(db.pragma('table_info(reports)').map((column) => column.name));
const reportMigrations = [
  ['category', "ALTER TABLE reports ADD COLUMN category TEXT NOT NULL DEFAULT 'Other'"],
  ['latitude', 'ALTER TABLE reports ADD COLUMN latitude REAL'],
  ['longitude', 'ALTER TABLE reports ADD COLUMN longitude REAL'],
  ['assigned_to', 'ALTER TABLE reports ADD COLUMN assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL'],
  ['proof_image', 'ALTER TABLE reports ADD COLUMN proof_image TEXT'],
  ['proof_note', 'ALTER TABLE reports ADD COLUMN proof_note TEXT'],
];

for (const [column, migration] of reportMigrations) {
  if (!reportColumns.has(column)) db.exec(migration);
}

module.exports = db;
