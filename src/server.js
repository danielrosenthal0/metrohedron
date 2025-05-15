import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get('/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        trips: true,
        favoriteLines: true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/user/by-auth0/:auth0Id', async (req, res) => {
  const { auth0Id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Id },
      include: {
        trips: true,
        favoriteLines: true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/sync-user', async (req, res) => {
  const { auth0Id, email, name } = req.body;
  if (!auth0Id || !email) {
    return res.status(400).json({ error: 'auth0Id and email are required' });
  }
  try {
    const user = await prisma.user.upsert({
      where: { auth0Id },
      update: { email, name },
      create: { auth0Id, email, name },
    });
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('Error syncing user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(4000, () => {
  console.log('Express server running on http://localhost:4000');
});