// routes/citizen.js
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const citizen = require('../controllers/citizenController');
const { isCitizen } = require('../middleware/auth');

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + crypto.randomBytes(6).toString('hex') + EXT[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (EXT[file.mimetype]) return cb(null, true);
    return cb(new Error('Only JPEG, PNG or WEBP images are allowed.'));
  },
});

// Multer rejections become a 400 with the form re-rendered (never a stack trace).
function handleUpload(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller.' : err.message;
    req.session.flash = { type: 'error', message };
    return res.status(400).render('citizen/report-form', { title: 'Report an Issue', form: {} });
  });
}

const router = express.Router();

router.get('/', citizen.getFeed);
router.get('/login', citizen.getLogin);
router.post('/login', citizen.postLogin);
router.get('/register', citizen.getRegister);
router.post('/register', citizen.postRegister);
router.get('/logout', citizen.logout);
router.get('/portfolio', isCitizen, citizen.getPortfolio);
router.get('/report', isCitizen, citizen.getReportForm);
router.post('/report', isCitizen, handleUpload, citizen.postReport);
router.delete('/report/:id', isCitizen, citizen.deleteReport);

module.exports = router;
