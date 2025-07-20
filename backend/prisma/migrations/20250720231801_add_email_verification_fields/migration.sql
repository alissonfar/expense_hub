/*
  Warnings:

  - A unique constraint covering the columns `[verificacaoToken]` on the table `pessoas` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "pessoas" ADD COLUMN     "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailVerificadoEm" TIMESTAMPTZ(6),
ADD COLUMN     "verificacaoToken" VARCHAR(255),
ADD COLUMN     "verificacaoTokenExpiry" TIMESTAMPTZ(6);

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_verificacaoToken_key" ON "pessoas"("verificacaoToken");

-- CreateIndex
CREATE INDEX "idx_pessoas_email_verificado" ON "pessoas"("emailVerificado");

-- CreateIndex
CREATE INDEX "idx_pessoas_verificacao_token" ON "pessoas"("verificacaoToken");
