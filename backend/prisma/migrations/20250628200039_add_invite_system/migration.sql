/*
  Warnings:

  - A unique constraint covering the columns `[conviteToken]` on the table `pessoas` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "pessoas" ADD COLUMN     "conviteAtivo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "conviteExpiraEm" TIMESTAMPTZ(6),
ADD COLUMN     "conviteToken" VARCHAR(255),
ALTER COLUMN "senha_hash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_conviteToken_key" ON "pessoas"("conviteToken");

-- CreateIndex
CREATE INDEX "idx_pessoas_convite_ativo" ON "pessoas"("conviteAtivo");

-- CreateIndex
CREATE INDEX "idx_pessoas_convite_token" ON "pessoas"("conviteToken");
