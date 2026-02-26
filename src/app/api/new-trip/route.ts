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

    const createdTrips = await prisma.$transaction(
      tripInputs.map((item) =>
        prisma.trip.create({
          data: {
            startStationId: item.startStationId,
            endStationId: item.endStationId,
            lineId: item.lineId,
            tripDate: new Date(item.tripDate),
            userId: user.id,
          },
        })
      )
    );
    
    return NextResponse.json(createdTrips);
  } catch (error) {
    console.error('Trip creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
