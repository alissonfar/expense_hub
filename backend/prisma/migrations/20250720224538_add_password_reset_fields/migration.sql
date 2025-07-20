/*
  Warnings:

  - A unique constraint covering the columns `[resetToken]` on the table `pessoas` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "pessoas" ADD COLUMN     "resetToken" VARCHAR(255),
ADD COLUMN     "resetTokenExpiry" TIMESTAMPTZ(6);

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_resetToken_key" ON "pessoas"("resetToken");

-- CreateIndex
CREATE INDEX "idx_pessoas_reset_token" ON "pessoas"("resetToken");
