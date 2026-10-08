/**
 * navGroups.js — single source of truth for the grouped navigation
 *
 * The app's destinations are organised into four groups (Teacher, Library,
 * Student, Settings). The mobile bottom nav renders the groups with a
 * slide-up sub-menu; the desktop header renders them as dropdowns.
 */

import { BookMarked, BookOpen, CalendarDays, UserRound } from 'lucide-react';
import { buildSupportLink } from '../../utils/whatsapp';

/**
 * WhatsApp support line, configured at build time so the number can change
 * without a code edit:  VITE_SUPPORT_WHATSAPP=233241234567
 *
 * Number normalisation lives in src/utils/whatsapp.js (and is tested there).
 * Without a usable number the entry is omitted entirely — a wa.me link with no
 * recipient just opens WhatsApp and asks the user to pick a contact.
 */
export const supportLink = buildSupportLink(
  import.meta.env.VITE_SUPPORT_WHATSAPP,
  'Hello Lecturer Sam Academy support — ',
);

export const NAV_GROUPS = [
  {
    id: 'teacher',
    label: 'Teacher',
    icon: CalendarDays,
    items: [
      { to: '/planner', label: 'Planner' },
      { to: '/timetable', label: 'Timetable' },
      { to: '/scheme', label: 'Scheme' },
    ],
  },
  {
    id: 'library',
    label: 'Library',
    icon: BookMarked,
    items: [
      { to: '/curriculum', label: 'Curriculum' },
      { to: '/course', label: 'Notes' },
    ],
  },
  {
    id: 'student',
    label: 'Student',
    icon: BookOpen,
    items: [
      { to: '/course/legacy', label: 'Courses' },
      { to: '/course', label: 'Notes' },
      { to: '/practice', label: 'Practice' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: UserRound,
    items: [
      { to: '/', label: 'Home' },
      { to: '/profile', label: 'Profile' },
      { to: '/dashboard', label: 'Progress' },
      { to: '/help', label: 'Help' },
      { to: '/terms', label: 'Terms' },
      { to: '/privacy', label: 'Privacy' },
      { to: '/onboarding', label: 'Welcome tour' },
      ...(supportLink ? [{ to: supportLink, label: 'WhatsApp support', external: true }] : []),
    ],
  },
];

// Path → group matching, in priority order (more specific paths first).
const PATH_GROUPS = [
  { prefix: '/planner', group: 'teacher' },
  { prefix: '/timetable', group: 'teacher' },
  { prefix: '/scheme', group: 'teacher' },
  { prefix: '/curriculum', group: 'library' },
  { prefix: '/library', group: 'library' },
  { prefix: '/course/legacy', group: 'student' },
  { prefix: '/course', group: 'library' },
  { prefix: '/lesson', group: 'student' },
  { prefix: '/practice', group: 'student' },
  { prefix: '/quiz', group: 'student' },
  { prefix: '/results', group: 'student' },
  { prefix: '/profile', group: 'settings' },
  { prefix: '/dashboard', group: 'settings' },
  { prefix: '/help', group: 'settings' },
  { prefix: '/ai-assistant', group: null },
];

/** Which group (id or null) contains the current path. */
export function getGroupForPath(pathname) {
  for (const { prefix, group } of PATH_GROUPS) {
    if (pathname.startsWith(prefix)) return group;
  }
  return null;
}
