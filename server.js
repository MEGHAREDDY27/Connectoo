// server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const methodOverride = require('method-override');

// Opens the DB and executes schema.sql synchronously before the server listens.
require('./config/db');

const { attachUser } = require('./middleware/auth');
const citizenRoutes = require('./routes/citizen');
const officialRoutes = require('./routes/official');
const fieldRoutes = require('./routes/field');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Support <form method="POST"> with a hidden _method=DELETE field (consumed and removed from the body).
app.use(
  methodOverride((req) => {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      const method = req.body._method;
      delete req.body._method;
      return method;
    }
    return undefined;
  })
);

app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, 'database') }),
    secret: process.env.SESSION_SECRET || 'dev-only-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 },
  })
);

app.use(attachUser);

// View helpers available in every template
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.currentPath = req.path;
  res.locals.formatDate = (value) => {
    if (!value) return '';
    const d = new Date(String(value).replace(' ', 'T') + 'Z');
    return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
  };
  res.locals.statusBadge = (status) =>
    ({
      open: 'bg-red-500/15 text-red-300 border border-red-500',
      acknowledged: 'bg-amber-500/15 text-amber-300 border border-amber-500',
      assigned: 'bg-blue-500/15 text-blue-300 border border-blue-500',
      resolved: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500',
    }[status] || 'bg-slate-500/15 text-slate-300 border border-slate-500');
  next();
});

app.use('/', citizenRoutes);
app.use('/', officialRoutes);
app.use('/', fieldRoutes);
app.use('/', reportRoutes);

app.use((req, res) => {
  res.status(404).render('error', { title: 'Not Found', status: 404, message: 'The page you requested does not exist.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  const message = status >= 500 && process.env.NODE_ENV === 'production' ? 'Something went wrong.' : err.message;
  res.status(status).render('error', { title: 'Error', status, message });
});
app.listen(PORT, () => {
  console.log(`Connectoo running at http://localhost:${PORT}`);
});

module.exports = app;
