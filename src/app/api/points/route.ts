import {  PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lineId = searchParams.get('lineId'); 
    if (!lineId) {
      return NextResponse.json(
        { error: "lineId is required" },
        { status: 400 }
      );
    }
    const points = await prisma.lineShape.findMany({
      where: {
        lineId: lineId
      },
      orderBy: [
        { shapeId: 'asc' },
        { shapePointSequence: 'asc' }
      ],
      select: {
        shapeId: true,
        shapePointSequence: true,
        shapePointLatitude: true,
        shapePointLongitude: true,
        line: {
          select: {
            color: true,
            name: true
          }
        }
      }
    })

    // empty hashmap object to prepare for grouping by shapeid, adding position and colors as values
    const grouped: Record<string, { positions: [number, number][], color: string }> = {};
    
    points.forEach(point => {
      // if key of shape id not in hashmap, create it with empty positions, add color
      if (!grouped[point.shapeId]) {
        grouped[point.shapeId] = {
          positions: [],
          color: point.line.color
        };
      }
      //push positions for the current shape id
      grouped[point.shapeId].positions.push([point.shapePointLatitude, point.shapePointLongitude]);
    });
    return NextResponse.json(grouped);

  } catch (error) {
    console.error("Error fetching line shapes:", error);
    return NextResponse.json(
      { error: "Failed to fetch line shapes" },
      { status: 500 }
    );
  }
}