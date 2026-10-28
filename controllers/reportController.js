// controllers/reportController.js
const Report = require('../models/Report');
const Hype = require('../models/Hype');
const Comment = require('../models/Comment');
const Acknowledgement = require('../models/Acknowledgement');

function notFound() {
  const err = new Error('Report not found.');
  err.status = 404;
  return err;
}

exports.getDetail = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const report = Number.isInteger(id) ? Report.findById(id) : null;
    if (!report) return next(notFound());

    const user = req.session.user || null;
    res.render('reports/detail', {
      title: report.title,
      report,
      comments: Comment.findByReport(id),
      hyped: user ? Hype.has(user.id, id) : false,
      acknowledgements: Acknowledgement.findByReport(id),
    });
  } catch (err) {
    next(err);
  }
};

exports.toggleHype = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || !Report.findById(id)) return res.status(404).json({ error: 'Report not found' });
    const result = Hype.toggle(req.session.user.id, id);
    return res.json({ hyped: result.hyped, count: result.count });
  } catch (err) {
    next(err);
  }
};

exports.postComment = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || !Report.findById(id)) return next(notFound());

    const body = (req.body.body || '').trim();
    if (!body) {
      req.session.flash = { type: 'error', message: 'Comment cannot be empty.' };
      return res.redirect('/reports/' + id + '#comments');
    }
    if (body.length > 2000) {
      req.session.flash = { type: 'error', message: 'Comment must be 2000 characters or fewer.' };
      return res.redirect('/reports/' + id + '#comments');
    }

    let parentId = null;
    if (req.body.parent_id) {
      const parent = Comment.findById(parseInt(req.body.parent_id, 10));
      if (!parent || parent.report_id !== id) {
        req.session.flash = { type: 'error', message: 'The comment you replied to no longer exists.' };
        return res.redirect('/reports/' + id + '#comments');
      }
      parentId = parent.id;
    }

    Comment.create({ report_id: id, user_id: req.session.user.id, parent_id: parentId, body });
    return res.redirect('/reports/' + id + '#comments');
  } catch (err) {
    next(err);
  }
};
