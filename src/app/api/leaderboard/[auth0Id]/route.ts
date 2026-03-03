import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

function rankRows<T extends { rideCount: number }>(rows: T[]) {
  return rows
    .sort((a, b) => b.rideCount - a.rideCount)
    .map((row, idx) => ({ ...row, rank: idx + 1 }));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ auth0Id: string }> }
) {
  try {
    const { auth0Id } = await params;
    const { searchParams } = new URL(request.url);

    const scope = (searchParams.get('scope') || 'friends').toLowerCase();
    const lineId = searchParams.get('lineId');

    const user = await prisma.user.findUnique({
      where: { auth0Id },
      select: { id: true, auth0Id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let participantIds: string[] = [user.id];

    if (scope === 'global') {
      const users = await prisma.user.findMany({ select: { id: true } });
      participantIds = users.map((item) => item.id);
    } else {
      const friendships = await prisma.friendship.findMany({
        where: {
          status: 'ACCEPTED',
          OR: [{ requesterId: user.id }, { addresseeId: user.id }],
        },
        select: { requesterId: true, addresseeId: true },
      });

      participantIds = Array.from(
        new Set([
          user.id,
          ...friendships.map((item) => (item.requesterId === user.id ? item.addresseeId : item.requesterId)),
        ])
      );
    }

    const participants = await prisma.user.findMany({
      where: { id: { in: participantIds } },
      select: {
        id: true,
        auth0Id: true,
        name: true,
        email: true,
      },
    });

    const overallAgg = await prisma.trip.groupBy({
      by: ['userId'],
      where: { userId: { in: participantIds } },
      _count: { id: true },
    });

    const overallCountMap = new Map(overallAgg.map((row) => [row.userId, row._count.id]));

    const overallLeaderboard = rankRows(
      participants.map((participant) => ({
        userId: participant.id,
        auth0Id: participant.auth0Id,
        name: participant.name,
        email: participant.email,
        rideCount: overallCountMap.get(participant.id) ?? 0,
      }))
    );

    const lineLeaderboard = lineId
      ? rankRows(
          participants.map((participant) => ({
            userId: participant.id,
            auth0Id: participant.auth0Id,
            name: participant.name,
            email: participant.email,
            rideCount: 0,
          }))
        )
      : [];

    if (lineId) {
      const lineAgg = await prisma.trip.groupBy({
        by: ['userId'],
        where: {
          userId: { in: participantIds },
          lineId,
        },
        _count: { id: true },
      });

      const lineCountMap = new Map(lineAgg.map((row) => [row.userId, row._count.id]));

      lineLeaderboard.splice(
        0,
        lineLeaderboard.length,
        ...rankRows(
          participants.map((participant) => ({
            userId: participant.id,
            auth0Id: participant.auth0Id,
            name: participant.name,
            email: participant.email,
            rideCount: lineCountMap.get(participant.id) ?? 0,
          }))
        )
      );
    }

    const userLinesAgg = await prisma.trip.groupBy({
      by: ['lineId'],
      where: { userId: user.id },
      _count: { id: true },
      orderBy: {
        _count: {
          lineId: 'desc',
        },
      },
      take: 10,
    });

    const lines = await prisma.line.findMany({
      where: { id: { in: userLinesAgg.map((row) => row.lineId) } },
      select: { id: true, name: true, color: true },
    });

    const lineMap = new Map(lines.map((line) => [line.id, line]));

    const topLinesForUser = userLinesAgg.map((row) => ({
      lineId: row.lineId,
      lineName: lineMap.get(row.lineId)?.name ?? 'Unknown line',
      lineColor: lineMap.get(row.lineId)?.color ?? '#999999',
      rideCount: row._count.id,
    }));

    return NextResponse.json({
      scope,
      participantCount: participants.length,
      overallLeaderboard,
      lineLeaderboard,
      selectedLineId: lineId,
      topLinesForUser,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
