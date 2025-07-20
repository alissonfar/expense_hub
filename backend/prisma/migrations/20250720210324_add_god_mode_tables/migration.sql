-- AlterTable
ALTER TABLE "pessoas" ADD COLUMN     "is_god" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "system_logs" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" VARCHAR(10) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "user_id" INTEGER,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "hub_id" INTEGER,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_metrics" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metric_name" VARCHAR(100) NOT NULL,
    "metric_value" DECIMAL(10,2) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "system_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_system_logs_timestamp" ON "system_logs"("timestamp");

-- CreateIndex
CREATE INDEX "idx_system_logs_level" ON "system_logs"("level");

-- CreateIndex
CREATE INDEX "idx_system_logs_category" ON "system_logs"("category");

-- CreateIndex
CREATE INDEX "idx_system_logs_user" ON "system_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_system_logs_hub" ON "system_logs"("hub_id");

-- CreateIndex
CREATE INDEX "idx_system_metrics_timestamp" ON "system_metrics"("timestamp");

-- CreateIndex
CREATE INDEX "idx_system_metrics_name" ON "system_metrics"("metric_name");

-- CreateIndex
CREATE INDEX "idx_pessoas_is_god" ON "pessoas"("is_god");
