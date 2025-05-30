import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get('/user/:auth0Id', async (req, res) => {
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
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(4000, () => {
  console.log('Express server running on http://localhost:4000');
});