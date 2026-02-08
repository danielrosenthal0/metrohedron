-- CreateTable
CREATE TABLE "LineShape" (
    "id" TEXT NOT NULL,
    "shapeId" TEXT NOT NULL,
    "shapePointSequence" TEXT NOT NULL,
    "shapePointLatitude" DOUBLE PRECISION NOT NULL,
    "shapePointLongitude" DOUBLE PRECISION NOT NULL,
    "lineId" TEXT NOT NULL,

    CONSTRAINT "LineShape_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LineShape" ADD CONSTRAINT "LineShape_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
