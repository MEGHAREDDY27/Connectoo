// controllers/officialController.js
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const User = require('../models/User');
const Report = require('../models/Report');
const Acknowledgement = require('../models/Acknowledgement');

exports.getLogin = async (req, res, next) => {
  try {
    if (req.session.user && req.session.user.role === 'authority') return res.redirect('/official/dashboard');
    return res.redirect('/login?tab=official');
  } catch (err) {
    next(err);
  }
};

exports.postLogin = async (req, res, next) => {
  try {
    const username = (req.body.username || '').trim();
    const password = req.body.password || '';
    const found = username ? User.findByUsername(username) : null;
    const ok = found ? await bcrypt.compare(password, found.password_hash) : false;

    if (!ok || found.role !== 'authority') {
      req.session.flash = { type: 'error', message: 'Invalid credentials or not an authority account.' };
      return res.redirect('/official/login');
    }

    req.session.user = { id: found.id, username: found.username, email: found.email, role: found.role };
    req.session.flash = { type: 'success', message: 'Signed in as ' + found.username + '.' };
    return res.redirect('/official/dashboard');
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('connect.sid');
      res.redirect('/official/login');
    });
  } catch (err) {
    next(err);
  }
};

exports.getDashboard = async (req, res, next) => {
  try {
    const data = Report.dashboardData();
    res.render('official/dashboard', {
      title: 'Authority Dashboard',
      reports: Report.findAll(),
      stats: Report.stats(),
      ...data,
      assignable: Report.findAssignable(),
    });
  } catch (err) {
    next(err);
  }
};

exports.assignReport = async (req, res, next) => {
  try {
    const reportId = Number.parseInt(req.body.report_id, 10);
    const workerId = Number.parseInt(req.body.worker_id, 10);
    const worker = Number.isInteger(workerId)
      ? db.prepare("SELECT id FROM users WHERE id = ? AND role = 'field_worker'").get(workerId)
      : null;
    if (!Number.isInteger(reportId) || !worker) {
      req.session.flash = { type: 'error', message: 'Choose a valid report and field worker.' };
    } else if (!Report.assign(reportId, worker.id)) {
      req.session.flash = { type: 'error', message: 'This report is no longer available for assignment.' };
    } else {
      req.session.flash = { type: 'success', message: 'Issue assigned to the field worker.' };
    }
    return res.redirect('/official/dashboard');
  } catch (err) {
    next(err);
  }
};

exports.createFieldWorker = async (req, res, next) => {
  try {
    const username = (req.body.username || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    if (!/^[A-Za-z0-9_]{3,30}$/.test(username) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
      req.session.flash = { type: 'error', message: 'Enter a valid username and email, and a password of at least 8 characters.' };
      return res.redirect('/official/dashboard');
    }
    if (User.findByUsername(username) || User.findByEmail(email)) {
      req.session.flash = { type: 'error', message: 'That username or email is already in use.' };
      return res.redirect('/official/dashboard');
    }
    User.create({ username, email, password_hash: await bcrypt.hash(password, 10), role: 'field_worker' });
    req.session.flash = { type: 'success', message: 'Field worker account created.' };
    return res.redirect('/official/dashboard');
  } catch (err) {
    next(err);
  }
};

const acknowledge = db.transaction((reportId, officialId, note) => {
  Report.updateStatus(reportId, 'acknowledged');
  Acknowledgement.create({ report_id: reportId, official_id: officialId, note });
});

exports.acknowledgeReport = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const report = Number.isInteger(id) ? Report.findById(id) : null;
    if (!report) {
      req.session.flash = { type: 'error', message: 'Report not found.' };
    } else if (report.status !== 'open') {
      req.session.flash = { type: 'error', message: 'Only open reports can be acknowledged.' };
    } else {
      const note = (req.body.note || '').trim() || 'Acknowledged by ' + req.session.user.username + '.';
      acknowledge(id, req.session.user.id, note);
      req.session.flash = { type: 'success', message: 'Report #' + id + ' acknowledged.' };
    }
    return res.redirect('/official/dashboard');
  } catch (err) {
    next(err);
  }
};
