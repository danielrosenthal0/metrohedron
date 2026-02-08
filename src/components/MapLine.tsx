'use client'

import { Line } from "@prisma/client";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from "react";

delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


export default function MapLine() {
  const [points, setPoints] = useState<Record<string, { positions: [number, number][], color: string }>>({});

  // const lineId = line.id;
useEffect(() => {
    // all lines
    fetch(`/api/lines`)
      .then(res => res.json())
      .then((data: Line[]) => {
        console.log("got lines: ", data);
        
        // shapes for each line
        data.forEach((line: Line) => {
          fetch(`/api/points?lineId=${line.id}`)
            .then(res => res.json())
            .then((shapes: Record<string, { positions: [number, number][], color: string }>) => {
              
              setPoints(prev => ({
                ...prev,
                ...shapes  
              }));
            })
            .catch(error => {
              console.error(`Error fetching shapes for line ${line.name}:`, error);
            });
        });
      })
      .catch(error => {
        console.error("Error fetching lines:", error);
      });
  }, []);

    
  return (
    <div style={{ height: '500px', width: '100%' }}>
<MapContainer center={[40.7128, -74.0060]} zoom={12} style={{ height: '100%', width: '100%' }}>
  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'>

  </TileLayer>

{Object.entries(points).map(([shapeId, { positions, color }]) => {
          return positions && positions.length > 0 ? (
            <Polyline 
              key={shapeId}
              positions={positions}
              pathOptions={{
                color: color,
                weight: 4,
                opacity: 0.8
              }}
            />
          ) : null;
        })}
</MapContainer>
    </div>
  )
}