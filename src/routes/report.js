import { buildOnHandReport } from '../reportsCode/onHandReport.js';
import { buildInTransitReport } from '../reportsCode/inTransitReport.js';
import { buildTransportAuditReport } from '../reportsCode/transportAuditReport.js';
import { buildProcessAuditReport } from '../reportsCode/processAuditReport.js';
import { buildMovementLedgerReport } from '../reportsCode/movementLedgerReport.js';

// --------------------------------------------------
// ON HAND
// --------------------------------------------------

export async function onHand(req, res) {
  const report = await buildOnHandReport();
  res.render('report/onHand', { report });
}

// --------------------------------------------------
// IN TRANSIT
// --------------------------------------------------

export async function inTransit(req, res) {
  const report = await buildInTransitReport();
  res.render('report/inTransit', { report });
}

// --------------------------------------------------
// TRANSPORT AUDIT
// --------------------------------------------------

export async function transportAudit(req, res) {
  const { transportId } = req.query;

  if (!transportId) {
    return res.status(400).send('Missing ?transportId=');
  }

  const report = await buildTransportAuditReport({ transportId });
  res.render('report/transportAudit', { report });
}

// --------------------------------------------------
// PROCESS AUDIT
// --------------------------------------------------

export async function processAudit(req, res) {
  const { processId } = req.query;

  if (!processId) {
    return res.status(400).send('Missing ?processId=');
  }

  const report = await buildProcessAuditReport({ processId });
  res.render('report/processAudit', { report });
}

// --------------------------------------------------
// MOVEMENT LEDGER
// --------------------------------------------------

export async function movementLedger(req, res) {
  const report = await buildMovementLedgerReport(req.query);
  res.render('report/movementLedger', { report });
}