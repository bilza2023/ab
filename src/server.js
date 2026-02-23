import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import reportRouter from './routes/report.js';
import supplierRouter from './routes/supplier.js';
import stockRouter from './routes/stock.js';

import { destroyAllData } from './utils/destroy.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(express.urlencoded({ extended: true }));

// --------------------------------------------------
// View Engine
// --------------------------------------------------

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --------------------------------------------------
// Home
// --------------------------------------------------

app.get('/', (req, res) => {
  res.render('home');
});

// --------------------------------------------------
// Routers
// --------------------------------------------------

app.use('/reports', reportRouter);
app.use('/suppliers', supplierRouter);
app.use('/', stockRouter); // deposit, dispatch, withdraw, receive
app.use(express.static('public'));
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
// Start Server
// --------------------------------------------------

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});