import { NextResponse } from 'next/server';
import { FriendshipStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Action = 'accept' | 'decline' | 'block' | 'cancel';

export async function POST(request: Request) {
  try {
    const { auth0Id, friendshipId, action } = await request.json() as {
      auth0Id?: string;
      friendshipId?: string;
      action?: Action;
    };

    if (!auth0Id || !friendshipId || !action) {
      return NextResponse.json(
        { error: 'auth0Id, friendshipId, and action are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { auth0Id }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship) {
      return NextResponse.json({ error: 'Friendship request not found' }, { status: 404 });
    }

    const isRequester = friendship.requesterId === user.id;
    const isAddressee = friendship.addresseeId === user.id;

    if (!isRequester && !isAddressee) {
      return NextResponse.json({ error: 'Not authorized for this friendship' }, { status: 403 });
    }

    if (action === 'cancel') {
      if (!isRequester || friendship.status !== FriendshipStatus.PENDING) {
        return NextResponse.json({ error: 'Only pending outgoing requests can be canceled' }, { status: 400 });
      }

      const canceled = await prisma.friendship.delete({ where: { id: friendshipId } });
      return NextResponse.json({ friendship: canceled, state: 'CANCELED' });
    }

    if (!isAddressee) {
      return NextResponse.json({ error: 'Only request recipients can perform this action' }, { status: 403 });
    }

    if (friendship.status !== FriendshipStatus.PENDING && action !== 'block') {
      return NextResponse.json({ error: 'Only pending requests can be accepted or declined' }, { status: 400 });
    }

    let status: FriendshipStatus = friendship.status;
    if (action === 'accept') status = FriendshipStatus.ACCEPTED;
    if (action === 'decline') status = FriendshipStatus.DECLINED;
    if (action === 'block') status = FriendshipStatus.BLOCKED;

    const updated = await prisma.friendship.update({
      where: { id: friendshipId },
      data: {
        status,
        acceptedAt: action === 'accept' ? new Date() : null,
      },
    });

    return NextResponse.json({ friendship: updated, state: status });
  } catch (error) {
    console.error('Error responding to friendship request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
