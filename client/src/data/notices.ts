// Mirrors the _seedNotices list in lib/screens/notice_board_screen.dart
import type { Notice } from '../models/notice';

export const SEED_NOTICES: Notice[] = [
  {
    id: 'n1',
    title: 'Mandatory attendance for CSE-301 lab tomorrow',
    body:
      "All Section B students enrolled in CSE-301 (Data Structures) must attend tomorrow's lab session. Roll will be taken at 8:30 am sharp. Students without prior written exemption will be marked absent.",
    postedAt: new Date(2026, 3, 14),
    category: 'academic',
    pinned: true,
  },
  {
    id: 'n2',
    title: 'Mid-term routine released for Section B',
    body:
      'The Spring 2026 mid-term routine for Section B has been published. Pick up a copy from your department office or check the notice board outside Room 4C02. Re-checkouts start Monday.',
    postedAt: new Date(2026, 3, 11),
    category: 'exam',
    pinned: false,
  },
  {
    id: 'n3',
    title: 'Career Fair 2026 — registrations open',
    body:
      'AUST Central Career Fair returns on 24 May. 40+ companies including GP, BRAC, and Pathao will be on campus. Register by 18 May at the career services desk — bring your CV.',
    postedAt: new Date(2026, 3, 9),
    category: 'event',
    pinned: false,
  },
  {
    id: 'n4',
    title: 'Library closed Friday for maintenance',
    body:
      'The main library will be closed this Friday from 9 am to 6 pm for AC maintenance. Reading rooms on the third floor will remain open.',
    postedAt: new Date(2026, 3, 7),
    category: 'general',
    pinned: false,
  },
  {
    id: 'n5',
    title: 'Bus schedule updated for Route 3',
    body:
      'Route 3 (Mirpur–Campus) now leaves the Mirpur pick-up point 15 minutes earlier on weekdays to avoid the morning rush. See the updated PDF on the Transport page.',
    postedAt: new Date(2026, 3, 5),
    category: 'general',
    pinned: false,
  },
  {
    id: 'n6',
    title: "Scholarship application deadline: 30 April",
    body:
      "Final-year students applying for the Vice-Chancellor's Merit Scholarship must submit their completed forms to the registrar by 5 pm on 30 April. Late submissions will not be considered.",
    postedAt: new Date(2026, 3, 3),
    category: 'academic',
    pinned: false,
  },
  {
    id: 'n7',
    title: 'Hackathon "AUST Codestorm 2026" registrations open',
    body:
      'Three-day campus hackathon hosted by the CSE department. Form teams of 3–4 by 20 April. Top 3 teams go to the national round.',
    postedAt: new Date(2026, 3, 1),
    category: 'event',
    pinned: false,
  },
  {
    id: 'n8',
    title: 'Campus Wi-Fi maintenance Sunday 2–4 am',
    body:
      'Campus-wide Wi-Fi will be intermittent on Sunday between 2 am and 4 am while the gateway is replaced. Wired connections in the labs will be unaffected.',
    postedAt: new Date(2026, 2, 30),
    category: 'general',
    pinned: false,
  },
];
