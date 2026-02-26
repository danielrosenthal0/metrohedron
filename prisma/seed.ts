import { Prisma, PrismaClient } from "@prisma/client";
import * as fs from 'fs';
// import shapes from 'prisma/seed.ts';
const filePath: string = '/Users/danielrosenthal/Documents/metrohedron/prisma/shapes.txt';

const prisma = new PrismaClient();

interface MTAStation {
  gtfs_stop_id: string;
  stop_name: string;
  daytime_routes?: string;
  borough?: string;
  gtfs_latitude?: string;
  gtfs_longitude?: string; 
}
async function seedLineShapes() {
  console.log("starting shape parsing")
  const fileContent: string = fs.readFileSync(filePath, 'utf-8').replace(/\0/g, ''); 
  const lines: string[] = fileContent.split('\n');
  const existingLines = await prisma.line.findMany({
    select: { id: true, name: true }
  });
  
  const lineNameToId = new Map(
    existingLines.map(line => [line.name, line.id])
  );
  const dataAsList: Prisma.LineShapeCreateManyInput[] = [];
  lines.slice(1).forEach( (line: string) => {
    if (line.trim()) {
      const columns: string[] = line.trim().split(",");
      // parse line from first column
      const shapeId = columns[0]
      let currLine: string = columns[0].split('.')[0]
      if (currLine == "SI") {
        currLine = "SIR"
      }
      const lineId = lineNameToId.get(currLine);
      if (!lineId) {
        console.warn(`Line ${currLine} not found in database, skipping`);
        return;
      }
      dataAsList.push({
        shapeId: shapeId,
          shapePointSequence: parseInt(columns[1]),
          shapePointLatitude: Number(columns[2]),
          shapePointLongitude: Number(columns[3]),
          lineId: lineId
      })
    }


  })
      await prisma.lineShape.createMany({
      data: dataAsList
    })

}

const lineColors: Record<string, string> = {
  // Blue
  'A': '#0062CF',
  'C': '#0062CF',
  'E': '#0062CF',
  
  // Orange
  'B': '#EB6800',
  'D': '#EB6800',
  'F': '#EB6800',
  'M': '#EB6800',
  
  // Light Green
  'G': '#799534',
  
  // Brown
  'J': '#8E5C33',
  'Z': '#8E5C33',
  
  // Grey
  'L': '#7C858C',
  
  // Yellow
  'N': '#F6BC26',
  'Q': '#F6BC26',
  'R': '#F6BC26',
  'W': '#F6BC26',
  
  // Red
  '1': '#D82233',
  '2': '#D82233',
  '3': '#D82233',
  
  // Dark Green
  '4': '#009952',
  '5': '#009952',
  '6': '#009952',
  
  // Purple
  '7': '#9A38A1',
  
  // Teal
  'T': '#008EB7',
  
  // MTA Blue (SIR)
  'SIR': '#08179C',
  
  // Shuttles (Grey)
  'S': '#7C858C',
  'H': '#7C858C',
  'FS': '#7C858C',
  'GS': '#7C858C',
  'SI': '#08179C'
};
async function main() {
  // Clear existing data 
  await prisma.lineShape.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.station.deleteMany({});
  await prisma.line.deleteMany({});

  const response = await fetch("https://data.ny.gov/resource/39hk-dx4f.json");
  const stations: MTAStation[] = await response.json();

  const lineSet = new Set<string>();
  stations.forEach((station) => {
    if (station.daytime_routes) {
      station.daytime_routes.split(' ').forEach((route) => {
        const trimmed = route.trim();
        if (trimmed) lineSet.add(trimmed);
      });
    }
  });
  const lines = Array.from(lineSet);
  console.log(`Seeding ${lines.length} lines and ${stations.length} stations...`);
  for (const lineName of lines) {
    await prisma.line.create({
      data: {
        name: lineName,
        color: lineColors[lineName] || '#000000',
      },
    });
  }

  for (const station of stations) {
    if (!station.gtfs_stop_id || !station.stop_name) continue;
    const lineNames = station.daytime_routes ? station.daytime_routes.split(' ').map((l) => l.trim()).filter(Boolean) : [];
    await prisma.station.create({
      data: {
        id: station.gtfs_stop_id,
        name: station.stop_name,
        borough: station.borough ?? "Unknown",
        latitude: station.gtfs_latitude ? Number(station.gtfs_latitude) : 0,
        longitude: station.gtfs_longitude ? Number(station.gtfs_longitude) : 0,
        lines: {
          connect: lineNames.map(name => ({ name })),
        },
      },
    });
  }

  await seedLineShapes()
  console.log('Seeding complete!');
}
main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });