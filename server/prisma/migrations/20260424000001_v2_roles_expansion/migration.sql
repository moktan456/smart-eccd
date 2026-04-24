-- V2: Roles expansion – Classroom, AcademicEvent, FeeStructure, FeeRecord, LeaveRequest
-- Plus: Center branding, Child studentId, User phone

-- ── New Enums ─────────────────────────────────────────────────
CREATE TYPE "FeeStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'WAIVED');
CREATE TYPE "FeeFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'ONE_TIME');
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "EventType" AS ENUM ('HOLIDAY', 'EXAM', 'FUNCTION', 'MEETING', 'ACTIVITY', 'OTHER');

-- ── Update NotificationType enum ──────────────────────────────
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FEE_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LEAVE_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'LEAVE_REJECTED';

-- ── Center: add branding + location columns ───────────────────
ALTER TABLE "Center" ADD COLUMN IF NOT EXISTS "website"     TEXT;
ALTER TABLE "Center" ADD COLUMN IF NOT EXISTS "theme"       TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "Center" ADD COLUMN IF NOT EXISTS "themeColor"  TEXT NOT NULL DEFAULT '#4F46E5';
ALTER TABLE "Center" ADD COLUMN IF NOT EXISTS "latitude"    DOUBLE PRECISION;
ALTER TABLE "Center" ADD COLUMN IF NOT EXISTS "longitude"   DOUBLE PRECISION;

-- ── User: add phone ───────────────────────────────────────────
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- ── Child: add studentId ──────────────────────────────────────
ALTER TABLE "Child" ADD COLUMN IF NOT EXISTS "studentId" TEXT;
-- Generate studentIds for existing children
UPDATE "Child" SET "studentId" = CONCAT('STU-', UPPER(SUBSTRING(id, 1, 8))) WHERE "studentId" IS NULL;
ALTER TABLE "Child" ALTER COLUMN "studentId" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Child_studentId_key" ON "Child"("studentId");
CREATE INDEX IF NOT EXISTS "Child_studentId_idx" ON "Child"("studentId");

-- ── Classroom model ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Classroom" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "centerId"  TEXT NOT NULL,
    "capacity"  INTEGER,
    "floor"     TEXT,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Classroom_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Classroom_centerId_idx" ON "Classroom"("centerId");

-- ── Class: add classroomId ────────────────────────────────────
ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS "classroomId" TEXT;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Class_classroomId_fkey'
  ) THEN
    ALTER TABLE "Class" ADD CONSTRAINT "Class_classroomId_fkey"
      FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ── ActivityAssignment: add teacher FK relation ───────────────
-- teacherId already exists as column; add FK constraint if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ActivityAssignment_teacherId_fkey'
  ) THEN
    ALTER TABLE "ActivityAssignment" ADD CONSTRAINT "ActivityAssignment_teacherId_fkey"
      FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- ── AcademicEvent model ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AcademicEvent" (
    "id"          TEXT NOT NULL,
    "centerId"    TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "eventType"   "EventType" NOT NULL DEFAULT 'OTHER',
    "startDate"   TIMESTAMP(3) NOT NULL,
    "endDate"     TIMESTAMP(3) NOT NULL,
    "isPublic"    BOOLEAN NOT NULL DEFAULT true,
    "createdBy"   TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AcademicEvent_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AcademicEvent_centerId_idx" ON "AcademicEvent"("centerId");
CREATE INDEX IF NOT EXISTS "AcademicEvent_startDate_idx" ON "AcademicEvent"("startDate");

-- ── FeeStructure model ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FeeStructure" (
    "id"          TEXT NOT NULL,
    "centerId"    TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "amount"      DECIMAL(10,2) NOT NULL,
    "frequency"   "FeeFrequency" NOT NULL DEFAULT 'MONTHLY',
    "dueDay"      INTEGER,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FeeStructure_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "FeeStructure_centerId_idx" ON "FeeStructure"("centerId");

-- ── FeeRecord model ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FeeRecord" (
    "id"             TEXT NOT NULL,
    "childId"        TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "centerId"       TEXT NOT NULL,
    "amount"         DECIMAL(10,2) NOT NULL,
    "dueDate"        TIMESTAMP(3) NOT NULL,
    "paidDate"       TIMESTAMP(3),
    "paidAmount"     DECIMAL(10,2),
    "status"         "FeeStatus" NOT NULL DEFAULT 'PENDING',
    "receiptNote"    TEXT,
    "createdBy"      TEXT NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeRecord_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FeeRecord_childId_fkey"        FOREIGN KEY ("childId")        REFERENCES "Child"("id")        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FeeRecord_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FeeRecord_centerId_fkey"       FOREIGN KEY ("centerId")       REFERENCES "Center"("id")       ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "FeeRecord_childId_idx"  ON "FeeRecord"("childId");
CREATE INDEX IF NOT EXISTS "FeeRecord_centerId_idx" ON "FeeRecord"("centerId");
CREATE INDEX IF NOT EXISTS "FeeRecord_status_idx"   ON "FeeRecord"("status");
CREATE INDEX IF NOT EXISTS "FeeRecord_dueDate_idx"  ON "FeeRecord"("dueDate");

-- ── LeaveRequest model ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "LeaveRequest" (
    "id"          TEXT NOT NULL,
    "childId"     TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "startDate"   TIMESTAMP(3) NOT NULL,
    "endDate"     TIMESTAMP(3) NOT NULL,
    "reason"      TEXT NOT NULL,
    "status"      "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy"  TEXT,
    "reviewNote"  TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LeaveRequest_childId_fkey"     FOREIGN KEY ("childId")     REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LeaveRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id")  ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LeaveRequest_reviewedBy_fkey"  FOREIGN KEY ("reviewedBy")  REFERENCES "User"("id")  ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "LeaveRequest_childId_idx"     ON "LeaveRequest"("childId");
CREATE INDEX IF NOT EXISTS "LeaveRequest_requestedBy_idx" ON "LeaveRequest"("requestedBy");
CREATE INDEX IF NOT EXISTS "LeaveRequest_status_idx"      ON "LeaveRequest"("status");
