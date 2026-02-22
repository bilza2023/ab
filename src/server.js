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
// Home (Wiring Matrix)
// -----------------------------

app.get('/', (req, res) => {
  res.render('home');
});

// ==================================================
// DEPOSIT
// ==================================================

app.get('/deposit', (req, res) => {
  const { to } = req.query;
  if (!to) return res.status(400).send('Missing ?to=mmaCode');

  res.render('deposit/index', { mmaCode: to });
});

app.post('/deposit', async (req, res) => {
  const { toMmaCode, supplierId, shade, size, qty } = req.body;

  await company.deposit(toMmaCode, {
    supplierId,
    shade,
    size,
    qty
  });

  res.redirect('/');
});

// ==================================================
// DISPATCH
// ==================================================

app.get('/dispatch', (req, res) => {
  const { from, to } = req.query;
  if (!from || !to)
    return res.status(400).send('Missing ?from= & ?to=');

  res.render('dispatch/index', {
    fromMmaCode: from,
    toMmaCode: to
  });
});

app.post('/dispatch', async (req, res) => {
  const {
    fromMmaCode,
    toMmaCode,
    transportId,   // ✅ include this
    supplierId,
    shade,
    size,
    qty
  } = req.body;

  await company.dispatch(fromMmaCode, {
    toMmaCode,
    transportId,   // ✅ pass it forward
    supplierId,
    shade,
    size,
    qty
  });

  res.redirect('/');
});

// ==================================================
// WITHDRAW
// ==================================================

app.get('/withdraw', (req, res) => {
  const { from } = req.query;
  if (!from) return res.status(400).send('Missing ?from=mmaCode');

  res.render('withdraw/index', { mmaCode: from });
});

app.post('/withdraw', async (req, res) => {
  const { fromMmaCode, supplierId, shade, size, qty, processId } = req.body;

  await company.withdraw(fromMmaCode, {
    supplierId,
    shade,
    size,
    qty,
    processId
  });

  res.redirect('/');
});

// ==================================================
// RECEIVE
// ==================================================

app.get('/receive', (req, res) => {
  res.render('receive/index');
});
app.post('/receive', async (req, res) => {
  try {
    const { transportId, qty } = req.body;

    await company.receive({
      transportId,
      qty
    });

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(400).send(err.message);
  }
});
// -----------------------------
// Start Server
// -----------------------------

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});