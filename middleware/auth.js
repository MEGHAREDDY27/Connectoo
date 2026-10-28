// middleware/auth.js
function isAuthority(req, res, next) {
  const u = req.session && req.session.user;
  if (u && u.role === 'authority') return next();
  return res.redirect('/official/login');
}

function isCitizen(req, res, next) {
  const u = req.session && req.session.user;
  if (u && u.role === 'citizen') return next();
  return res.redirect('/login');
}

function isFieldWorker(req, res, next) {
  const u = req.session && req.session.user;
  if (u && u.role === 'field_worker') return next();
  return res.redirect('/field/login');
}

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) return next();
  // AJAX callers get JSON instead of a redirect they cannot follow meaningfully
  if (req.xhr || req.get('X-Requested-With') === 'XMLHttpRequest') {
    return res.status(401).json({ error: 'Login required' });
  }
  return res.redirect('/login');
}

function attachUser(req, res, next) {
  res.locals.user = (req.session && req.session.user) || null;
  next();
}

module.exports = { isAuthority, isCitizen, isFieldWorker, isAuthenticated, attachUser };
