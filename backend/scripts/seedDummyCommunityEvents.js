/**
 * Inserts 10 sample Community Hub events into MongoDB.
 * Run from project root: npm run seed:community
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: false });

const mongoose = require('mongoose');
const CommunityEvent = require('../models/CommunityEvent');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resq_portal';

const daysFromNow = (d) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  x.setHours(10, 0, 0, 0);
  return x;
};

const daysFromNowEnd = (d, hours) => {
  const x = daysFromNow(d);
  const y = new Date(x);
  y.setHours(y.getHours() + (hours || 2));
  return y;
};

const dummyEvents = [
  {
    title: 'SLIIT Tech Talk 2026 — AI on Campus',
    description:
      'Open talk on how AI is changing software engineering. For IT and CS students; includes Q&A and light refreshments.',
    startDateTime: daysFromNow(7),
    endDateTime: daysFromNowEnd(7, 2),
    location: 'Main Auditorium, SLIIT Malabe',
    organizer: 'IEEE Student Branch',
    category: 'Tech Talk',
    imageUrl: 'https://picsum.photos/seed/sliit1/960/540',
    videoUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    contactInfo: 'ieee@sliit.lk',
  },
  {
    title: 'Workshop: UI/UX with Figma',
    description:
      'Hands-on session covering components, auto-layout, and prototyping. Bring your laptop.',
    startDateTime: daysFromNow(14),
    endDateTime: daysFromNowEnd(14, 3),
    location: 'Lab 4, Block B',
    organizer: 'Design Club SLIIT',
    category: 'Workshop',
    imageUrl: 'https://picsum.photos/seed/sliit2/960/540',
    videoUrl: 'https://www.youtube.com/watch?v=Ke90Tje7VS0',
    contactInfo: 'designclub@students.sliit.lk',
  },
  {
    title: 'Career Fair — Industry Meetup',
    description:
      'Meet recruiters and alumni from tech companies. CV clinic and mock interviews available.',
    startDateTime: daysFromNow(21),
    endDateTime: daysFromNowEnd(21, 5),
    location: 'Student Center Hall',
    organizer: 'Career Guidance Unit',
    category: 'Seminar',
    imageUrl: 'https://picsum.photos/seed/sliit3/960/540',
    contactInfo: 'careers@sliit.lk',
  },
  {
    title: 'Cultural Night 2026',
    description:
      'Music, dance, and drama performances celebrating diversity. Tickets at the door.',
    startDateTime: daysFromNow(35),
    endDateTime: daysFromNowEnd(35, 4),
    location: 'Outdoor Stage, Malabe Campus',
    organizer: 'Student Union — Cultural',
    category: 'Cultural',
    imageUrl: 'https://picsum.photos/seed/sliit4/960/540',
    videoUrl: 'https://www.youtube.com/watch?v=L_jWHffIx5E',
  },
  {
    title: 'Inter-Faculty Cricket Finals',
    description:
      'Cheer for your faculty in the campus cricket finals. Food stalls and music between innings.',
    startDateTime: daysFromNow(10),
    endDateTime: daysFromNowEnd(10, 6),
    location: 'SLIIT Sports Ground',
    organizer: 'Sports Council',
    category: 'Sports',
    imageUrl: 'https://picsum.photos/seed/sliit5/960/540',
  },
  {
    title: 'Hackathon: Build for Good (48h)',
    description:
      'Team up and ship a prototype for a social good theme. Prizes for top three teams.',
    startDateTime: daysFromNow(45),
    endDateTime: daysFromNowEnd(45, 48),
    location: 'Innovation Lab + Online',
    organizer: 'FOSS Community SLIIT',
    category: 'Competition',
    imageUrl: 'https://picsum.photos/seed/sliit6/960/540',
    videoUrl: 'https://www.youtube.com/watch?v=Tn6-3hcGPno',
    contactInfo: 'foss@sliit.lk',
  },
  {
    title: 'Guest Lecture: Cybersecurity Careers',
    description:
      'Industry speaker on SOC roles, certifications, and internships. Open to all undergraduates.',
    startDateTime: daysFromNow(18),
    endDateTime: daysFromNowEnd(18, 2),
    location: 'Lecture Hall 12',
    organizer: 'Department of Computer Systems',
    category: 'Seminar',
    imageUrl: 'https://picsum.photos/seed/sliit7/960/540',
  },
  {
    title: 'Welcome Mixer — New Intake',
    description:
      'Meet batchmates and seniors. Icebreakers, club stalls, and campus tour sign-ups.',
    startDateTime: daysFromNow(3),
    endDateTime: daysFromNowEnd(3, 3),
    location: 'Canteen Courtyard',
    organizer: 'Student Welfare',
    category: 'Social',
    imageUrl: 'https://picsum.photos/seed/sliit8/960/540',
  },
  {
    title: 'Robotics Demo Day',
    description:
      'Line-follower and sumo-bot demos from project teams. Volunteers welcome to try the arena.',
    startDateTime: daysFromNow(28),
    endDateTime: daysFromNowEnd(28, 4),
    location: 'Mechatronics Lab',
    organizer: 'Robotics Club',
    category: 'Workshop',
    imageUrl: 'https://picsum.photos/seed/sliit9/960/540',
    videoUrl: 'https://www.youtube.com/watch?v=8jPQjjsBbIc',
  },
  {
    title: 'Research Seminar: Sustainable Computing',
    description:
      'Short talks by final-year researchers on energy-aware systems and green data centers.',
    startDateTime: daysFromNow(40),
    endDateTime: daysFromNowEnd(40, 2),
    location: 'Research Wing Seminar Room',
    organizer: 'Faculty of Computing',
    category: 'Other',
    imageUrl: 'https://picsum.photos/seed/sliit10/960/540',
    contactInfo: 'research@sliit.lk',
  },
];

async function run() {
  await mongoose.connect(uri);
  console.log('MongoDB connected');

  const created = await CommunityEvent.insertMany(dummyEvents);
  console.log(`Inserted ${created.length} community events.`);

  await mongoose.disconnect();
  console.log('Done.');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
