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
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            line: true,
            startStation: true,
            endStation: true
          }
        },
        favoriteLines: true
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
