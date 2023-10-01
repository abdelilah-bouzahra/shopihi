-- CreateTable
CREATE TABLE "HeitzApi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "api" TEXT NOT NULL,
    "idHeitz" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "autoSync" BOOLEAN NOT NULL
);
