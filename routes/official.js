// routes/official.js  (mounted at the app root; paths are absolute)
const express = require('express');
const official = require('../controllers/officialController');
const { isAuthority } = require('../middleware/auth');

const router = express.Router();

router.get('/official/login', official.getLogin);
router.post('/official/login', official.postLogin);
router.get('/official/logout', official.logout);
router.get('/official/dashboard', isAuthority, official.getDashboard);
router.post('/official/acknowledge/:id', isAuthority, official.acknowledgeReport);
router.post('/official/assign', isAuthority, official.assignReport);
router.post('/official/workers', isAuthority, official.createFieldWorker);

module.exports = router;
