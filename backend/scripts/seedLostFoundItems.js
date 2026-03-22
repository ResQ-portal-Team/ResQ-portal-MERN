/**
 * Inserts lost & found dummy items (re-run safe: replaces same titles).
 * Usage: from project root — npm run seed:lostfound
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Item = require('../models/Item');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resq_portal';

const DEMO_EMAIL = 'demo_lostfound@resq.local';
const DEMO_STUDENT_ID = 'ITDEMO999';
const DEMO_NICKNAME = 'lostfound_demo';

const date = (y, m, d) => new Date(y, m - 1, d, 12, 0, 0);

/** Titles used for idempotent delete-before-insert */
const SEED_ITEM_TITLES = [
  '[DEMO] Black Samsung Galaxy — lost after lecture',
  '[DEMO] Samsung phone found near canteen',
  '[DEMO] SLIIT student ID card (Faculty of Computing)',
  '[DEMO] Student ID picked up at Library entrance',
  '[DEMO] Grey Nike backpack with laptop sleeve',
  '[DEMO] Unclaimed backpack — Student Centre',
  '[DEMO] Data Structures textbook (2nd ed.)',
  '[DEMO] Textbook left in Lab 03',
  '[DEMO] Brown leather wallet with cards',
  '[DEMO] Wallet found in Main Hall',
  '[DEMO] AirPods Pro case — white',
  '[DEMO] Returned: keys with SLIIT keychain',
];

const SEED_ITEMS = [
  {
    title: '[DEMO] Black Samsung Galaxy — lost after lecture',
    description:
      'Black Samsung Galaxy A-series with cracked corner protector. Last seen after 10:00 lecture. Lock screen has a mountain wallpaper.',
    type: 'lost',
    category: 'Mobile phones',
    location: 'Block 4 — Ground floor corridor',
    date: date(2026, 3, 18),
    status: 'active',
  },
  {
    title: '[DEMO] Samsung phone found near canteen',
    description:
      'Samsung Android phone found on a bench outside the canteen. Black case. Will verify ownership before handover.',
    type: 'found',
    category: 'Mobile phones',
    location: 'Block 4 — Ground floor corridor',
    date: date(2026, 3, 19),
    status: 'active',
  },
  {
    title: '[DEMO] SLIIT student ID card (Faculty of Computing)',
    description: 'Lost my faculty ID while rushing between labs. Name starts with K — reward if found.',
    type: 'lost',
    category: 'Student ID cards',
    location: 'Library — Ground floor',
    date: date(2026, 3, 15),
    status: 'active',
  },
  {
    title: '[DEMO] Student ID picked up at Library entrance',
    description: 'Student ID card handed in at security. Owner can collect with verification.',
    type: 'found',
    category: 'Student ID cards',
    location: 'Library — Ground floor',
    date: date(2026, 3, 16),
    status: 'pending',
  },
  {
    title: '[DEMO] Grey Nike backpack with laptop sleeve',
    description: 'Grey Nike backpack, small tear on left strap. Contains notebooks and a water bottle.',
    type: 'lost',
    category: 'Backpacks',
    location: 'Sports ground — pavilion side',
    date: date(2026, 3, 10),
    status: 'active',
  },
  {
    title: '[DEMO] Unclaimed backpack — Student Centre',
    description: 'Grey backpack left near lockers. Contents not described; claim at office with details.',
    type: 'found',
    category: 'Backpacks',
    location: 'Student Centre — near lockers',
    date: date(2026, 3, 12),
    status: 'active',
  },
  {
    title: '[DEMO] Data Structures textbook (2nd ed.)',
    description: 'Pearson textbook with name written on the first page (faded). Lost during mid-day break.',
    type: 'lost',
    category: 'Textbooks',
    location: 'Lab 02 — Computing',
    date: date(2026, 3, 5),
    status: 'active',
  },
  {
    title: '[DEMO] Textbook left in Lab 03',
    description: 'Data structures textbook on desk. Left with lab tech for collection.',
    type: 'found',
    category: 'Textbooks',
    location: 'Lab 03 — Computing',
    date: date(2026, 3, 6),
    status: 'active',
  },
  {
    title: '[DEMO] Brown leather wallet with cards',
    description: 'Slim brown wallet. Contains bank cards — will not disclose last digits here.',
    type: 'lost',
    category: 'Wallets',
    location: 'Main Hall — during event',
    date: date(2026, 2, 28),
    status: 'active',
  },
  {
    title: '[DEMO] Wallet found in Main Hall',
    description: 'Brown wallet found under seating after evening session. Security has it.',
    type: 'found',
    category: 'Wallets',
    location: 'Main Hall — during event',
    date: date(2026, 3, 1),
    status: 'returned',
  },
  {
    title: '[DEMO] AirPods Pro case — white',
    description: 'White charging case only (no earbuds inside). Stickers on lid.',
    type: 'lost',
    category: 'Headphones / Earbuds',
    location: 'Canteen — indoor seating',
    date: date(2026, 3, 20),
    status: 'active',
  },
  {
    title: '[DEMO] Returned: keys with SLIIT keychain',
    description: 'Bunch of keys with blue SLIIT keychain — matched and returned (demo closed item).',
    type: 'found',
    category: 'Room keys',
    location: 'Parking area B',
    date: date(2026, 1, 12),
    status: 'returned',
  },
];

async function ensureDemoUser() {
  let user = await User.findOne({ email: DEMO_EMAIL });
  if (user) {
    return user;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('DemoLostFound123!', salt);

  try {
    user = await User.create({
      studentId: DEMO_STUDENT_ID,
      realName: 'Lost & Found Demo',
      email: DEMO_EMAIL,
      nickname: DEMO_NICKNAME,
      password: hashedPassword,
    });
  } catch (e) {
    if (e.code === 11000) {
      user = await User.findOne({
        $or: [{ email: DEMO_EMAIL }, { studentId: DEMO_STUDENT_ID }, { nickname: DEMO_NICKNAME }],
      });
    } else {
      throw e;
    }
  }

  if (!user) {
    throw new Error('Could not create or load demo user for seed items.');
  }

  return user;
}

async function run() {
  await mongoose.connect(uri);
  const poster = await ensureDemoUser();

  const removed = await Item.deleteMany({ title: { $in: SEED_ITEM_TITLES } });
  const docs = SEED_ITEMS.map((row) => ({
    ...row,
    postedBy: poster._id,
    image: null,
    imagePublicId: null,
    matchedWith: null,
    otpCode: null,
  }));

  const inserted = await Item.insertMany(docs);
  console.log(
    `Demo user: ${DEMO_EMAIL} (password: DemoLostFound123!) — use to log in if you want items under your account.`
  );
  console.log(`Removed ${removed.deletedCount} old seed rows (if any). Inserted ${inserted.length} lost/found dummy items.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
