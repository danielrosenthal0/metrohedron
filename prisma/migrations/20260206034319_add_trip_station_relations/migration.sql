/*
  Warnings:

  - You are about to drop the column `endStation` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `startStation` on the `Trip` table. All the data in the column will be lost.
  - Added the required column `endStationId` to the `Trip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startStationId` to the `Trip` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Trip" DROP COLUMN "endStation",
DROP COLUMN "startStation",
ADD COLUMN     "endStationId" TEXT NOT NULL,
ADD COLUMN     "startStationId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Trip" ADD CONSTRAINT "Trip_startStationId_fkey" FOREIGN KEY ("startStationId") REFERENCES "public"."Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Trip" ADD CONSTRAINT "Trip_endStationId_fkey" FOREIGN KEY ("endStationId") REFERENCES "public"."Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
