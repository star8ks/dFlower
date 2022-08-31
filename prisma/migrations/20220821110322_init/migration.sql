-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "gifterId" BIGINT NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "roomId" TEXT NOT NULL,
    "gifterId" BIGINT NOT NULL,
    "percent" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("roomId","gifterId")
);

-- CreateTable
CREATE TABLE "Gifter" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "eth_addr" TEXT NOT NULL,

    CONSTRAINT "Gifter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftersOnRooms" (
    "roomId" TEXT NOT NULL,
    "gifterId" BIGINT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accept" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GiftersOnRooms_pkey" PRIMARY KEY ("roomId","gifterId")
);

-- CreateTable
CREATE TABLE "Point" (
    "roomId" TEXT NOT NULL,
    "senderId" BIGINT NOT NULL,
    "receiverId" BIGINT NOT NULL,
    "point" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Point_pkey" PRIMARY KEY ("roomId","senderId","receiverId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gifter_eth_addr_key" ON "Gifter"("eth_addr");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_gifterId_fkey" FOREIGN KEY ("gifterId") REFERENCES "Gifter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_gifterId_fkey" FOREIGN KEY ("gifterId") REFERENCES "Gifter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftersOnRooms" ADD CONSTRAINT "GiftersOnRooms_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftersOnRooms" ADD CONSTRAINT "GiftersOnRooms_gifterId_fkey" FOREIGN KEY ("gifterId") REFERENCES "Gifter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Point" ADD CONSTRAINT "Point_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Point" ADD CONSTRAINT "Point_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Gifter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Point" ADD CONSTRAINT "Point_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Gifter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
