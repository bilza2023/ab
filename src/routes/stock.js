import express from 'express';
import { company } from '../application/company.js';
import { appData } from '../application/appData.js';

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
    transportId,
    supplierId,
    shade,
    size,
    qty
  } = req.body;

  await company.dispatch(fromMmaCode, {
    toMmaCode,
    transportId,
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

router.get('/withdraw', (req, res) => {
  const { from } = req.query;
  if (!from) return res.status(400).send('Missing ?from=mmaCode');

  res.render('withdraw/index', { mmaCode: from });
});

router.post('/withdraw', async (req, res) => {
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

router.get('/receive', (req, res) => {
  res.render('receive/index');
});

router.post('/receive', async (req, res) => {
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

export default router;