// database/seed.js (run with: npm run seed)
const bcrypt = require('bcrypt');
const db = require('../config/db');

const users = [
  { username: 'admin', display_name: 'Connectoo Admin', email: 'admin@civic.local', password: bcrypt.hashSync('Admin@123', 10), role: 'authority' },
  { username: 'officer1', display_name: 'Municipal Officer', email: 'officer1@civic.local', password: bcrypt.hashSync('Officer@123', 10), role: 'authority' },
  { username: 'priya_sharma', display_name: 'Priya Sharma', email: 'priya.sharma@civic.local', password: bcrypt.hashSync('Citizen@123', 10), role: 'citizen' },
  { username: 'rahul_reddy', display_name: 'Rahul Reddy', email: 'rahul.reddy@civic.local', password: bcrypt.hashSync('Citizen@123', 10), role: 'citizen' },
  { username: 'sneha_patel', display_name: 'Sneha Patel', email: 'sneha.patel@civic.local', password: bcrypt.hashSync('Citizen@123', 10), role: 'citizen' },
  { username: 'amit_kumar', display_name: 'Amit Kumar', email: 'amit.kumar@civic.local', password: bcrypt.hashSync('Citizen@123', 10), role: 'citizen' },
];

const reports = [
  {
    username: 'priya_sharma',
    title: 'Overflowing community bin near Madhapur bus stop',
    description: 'The community bin opposite Metro Pillar 112 has been full since Monday morning. Loose waste is spreading onto the footpath, and residents have noticed stray dogs gathering around it. Please arrange collection and clean the surrounding area.',
    location: 'Opposite Metro Pillar 112, Madhapur Main Road',
    ward: 'Ward 12',
    category: 'Sanitation',
    latitude: 17.4483,
    longitude: 78.3915,
    status: 'open',
    hype_count: 12,
  },
  {
    username: 'rahul_reddy',
    title: 'Streetlights out along 4th Cross',
    description: 'Three consecutive streetlights on 4th Cross have not been working for nearly two weeks. The lane is difficult to see after sunset, especially near the school entrance. Residents have reported the issue to the maintenance office and request an inspection.',
    location: '4th Cross, Jubilee Hills',
    ward: 'Ward 9',
    category: 'Lighting',
    latitude: 17.4315,
    longitude: 78.4070,
    status: 'acknowledged',
    hype_count: 7,
    acknowledgement: 'Electrical maintenance team notified; site inspection scheduled.',
  },
  {
    username: 'sneha_patel',
    title: 'Deep pothole on Kukatpally service road',
    description: 'A large pothole has formed on the service road near Kukatpally signal. It fills with rainwater and is hard to distinguish from the road surface, forcing two-wheelers to swerve into traffic. Temporary barricades or repairs would reduce the risk.',
    location: 'Service road near Kukatpally signal',
    ward: 'Ward 15',
    category: 'Roads',
    latitude: 17.4933,
    longitude: 78.3996,
    status: 'resolved',
    hype_count: 9,
    acknowledgement: 'Pothole inspected and repaired by the ward road maintenance team.',
  },
  {
    username: 'amit_kumar',
    title: 'Water leak beside the community park',
    description: 'A steady leak from the roadside water line beside the community park has been running since yesterday evening. Water is pooling across the pedestrian path and reducing pressure for nearby homes. Please inspect the valve and repair the line.',
    location: 'Community park entrance, Manikonda',
    ward: 'Ward 18',
    category: 'Water',
    latitude: 17.4040,
    longitude: 78.3820,
    status: 'open',
    hype_count: 5,
  },
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (username, email, password_hash, role, display_name)
  VALUES (?, ?, ?, ?, ?)
`);
const updateDisplayName = db.prepare('UPDATE users SET display_name = ? WHERE username = ?');
const findUser = db.prepare('SELECT id FROM users WHERE username = ?');
const findReport = db.prepare('SELECT id, user_id FROM reports WHERE title = ? AND location = ?');
const legacyReportTitles = {
  'Overflowing community bin near Madhapur bus stop': 'Overflowing garbage bin near bus stop',
  'Streetlights out along 4th Cross': 'Broken streetlight on 4th Cross',
  'Deep pothole on Kukatpally service road': 'Pothole on service road',
};
const findLegacyReport = db.prepare('SELECT id FROM reports WHERE title = ?');
const insertReport = db.prepare(`
  INSERT INTO reports
    (user_id, title, description, location, ward, category, latitude, longitude, status, hype_count)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const updateSeedReport = db.prepare(`
  UPDATE reports
  SET user_id = ?, title = ?, description = ?, location = ?, ward = ?, category = ?, latitude = ?, longitude = ?
  WHERE id = ?
`);
const findAcknowledgement = db.prepare('SELECT id FROM acknowledgements WHERE report_id = ? LIMIT 1');
const insertAcknowledgement = db.prepare(
  'INSERT INTO acknowledgements (report_id, official_id, note) VALUES (?, ?, ?)'
);

const seed = db.transaction(() => {
  for (const user of users) {
    insertUser.run(user.username, user.email, user.password, user.role, user.display_name);
    updateDisplayName.run(user.display_name, user.username);
  }

  const officer = findUser.get('officer1');
  if (!officer) throw new Error('Unable to find seeded municipal officer account.');

  let inserted = 0;
  for (const report of reports) {
    const author = findUser.get(report.username);
    if (!author) throw new Error(`Unable to find seeded citizen account: ${report.username}`);

    const legacyTitle = legacyReportTitles[report.title];
    let existing = findReport.get(report.title, report.location) ||
      (legacyTitle ? findLegacyReport.get(legacyTitle) : null);
    let reportId;
    if (existing) {
      reportId = existing.id;
      updateSeedReport.run(
        author.id, report.title, report.description, report.location, report.ward,
        report.category, report.latitude, report.longitude, reportId
      );
    } else {
      reportId = insertReport.run(
        author.id, report.title, report.description, report.location, report.ward,
        report.category, report.latitude, report.longitude, report.status, report.hype_count
      ).lastInsertRowid;
      inserted += 1;
    }

    if (report.acknowledgement && !findAcknowledgement.get(reportId)) {
      insertAcknowledgement.run(reportId, officer.id, report.acknowledgement);
    }
  }
  return inserted;
});

const insertedReports = seed();
console.log(`[seed] Sample reports ready; inserted ${insertedReports} new reports.`);
console.log('[seed] Users ready: admin / Admin@123, officer1 / Officer@123, and four realistic citizen profiles.');
