import express from 'express';
import { company } from '../application/company.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const stations = await company.getGlobalReport();
  res.render('report/index', { stations });
});

export default router;