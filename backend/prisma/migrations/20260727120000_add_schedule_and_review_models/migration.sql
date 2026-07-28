-- AlterTable
ALTER TABLE "StudyLog" ADD COLUMN     "linkedReminderId" UUID;

-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN     "subjectTaskId" UUID,
ADD COLUMN     "reviewSeriesId" UUID;

-- CreateTable
CREATE TABLE "Milestone" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "deadlineDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectTask" (
    "id" UUID NOT NULL,
    "milestoneId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubjectTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewRecipe" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "intervalDays" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewSeries" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "subjectId" UUID NOT NULL,
    "baseDate" DATE NOT NULL,
    "intervalDays" INTEGER[],
    "recipeId" UUID,
    "subjectTaskId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewSeries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyLog_linkedReminderId_idx" ON "StudyLog"("linkedReminderId");

-- CreateIndex
CREATE INDEX "Reminder_subjectTaskId_idx" ON "Reminder"("subjectTaskId");

-- CreateIndex
CREATE INDEX "Reminder_reviewSeriesId_idx" ON "Reminder"("reviewSeriesId");

-- CreateIndex
CREATE INDEX "SubjectTask_milestoneId_idx" ON "SubjectTask"("milestoneId");

-- CreateIndex
CREATE INDEX "SubjectTask_subjectId_idx" ON "SubjectTask"("subjectId");

-- CreateIndex
CREATE INDEX "ReviewSeries_subjectId_idx" ON "ReviewSeries"("subjectId");

-- CreateIndex
CREATE INDEX "ReviewSeries_recipeId_idx" ON "ReviewSeries"("recipeId");

-- CreateIndex
CREATE INDEX "ReviewSeries_subjectTaskId_idx" ON "ReviewSeries"("subjectTaskId");

-- AddForeignKey
ALTER TABLE "StudyLog" ADD CONSTRAINT "StudyLog_linkedReminderId_fkey" FOREIGN KEY ("linkedReminderId") REFERENCES "Reminder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_subjectTaskId_fkey" FOREIGN KEY ("subjectTaskId") REFERENCES "SubjectTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_reviewSeriesId_fkey" FOREIGN KEY ("reviewSeriesId") REFERENCES "ReviewSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectTask" ADD CONSTRAINT "SubjectTask_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectTask" ADD CONSTRAINT "SubjectTask_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSeries" ADD CONSTRAINT "ReviewSeries_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSeries" ADD CONSTRAINT "ReviewSeries_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "ReviewRecipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSeries" ADD CONSTRAINT "ReviewSeries_subjectTaskId_fkey" FOREIGN KEY ("subjectTaskId") REFERENCES "SubjectTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
