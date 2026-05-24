-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'explorer',
    "pillarWeights" TEXT NOT NULL DEFAULT '{"biomechanics":33,"biochemistry":33,"neurophysiology":34}',
    "contraindications" TEXT NOT NULL DEFAULT '[]',
    "tier" INTEGER NOT NULL DEFAULT 1,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "boltScore" DOUBLE PRECISION,
    "restingRR" DOUBLE PRECISION,
    "restingHR" DOUBLE PRECISION,
    "hrv" DOUBLE PRECISION,
    "breathingPattern" TEXT,
    "hasStressIssues" BOOLEAN NOT NULL DEFAULT false,
    "hasSleepIssues" BOOLEAN NOT NULL DEFAULT false,
    "hasFocusIssues" BOOLEAN NOT NULL DEFAULT false,
    "hasAnxiety" BOOLEAN NOT NULL DEFAULT false,
    "hasFatigue" BOOLEAN NOT NULL DEFAULT false,
    "primaryGoal" TEXT,
    "secondaryGoals" TEXT NOT NULL DEFAULT '[]',
    "activityLevel" TEXT,
    "hasHypertension" BOOLEAN NOT NULL DEFAULT false,
    "hasHeartCondition" BOOLEAN NOT NULL DEFAULT false,
    "hasEpilepsy" BOOLEAN NOT NULL DEFAULT false,
    "isPregnant" BOOLEAN NOT NULL DEFAULT false,
    "hasCOPD" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Programme" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentWeek" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "weeklyPlan" TEXT NOT NULL,
    "pillarWeights" TEXT NOT NULL,
    "sessionDuration" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "pillar" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "preNsScore" INTEGER,
    "postHrv" DOUBLE PRECISION,
    "preHrv" DOUBLE PRECISION,
    "eegAlphaRatio" DOUBLE PRECISION,
    "subjectiveRating" INTEGER,
    "discomfortReported" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "systolic" DOUBLE PRECISION,
    "diastolic" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "context" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoltScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "isPersonalRecord" BOOLEAN NOT NULL DEFAULT false,
    "testedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoltScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreathHoldRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "durationSeconds" DOUBLE PRECISION NOT NULL,
    "isPersonalRecord" BOOLEAN NOT NULL DEFAULT false,
    "sessionId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BreathHoldRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreakEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StreakEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WearableConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WearableConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMilestone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "milestoneType" TEXT NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "UserMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportMonth" TEXT NOT NULL,
    "boltStart" DOUBLE PRECISION,
    "boltEnd" DOUBLE PRECISION,
    "rhrStart" DOUBLE PRECISION,
    "rhrEnd" DOUBLE PRECISION,
    "hrvTrend" TEXT,
    "rrStart" DOUBLE PRECISION,
    "rrEnd" DOUBLE PRECISION,
    "topTechniques" TEXT NOT NULL DEFAULT '[]',
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "technique" TEXT NOT NULL,
    "instructorStyle" TEXT NOT NULL,
    "biometricFeedbackType" TEXT NOT NULL DEFAULT 'none',
    "nsScoreMin" INTEGER,
    "gamificationEvent" TEXT NOT NULL DEFAULT 'milestone_none',
    "fourWeekAnchor" BOOLEAN NOT NULL DEFAULT false,
    "thumbnailUrl" TEXT,
    "videoUrl" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "contraindicated" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_userId_key" ON "Assessment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Programme_userId_key" ON "Programme"("userId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Programme" ADD CONSTRAINT "Programme_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricEntry" ADD CONSTRAINT "MetricEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoltScore" ADD CONSTRAINT "BoltScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreathHoldRecord" ADD CONSTRAINT "BreathHoldRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakEntry" ADD CONSTRAINT "StreakEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WearableConnection" ADD CONSTRAINT "WearableConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMilestone" ADD CONSTRAINT "UserMilestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyReport" ADD CONSTRAINT "MonthlyReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
