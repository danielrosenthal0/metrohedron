import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ auth0Id: string }> }
) {
  try {
    const { auth0Id } = await params;
    const user = await prisma.user.findUnique({
      where: { auth0Id },
      include: {
        trips: {
          include: { line: true }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const trips = user.trips.map(trip => ({
      startStation: trip.startStationId,
      endStation: trip.endStationId,
      line: trip.line?.name || '',
      tripDate: trip.tripDate
    }));
    
    return NextResponse.json(trips);
  } catch (error) {
    console.error('Error fetching user trips:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}