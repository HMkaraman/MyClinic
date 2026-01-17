import { PrismaClient, Role, Language } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'tenant-demo' },
    update: {},
    create: {
      id: 'tenant-demo',
      name: 'MyClinic Demo',
      settings: {
        timezone: 'Asia/Baghdad',
        currency: 'IQD',
        defaultLanguage: 'ar',
      },
    },
  });
  console.log('✓ Created tenant:', tenant.name);

  // Create default branch
  const branch = await prisma.branch.upsert({
    where: { id: 'branch-main' },
    update: {},
    create: {
      id: 'branch-main',
      tenantId: tenant.id,
      name: 'Main Branch',
      address: '123 Medical Street, Baghdad',
      phone: '+964 750 123 4567',
      settings: {
        workingHours: {
          start: '08:00',
          end: '20:00',
        },
        appointmentDuration: 30,
      },
    },
  });
  console.log('✓ Created branch:', branch.name);

  // Hash password for all users
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@myclinic.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@myclinic.com',
      name: 'Admin User',
      phone: '+964 750 000 0001',
      passwordHash,
      role: Role.ADMIN,
      branchIds: [branch.id],
      language: Language.en,
      status: 'ACTIVE',
    },
  });
  console.log('✓ Created admin user:', admin.email);

  // Create manager user
  const manager = await prisma.user.upsert({
    where: { email: 'manager@myclinic.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'manager@myclinic.com',
      name: 'Manager User',
      phone: '+964 750 000 0002',
      passwordHash,
      role: Role.MANAGER,
      branchIds: [branch.id],
      language: Language.ar,
      status: 'ACTIVE',
    },
  });
  console.log('✓ Created manager user:', manager.email);

  // Create doctor user
  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@myclinic.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'doctor@myclinic.com',
      name: 'Dr. Ahmad',
      phone: '+964 750 000 0003',
      passwordHash,
      role: Role.DOCTOR,
      branchIds: [branch.id],
      language: Language.ar,
      status: 'ACTIVE',
    },
  });
  console.log('✓ Created doctor user:', doctor.email);

  // Create reception user
  const reception = await prisma.user.upsert({
    where: { email: 'reception@myclinic.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'reception@myclinic.com',
      name: 'Sarah Reception',
      phone: '+964 750 000 0004',
      passwordHash,
      role: Role.RECEPTION,
      branchIds: [branch.id],
      language: Language.ar,
      status: 'ACTIVE',
    },
  });
  console.log('✓ Created reception user:', reception.email);

  // Create nurse user
  const nurse = await prisma.user.upsert({
    where: { email: 'nurse@myclinic.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'nurse@myclinic.com',
      name: 'Fatima Nurse',
      phone: '+964 750 000 0005',
      passwordHash,
      role: Role.NURSE,
      branchIds: [branch.id],
      language: Language.ar,
      status: 'ACTIVE',
    },
  });
  console.log('✓ Created nurse user:', nurse.email);

  // Create accountant user
  const accountant = await prisma.user.upsert({
    where: { email: 'accountant@myclinic.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'accountant@myclinic.com',
      name: 'Ali Accountant',
      phone: '+964 750 000 0006',
      passwordHash,
      role: Role.ACCOUNTANT,
      branchIds: [branch.id],
      language: Language.ar,
      status: 'ACTIVE',
    },
  });
  console.log('✓ Created accountant user:', accountant.email);

  // Create support user
  const support = await prisma.user.upsert({
    where: { email: 'support@myclinic.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'support@myclinic.com',
      name: 'Support Agent',
      phone: '+964 750 000 0007',
      passwordHash,
      role: Role.SUPPORT,
      branchIds: [branch.id],
      language: Language.en,
      status: 'ACTIVE',
    },
  });
  console.log('✓ Created support user:', support.email);

  // Create some sample services
  const services = [
    {
      id: 'service-consultation',
      tenantId: tenant.id,
      name: 'General Consultation',
      nameAr: 'استشارة عامة',
      nameEn: 'General Consultation',
      durationMinutes: 30,
      price: 25000,
      category: 'Consultation',
    },
    {
      id: 'service-followup',
      tenantId: tenant.id,
      name: 'Follow-up Visit',
      nameAr: 'زيارة متابعة',
      nameEn: 'Follow-up Visit',
      durationMinutes: 15,
      price: 15000,
      category: 'Consultation',
    },
    {
      id: 'service-xray',
      tenantId: tenant.id,
      name: 'X-Ray',
      nameAr: 'أشعة سينية',
      nameEn: 'X-Ray',
      durationMinutes: 20,
      price: 35000,
      category: 'Imaging',
    },
    {
      id: 'service-bloodtest',
      tenantId: tenant.id,
      name: 'Blood Test',
      nameAr: 'فحص دم',
      nameEn: 'Blood Test',
      durationMinutes: 10,
      price: 20000,
      category: 'Laboratory',
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: {},
      create: service,
    });
    console.log('✓ Created service:', service.name);
  }

  // Create sample patients
  const patient1 = await prisma.patient.upsert({
    where: { id: 'patient-demo-1' },
    update: {},
    create: {
      id: 'patient-demo-1',
      tenantId: tenant.id,
      branchId: branch.id,
      fileNumber: 'P-20260118-00001',
      name: 'Ahmed Mohammed',
      phone: '+964 750 111 1111',
      email: 'ahmed@example.com',
      dateOfBirth: new Date('1985-03-15'),
      gender: 'MALE',
      address: 'Baghdad, Al-Mansour District',
      medicalSummary: {
        allergies: ['penicillin'],
        conditions: ['hypertension'],
        bloodType: 'A+',
      },
      source: 'WALK_IN',
    },
  });
  console.log('✓ Created patient:', patient1.name);

  const patient2 = await prisma.patient.upsert({
    where: { id: 'patient-demo-2' },
    update: {},
    create: {
      id: 'patient-demo-2',
      tenantId: tenant.id,
      branchId: branch.id,
      fileNumber: 'P-20260118-00002',
      name: 'Fatima Hassan',
      phone: '+964 750 222 2222',
      dateOfBirth: new Date('1990-07-22'),
      gender: 'FEMALE',
      address: 'Baghdad, Karrada District',
      medicalSummary: {
        allergies: [],
        conditions: ['diabetes type 2'],
        bloodType: 'O+',
      },
      source: 'REFERRAL',
    },
  });
  console.log('✓ Created patient:', patient2.name);

  // Create sample appointment (tomorrow at 10 AM)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const appointment = await prisma.appointment.upsert({
    where: { id: 'appointment-demo-1' },
    update: {},
    create: {
      id: 'appointment-demo-1',
      branchId: branch.id,
      patientId: patient1.id,
      doctorId: doctor.id,
      serviceId: 'service-consultation',
      scheduledAt: tomorrow,
      durationMinutes: 30,
      status: 'CONFIRMED',
      notes: 'Regular checkup appointment',
    },
  });
  console.log('✓ Created appointment for:', patient1.name);

  console.log('\n🎉 Database seed completed successfully!\n');
  console.log('Test credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('| Role       | Email                    | Password   |');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('| Admin      | admin@myclinic.com       | Admin123!  |');
  console.log('| Manager    | manager@myclinic.com     | Admin123!  |');
  console.log('| Doctor     | doctor@myclinic.com      | Admin123!  |');
  console.log('| Reception  | reception@myclinic.com   | Admin123!  |');
  console.log('| Nurse      | nurse@myclinic.com       | Admin123!  |');
  console.log('| Accountant | accountant@myclinic.com  | Admin123!  |');
  console.log('| Support    | support@myclinic.com     | Admin123!  |');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
