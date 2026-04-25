// SMART ECCD – Database Seed Script
// Populates the DB with demo data for all 4 roles

const { PrismaClient, Role, BloomLevel, ActivityStatus, AttendanceStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SMART ECCD database...\n');

  // ── 1. Super Admin ──────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@smart-eccd.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@smart-eccd.com',
      passwordHash: await bcrypt.hash('Admin@1234', 12),
      role: Role.SUPER_ADMIN,
    },
  });
  console.log(`✅ Super Admin: ${superAdmin.email}`);

  // ── 2. Center Manager ───────────────────────────────────────
  const manager = await prisma.user.upsert({
    where: { email: 'manager@brightstart.com' },
    update: {},
    create: {
      name: 'Maria Santos',
      email: 'manager@brightstart.com',
      passwordHash: await bcrypt.hash('Manager@1234', 12),
      role: Role.CENTER_MANAGER,
    },
  });

  // ── 3. Center ───────────────────────────────────────────────
  const center = await prisma.center.upsert({
    where: { managerId: manager.id },
    update: {},
    create: {
      name: 'Bright Start Learning Center',
      address: '123 Sunshine Ave, Quezon City',
      phone: '+63-2-1234-5678',
      email: 'hello@brightstart.com',
      managerId: manager.id,
    },
  });

  // Update manager's centerId
  await prisma.user.update({
    where: { id: manager.id },
    data: { centerId: center.id },
  });
  console.log(`✅ Center: ${center.name}`);
  console.log(`✅ Center Manager: ${manager.email}`);

  // ── 4. Teacher ──────────────────────────────────────────────
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@brightstart.com' },
    update: {},
    create: {
      name: 'Ana Reyes',
      email: 'teacher@brightstart.com',
      passwordHash: await bcrypt.hash('Teacher@1234', 12),
      role: Role.TEACHER,
      centerId: center.id,
    },
  });
  console.log(`✅ Teacher: ${teacher.email}`);

  // ── 5. Class ────────────────────────────────────────────────
  const klass = await prisma.class.upsert({
    where: { id: 'cls_seed_01' },
    update: {},
    create: {
      id: 'cls_seed_01',
      name: 'Rainbow Class',
      ageGroup: '4-5 years',
      centerId: center.id,
      teacherId: teacher.id,
    },
  });
  console.log(`✅ Class: ${klass.name}`);

  // ── 6. Parent & Child ────────────────────────────────────────
  const parent = await prisma.user.upsert({
    where: { email: 'parent@example.com' },
    update: {},
    create: {
      name: 'Juan dela Cruz',
      email: 'parent@example.com',
      passwordHash: await bcrypt.hash('Parent@1234', 12),
      role: Role.PARENT,
      centerId: center.id,
    },
  });

  const child = await prisma.child.upsert({
    where: { id: 'child_seed_01' },
    update: {},
    create: {
      id: 'child_seed_01',
      firstName: 'Sofia',
      lastName: 'dela Cruz',
      dateOfBirth: new Date('2020-03-15'),
      studentId: 'STU-2026-0001',
      classId: klass.id,
      centerId: center.id,
    },
  });

  await prisma.childParent.upsert({
    where: { childId_parentId: { childId: child.id, parentId: parent.id } },
    update: {},
    create: { childId: child.id, parentId: parent.id, isPrimary: true },
  });
  console.log(`✅ Parent: ${parent.email}`);
  console.log(`✅ Child: ${child.firstName} ${child.lastName}`);

  // ── 7. Sample Activity ───────────────────────────────────────
  const activity = await prisma.activity.upsert({
    where: { id: 'act_seed_01' },
    update: {},
    create: {
      id: 'act_seed_01',
      title: 'Animal Sorting Game',
      description: 'Children sort animal pictures by categories (pets, wild, farm).',
      instructions: '1. Lay out the cards. 2. Ask children to group by category. 3. Discuss why.',
      bloomLevels: [BloomLevel.REMEMBER, BloomLevel.UNDERSTAND, BloomLevel.ANALYZE],
      activityType: 'Group',
      ageGroup: '4-5 years',
      durationMins: 30,
      resources: [],
      learningGoals: ['Identify animals by name', 'Group animals by habitat', 'Explain sorting choices'],
      status: ActivityStatus.PUBLISHED,
      centerId: center.id,
      createdById: manager.id,
    },
  });
  console.log(`✅ Activity: ${activity.title}`);

  // ── 8. Sample Attendance ─────────────────────────────────────
  await prisma.attendance.upsert({
    where: { childId_date: { childId: child.id, date: new Date('2025-01-15') } },
    update: {},
    create: {
      childId: child.id,
      date: new Date('2025-01-15'),
      status: AttendanceStatus.PRESENT,
    },
  });

  console.log('\n✨ Seed complete!\n');
  console.log('Demo accounts:');
  console.log('  Super Admin : superadmin@smart-eccd.com  / Admin@1234');
  console.log('  Manager     : manager@brightstart.com    / Manager@1234');
  console.log('  Teacher     : teacher@brightstart.com    / Teacher@1234');
  console.log('  Parent      : parent@example.com         / Parent@1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
