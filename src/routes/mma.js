
import express from 'express';
import { company } from '../application/company.js';

const router = express.Router();

// Station report
router.get('/:code', async (req, res) => {
  const mmaCode = req.params.code;

  const balances = await company.getStationReport(mmaCode);

  res.render('report/index', {
    stations: [
      { code: mmaCode, balances }
    ]
  });
});

// Deposit form
router.get('/:code/deposit', (req, res) => {
  res.render('deposit/index', {
    mmaCode: req.params.code
  });
});

// Deposit submit
router.post('/:code/deposit', async (req, res) => {
  const mmaCode = req.params.code;

  await company.deposit(mmaCode, req.body);

  res.redirect(`/mma/${mmaCode}`);
});

// Dispatch form
router.get('/:code/dispatch', (req, res) => {
  res.render('dispatch/index', {
    mmaCode: req.params.code
  });
});

// Dispatch submit
router.post('/:code/dispatch', async (req, res) => {
  const mmaCode = req.params.code;

  await company.dispatch(mmaCode, req.body);

  res.redirect(`/mma/${mmaCode}`);
});

export default router;