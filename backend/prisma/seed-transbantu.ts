import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Transbantu HR database seeding...');

  // Create specific roles for Transbantu
  const adminRole = await prisma.role.upsert({
    where: { name: 'HR Admin' },
    update: {},
    create: {
      name: 'HR Admin',
      description: 'Full HR Admin access - Prisca Sakala only',
      permissions: [
        'users.create',
        'users.read',
        'users.update',
        'users.delete',
        'employees.create',
        'employees.read',
        'employees.update',
        'employees.delete',
        'attendance.read',
        'attendance.manage',
        'leave.read',
        'leave.approve',
        'performance.read',
        'performance.manage',
        'recruitment.read',
        'recruitment.manage',
        'reports.read',
        'reports.generate',
        'workplans.create',
        'workplans.manage',
        'settings.manage',
        '*'
      ],
    },
  });

  const directorRole = await prisma.role.upsert({
    where: { name: 'Director' },
    update: {},
    create: {
      name: 'Director',
      description: 'Director level access',
      permissions: [
        'employees.read',
        'attendance.read',
        'leave.read',
        'performance.read',
        'reports.read',
        'workplans.read',
        'workplans.submit'
      ],
    },
  });

  const officerRole = await prisma.role.upsert({
    where: { name: 'Officer' },
    update: {},
    create: {
      name: 'Officer',
      description: 'Officer level access',
      permissions: [
        'profile.read',
        'profile.update',
        'attendance.read',
        'attendance.clock',
        'leave.read',
        'leave.request',
        'performance.read',
        'workplans.read',
        'workplans.submit'
      ],
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: 'Staff' },
    update: {},
    create: {
      name: 'Staff',
      description: 'General staff access',
      permissions: [
        'profile.read',
        'profile.update',
        'attendance.read',
        'attendance.clock',
        'leave.read',
        'leave.request',
        'workplans.read',
        'workplans.submit'
      ],
    },
  });

  // Create departments
  const departments = [
    { name: 'Management', description: 'Executive Management' },
    { name: 'Health Programs', description: 'Community Health Programs' },
    { name: 'Project Management', description: 'Project Implementation' },
    { name: 'Technical Services', description: 'Technical and Clinical Services' },
    { name: 'Support Services', description: 'Administrative and Support Services' },
    { name: 'Human Resources', description: 'HR and Administration' },
  ];

  const createdDepartments = {};
  for (const dept of departments) {
    const department = await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
    createdDepartments[dept.name] = department;
  }

  // Generate unique usernames with numbers
  function generateUsername(firstName: string, lastName: string): string {
    const baseUsername = firstName.toLowerCase();
    const randomNum = Math.floor(Math.random() * 90000) + 10000; // 5-digit number
    return `${baseUsername}${randomNum}`;
  }

  // Create all Transbantu staff members
  const staffMembers = [
    {
      firstName: 'Prisca',
      lastName: 'Sakala',
      position: 'HR and Admin Officer',
      department: 'Human Resources',
      role: adminRole.id,
      isAdmin: true
    },
    {
      firstName: 'Stephanie',
      lastName: 'Rossouw',
      position: 'Director',
      department: 'Management',
      role: directorRole.id
    },
    {
      firstName: 'Terry',
      lastName: 'Munansangu',
      position: 'Director',
      department: 'Management',
      role: directorRole.id
    },
    {
      firstName: 'Khitana',
      lastName: 'Ngandwe',
      position: 'Comm Health Advocate Officer',
      department: 'Health Programs',
      role: officerRole.id
    },
    {
      firstName: 'Emelia',
      lastName: 'Mwaba',
      position: 'Comm Project Officer',
      department: 'Project Management',
      role: officerRole.id
    },
    {
      firstName: 'Sarah',
      lastName: 'Chirwa',
      position: 'Project Officer',
      department: 'Project Management',
      role: officerRole.id
    },
    {
      firstName: 'Yang',
      lastName: 'Ngandwe',
      position: 'Ass Project Officer',
      department: 'Project Management',
      role: officerRole.id
    },
    {
      firstName: 'Ngawa',
      lastName: 'Chongani',
      position: 'Ass Project Officer',
      department: 'Project Management',
      role: officerRole.id
    },
    {
      firstName: 'Mponyela',
      lastName: 'Kamanya',
      position: 'Ass Project Officer',
      department: 'Project Management',
      role: officerRole.id
    },
    {
      firstName: 'Given',
      lastName: 'Mulenga',
      position: 'Health Care Provider',
      department: 'Technical Services',
      role: staffRole.id
    },
    {
      firstName: 'Elvis',
      lastName: 'Kopeka',
      position: 'HIV Technical Officer',
      department: 'Technical Services',
      role: officerRole.id
    },
    {
      firstName: 'Eric',
      lastName: 'Simukonda',
      position: 'Legal, Learning and Research Officer',
      department: 'Support Services',
      role: officerRole.id
    },
    {
      firstName: 'Mazuba',
      lastName: 'Chibanga',
      position: 'Community Outreach Officer',
      department: 'Health Programs',
      role: officerRole.id
    },
    {
      firstName: 'Pamela',
      lastName: 'Chileshe',
      position: 'Staff Counsellor',
      department: 'Support Services',
      role: staffRole.id
    },
    {
      firstName: 'Nalukwi',
      lastName: 'Susiku',
      position: 'Clinical Officer',
      department: 'Technical Services',
      role: officerRole.id
    },
    {
      firstName: 'Pelekelo',
      lastName: '',
      position: 'M&E Officer',
      department: 'Project Management',
      role: officerRole.id
    }
  ];

  // Create users with unique usernames
  for (const staff of staffMembers) {
    const username = generateUsername(staff.firstName, staff.lastName || 'staff');
    const email = `${username}@transbantu.org`;
    const defaultPassword = staff.isAdmin ? 'admin2024!' : 'transbantu2024!';
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    const employeeId = `TBT${String(staffMembers.indexOf(staff) + 1).padStart(3, '0')}`;

    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        employeeId,
        email,
        passwordHash,
        roleId: staff.role,
        departmentId: createdDepartments[staff.department].id,
        status: 'ACTIVE',
        profile: {
          create: {
            firstName: staff.firstName,
            lastName: staff.lastName || '',
            jobTitle: staff.position,
            hireDate: new Date('2024-01-01'),
            phone: '+260-XXX-XXXX',
          },
        },
      },
    });

    console.log(`✅ Created user: ${staff.firstName} ${staff.lastName} - Username: ${username}`);
  }

  // Create default leave types
  const leaveTypes = [
    { name: 'Annual Leave', description: 'Yearly vacation leave', maxDaysPerYear: 25, carryForward: true },
    { name: 'Sick Leave', description: 'Medical leave', maxDaysPerYear: 10, carryForward: false },
    { name: 'Personal Leave', description: 'Personal time off', maxDaysPerYear: 5, carryForward: false },
    { name: 'Maternity Leave', description: 'Maternity leave', maxDaysPerYear: 90, carryForward: false },
    { name: 'Compassionate Leave', description: 'Bereavement leave', maxDaysPerYear: 7, carryForward: false },
  ];

  for (const leaveType of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { name: leaveType.name },
      update: {},
      create: leaveType,
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log('');
  console.log('🔑 Login Credentials:');
  console.log('HR Admin (Prisca Sakala): Check console output for username / admin2024!');
  console.log('All other staff: Check console output for usernames / transbantu2024!');
  console.log('');
  console.log('📧 Email format: username@transbantu.org');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });