
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { company } from './application/company.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------
// Middleware
// -----------------------------

app.use(express.urlencoded({ extended: true }));

// -----------------------------
// View Engine
// -----------------------------

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// -----------------------------
// Home
// -----------------------------

app.get('/', (req, res) => {
  const mmaCodes = company.getAllMmaCodes();

  res.render('home', { mmaCodes });
});

// -----------------------------
// Global Report
// -----------------------------

app.get('/report', async (req, res) => {
  const stations = await company.getGlobalReport();
  res.render('report/index', { stations });
});

// -----------------------------
// Station Report
// -----------------------------

app.get('/mma/:code', async (req, res) => {
  const mmaCode = req.params.code;

  const balances = await company.getStationReport(mmaCode);

  res.render('report/index', {
    stations: [{ code: mmaCode, balances }]
  });
});

// -----------------------------
// Deposit
// -----------------------------

app.get('/mma/:code/deposit', (req, res) => {
  res.render('deposit/index', {
    mmaCode: req.params.code
  });
});

app.post('/mma/:code/deposit', async (req, res) => {
  const mmaCode = req.params.code;

  await company.deposit(mmaCode, req.body);

  res.redirect(`/mma/${mmaCode}`);
});

// -----------------------------
// Dispatch
// -----------------------------

app.get('/mma/:code/dispatch', (req, res) => {
  res.render('dispatch/index', {
    mmaCode: req.params.code
  });
});

app.post('/mma/:code/dispatch', async (req, res) => {
  const mmaCode = req.params.code;

  await company.dispatch(mmaCode, req.body);

  res.redirect(`/mma/${mmaCode}`);
});

// -----------------------------
// Start Server
// -----------------------------

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});