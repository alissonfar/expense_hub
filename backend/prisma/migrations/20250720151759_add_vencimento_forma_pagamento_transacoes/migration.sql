-- AlterTable
ALTER TABLE "transacoes" ADD COLUMN     "data_vencimento" DATE,
ADD COLUMN     "forma_pagamento" VARCHAR(15);

-- CreateIndex
CREATE INDEX "idx_transacoes_data_vencimento" ON "transacoes"("data_vencimento");

-- CreateIndex
CREATE INDEX "idx_transacoes_forma_pagamento" ON "transacoes"("forma_pagamento");

-- CreateIndex
CREATE INDEX "idx_transacoes_hub_vencimento" ON "transacoes"("hubId", "data_vencimento");

-- CreateIndex
CREATE INDEX "idx_transacoes_hub_forma" ON "transacoes"("hubId", "forma_pagamento");

-- CreateIndex
CREATE INDEX "idx_transacoes_vencimento_status" ON "transacoes"("data_vencimento", "status_pagamento");

-- CreateIndex
CREATE INDEX "idx_transacoes_hub_tipo_vencimento" ON "transacoes"("hubId", "tipo", "data_vencimento");

-- CreateIndex
CREATE INDEX "idx_transacoes_hub_forma_status" ON "transacoes"("hubId", "forma_pagamento", "status_pagamento");

-- CreateIndex
CREATE INDEX "idx_transacoes_hub_tipo_forma" ON "transacoes"("hubId", "tipo", "forma_pagamento");

-- CreateIndex
CREATE INDEX "idx_transacoes_vencimento_tipo" ON "transacoes"("data_vencimento", "tipo");

-- CreateIndex
CREATE INDEX "idx_transacoes_forma_tipo" ON "transacoes"("forma_pagamento", "tipo");
