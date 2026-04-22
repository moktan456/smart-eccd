-- ============================================================
-- SMART ECCD – Full Database Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. Enums ─────────────────────────────────────────────────

CREATE TYPE "Role" AS ENUM (
  'SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER', 'PARENT'
);

CREATE TYPE "BloomLevel" AS ENUM (
  'REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'
);

CREATE TYPE "ActivityStatus" AS ENUM (
  'DRAFT', 'PUBLISHED', 'ARCHIVED'
);

CREATE TYPE "AssignmentStatus" AS ENUM (
  'PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'
);

CREATE TYPE "CompletionStatus" AS ENUM (
  'COMPLETED', 'PARTIAL', 'NOT_ATTEMPTED'
);

CREATE TYPE "AttendanceStatus" AS ENUM (
  'PRESENT', 'ABSENT', 'LATE', 'EXCUSED'
);

CREATE TYPE "NotificationType" AS ENUM (
  'ACTIVITY_ASSIGNED', 'PERFORMANCE_RECORDED', 'ATTENDANCE_MARKED',
  'MESSAGE_RECEIVED', 'ANNOUNCEMENT', 'FLAG_RAISED', 'REPORT_READY'
);

CREATE TYPE "MessageStatus" AS ENUM (
  'SENT', 'DELIVERED', 'READ'
);

-- ── 2. Tables ─────────────────────────────────────────────────

CREATE TABLE "User" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"         TEXT NOT NULL,
  "email"        TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role"         "Role" NOT NULL,
  "centerId"     TEXT,
  "avatar"       TEXT,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx"    ON "User"("email");
CREATE INDEX "User_centerId_idx" ON "User"("centerId");
CREATE INDEX "User_role_idx"     ON "User"("role");

CREATE TABLE "RefreshToken" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "token"     TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

CREATE TABLE "OtpCode" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email"     TEXT NOT NULL,
  "code"      TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "used"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OtpCode_email_idx" ON "OtpCode"("email");

CREATE TABLE "Center" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"      TEXT NOT NULL,
  "address"   TEXT NOT NULL,
  "phone"     TEXT,
  "email"     TEXT,
  "logo"      TEXT,
  "managerId" TEXT NOT NULL,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Center_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Center_managerId_key" ON "Center"("managerId");
CREATE INDEX "Center_managerId_idx" ON "Center"("managerId");

CREATE TABLE "Class" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"      TEXT NOT NULL,
  "ageGroup"  TEXT NOT NULL,
  "centerId"  TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Class_centerId_idx"  ON "Class"("centerId");
CREATE INDEX "Class_teacherId_idx" ON "Class"("teacherId");

CREATE TABLE "Child" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "firstName"       TEXT NOT NULL,
  "lastName"        TEXT NOT NULL,
  "dateOfBirth"     TIMESTAMP(3) NOT NULL,
  "photo"           TEXT,
  "classId"         TEXT NOT NULL,
  "centerId"        TEXT NOT NULL,
  "medicalNotesEnc" TEXT,
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Child_classId_idx"  ON "Child"("classId");
CREATE INDEX "Child_centerId_idx" ON "Child"("centerId");

CREATE TABLE "ChildParent" (
  "childId"   TEXT NOT NULL,
  "parentId"  TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "ChildParent_pkey" PRIMARY KEY ("childId", "parentId")
);

CREATE TABLE "Activity" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title"         TEXT NOT NULL,
  "description"   TEXT NOT NULL,
  "instructions"  TEXT NOT NULL,
  "bloomLevels"   "BloomLevel"[],
  "activityType"  TEXT NOT NULL,
  "ageGroup"      TEXT NOT NULL,
  "durationMins"  INTEGER NOT NULL,
  "resources"     TEXT[],
  "learningGoals" TEXT[],
  "status"        "ActivityStatus" NOT NULL DEFAULT 'DRAFT',
  "centerId"      TEXT NOT NULL,
  "createdById"   TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Activity_centerId_idx" ON "Activity"("centerId");
CREATE INDEX "Activity_status_idx"   ON "Activity"("status");

CREATE TABLE "ActivityAssignment" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "activityId"    TEXT NOT NULL,
  "classId"       TEXT NOT NULL,
  "teacherId"     TEXT NOT NULL,
  "scheduledDate" TIMESTAMP(3) NOT NULL,
  "scheduledTime" TEXT NOT NULL,
  "isRecurring"   BOOLEAN NOT NULL DEFAULT false,
  "recurringRule" TEXT,
  "status"        "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityAssignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActivityAssignment_activityId_idx"    ON "ActivityAssignment"("activityId");
CREATE INDEX "ActivityAssignment_classId_idx"       ON "ActivityAssignment"("classId");
CREATE INDEX "ActivityAssignment_teacherId_idx"     ON "ActivityAssignment"("teacherId");
CREATE INDEX "ActivityAssignment_scheduledDate_idx" ON "ActivityAssignment"("scheduledDate");

CREATE TABLE "ActivityRecord" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "assignmentId"  TEXT NOT NULL,
  "conductedDate" TIMESTAMP(3) NOT NULL,
  "notes"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ActivityRecord_assignmentId_key" ON "ActivityRecord"("assignmentId");

CREATE TABLE "ChildPerformance" (
  "id"                 TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "recordId"           TEXT NOT NULL,
  "childId"            TEXT NOT NULL,
  "completionStatus"   "CompletionStatus" NOT NULL,
  "bloomLevelAchieved" "BloomLevel" NOT NULL,
  "skillRatings"       JSONB NOT NULL,
  "observationNotes"   TEXT,
  "evidenceUrls"       TEXT[],
  "isFlagged"          BOOLEAN NOT NULL DEFAULT false,
  "flagReason"         TEXT,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChildPerformance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChildPerformance_childId_idx"            ON "ChildPerformance"("childId");
CREATE INDEX "ChildPerformance_recordId_idx"           ON "ChildPerformance"("recordId");
CREATE INDEX "ChildPerformance_bloomLevelAchieved_idx" ON "ChildPerformance"("bloomLevelAchieved");

CREATE TABLE "Attendance" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "childId"   TEXT NOT NULL,
  "recordId"  TEXT,
  "date"      TIMESTAMP(3) NOT NULL,
  "status"    "AttendanceStatus" NOT NULL,
  "note"      TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Attendance_childId_date_key" ON "Attendance"("childId", "date");
CREATE INDEX "Attendance_childId_idx" ON "Attendance"("childId");
CREATE INDEX "Attendance_date_idx"    ON "Attendance"("date");

CREATE TABLE "Message" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "senderId"   TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  "subject"    TEXT,
  "body"       TEXT NOT NULL,
  "status"     "MessageStatus" NOT NULL DEFAULT 'SENT',
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Message_senderId_idx"   ON "Message"("senderId");
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

CREATE TABLE "Announcement" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "centerId"  TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "body"      TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Announcement_centerId_idx" ON "Announcement"("centerId");

CREATE TABLE "Notification" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL,
  "type"      "NotificationType" NOT NULL,
  "title"     TEXT NOT NULL,
  "message"   TEXT NOT NULL,
  "data"      JSONB,
  "isRead"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- ── 3. Foreign Keys ───────────────────────────────────────────

ALTER TABLE "User"
  ADD CONSTRAINT "User_centerId_fkey"
  FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RefreshToken"
  ADD CONSTRAINT "RefreshToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Center"
  ADD CONSTRAINT "Center_managerId_fkey"
  FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Class"
  ADD CONSTRAINT "Class_centerId_fkey"
  FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Class"
  ADD CONSTRAINT "Class_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Child"
  ADD CONSTRAINT "Child_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Child"
  ADD CONSTRAINT "Child_centerId_fkey"
  FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ChildParent"
  ADD CONSTRAINT "ChildParent_childId_fkey"
  FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChildParent"
  ADD CONSTRAINT "ChildParent_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Activity"
  ADD CONSTRAINT "Activity_centerId_fkey"
  FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Activity"
  ADD CONSTRAINT "Activity_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ActivityAssignment"
  ADD CONSTRAINT "ActivityAssignment_activityId_fkey"
  FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ActivityAssignment"
  ADD CONSTRAINT "ActivityAssignment_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ActivityRecord"
  ADD CONSTRAINT "ActivityRecord_assignmentId_fkey"
  FOREIGN KEY ("assignmentId") REFERENCES "ActivityAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ChildPerformance"
  ADD CONSTRAINT "ChildPerformance_recordId_fkey"
  FOREIGN KEY ("recordId") REFERENCES "ActivityRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ChildPerformance"
  ADD CONSTRAINT "ChildPerformance_childId_fkey"
  FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Attendance"
  ADD CONSTRAINT "Attendance_childId_fkey"
  FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Attendance"
  ADD CONSTRAINT "Attendance_recordId_fkey"
  FOREIGN KEY ("recordId") REFERENCES "ActivityRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Message"
  ADD CONSTRAINT "Message_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Message"
  ADD CONSTRAINT "Message_receiverId_fkey"
  FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 4. Prisma migrations table (lets Prisma think schema is in sync) ──

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                    VARCHAR(36) NOT NULL,
  "checksum"              VARCHAR(64) NOT NULL,
  "finished_at"           TIMESTAMPTZ,
  "migration_name"        VARCHAR(255) NOT NULL,
  "logs"                  TEXT,
  "rolled_back_at"        TIMESTAMPTZ,
  "started_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "applied_steps_count"   INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

-- ── 5. Seed Data ──────────────────────────────────────────────

-- Super Admin
INSERT INTO "User" ("id","name","email","passwordHash","role","isActive")
VALUES (
  'usr_superadmin_01',
  'Super Admin',
  'superadmin@smart-eccd.com',
  '$2b$12$Xj1OI.UmgsokrBo42JH51Ohjj7ktMvRtw1uig3gQp9h6g/6I4wOda',
  'SUPER_ADMIN',
  true
) ON CONFLICT ("email") DO NOTHING;

-- Center Manager
INSERT INTO "User" ("id","name","email","passwordHash","role","isActive")
VALUES (
  'usr_manager_01',
  'Maria Santos',
  'manager@brightstart.com',
  '$2b$12$sr5PQ5RpFJhw5dRgeZNwGOZF.nTuLQjYw6CQf2q9a7wh8MfbG7LlC',
  'CENTER_MANAGER',
  true
) ON CONFLICT ("email") DO NOTHING;

-- Center (requires manager first)
INSERT INTO "Center" ("id","name","address","phone","email","managerId","isActive")
VALUES (
  'ctr_seed_01',
  'Bright Start Learning Center',
  '123 Sunshine Ave, Quezon City',
  '+63-2-1234-5678',
  'hello@brightstart.com',
  'usr_manager_01',
  true
) ON CONFLICT ("managerId") DO NOTHING;

-- Update manager centerId
UPDATE "User" SET "centerId" = 'ctr_seed_01' WHERE "id" = 'usr_manager_01';

-- Teacher
INSERT INTO "User" ("id","name","email","passwordHash","role","centerId","isActive")
VALUES (
  'usr_teacher_01',
  'Ana Reyes',
  'teacher@brightstart.com',
  '$2b$12$4.BHvGlzb0FfNZZflUzRnenjgT84lvSkKvAHPZy9J6ZHY4xY4ZA3e',
  'TEACHER',
  'ctr_seed_01',
  true
) ON CONFLICT ("email") DO NOTHING;

-- Parent
INSERT INTO "User" ("id","name","email","passwordHash","role","centerId","isActive")
VALUES (
  'usr_parent_01',
  'Juan dela Cruz',
  'parent@example.com',
  '$2b$12$RrAkg9ZxXdeiI0xXzJvIkuYmi45OpuEcWKDzKw3frr.limfa75MLW',
  'PARENT',
  'ctr_seed_01',
  true
) ON CONFLICT ("email") DO NOTHING;

-- Class
INSERT INTO "Class" ("id","name","ageGroup","centerId","teacherId","isActive")
VALUES (
  'cls_seed_01',
  'Rainbow Class',
  '4-5 years',
  'ctr_seed_01',
  'usr_teacher_01',
  true
) ON CONFLICT ("id") DO NOTHING;

-- Child
INSERT INTO "Child" ("id","firstName","lastName","dateOfBirth","classId","centerId","isActive")
VALUES (
  'child_seed_01',
  'Sofia',
  'dela Cruz',
  '2020-03-15 00:00:00',
  'cls_seed_01',
  'ctr_seed_01',
  true
) ON CONFLICT ("id") DO NOTHING;

-- ChildParent link
INSERT INTO "ChildParent" ("childId","parentId","isPrimary")
VALUES ('child_seed_01','usr_parent_01', true)
ON CONFLICT ("childId","parentId") DO NOTHING;

-- Sample Activity
INSERT INTO "Activity" (
  "id","title","description","instructions",
  "bloomLevels","activityType","ageGroup","durationMins",
  "resources","learningGoals","status","centerId","createdById"
)
VALUES (
  'act_seed_01',
  'Animal Sorting Game',
  'Children sort animal pictures by categories (pets, wild, farm).',
  '1. Lay out the cards. 2. Ask children to group by category. 3. Discuss why.',
  ARRAY['REMEMBER','UNDERSTAND','ANALYZE']::"BloomLevel"[],
  'Group',
  '4-5 years',
  30,
  ARRAY[]::TEXT[],
  ARRAY['Identify animals by name','Group animals by habitat','Explain sorting choices'],
  'PUBLISHED',
  'ctr_seed_01',
  'usr_manager_01'
) ON CONFLICT ("id") DO NOTHING;

-- Sample Attendance
INSERT INTO "Attendance" ("childId","date","status")
VALUES ('child_seed_01','2025-01-15 00:00:00','PRESENT')
ON CONFLICT ("childId","date") DO NOTHING;

-- ── Done ──────────────────────────────────────────────────────
SELECT 'SMART ECCD database setup complete!' AS result;
