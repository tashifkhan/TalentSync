-- AlterTable: Remove unique constraint on userId to allow multiple configs per user
-- Drop the old unique index on userId
DROP INDEX IF EXISTS "LlmConfig_userId_key";

-- Add label column with default value
ALTER TABLE "LlmConfig" ADD COLUMN "label" TEXT NOT NULL DEFAULT 'Default';

-- Add isActive column with default false
ALTER TABLE "LlmConfig" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT false;

-- Set existing configs as active (they were the only config, so they should be active)
UPDATE "LlmConfig" SET "isActive" = true;

-- Add compound unique constraint on userId + label
CREATE UNIQUE INDEX "LlmConfig_userId_label_key" ON "LlmConfig"("userId", "label");

-- Add index for fast lookup of active config
CREATE INDEX "LlmConfig_userId_isActive_idx" ON "LlmConfig"("userId", "isActive");
