import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { auth0Id, trip } = await request.json();
    
    const user = await prisma.user.findUnique({
      where: { auth0Id },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    console.log(trip)
    const newTrip = await prisma.trip.create({
      data: {
        ...trip,
        userId: user.id,
      },
    });
    
    return NextResponse.json(newTrip);
  } catch (error) {
    console.error('Trip creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}