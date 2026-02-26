'use client'

import { useEffect, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { resolveMtaLineColor } from "@/lib/lineColors";

// need this for known issue with leaflet and next js webpack, loses icon png location
// how this typing works: ts does not know type of getIconUrl, hidden by leaflet. this creates a combo type with L.Icon.Default and the unknown optional type of the function, unknown makes it so we don't care about type since it is being deleted anyways
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
interface MapProps {
  center: [number, number];
  zoom?: number;
  lineId?: string;
  lineName?: string;
  lineColor?: string;
  segments?: MapSegmentInput[];
  startStationCoord: [number, number];
  endStationCoord: [number, number]
}

type ShapePoint = [number, number];
type ShapesResponse = Record<string, { positions: ShapePoint[]; color: string }>;
type MapSegmentInput = {
  lineId?: string;
  lineName?: string;
  lineColor?: string;
  startStationCoord: ShapePoint;
  endStationCoord: ShapePoint;
};
type RenderedSegment = { positions: ShapePoint[]; color: string };

function getDistanceSquared(a: ShapePoint, b: ShapePoint) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
}

function findClosestPointIndex(points: ShapePoint[], target: ShapePoint) {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  points.forEach((point, index) => {
    const distance = getDistanceSquared(point, target);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function areSamePoint(a: ShapePoint, b: ShapePoint) {
  return a[0] === b[0] && a[1] === b[1];
}

function buildTripSegment(
  shapes: ShapesResponse,
  startStationCoord: ShapePoint,
  endStationCoord: ShapePoint
) {
  let best: { positions: ShapePoint[]; color: string; score: number } | null = null;

  for (const { positions, color } of Object.values(shapes)) {
    if (positions.length < 2) continue;

    const startIndex = findClosestPointIndex(positions, startStationCoord);
    const endIndex = findClosestPointIndex(positions, endStationCoord);

    const sliced =
      startIndex <= endIndex
        ? positions.slice(startIndex, endIndex + 1)
        : positions.slice(endIndex, startIndex + 1).reverse();

    if (sliced.length < 2) continue;

    const score =
      getDistanceSquared(startStationCoord, positions[startIndex]) +
      getDistanceSquared(endStationCoord, positions[endIndex]);

    if (!best || score < best.score) {
      best = { positions: sliced, color, score };
    }
  }

  if (!best) return null;

  const routePositions = [...best.positions];
  if (!areSamePoint(routePositions[0], startStationCoord)) {
    routePositions.unshift(startStationCoord);
  }
  if (!areSamePoint(routePositions[routePositions.length - 1], endStationCoord)) {
    routePositions.push(endStationCoord);
  }

  return { positions: routePositions, color: best.color };
}

function asSegments(
  segments: MapSegmentInput[] | undefined,
  single: MapSegmentInput
) {
  return segments && segments.length > 0 ? segments : [single];
}

function toFallbackRenderedSegments(segments: MapSegmentInput[], fallbackColor?: string) {
  return segments.map((segment) => ({
    positions: [segment.startStationCoord, segment.endStationCoord] as ShapePoint[],
    color: resolveMtaLineColor(segment.lineName, segment.lineColor, fallbackColor),
  }));
}

export default function Map({
  center,
  zoom = 13,
  lineId,
  lineName,
  lineColor,
  segments,
  startStationCoord,
  endStationCoord,
}: MapProps) {
  const fallbackSegments = asSegments(segments, {
    lineId,
    lineName,
    lineColor,
    startStationCoord,
    endStationCoord,
  });
  const mapStart = fallbackSegments[0]?.startStationCoord ?? startStationCoord;
  const mapEnd = fallbackSegments[fallbackSegments.length - 1]?.endStationCoord ?? endStationCoord;

  const [renderedSegments, setRenderedSegments] = useState<RenderedSegment[]>(
    toFallbackRenderedSegments(fallbackSegments, lineColor)
  );

  useEffect(() => {
    let isCurrent = true;
    const segmentsToRender = asSegments(segments, {
      lineId,
      lineName,
      lineColor,
      startStationCoord,
      endStationCoord,
    });

    const uniqueLineIds = Array.from(
      new Set(segmentsToRender.map((segment) => segment.lineId).filter((candidate): candidate is string => Boolean(candidate)))
    );

    const shapesByLine: Record<string, ShapesResponse> = {};

    Promise.all(
      uniqueLineIds.map(async (id) => {
        try {
          const res = await fetch(`/api/points?lineId=${id}`);
          if (!res.ok) {
            throw new Error(`Failed to fetch shapes for line ${id}`);
          }
          const shapes = (await res.json()) as ShapesResponse;
          shapesByLine[id] = shapes;
        } catch (error) {
          console.error("Error fetching trip shape:", error);
        }
      })
    )
      .then(() => {
        if (!isCurrent) return;

        const builtSegments = segmentsToRender.map((segment) => {
          const fallbackColor = resolveMtaLineColor(segment.lineName, segment.lineColor, lineColor);
          const shapes = segment.lineId ? shapesByLine[segment.lineId] : undefined;
          if (!shapes) {
            return {
              positions: [segment.startStationCoord, segment.endStationCoord] as ShapePoint[],
              color: fallbackColor,
            };
          }

          const built = buildTripSegment(shapes, segment.startStationCoord, segment.endStationCoord);
          if (!built) {
            return {
              positions: [segment.startStationCoord, segment.endStationCoord] as ShapePoint[],
              color: fallbackColor,
            };
          }

          return {
            positions: built.positions,
            color: resolveMtaLineColor(segment.lineName, segment.lineColor, built.color, lineColor),
          };
        });

        setRenderedSegments(builtSegments);
      })
      .catch((error) => {
        console.error("Error building trip segments:", error);
        if (!isCurrent) return;
        setRenderedSegments(toFallbackRenderedSegments(segmentsToRender, lineColor));
      });

    return () => {
      isCurrent = false;
    };
  }, [lineId, lineName, lineColor, startStationCoord, endStationCoord, segments]);

  return (
    <div>
      <MapContainer center={center} 
      zoom={zoom} 
      style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Marker position={mapStart}></Marker>
      <Marker position={mapEnd}></Marker>
      {renderedSegments.map((segment, index) => (
        <Polyline 
          key={index}
          positions={segment.positions}
          color={segment.color}
          weight={3}
          opacity={0.7}
        />
      ))}
      </MapContainer>
    </div>
  )
}
