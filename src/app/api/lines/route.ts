import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const lines = await prisma.line.findMany({
      include: { stations: true }
    });
    return NextResponse.json(lines);
  } catch (error) {
    console.error('Error fetching lines:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}