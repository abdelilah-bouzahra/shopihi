/*
  Warnings:

  - You are about to drop the `HeitzApi` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "HeitzApi";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "APICredentials" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "apiUrl" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "APICredentials_shop_key" ON "APICredentials"("shop");
