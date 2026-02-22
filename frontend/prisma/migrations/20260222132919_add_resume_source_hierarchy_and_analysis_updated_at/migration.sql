-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "isMaster" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'UPLOADED';

-- CreateTable
CREATE TABLE "CoverLetterRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderRoleOrGoal" TEXT,
    "jobDescription" TEXT,
    "jdUrl" TEXT,
    "keyPoints" TEXT,
    "additionalInfo" TEXT,
    "companyUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoverLetterRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverLetterResponse" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoverLetterResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Resume_userId_isMaster_idx" ON "Resume"("userId", "isMaster");

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverLetterRequest" ADD CONSTRAINT "CoverLetterRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverLetterResponse" ADD CONSTRAINT "CoverLetterResponse_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CoverLetterRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
