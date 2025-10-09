-- CreateEnum
CREATE TYPE "ContextType" AS ENUM ('user', 'group');

-- CreateTable
CREATE TABLE "ConversationContext" (
    "id" TEXT NOT NULL,
    "type" "ContextType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ConversationContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContextParticipant" (
    "id" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "participant" TEXT NOT NULL,

    CONSTRAINT "ContextParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConversationContext_type_idx" ON "ConversationContext"("type");

-- CreateIndex
CREATE INDEX "ConversationContext_expiresAt_idx" ON "ConversationContext"("expiresAt");

-- CreateIndex
CREATE INDEX "ContextParticipant_participant_idx" ON "ContextParticipant"("participant");

-- CreateIndex
CREATE UNIQUE INDEX "ContextParticipant_contextId_participant_key" ON "ContextParticipant"("contextId", "participant");

-- CreateIndex
CREATE INDEX "ConversationMessage_contextId_timestamp_idx" ON "ConversationMessage"("contextId", "timestamp");

-- AddForeignKey
ALTER TABLE "ContextParticipant" ADD CONSTRAINT "ContextParticipant_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "ConversationContext"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "ConversationContext"("id") ON DELETE CASCADE ON UPDATE CASCADE;
