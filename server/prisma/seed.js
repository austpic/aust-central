import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

/**
 * Development seed.
 *
 * Ports the hardcoded fixtures currently living inside the Flutter widgets into
 * real rows, so the app has something to render the moment it points at this
 * server. Idempotent — safe to run repeatedly.
 *
 * NOT for production: it creates accounts with known passwords.
 */

const prisma = new PrismaClient();

const PEPPER = process.env.PASSWORD_PEPPER ?? '';
const DEMO_PASSWORD = 'DemoPassword1';

/** The 12 selectable places from bus_page.dart, then the campus-bound legs. */
const STOPS = [
  'Mirpur', 'Ansar Camp', 'Technical', 'Kalyanpur', 'Shyamoli', 'Ring Road',
  'Shia Mashjid', 'Mohammadpur', 'Asadgate', 'Manik Mia', 'Khamar Bari', 'Farmgate',
  'Bijoy Sarani', 'Mohakhali', 'Banani', 'Gulshan', 'AUST',
];

/** Buses and routes from bus_selection_page.dart, extended to start at Mirpur. */
const BUSES = [
  {
    name: 'Meghna - 1',
    driverNumber: '+880 1711-000001',
    route: ['Mirpur', 'Kalyanpur', 'Shyamoli', 'Asadgate', 'Farmgate', 'Bijoy Sarani', 'Mohakhali', 'AUST'],
  },
  {
    name: 'Jamuna - 2',
    driverNumber: '+880 1711-000002',
    route: ['Technical', 'Shyamoli', 'Ring Road', 'Mohammadpur', 'Asadgate', 'Farmgate', 'Banani', 'Mohakhali', 'AUST'],
  },
  {
    name: 'Padma - 1',
    driverNumber: '+880 1711-000003',
    route: ['Ansar Camp', 'Kalyanpur', 'Shia Mashjid', 'Manik Mia', 'Khamar Bari', 'Farmgate', 'Bijoy Sarani', 'Gulshan', 'AUST'],
  },
];

/** The five daily slots from schedule_page.dart, normalised to 24-hour. */
const DEPARTURE_TIMES = ['06:00', '08:30', '13:30', '15:30', '18:30'];
const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];

/** Notices from notice_board_screen.dart. */
const NOTICES = [
  {
    title: 'Mandatory attendance for CSE-301 lab tomorrow',
    body: "All Section B students enrolled in CSE-301 (Data Structures) must attend tomorrow's lab session. Roll will be taken at 8:30 am sharp. Students without prior written exemption will be marked absent.",
    category: 'ACADEMIC',
    pinned: true,
    daysAgo: 1,
  },
  {
    title: 'Mid-term routine released for Section B',
    body: 'The Spring 2026 mid-term routine for Section B has been published. Pick up a copy from your department office or check the notice board outside Room 4C02.',
    category: 'EXAM',
    daysAgo: 4,
  },
  {
    title: 'Career Fair 2026 — registrations open',
    body: 'AUST Central Career Fair returns on 24 May. 40+ companies including GP, BRAC, and Pathao will be on campus. Register by 18 May at the career services desk — bring your CV.',
    category: 'EVENT',
    daysAgo: 6,
  },
  {
    title: 'Library closed Friday for maintenance',
    body: 'The main library will be closed this Friday from 9 am to 6 pm for AC maintenance. Reading rooms on the third floor will remain open.',
    category: 'GENERAL',
    daysAgo: 8,
  },
];

/** Lost & found items from lost_found_screen.dart. */
const LOST_FOUND = [
  { name: 'Backpack', category: 'Bags', color: 'Black', room: '7A06', daysAgo: 20 },
  { name: 'Bottle', category: 'Bottle', color: 'Blue', room: '4C02', daysAgo: 35 },
  { name: 'ID Card', category: 'ID Card', color: '', room: '', daysAgo: 60 },
  { name: 'Umbrella', category: 'Umbrella', color: 'Grey', room: '', daysAgo: 60 },
  { name: 'Charger', category: 'Charger', color: 'White', room: 'Library', daysAgo: 12 },
];

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 3600 * 1000);
}

async function upsertUser({ email, name, role, department, studentId }) {
  const passwordHash = await argon2.hash(`${DEMO_PASSWORD}${PEPPER}`, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });

  return prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      role,
      department,
      studentId,
      passwordHash,
      emailVerifiedAt: new Date(),
    },
    // Never reset an existing password on re-seed.
    update: { name, role, department, studentId },
  });
}

async function main() {
  if (!PEPPER) {
    throw new Error(
      'PASSWORD_PEPPER is not set. Run with the same environment the server uses, ' +
        'or seeded accounts will not be able to sign in.',
    );
  }

  console.log('Seeding…');

  // --- Users ---
  const admin = await upsertUser({
    email: 'admin@aust.edu',
    name: 'Campus Admin',
    role: 'ADMIN',
    department: 'Administration',
    studentId: null,
  });

  const farhana = await upsertUser({
    email: 'farhana@aust.edu',
    name: 'Farhana Rahman',
    role: 'STUDENT',
    department: 'CSE',
    studentId: '20200104001',
  });

  const arman = await upsertUser({
    email: 'arman@aust.edu',
    name: 'Shahidul Islam Arman',
    role: 'STUDENT',
    department: 'Chemistry',
    studentId: '20200203045',
  });

  console.log('  users: 3');

  // --- Transport ---
  const stops = new Map();
  for (const name of STOPS) {
    const stop = await prisma.busStop.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    stops.set(name, stop.id);
  }

  for (const definition of BUSES) {
    const bus = await prisma.bus.upsert({
      where: { name: definition.name },
      create: { name: definition.name, driverNumber: definition.driverNumber },
      update: { driverNumber: definition.driverNumber },
    });

    // Rebuild the route each run so edits above take effect.
    await prisma.routeStop.deleteMany({ where: { busId: bus.id } });
    await prisma.routeStop.createMany({
      data: definition.route.map((stopName, position) => ({
        busId: bus.id,
        stopId: stops.get(stopName),
        position,
      })),
    });

    for (const departureTime of DEPARTURE_TIMES) {
      await prisma.departure.upsert({
        where: { busId_departureTime: { busId: bus.id, departureTime } },
        create: { busId: bus.id, departureTime, daysOfWeek: WEEKDAYS },
        update: { daysOfWeek: WEEKDAYS },
      });
    }
  }
  console.log(`  stops: ${STOPS.length}, buses: ${BUSES.length}, departures: ${BUSES.length * DEPARTURE_TIMES.length}`);

  // --- Notices ---
  if ((await prisma.notice.count()) === 0) {
    for (const notice of NOTICES) {
      await prisma.notice.create({
        data: {
          title: notice.title,
          body: notice.body,
          category: notice.category,
          pinned: notice.pinned ?? false,
          postedAt: daysAgo(notice.daysAgo),
          authorId: admin.id,
        },
      });
    }
  }
  console.log(`  notices: ${await prisma.notice.count()}`);

  // --- Blood ---
  await prisma.donorProfile.upsert({
    where: { userId: farhana.id },
    create: {
      userId: farhana.id,
      available: true,
      bloodGroup: 'O_POS',
      lastDonated: daysAgo(45),
    },
    update: {},
  });

  if ((await prisma.bloodRequest.count()) === 0) {
    await prisma.bloodRequest.createMany({
      data: [
        {
          requesterId: arman.id,
          patientName: 'Nazia Rahman',
          bloodGroup: 'A_POS',
          hospital: 'Square Hospital',
          location: 'Panthapath, Dhaka',
          units: 2,
          urgency: 'CRITICAL',
          requiredBy: hoursFromNow(6),
          contactNumber: '+8801711122334',
          notes: 'ICU admission — needs platelets too',
        },
        {
          requesterId: farhana.id,
          patientName: 'Imran Hossain',
          bloodGroup: 'B_NEG',
          hospital: 'Popular Diagnostic',
          location: 'Dhanmondi, Dhaka',
          units: 1,
          urgency: 'URGENT',
          requiredBy: hoursFromNow(48),
          contactNumber: '+8801811223344',
          notes: '',
        },
      ],
    });
  }
  console.log(`  blood requests: ${await prisma.bloodRequest.count()}`);

  // --- Book exchange ---
  if ((await prisma.bookListing.count()) === 0) {
    await prisma.bookListing.createMany({
      data: [
        {
          sellerId: arman.id,
          title: 'Organic Chemistry: Structure & Function',
          courseCode: 'CHEM 201',
          department: 'Chemistry',
          semester: 'Fall 2025',
          condition: 'LIKE_NEW',
          listingType: 'SWAP',
          priceBdt: null,
          description: 'Barely used, no markings. Happy to swap for a CSE text.',
        },
        {
          sellerId: arman.id,
          title: 'Organic Chemistry: Structure & Function',
          courseCode: 'CHEM 201',
          department: 'Chemistry',
          semester: 'Spring 2025',
          condition: 'GOOD',
          listingType: 'SALE',
          priceBdt: 300,
          description: 'Some highlighting in the first three chapters.',
        },
        {
          sellerId: farhana.id,
          title: 'Introduction to Algorithms',
          courseCode: 'CSE 301',
          department: 'CSE',
          semester: 'Fall 2025',
          condition: 'GOOD',
          listingType: 'FREE',
          priceBdt: null,
          description: 'Passing it on — just collect from campus.',
        },
      ],
    });
  }
  console.log(`  book listings: ${await prisma.bookListing.count()}`);

  // --- Lost & found ---
  if ((await prisma.lostFoundItem.count()) === 0) {
    await prisma.lostFoundItem.createMany({
      data: LOST_FOUND.map((item) => ({
        reporterId: farhana.id,
        name: item.name,
        kind: 'FOUND',
        category: item.category,
        color: item.color,
        room: item.room,
        occurredOn: daysAgo(item.daysAgo),
        description: '',
      })),
    });
  }
  console.log(`  lost & found: ${await prisma.lostFoundItem.count()}`);

  // --- Academic data for the demo student ---
  if ((await prisma.semester.count({ where: { userId: farhana.id } })) === 0) {
    const semesters = [
      { name: 'Spring 2023', position: 0 },
      { name: 'Summer 2023', position: 1 },
      { name: 'Fall 2023', position: 2 },
    ];
    const courses = [
      { courseName: 'Data Structures', credits: 3, grade: 'A' },
      { courseName: 'Database Systems', credits: 3, grade: 'A_PLUS' },
      { courseName: 'Digital Logic Design', credits: 3, grade: 'A_MINUS' },
      { courseName: 'Discrete Mathematics', credits: 3, grade: 'B_PLUS' },
      { courseName: 'English Composition', credits: 3, grade: 'A' },
      { courseName: 'Physics Lab', credits: 1.5, grade: 'A_PLUS' },
    ];

    for (const semester of semesters) {
      const created = await prisma.semester.create({
        data: { userId: farhana.id, ...semester },
      });
      await prisma.courseGrade.createMany({
        data: courses.map((c) => ({ semesterId: created.id, ...c })),
      });
    }
  }

  if ((await prisma.classReminder.count({ where: { userId: farhana.id } })) === 0) {
    await prisma.classReminder.createMany({
      data: [
        { userId: farhana.id, courseName: 'Data Structures', weekday: 'SUNDAY', classTime: '10:00', minutesBefore: 10 },
        { userId: farhana.id, courseName: 'Database Systems', weekday: 'TUESDAY', classTime: '13:00', minutesBefore: 15 },
        { userId: farhana.id, courseName: 'Digital Logic Design', weekday: 'TUESDAY', classTime: '14:00', isEnabled: false, minutesBefore: 5 },
        { userId: farhana.id, courseName: 'Discrete Mathematics', weekday: 'TUESDAY', classTime: '15:00', minutesBefore: 10 },
        { userId: farhana.id, courseName: 'English Composition', weekday: 'MONDAY', classTime: '16:00', isEnabled: false, minutesBefore: 30 },
        { userId: farhana.id, courseName: 'Physics Lab', weekday: 'MONDAY', classTime: '17:00', minutesBefore: 15 },
      ],
    });
  }

  if ((await prisma.task.count({ where: { userId: farhana.id } })) === 0) {
    await prisma.task.createMany({
      data: [
        { userId: farhana.id, title: 'Finish DLD assignment', category: 'TODAY', dueDate: new Date() },
        { userId: farhana.id, title: 'Read Algorithms ch. 4', category: 'TODAY', dueDate: new Date() },
        { userId: farhana.id, title: 'Submit lab report', category: 'LATER', dueDate: daysAgo(-3) },
      ],
    });
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: farhana.id,
        type: 'NOTICE',
        title: 'New notice posted',
        body: 'Mandatory attendance for CSE-301 lab tomorrow',
      },
      {
        userId: farhana.id,
        type: 'BLOOD_REQUEST',
        title: 'Critical blood request nearby',
        body: 'A+ needed at Square Hospital',
      },
    ],
    skipDuplicates: true,
  });

  console.log('\nSeed complete.');
  console.log(`Demo accounts (password: ${DEMO_PASSWORD})`);
  console.log('  admin@aust.edu    (ADMIN)');
  console.log('  farhana@aust.edu  (STUDENT, has data)');
  console.log('  arman@aust.edu    (STUDENT, seller)');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
