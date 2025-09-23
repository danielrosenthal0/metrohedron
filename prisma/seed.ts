import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();

interface MTAStation {
  gtfs_stop_id: string;
  stop_name: string;
  daytime_routes?: string;
  borough?: string;
  gtfs_latitude?: string;
  gtfs_longitude?: string; 
}

async function main() {
  // Clear existing data 
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
        color: '',
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