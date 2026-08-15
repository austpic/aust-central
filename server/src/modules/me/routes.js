import { z } from 'zod';

import { NotFoundError, UnauthorizedError } from '../../lib/errors.js';
import { publicUserSchema, toPublicUser } from '../auth/schema.js';
import * as blood from '../blood/service.js';
import * as books from '../books/service.js';
import * as cgpa from '../cgpa/service.js';
import * as classReminders from '../class-reminders/service.js';
import * as labReports from '../lab-reports/service.js';
import * as lostFound from '../lost-found/service.js';
import * as notices from '../notices/service.js';
import * as tasks from '../tasks/service.js';

/**
 * The signed-in user's profile and dashboard.
 *
 * The dashboard endpoint exists so home_page.dart stops rendering invented
 * strings. Every chip on that screen — '3 due today', 'Current: 3.72',
 * '14 listings', '2 requests nearby' — is a literal in the Flutter source
 * today. These are the real numbers behind them.
 */

const updateProfileBodySchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    studentId: z.string().trim().max(40).nullish(),
    department: z.string().trim().max(120).nullish(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field' });

const setAvatarBodySchema = z.object({ fileId: z.string().uuid().nullable() }).strict();

const dashboardResponseSchema = z.object({
  greetingName: z.string(),
  tasksDueToday: z.number().int(),
  nextClass: z
    .object({
      courseName: z.string(),
      classTime: z.string(),
      minutesUntil: z.number().int(),
    })
    .nullable(),
  cgpa: z.number().nullable(),
  labReportDrafts: z.number().int(),
  openBloodRequests: z.number().int(),
  activeListings: z.number().int(),
  openLostFoundItems: z.number().int(),
  unreadNotifications: z.number().int(),
  latestNotice: z
    .object({ id: z.string().uuid(), title: z.string(), body: z.string() })
    .nullable(),
});

async function loadUser(app, userId) {
  const user = await app.prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) throw new UnauthorizedError();
  return user;
}

export default async function meRoutes(app) {
  app.addHook('onRequest', app.requireAuth);

  app.get(
    '/',
    { schema: { response: { 200: publicUserSchema } } },
    async (request) => toPublicUser(await loadUser(app, request.user.sub)),
  );

  app.patch(
    '/',
    { schema: { body: updateProfileBodySchema, response: { 200: publicUserSchema } } },
    async (request) => {
      // Note what is absent: role, email, and emailVerifiedAt are not editable
      // here. Changing an email must re-verify it, and role changes are an
      // admin action — neither belongs on a self-service profile patch.
      const user = await app.prisma.user.update({
        where: { id: request.user.sub },
        data: request.body,
      });
      return toPublicUser(user);
    },
  );

  app.put(
    '/avatar',
    { schema: { body: setAvatarBodySchema, response: { 200: publicUserSchema } } },
    async (request) => {
      const { fileId } = request.body;

      if (fileId) {
        // Must be a file this user uploaded — otherwise any file id could be
        // pinned to a profile and read back through the avatar route.
        const owned = await app.prisma.fileObject.count({
          where: { id: fileId, ownerId: request.user.sub },
        });
        if (owned === 0) throw new NotFoundError('File not found');
      }

      const user = await app.prisma.user.update({
        where: { id: request.user.sub },
        data: { avatarFileId: fileId },
      });
      return toPublicUser(user);
    },
  );

  app.get(
    '/dashboard',
    { schema: { response: { 200: dashboardResponseSchema } } },
    async (request) => {
      const userId = request.user.sub;
      const user = await loadUser(app, userId);

      // Independent aggregates, so they run concurrently rather than serially.
      const [
        tasksDueToday,
        nextClass,
        cgpaSummary,
        labReportDrafts,
        openBloodRequests,
        activeListings,
        openLostFoundItems,
        unreadNotifications,
        latestNotice,
      ] = await Promise.all([
        tasks.countDueToday(app, userId),
        classReminders.nextClass(app, userId),
        cgpa.summary(app, userId),
        labReports.countDrafts(app, userId),
        blood.countOpenRequests(app),
        books.countActiveListings(app),
        lostFound.countOpenItems(app),
        app.prisma.notification.count({ where: { userId, readAt: null } }),
        notices.latestNotice(app),
      ]);

      return {
        // The app greets by last name; deriving it here keeps that logic out
        // of the widget, where it was tangled with a Firebase displayName read.
        greetingName: user.name.trim().split(/\s+/).at(-1) ?? user.name,
        tasksDueToday,
        nextClass: nextClass
          ? {
              courseName: nextClass.courseName,
              classTime: nextClass.classTime,
              minutesUntil: nextClass.minutesUntil,
            }
          : null,
        // Null rather than 0.0 when there are no grades yet — "no CGPA" and
        // "a CGPA of zero" are very different things to show a student.
        cgpa: cgpaSummary.totalCredits > 0 ? cgpaSummary.cgpa : null,
        labReportDrafts,
        openBloodRequests,
        activeListings,
        openLostFoundItems,
        unreadNotifications,
        latestNotice: latestNotice
          ? { id: latestNotice.id, title: latestNotice.title, body: latestNotice.body }
          : null,
      };
    },
  );
}
