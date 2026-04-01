-- System configuration table for platform-level settings
-- Values marked as encrypted are stored as AES-256-GCM ciphertext

CREATE TABLE "system_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "valueEnc" TEXT,
    "valueIv"  TEXT,
    "valueTag" TEXT,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");
