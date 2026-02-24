import express from 'express';
import { company } from '../application/company.js';
import { appData } from '../application/appData.js';
import { randomUUID } from 'crypto';

const router = express.Router();

// ==================================================
// DEPOSIT
// ==================================================

router.get('/deposit', async (req, res) => {
    const { to } = req.query;
    if (!to) return res.status(400).send('Missing ?to=mmaCode');
  
    const suppliers = await appData.suppliersList();
    const sizes = appData.sizesList();
    const shades = appData.shadesList();
    const mmas = appData.mmaList();
  
    res.render('deposit/index', {
      mmaCode: to,
      suppliers,
      sizes,
      shades,
      mmas
    });
  });

router.post('/deposit', async (req, res) => {
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

router.get('/dispatch', async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to)
    return res.status(400).send('Missing ?from= & ?to=');

  const suppliers = await appData.suppliersList();
  const sizes = appData.sizesList();
  const shades = appData.shadesList();

  res.render('dispatch/index', {
    fromMmaCode: from,
    toMmaCode: to,
    suppliers,
    sizes,
    shades
  });
});
router.post('/dispatch', async (req, res) => {
  const {
    fromMmaCode,
    toMmaCode,
    supplierId,
    shade,
    size,
    qty,
    transportNumber
  } = req.body;

  // System-generated shipment/grouping key
  const transportId = randomUUID();

  await company.dispatch(fromMmaCode, {
    toMmaCode,
    transportId,
    transportNumber: transportNumber || null,  // 👈 optional
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

router.get('/withdraw', async (req, res) => {
  const { from } = req.query;
  if (!from) return res.status(400).send('Missing ?from=mmaCode');

  const suppliers = await appData.suppliersList();
  const sizes = appData.sizesList();
  const shades = appData.shadesList();

  res.render('withdraw/index', {
    mmaCode: from,
    suppliers,
    sizes,
    shades
  });
});

router.post('/withdraw', async (req, res) => {
  const { fromMmaCode, supplierId, shade, size, qty } = req.body;

  await company.withdraw(fromMmaCode, {
    supplierId,
    shade,
    size,
    qty
  });

  res.redirect('/');
});

// ==================================================
// RECEIVE
// ==================================================

router.get('/receive', (req, res) => {
  const { to, transportId } = req.query;

  res.render('receive/index', {
    to: to || '',
    transportId: transportId || ''
  });
});
router.post('/receive', async (req, res, next) => {
  try {
    const { transportId, qty } = req.body;

    await company.receive({
      transportId,
      qty
    });

    res.redirect('/');
  } catch (err) {
    next(err);   // 👈 this sends to global error handler
  }
});


export default router;