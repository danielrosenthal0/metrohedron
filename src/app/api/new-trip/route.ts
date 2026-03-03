import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { auth0Id, trip, trips } = await request.json();
    
    const user = await prisma.user.findUnique({
      where: { auth0Id },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const tripInputs = Array.isArray(trips) ? trips : trip ? [trip] : [];
    if (tripInputs.length === 0) {
      return NextResponse.json(
        { error: 'At least one trip segment is required' },
        { status: 400 }
      );
    }

    const hasInvalidTrip = tripInputs.some((item) =>
      !item?.startStationId ||
      !item?.endStationId ||
      !item?.lineId ||
      !item?.tripDate
    );

    if (hasInvalidTrip) {
      return NextResponse.json(
        { error: 'Invalid trip payload' },
        { status: 400 }
      );
    }

    const parsedTrips = tripInputs.map((item) => ({
      startStationId: item.startStationId,
      endStationId: item.endStationId,
      lineId: item.lineId,
      tripDate: new Date(item.tripDate),
      userId: user.id,
    }));

    const maxRideDate = parsedTrips.reduce(
      (latest, item) => (item.tripDate > latest ? item.tripDate : latest),
      parsedTrips[0].tripDate
    );

    const lineCounts = parsedTrips.reduce<Record<string, { count: number; latestRide: Date }>>((acc, item) => {
      const current = acc[item.lineId];
      if (!current) {
        acc[item.lineId] = { count: 1, latestRide: item.tripDate };
        return acc;
      }

      acc[item.lineId] = {
        count: current.count + 1,
        latestRide: item.tripDate > current.latestRide ? item.tripDate : current.latestRide,
      };
      return acc;
    }, {});

    const createdTrips = await prisma.$transaction(async (tx) => {
      const tripsCreated = await Promise.all(
        parsedTrips.map((item) =>
          tx.trip.create({
            data: item,
          })
        )
      );

      await tx.userRideStats.upsert({
        where: { userId: user.id },
        update: {
          totalRides: { increment: parsedTrips.length },
          lastRideAt: maxRideDate,
          calculatedAt: new Date(),
        },
        create: {
          userId: user.id,
          totalRides: parsedTrips.length,
          lastRideAt: maxRideDate,
          calculatedAt: new Date(),
        },
      });

      await Promise.all(
        Object.entries(lineCounts).map(([lineId, value]) =>
          tx.userLineRideStats.upsert({
            where: {
              userId_lineId: {
                userId: user.id,
                lineId,
              },
            },
            update: {
              rideCount: { increment: value.count },
              lastRideAt: value.latestRide,
              calculatedAt: new Date(),
            },
            create: {
              userId: user.id,
              lineId,
              rideCount: value.count,
              lastRideAt: value.latestRide,
              calculatedAt: new Date(),
            },
          })
        )
      );

      return tripsCreated;
    });
    
    return NextResponse.json(createdTrips);
  } catch (error) {
    console.error('Trip creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
