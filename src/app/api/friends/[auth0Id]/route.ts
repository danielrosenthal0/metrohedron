import { FriendshipStatus, PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ auth0Id: string }> }
) {
  try {
    const { auth0Id } = await params;

    const user = await prisma.user.findUnique({
      where: { auth0Id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: user.id }, { addresseeId: user.id }],
      },
      include: {
        requester: {
          select: {
            id: true,
            auth0Id: true,
            name: true,
            email: true,
          },
        },
        addressee: {
          select: {
            id: true,
            auth0Id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const relatedUserIds = Array.from(
      new Set(
        friendships.flatMap((item) => [item.requester.id, item.addressee.id])
      )
    );

    const rideCounts = await prisma.trip.groupBy({
      by: ['userId'],
      where: { userId: { in: relatedUserIds } },
      _count: { id: true },
    });
    const rideCountMap = new Map(rideCounts.map((item) => [item.userId, item._count.id]));

    const friends = friendships
      .filter((item) => item.status === FriendshipStatus.ACCEPTED)
      .map((item) => {
        const friend = item.requesterId === user.id ? item.addressee : item.requester;
        return {
          friendshipId: item.id,
          since: item.acceptedAt,
          user: {
            id: friend.id,
            auth0Id: friend.auth0Id,
            name: friend.name,
            email: friend.email,
            totalRides: rideCountMap.get(friend.id) ?? 0,
          },
        };
      });

    const incomingRequests = friendships
      .filter((item) => item.status === FriendshipStatus.PENDING && item.addresseeId === user.id)
      .map((item) => ({
        friendshipId: item.id,
        createdAt: item.createdAt,
        from: {
          id: item.requester.id,
          auth0Id: item.requester.auth0Id,
          name: item.requester.name,
          email: item.requester.email,
          totalRides: rideCountMap.get(item.requester.id) ?? 0,
        },
      }));

    const outgoingRequests = friendships
      .filter((item) => item.status === FriendshipStatus.PENDING && item.requesterId === user.id)
      .map((item) => ({
        friendshipId: item.id,
        createdAt: item.createdAt,
        to: {
          id: item.addressee.id,
          auth0Id: item.addressee.auth0Id,
          name: item.addressee.name,
          email: item.addressee.email,
          totalRides: rideCountMap.get(item.addressee.id) ?? 0,
        },
      }));

    return NextResponse.json({
      friends,
      incomingRequests,
      outgoingRequests,
    });
  } catch (error) {
    console.error('Error fetching friendships:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
