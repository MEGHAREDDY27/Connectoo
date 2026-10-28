const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const field = require('../controllers/fieldController');
const { isFieldWorker } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + crypto.randomBytes(6).toString('hex') + extensions[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (extensions[file.mimetype]) return cb(null, true);
    return cb(new Error('Only JPEG, PNG or WEBP images are allowed.'));
  },
});

const router = express.Router();
router.get('/field/login', (req, res) => {
  if (req.session.user && req.session.user.role === 'field_worker') return res.redirect('/field/dashboard');
  return res.redirect('/login?tab=worker');
});
router.post('/field/login', field.postLogin);
router.get('/field/dashboard', isFieldWorker, field.getDashboard);
router.post('/field/tasks/:id/resolve', isFieldWorker, (req, res, next) => {
  upload.single('proof_image')(req, res, (err) => {
    if (!err) return next();
    req.session.flash = { type: 'error', message: err.code === 'LIMIT_FILE_SIZE' ? 'Proof image must be 5 MB or smaller.' : err.message };
    return res.redirect('/field/dashboard');
  });
}, field.resolveTask);

module.exports = router;
