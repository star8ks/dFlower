/*
  Warnings:

  - You are about to drop the column `eth_addr` on the `Gifter` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ethAddress]` on the table `Gifter` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[discordId]` on the table `Gifter` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `discordId` to the `Gifter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ethAddress` to the `Gifter` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Gifter_eth_addr_key";

-- AlterTable
ALTER TABLE "Gifter" DROP COLUMN "eth_addr",
ADD COLUMN     "discordId" TEXT NOT NULL,
ADD COLUMN     "ethAddress" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Gifter_ethAddress_key" ON "Gifter"("ethAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Gifter_discordId_key" ON "Gifter"("discordId");
