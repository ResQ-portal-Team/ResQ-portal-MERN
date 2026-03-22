/**
 * Inserts SLIIT Community Hub dummy events (re-run safe: replaces same titles).
 * Usage: from project root — npm run seed:community
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const CommunityEvent = require('../models/CommunityEvent');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resq_portal';

/** Staggered demo dates (upcoming / recent) */
const d = (month, day, h = 9) => new Date(2026, month - 1, day, h, 0, 0);

const SEED_EVENTS = [
  // Major Annual Events
  {
    title: 'CODEFEST',
    description:
      'An ICT competition designed to raise national awareness and skills. Open to teams across Sri Lanka.',
    startDateTime: d(3, 10),
    endDateTime: d(3, 12, 17),
    location: 'SLIIT Main Campus, Malabe',
    organizer: 'SLIIT Faculty of Computing',
    category: 'Major Annual Events',
  },
  {
    title: 'ROBOFEST',
    description:
      'An annual robotics competition hosted by the Department of Electrical & Computer Engineering.',
    startDateTime: d(4, 5),
    endDateTime: d(4, 6, 18),
    location: 'SLIIT Engineering Labs, Malabe',
    organizer: 'Department of Electrical & Computer Engineering, SLIIT',
    category: 'Major Annual Events',
  },
  {
    title: 'Interschool Quiz Competition',
    description: 'Organized by the Faculty of Business — schools compete in business and general knowledge rounds.',
    startDateTime: d(5, 8),
    endDateTime: d(5, 8, 16),
    location: 'SLIIT Business School Auditorium',
    organizer: 'Faculty of Business, SLIIT',
    category: 'Major Annual Events',
  },
  {
    title: "SLIIT's Got Talent",
    description: 'A talent showcase for students — music, dance, drama, and more.',
    startDateTime: d(6, 14),
    endDateTime: d(6, 14, 21),
    location: 'SLIIT Open Air Stage / Auditorium',
    organizer: 'SLIIT Student Community',
    category: 'Major Annual Events',
  },
  {
    title: 'Young Engineering Expo',
    description: 'Showcases innovations from engineering students — projects, prototypes, and demos.',
    startDateTime: d(7, 20),
    endDateTime: d(7, 21, 17),
    location: 'SLIIT Engineering Faculty Exhibition Hall',
    organizer: 'Faculty of Engineering, SLIIT',
    category: 'Major Annual Events',
  },

  // Specialized Events & Competitions
  {
    title: 'Technopreneur Challenge',
    description: 'A digital entrepreneurship competition — pitch, prototype, and scale your idea.',
    startDateTime: d(2, 22),
    endDateTime: d(2, 23, 18),
    location: 'SLIIT Innovation Hub',
    organizer: 'SLIIT Entrepreneurship Cell',
    category: 'Specialized Events & Competitions',
  },
  {
    title: 'DOCKFEST',
    description:
      'The inaugural Logistics Day organized by the Logistics Club of SLIIT Business School.',
    startDateTime: d(3, 28),
    endDateTime: d(3, 28, 17),
    location: 'SLIIT Business School',
    organizer: 'Logistics Club, SLIIT Business School',
    category: 'Specialized Events & Competitions',
  },
  {
    title: 'Capture the Flag Challenge',
    description: 'Cybersecurity competition — teams solve challenges in ethical hacking and defense.',
    startDateTime: d(4, 12),
    endDateTime: d(4, 13, 17),
    location: 'SLIIT Computer Labs',
    organizer: 'SLIIT Cyber Security Club',
    category: 'Specialized Events & Competitions',
  },
  {
    title: 'National Educator Awards (NEA)',
    description: 'Organized by the Faculty of Humanities and Sciences — recognising excellence in teaching.',
    startDateTime: d(5, 30),
    endDateTime: d(5, 30, 20),
    location: 'SLIIT Main Auditorium',
    organizer: 'Faculty of Humanities and Sciences, SLIIT',
    category: 'Specialized Events & Competitions',
  },
  {
    title: 'International Open Day',
    description: 'Showcasing global transfer opportunities and partner universities.',
    startDateTime: d(8, 9),
    endDateTime: d(8, 9, 16),
    location: 'SLIIT International Office & Exhibition Area',
    organizer: 'SLIIT International Affairs',
    category: 'Specialized Events & Competitions',
  },

  // Student & Cultural Activities
  {
    title: 'Foodfest',
    description: 'Annual food festival — stalls, cuisines, and student vendors across campus.',
    startDateTime: d(2, 14),
    endDateTime: d(2, 14, 21),
    location: 'SLIIT Campus Grounds',
    organizer: 'SLIIT Student Union',
    category: 'Student & Cultural Activities',
  },
  {
    title: 'Gamefest',
    description: 'Gaming competition — esports titles, LAN parties, and casual tournaments.',
    startDateTime: d(3, 1),
    endDateTime: d(3, 2, 20),
    location: 'SLIIT Student Centre',
    organizer: 'SLIIT Gaming Club',
    category: 'Student & Cultural Activities',
  },
  {
    title: 'Karrol/Cultural Festivals',
    description: 'Celebratory events — cultural performances, traditions, and community gatherings.',
    startDateTime: d(4, 18),
    endDateTime: d(4, 19, 18),
    location: 'SLIIT Open Air / Auditorium',
    organizer: 'SLIIT Cultural Societies',
    category: 'Student & Cultural Activities',
  },
  {
    title: 'Career Days',
    description: 'Networking events with industry — including sessions with partners such as Union Assurance PLC.',
    startDateTime: d(5, 15),
    endDateTime: d(5, 15, 17),
    location: 'SLIIT Career Guidance Hall',
    organizer: 'SLIIT Career Guidance Unit',
    category: 'Student & Cultural Activities',
  },
  {
    title: 'Sports Encounters',
    description: 'Friendly cricket and other sports tournaments between faculties and external teams.',
    startDateTime: d(6, 7),
    endDateTime: d(6, 8, 18),
    location: 'SLIIT Sports Grounds',
    organizer: 'SLIIT Sports Council',
    category: 'Student & Cultural Activities',
  },
];

async function run() {
  await mongoose.connect(uri);
  const titles = SEED_EVENTS.map((e) => e.title);
  const removed = await CommunityEvent.deleteMany({ title: { $in: titles } });
  const inserted = await CommunityEvent.insertMany(SEED_EVENTS);
  console.log(`Removed ${removed.deletedCount} old seed rows (if any). Inserted ${inserted.length} SLIIT dummy events.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
