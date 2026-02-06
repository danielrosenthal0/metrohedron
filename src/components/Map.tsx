'use client'

import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
interface MapProps {
  center: [number, number];
  zoom?: number;
  startStationCoord: [number, number];
  endStationCoord: [number, number]
}

export default function Map({center, zoom = 13, startStationCoord, endStationCoord}: MapProps) {
  console.log(center)
  return (
    <div>
      <MapContainer center={center} 
      zoom={zoom} 
      style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Marker position={startStationCoord}></Marker>
        <Marker position={endStationCoord}></Marker>
<Polyline 
          positions={[startStationCoord, endStationCoord]}
          color="blue"
          weight={3}
          opacity={0.7}
        />
      </MapContainer>
    </div>
  )
}