/*
  Warnings:

  - You are about to drop the column `lines` on the `Station` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Station" DROP COLUMN "lines",
ALTER COLUMN "borough" DROP DEFAULT,
ALTER COLUMN "latitude" DROP DEFAULT,
ALTER COLUMN "longitude" DROP DEFAULT;

-- CreateTable
CREATE TABLE "public"."_LineToStation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LineToStation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_LineToStation_B_index" ON "public"."_LineToStation"("B");

-- AddForeignKey
ALTER TABLE "public"."_LineToStation" ADD CONSTRAINT "_LineToStation_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Line"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_LineToStation" ADD CONSTRAINT "_LineToStation_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;
