// routes/reports.js
const express = require('express');
const report = require('../controllers/reportController');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

router.get('/reports/:id', report.getDetail);
router.post('/reports/:id/hype', isAuthenticated, report.toggleHype);
router.post('/reports/:id/comments', isAuthenticated, report.postComment);

module.exports = router;
