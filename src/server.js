import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import reportRouter from './routes/report.js';
import supplierRouter from './routes/supplier.js';
import stockRouter from './routes/stock.js';
import {appData} from './application/appData.js';

import { destroyAllData } from './utils/destroy.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
// --------------------------------------------------
// View Engine
// --------------------------------------------------

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --------------------------------------------------
// Home
// --------------------------------------------------
app.get('/', (req, res) => {
  const mmas = appData.mmaList();
  const lanes = appData.getLanes();

  res.render('home', { mmas, lanes });
});
// --------------------------------------------------
// Routers
// --------------------------------------------------

app.use('/reports', reportRouter);
app.use('/suppliers', supplierRouter);
app.use('/', stockRouter); // deposit, dispatch, withdraw, receive

// --------------------------------------------------
// System Utilities (DEV ONLY)
// --------------------------------------------------

app.get('/system/destroy', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).send('Forbidden in production');
    }

    await destroyAllData();

    res.send('System wiped clean. (stockTransport + stockLedger cleared)');
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});
app.get('/settings', (req, res) => {
  res.render('settings');
});

// --------------------------------------------------
// 404 handler (no route matched)
app.use((req, res) => {
  res.status(404).render('error', {
    message: 'Page not found.'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).render('error', {
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : err.message
  });
});
// --------------------------------------------------
// Start Server
// --------------------------------------------------

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});