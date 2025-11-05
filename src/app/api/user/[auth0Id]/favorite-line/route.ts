import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { auth0Id, lineId } = await request.json();

    const user = await prisma.user.findUnique({
      where: { auth0Id },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const updatedUser = await prisma.user.update({
      where: {auth0Id},
      data: {
        favoriteLines: {
          connect: {id: lineId}
        }
      },
      include: {
        favoriteLines: true
      }
    });
    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Setting favorite line error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}