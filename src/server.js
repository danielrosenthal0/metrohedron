import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from "cors";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
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
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/stations', async (req, res) => {
  try {
    const stations = await prisma.station.findMany();
    res.json(stations);
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

app.get('/lines', async (req, res) => {
  try {
    const lines = await prisma.line.findMany();
    lines.sort((a, b) => {
      const aNum = parseInt(a.name, 10);
      const bNum = parseInt(b.name, 10);
      const aIsNum = !isNaN(aNum);
      const bIsNum = !isNaN(bNum);
      if (aIsNum && bIsNum) return aNum - bNum;
      if (aIsNum) return -1;
      if (bIsNum) return 1;
      return a.name.localeCompare(b.name);
    });
    res.json(lines);
  } catch (error) {
    console.error('Error fetching lines:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

app.post('/new-trip', async (req, res) => {
  const { auth0Id, trip } = req.body;
  try {
    console.log('Received trip:', trip);
    const user = await prisma.user.findUnique({
      where: { auth0Id },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const newTrip = await prisma.trip.create({
      data: {
        ...trip,
        userId: user.id,
      },
    });
    res.json(newTrip);
  } catch (error) {
    console.error('Trip creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/user-trips/:auth0Id', async (req, res) => {
  const { auth0Id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Id },
      include: {
        trips: {
          include: { line: true }
        }
      }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const trips = user.trips.map(trip => ({
      startStation: trip.startStation,
      endStation: trip.endStation,
      line: trip.line?.name || '',
      startTime: trip.startTime,
      endTime: trip.endTime
    }));
    res.json(trips);
  } catch (error) {
    console.error('Error fetching user trips:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(4000, () => {
  console.log('Express server running on http://localhost:4000');
});