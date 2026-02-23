import express from 'express';

import { buildOnHandReport } from '../reportsCode/onHandReport.js';
import { buildInTransitReport } from '../reportsCode/inTransitReport.js';
import { buildTransportAuditReport } from '../reportsCode/transportAuditReport.js';
import { buildProcessAuditReport } from '../reportsCode/processAuditReport.js';
import { buildMovementLedgerReport } from '../reportsCode/movementLedgerReport.js';
import { buildMmaReport } from '../reportsCode/mmaReport.js';
import { buildSupplierReport } from '../reportsCode/supplierReport.js';

const router = express.Router();

// Index
router.get('/', (req, res) => {
  res.render('report/index');
});

// On Hand
router.get('/onhand', async (req, res) => {
  const report = await buildOnHandReport();
  res.render('report/onHand', { report });
});

// In Transit
router.get('/intransit', async (req, res) => {
  const report = await buildInTransitReport();
  res.render('report/inTransit', { report });
});

// MMA
router.get('/mma', async (req, res) => {
  const report = await buildMmaReport();
  res.render('report/mma', { report });
});

// Supplier
router.get('/supplier', async (req, res) => {
  const report = await buildSupplierReport();
  res.render('report/supplier', { report });
});

// Transport Audit
router.get('/transport-audit', async (req, res) => {
  const report = await buildTransportAuditReport();
  res.render('report/transportAudit', { report });
});

// Process Audit
router.get('/process-audit', async (req, res) => {
  const { processId } = req.query;
  if (!processId) return res.status(400).send('Missing ?processId=');

  const report = await buildProcessAuditReport({ processId });
  res.render('report/processAudit', { report });
});

// Movement Ledger
router.get('/movement-ledger', async (req, res) => {
  const report = await buildMovementLedgerReport(req.query);
  res.render('report/movementLedger', { report });
});

export default router;