import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// List + Form Page
router.get('/', async (req, res) => {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { id: 'desc' }
  });

  res.render('supplier/index', { suppliers });
});

// Create Supplier
router.post('/create', async (req, res) => {
  const { code, name, area } = req.body;

  try {
    await prisma.supplier.create({
      data: {
        code,
        name,
        area
      }
    });
  } catch (err) {
    console.error(err);
  }

  res.redirect('/suppliers');
});

// Delete Supplier
router.post('/delete/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  await prisma.supplier.delete({
    where: { id }
  });

  res.redirect('/suppliers');
});

export default router;