import { NextResponse } from 'next/server';
import { FriendshipStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { auth0Id, targetEmail, targetAuth0Id } = await request.json();

    if (!auth0Id || (!targetEmail && !targetAuth0Id)) {
      return NextResponse.json(
        { error: 'auth0Id and one of targetEmail or targetAuth0Id are required' },
        { status: 400 }
      );
    }

    const requester = await prisma.user.findUnique({
      where: { auth0Id },
      select: { id: true, auth0Id: true },
    });

    if (!requester) {
      return NextResponse.json({ error: 'Requesting user not found' }, { status: 404 });
    }

    const addressee = await prisma.user.findFirst({
      where: targetAuth0Id
        ? { auth0Id: targetAuth0Id }
        : { email: targetEmail.toLowerCase().trim() },
      select: { id: true, auth0Id: true, email: true, name: true },
    });

    if (!addressee) {
      return NextResponse.json({ error: 'Friend target not found' }, { status: 404 });
    }

    if (requester.id === addressee.id) {
      return NextResponse.json({ error: 'Cannot friend yourself' }, { status: 400 });
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: requester.id, addresseeId: addressee.id },
          { requesterId: addressee.id, addresseeId: requester.id },
        ],
      },
    });

    if (!existing) {
      const created = await prisma.friendship.create({
        data: {
          requesterId: requester.id,
          addresseeId: addressee.id,
          status: FriendshipStatus.PENDING,
        },
      });

      return NextResponse.json({ friendship: created, state: 'REQUESTED' });
    }

    if (existing.status === FriendshipStatus.ACCEPTED) {
      return NextResponse.json(
        { error: 'You are already friends', friendship: existing, state: 'ALREADY_FRIENDS' },
        { status: 409 }
      );
    }

    if (existing.status === FriendshipStatus.BLOCKED) {
      return NextResponse.json(
        { error: 'Friendship is blocked', friendship: existing, state: 'BLOCKED' },
        { status: 403 }
      );
    }

    if (
      existing.status === FriendshipStatus.PENDING &&
      existing.requesterId === addressee.id &&
      existing.addresseeId === requester.id
    ) {
      const accepted = await prisma.friendship.update({
        where: { id: existing.id },
        data: {
          status: FriendshipStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      return NextResponse.json({ friendship: accepted, state: 'AUTO_ACCEPTED' });
    }

    const resetToPending = await prisma.friendship.update({
      where: { id: existing.id },
      data: {
        requesterId: requester.id,
        addresseeId: addressee.id,
        status: FriendshipStatus.PENDING,
        acceptedAt: null,
      },
    });

    return NextResponse.json({ friendship: resetToPending, state: 'REQUESTED' });
  } catch (error) {
    console.error('Error creating friendship request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
