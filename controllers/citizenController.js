// controllers/citizenController.js
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Report = require('../models/Report');
const Hype = require('../models/Hype');
const Comment = require('../models/Comment');

const PAGE_SIZE = 10;
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');

function removeFile(filename) {
  if (filename) fs.unlink(path.join(UPLOAD_DIR, path.basename(filename)), () => {});
}

function sessionUser(u) {
  return { id: u.id, username: u.username, email: u.email, role: u.role };
}

exports.getFeed = async (req, res, next) => {
  try {
    const total = Report.count();
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    let page = parseInt(req.query.page, 10);
    if (!Number.isInteger(page) || page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    const reports = Report.findPage(PAGE_SIZE, (page - 1) * PAGE_SIZE);
    res.render('citizen/feed', { title: 'Connectoo', reports, page, totalPages, total });
  } catch (err) {
    next(err);
  }
};

exports.getLogin = async (req, res, next) => {
  try {
    if (req.session.user) {
      const destinations = { authority: '/official/dashboard', field_worker: '/field/dashboard', citizen: '/' };
      return res.redirect(destinations[req.session.user.role] || '/');
    }
    res.render('citizen/login', { title: 'Sign in', activeTab: req.query.tab || 'citizen' });
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

    if (!ok) {
      req.session.flash = { type: 'error', message: 'Invalid username or password.' };
      return res.redirect('/login');
    }
    if (found.role !== 'citizen') {
      const loginPath = found.role === 'field_worker' ? '/field/login' : '/official/login';
      req.session.flash = { type: 'error', message: 'Use the sign-in tab for your account role.' };
      return res.redirect(loginPath);
    }

    req.session.user = sessionUser(found);
    req.session.flash = { type: 'success', message: 'Welcome back, ' + found.username + '!' };
    return res.redirect('/');
  } catch (err) {
    next(err);
  }
};

exports.getRegister = async (req, res, next) => {
  try {
    if (req.session.user) return res.redirect('/');
    res.render('citizen/register', { title: 'Register', form: {} });
  } catch (err) {
    next(err);
  }
};

exports.postRegister = async (req, res, next) => {
  try {
    const username = (req.body.username || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    const errors = [];
    if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) errors.push('Username must be 3-30 letters, numbers or underscores.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Enter a valid email address.');
    if (password.length < 6) errors.push('Password must be at least 6 characters.');
    if (!errors.length) {
      if (User.findByUsername(username)) errors.push('That username is already taken.');
      if (User.findByEmail(email)) errors.push('That email is already registered.');
    }
    if (errors.length) {
      req.session.flash = { type: 'error', message: errors.join(' ') };
      return res.status(400).render('citizen/register', { title: 'Register', form: { username, email } });
    }

    const id = User.create({ username, email, password_hash: await bcrypt.hash(password, 10), role: 'citizen' });
    req.session.user = sessionUser(User.findById(id));
    req.session.flash = { type: 'success', message: 'Account created. Welcome to Connectoo!' };
    return res.redirect('/');
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('connect.sid');
      res.redirect('/login');
    });
  } catch (err) {
    next(err);
  }
};

exports.getPortfolio = async (req, res, next) => {
  try {
    const uid = req.session.user.id;
    const activity = Comment.findByUser(uid).map((c) => ({
      ...c,
      excerpt: c.body.length > 100 ? c.body.slice(0, 100) + '…' : c.body,
    }));
    res.render('citizen/portfolio', {
      title: 'My Portfolio',
      myReports: Report.findByUser(uid),
      myHypes: Hype.findReportsByUser(uid),
      activity,
    });
  } catch (err) {
    next(err);
  }
};

exports.getReportForm = async (req, res, next) => {
  try {
    res.render('citizen/report-form', { title: 'Report an Issue', form: {} });
  } catch (err) {
    next(err);
  }
};

exports.postReport = async (req, res, next) => {
  try {
    const form = {
      title: (req.body.title || '').trim(),
      description: (req.body.description || '').trim(),
      location: (req.body.location || '').trim(),
      ward: (req.body.ward || '').trim(),
      category: (req.body.category || 'Other').trim(),
      latitude: req.body.latitude ? Number(req.body.latitude) : null,
      longitude: req.body.longitude ? Number(req.body.longitude) : null,
    };
    const errors = [];
    if (!form.title) errors.push('Title is required.');
    else if (form.title.length > 120) errors.push('Title must be 120 characters or fewer.');
    if (!form.description) errors.push('Description is required.');
    if (!form.location) errors.push('Location is required.');
    if (!form.ward) errors.push('Ward is required.');
    if (!['Roads', 'Sanitation', 'Lighting', 'Water', 'Public safety', 'Other'].includes(form.category)) errors.push('Choose a valid issue category.');
    if (form.latitude === null && form.longitude === null) errors.push('Select the issue location on the map.');
    if ((form.latitude === null) !== (form.longitude === null) ||
        (form.latitude !== null && (!Number.isFinite(form.latitude) || !Number.isFinite(form.longitude) ||
          form.latitude < -90 || form.latitude > 90 || form.longitude < -180 || form.longitude > 180))) {
      errors.push('Choose a valid location pin on the map.');
    }

    if (errors.length) {
      if (req.file) removeFile(req.file.filename);
      req.session.flash = { type: 'error', message: errors.join(' ') };
      return res.status(400).render('citizen/report-form', { title: 'Report an Issue', form });
    }

    const id = Report.create({
      user_id: req.session.user.id,
      ...form,
      image_path: req.file ? '/uploads/' + req.file.filename : null,
    });
    req.session.flash = { type: 'success', message: 'Your report has been submitted.' };
    return res.redirect('/reports/' + id);
  } catch (err) {
    if (req.file) removeFile(req.file.filename);
    next(err);
  }
};

exports.deleteReport = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = Number.isInteger(id) ? Report.deleteOwned(id, req.session.user.id) : null;
    if (!deleted) {
      req.session.flash = { type: 'error', message: 'Report not found or you do not own it.' };
    } else {
      removeFile(deleted.image_path);
      req.session.flash = { type: 'success', message: 'Report deleted.' };
    }
    return res.redirect('/portfolio');
  } catch (err) {
    next(err);
  }
};
