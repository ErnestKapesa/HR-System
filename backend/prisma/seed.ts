import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrator' },
    update: {},
    create: {
      name: 'Administrator',
      description: 'Full system access',
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
        '*'
      ],
    },
  });

  const hrRole = await prisma.role.upsert({
    where: { name: 'HR Manager' },
    update: {},
    create: {
      name: 'HR Manager',
      description: 'HR management access',
      permissions: [
        'employees.create',
        'employees.read',
        'employees.update',
        'attendance.read',
        'leave.read',
        'leave.approve',
        'performance.read',
        'performance.manage',
        'recruitment.read',
        'recruitment.manage',
        'reports.read',
        'reports.generate'
      ],
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      name: 'Manager',
      description: 'Team management access',
      permissions: [
        'employees.read',
        'attendance.read',
        'leave.read',
        'leave.approve',
        'performance.read',
        'performance.manage',
        'reports.read'
      ],
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: 'Employee' },
    update: {},
    create: {
      name: 'Employee',
      description: 'Basic employee access',
      permissions: [
        'profile.read',
        'profile.update',
        'attendance.read',
        'attendance.clock',
        'leave.read',
        'leave.request',
        'performance.read'
      ],
    },
  });

  // Create default departments
  const itDepartment = await prisma.department.upsert({
    where: { name: 'Information Technology' },
    update: {},
    create: {
      name: 'Information Technology',
      description: 'IT and software development',
      budget: 500000,
    },
  });

  const hrDepartment = await prisma.department.upsert({
    where: { name: 'Human Resources' },
    update: {},
    create: {
      name: 'Human Resources',
      description: 'Human resources management',
      budget: 200000,
    },
  });

  const financeDepartment = await prisma.department.upsert({
    where: { name: 'Finance' },
    update: {},
    create: {
      name: 'Finance',
      description: 'Financial management and accounting',
      budget: 300000,
    },
  });

  const marketingDepartment = await prisma.department.upsert({
    where: { name: 'Marketing' },
    update: {},
    create: {
      name: 'Marketing',
      description: 'Marketing and communications',
      budget: 250000,
    },
  });

  // Create default admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@transbantu.com' },
    update: {},
    create: {
      employeeId: 'TBT001',
      email: 'admin@transbantu.com',
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
      departmentId: itDepartment.id,
      status: 'ACTIVE',
      profile: {
        create: {
          firstName: 'System',
          lastName: 'Administrator',
          phone: '+1234567890',
          jobTitle: 'System Administrator',
          hireDate: new Date('2024-01-01'),
          salary: 100000,
        },
      },
    },
  });

  // Create HR Manager
  const hrPasswordHash = await bcrypt.hash('hr123', 12);
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@transbantu.com' },
    update: {},
    create: {
      employeeId: 'TBT002',
      email: 'hr@transbantu.com',
      passwordHash: hrPasswordHash,
      roleId: hrRole.id,
      departmentId: hrDepartment.id,
      status: 'ACTIVE',
      profile: {
        create: {
          firstName: 'Sarah',
          lastName: 'Johnson',
          phone: '+1234567891',
          jobTitle: 'HR Manager',
          hireDate: new Date('2024-01-15'),
          salary: 80000,
        },
      },
    },
  });

  // Create sample employees
  const employeePasswordHash = await bcrypt.hash('employee123', 12);
  
  const sampleEmployees = [
    {
      employeeId: 'TBT003',
      email: 'john.smith@transbantu.com',
      firstName: 'John',
      lastName: 'Smith',
      jobTitle: 'Senior Developer',
      departmentId: itDepartment.id,
      salary: 75000,
    },
    {
      employeeId: 'TBT004',
      email: 'mike.davis@transbantu.com',
      firstName: 'Mike',
      lastName: 'Davis',
      jobTitle: 'Financial Analyst',
      departmentId: financeDepartment.id,
      salary: 65000,
    },
    {
      employeeId: 'TBT005',
      email: 'lisa.wong@transbantu.com',
      firstName: 'Lisa',
      lastName: 'Wong',
      jobTitle: 'Marketing Specialist',
      departmentId: marketingDepartment.id,
      salary: 60000,
    },
  ];

  for (const emp of sampleEmployees) {
    await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        employeeId: emp.employeeId,
        email: emp.email,
        passwordHash: employeePasswordHash,
        roleId: employeeRole.id,
        departmentId: emp.departmentId,
        status: 'ACTIVE',
        profile: {
          create: {
            firstName: emp.firstName,
            lastName: emp.lastName,
            phone: '+1234567892',
            jobTitle: emp.jobTitle,
            hireDate: new Date('2024-02-01'),
            salary: emp.salary,
          },
        },
      },
    });
  }

  // Create default leave types
  const leaveTypes = [
    {
      name: 'Annual Leave',
      description: 'Yearly vacation leave',
      maxDaysPerYear: 25,
      carryForward: true,
    },
    {
      name: 'Sick Leave',
      description: 'Medical leave',
      maxDaysPerYear: 10,
      carryForward: false,
    },
    {
      name: 'Personal Leave',
      description: 'Personal time off',
      maxDaysPerYear: 5,
      carryForward: false,
    },
    {
      name: 'Maternity Leave',
      description: 'Maternity leave',
      maxDaysPerYear: 90,
      carryForward: false,
    },
  ];

  for (const leaveType of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { name: leaveType.name },
      update: {},
      create: leaveType,
    });
  }

  // Create sample job postings
  await prisma.jobPosting.upsert({
    where: { title: 'Senior Developer' },
    update: {},
    create: {
      title: 'Senior Developer',
      departmentId: itDepartment.id,
      description: 'We are looking for a senior developer to join our team...',
      requirements: 'Bachelor\'s degree in Computer Science, 5+ years experience...',
      salaryRange: '$70,000 - $90,000',
      employmentType: 'FULL_TIME',
      location: 'Remote / Office',
      status: 'ACTIVE',
      postedBy: adminUser.id,
      postedAt: new Date(),
      closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('');
  console.log('🔑 Default login credentials:');
  console.log('Admin: admin@transbantu.com / admin123');
  console.log('HR Manager: hr@transbantu.com / hr123');
  console.log('Employee: john.smith@transbantu.com / employee123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });