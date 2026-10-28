const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const Report = require('../models/Report');
const User = require('../models/User');
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

function removeProof(filename) {
  if (filename) {
    fs.unlink(path.join(uploadDir, path.basename(filename)), (err) => {
      if (err && err.code !== 'ENOENT') console.error('Unable to remove rejected proof upload:', err);
    });
  }
}

exports.postLogin = async (req, res, next) => {
  try {
    const username = (req.body.username || '').trim();
    const password = req.body.password || '';
    const found = username ? User.findByUsername(username) : null;
    const ok = found ? await bcrypt.compare(password, found.password_hash) : false;

    if (!ok || found.role !== 'field_worker') {
      req.session.flash = { type: 'error', message: 'Invalid credentials or not a field worker account.' };
      return res.redirect('/login?tab=worker');
    }

    req.session.user = { id: found.id, username: found.username, email: found.email, role: found.role };
    req.session.flash = { type: 'success', message: 'Signed in as ' + found.username + '.' };
    return res.redirect('/field/dashboard');
  } catch (err) {
    next(err);
  }
};

exports.getDashboard = (req, res, next) => {
  try {
    const reports = Report.findFieldTasks(req.session.user.id);
    res.render('field/dashboard', {
      title: 'Assigned field tasks',
      reports,
      locations: Report.dashboardData().locations,
    });
  } catch (err) {
    next(err);
  }
};

exports.resolveTask = (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const note = (req.body.proof_note || '').trim();
    const proofImage = req.file ? '/uploads/' + req.file.filename : null;
    if (!Number.isInteger(id) || (!note && !proofImage) || note.length > 1000) {
      removeProof(req.file && req.file.filename);
      req.session.flash = { type: 'error', message: note.length > 1000 ? 'Completion notes must be 1000 characters or fewer.' : 'Add a completion note or upload a proof image.' };
      return res.redirect('/field/dashboard');
    }
    if (!Report.resolveTask(id, req.session.user.id, proofImage, note)) {
      removeProof(req.file && req.file.filename);
      req.session.flash = { type: 'error', message: 'Task not found, not assigned to you, or already completed.' };
      return res.redirect('/field/dashboard');
    }
    req.session.flash = { type: 'success', message: 'Task marked as resolved.' };
    return res.redirect('/field/dashboard');
  } catch (err) {
    removeProof(req.file && req.file.filename);
    next(err);
  }
};
