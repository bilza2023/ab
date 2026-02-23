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
  res.render('reports/index');
});

// On Hand
router.get('/onhand', async (req, res) => {
  const report = await buildOnHandReport();
  res.render('reports/onHand', { report });
});

// In Transit
router.get('/intransit', async (req, res) => {
  const report = await buildInTransitReport();
  res.render('reports/inTransit', { report });
});

// MMA
router.get('/mma', async (req, res) => {
  const report = await buildMmaReport();
  res.render('reports/mma', { report });
});

// Supplier
router.get('/supplier', async (req, res) => {
  const report = await buildSupplierReport();
  res.render('reports/supplier', { report });
});

// Transport Audit
router.get('/transport-audit', async (req, res) => {
  const report = await buildTransportAuditReport();
  res.render('reports/transportAudit', { report });
});

// Process Audit
router.get('/process-audit', async (req, res) => {
  const { processId } = req.query;
  if (!processId) return res.status(400).send('Missing ?processId=');

  const report = await buildProcessAuditReport({ processId });
  res.render('reports/processAudit', { report });
});

// Movement Ledger
router.get('/movement-ledger', async (req, res) => {
  const report = await buildMovementLedgerReport(req.query);
  res.render('reports/movementLedger', { report });
});

export default router;