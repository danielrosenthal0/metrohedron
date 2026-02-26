/*
  Warnings:

  - Added the required column `shapeId` to the `LineShape` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `shapePointSequence` on the `LineShape` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "LineShape" ADD COLUMN     "shapeId" TEXT NOT NULL,
DROP COLUMN "shapePointSequence",
ADD COLUMN     "shapePointSequence" INTEGER NOT NULL;
