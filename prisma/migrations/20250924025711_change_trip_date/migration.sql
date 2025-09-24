/*
  Warnings:

  - You are about to drop the column `endTime` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Trip` table. All the data in the column will be lost.
  - Added the required column `tripDate` to the `Trip` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Trip" DROP COLUMN "endTime",
DROP COLUMN "startTime",
ADD COLUMN     "tripDate" TIMESTAMP(3) NOT NULL;
