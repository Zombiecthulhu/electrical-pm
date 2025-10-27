import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password_hash: adminPassword,
      role: 'SUPER_ADMIN',
      first_name: 'System',
      last_name: 'Administrator',
      phone: '555-0100',
      is_active: true,
    },
  });

  console.log('Created admin user:', admin.email);

  // Create project manager user
  const pmPassword = await bcrypt.hash('Manager@123', 12);
  const projectManager = await prisma.user.upsert({
    where: { email: 'pm@example.com' },
    update: {},
    create: {
      email: 'pm@example.com',
      password_hash: pmPassword,
      role: 'PROJECT_MANAGER',
      first_name: 'John',
      last_name: 'Manager',
      phone: '555-0101',
      is_active: true,
    },
  });

  console.log('Created project manager user:', projectManager.email);

  // Create field supervisor user
  const supervisorPassword = await bcrypt.hash('Super@123', 12);
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@example.com' },
    update: {},
    create: {
      email: 'supervisor@example.com',
      password_hash: supervisorPassword,
      role: 'FIELD_SUPERVISOR',
      first_name: 'Bob',
      last_name: 'Supervisor',
      phone: '555-0102',
      is_active: true,
    },
  });

  console.log('Created field supervisor user:', supervisor.email);

  // Create field worker user
  const workerPassword = await bcrypt.hash('Worker@123', 12);
  const worker = await prisma.user.upsert({
    where: { email: 'worker@example.com' },
    update: {},
    create: {
      email: 'worker@example.com',
      password_hash: workerPassword,
      role: 'FIELD_WORKER',
      first_name: 'Mike',
      last_name: 'Worker',
      phone: '555-0103',
      is_active: true,
    },
  });

  console.log('Created field worker user:', worker.email);

  // Create office admin user
  const staffPassword = await bcrypt.hash('Staff@123', 12);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: {},
    create: {
      email: 'staff@example.com',
      password_hash: staffPassword,
      role: 'OFFICE_ADMIN',
      first_name: 'Sarah',
      last_name: 'Staff',
      phone: '555-0104',
      is_active: true,
    },
  });

  console.log('Created office admin user:', staff.email);

  // Create sample client
  const client = await prisma.client.create({
    data: {
      name: 'ABC Construction Company',
      type: 'GENERAL_CONTRACTOR',
      address: '123 Main St, Springfield, IL 62701',
      phone: '555-0200',
      email: 'contact@abcconstruction.com',
      created_by: admin.id,
      updated_by: admin.id,
      contacts: {
        create: {
          name: 'Jane Smith',
          title: 'Project Coordinator',
          phone: '555-0201',
          email: 'jane.smith@abcconstruction.com',
          is_primary: true,
        },
      },
    },
  });

  console.log('Created sample client:', client.name);

  // Create sample project
  const project = await prisma.project.create({
    data: {
      name: 'Downtown Office Building',
      project_number: 'PRJ-2025-001',
      client_id: client.id,
      status: 'IN_PROGRESS',
      type: 'COMMERCIAL',
      location: 'Downtown Springfield',
      address: '456 Commerce Ave, Springfield, IL 62701',
      start_date: new Date('2025-01-15'),
      estimated_end_date: new Date('2025-06-30'),
      budget: 150000.0,
      description: 'Complete electrical installation for new office building',
      created_by: admin.id,
      updated_by: admin.id,
      members: {
        create: [
          {
            user_id: projectManager.id,
            role: 'Project Manager',
          },
          {
            user_id: supervisor.id,
            role: 'Field Supervisor',
          },
        ],
      },
    },
  });

  console.log('Created sample project:', project.name);

  console.log('Database seed completed successfully!');
}

main()
  .catch(e => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

