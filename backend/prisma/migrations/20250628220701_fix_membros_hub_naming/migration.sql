/*
  Warnings:

  - You are about to drop the `MembroHub` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MembroHub" DROP CONSTRAINT "MembroHub_hubId_fkey";

-- DropForeignKey
ALTER TABLE "MembroHub" DROP CONSTRAINT "MembroHub_pessoaId_fkey";

-- DropTable
DROP TABLE "MembroHub";

-- CreateTable
CREATE TABLE "membros_hub" (
    "hubId" INTEGER NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'COLABORADOR',
    "dataAccessPolicy" "DataAccessPolicy",
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membros_hub_pkey" PRIMARY KEY ("hubId","pessoaId")
);

-- CreateIndex
CREATE INDEX "idx_membro_hub_hub" ON "membros_hub"("hubId");

-- CreateIndex
CREATE INDEX "idx_membro_hub_pessoa" ON "membros_hub"("pessoaId");

-- CreateIndex
CREATE INDEX "idx_membro_hub_ativo" ON "membros_hub"("ativo");

-- CreateIndex
CREATE INDEX "idx_membro_hub_role" ON "membros_hub"("role");

-- AddForeignKey
ALTER TABLE "membros_hub" ADD CONSTRAINT "membros_hub_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "membros_hub" ADD CONSTRAINT "membros_hub_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "pessoas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
