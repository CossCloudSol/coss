/**
 * Dev-only seed: gives the local dev database enough published data to render the public
 * pages (one category, one published course on its nested URL, one upcoming batch, one trainer).
 * Creates only what is missing (safe to run again) and never touches production: it refuses
 * unless both DATABASE_URL and DIRECT_URL point at the local dev database.
 *
 * Usage: npm run seed:dev
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('./lib/write-guard.cjs'); // loads .env.development.local first; refuses non-dev writes
require('./lib/dev-only.cjs').assertDevOnly(process.env, 'seed-dev');

const { PrismaClient } = await import('@prisma/client');
const db = new PrismaClient();

const CATEGORY = { slug: 'cloud-computing', name: 'Cloud Computing' };
const COURSE_SLUG = 'dev-sample-aws-cloud-training';
const TRAINER_NAME = 'Dev Sample Trainer';
const BATCH_NAME = 'Dev Sample Batch';

async function main() {
  const made = [];

  let category = await db.courseCategory.findUnique({ where: { slug: CATEGORY.slug } });
  if (!category) {
    category = await db.courseCategory.create({
      data: { name: CATEGORY.name, slug: CATEGORY.slug, description: 'AWS, Azure and GCP training.', status: 'published', sortOrder: 1 },
    });
    made.push(`category ${category.slug}`);
  }

  let course = await db.course.findUnique({ where: { slug: COURSE_SLUG } });
  if (!course) {
    course = await db.course.create({
      data: {
        title: 'AWS Cloud Training (dev sample)',
        slug: COURSE_SLUG,
        description: 'Sample course for local development: hands-on AWS labs, IAM, EC2, S3, VPC and cost basics.',
        excerpt: 'Sample course for local development.',
        category: category.name,
        categoryId: category.id,
        categorySlug: category.slug,
        urlType: 'nested',
        duration: '2 Months',
        mode: 'Classroom & Online',
        level: 'Beginner',
        price: 25000,
        highlights: ['Hands-on labs', '1-year LMS access', 'Placement assistance'],
        tools: ['AWS', 'Linux', 'Terraform'],
        syllabus: [
          { week: 'Week 1', topic: 'AWS basics', details: 'IAM, EC2, S3' },
          { week: 'Week 2', topic: 'Networking', details: 'VPC, subnets, security groups' },
        ],
        status: 'published',
      },
    });
    made.push(`course ${course.slug}`);
  }

  const batch = await db.batch.findFirst({ where: { courseId: course.id, batchName: BATCH_NAME } });
  if (!batch) {
    const start = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    await db.batch.create({
      data: {
        courseId: course.id,
        batchName: BATCH_NAME,
        mode: 'Classroom',
        centre: 'Dilsukhnagar',
        startDate: start,
        schedule: 'Mon–Fri, 7:00 AM – 9:00 AM',
        totalSeats: 20,
        seatsAvailable: 12,
        trainer: TRAINER_NAME,
        status: 'upcoming',
      },
    });
    made.push('batch');
  }

  const trainer = await db.trainer.findFirst({ where: { name: TRAINER_NAME } });
  if (!trainer) {
    await db.trainer.create({
      data: { name: TRAINER_NAME, title: 'Cloud & DevOps Trainer', category: 'Cloud', skills: 'AWS, Linux, Terraform', teaches: 'AWS, DevOps', startYear: 2015, bio: 'Sample trainer for local development.', isVisible: true },
    });
    made.push('trainer');
  }

  console.log(made.length ? `[seed-dev] created: ${made.join(', ')}` : '[seed-dev] nothing to do: the dev data is already there');
  console.log(`[seed-dev] course page: /courses/${CATEGORY.slug}/${COURSE_SLUG}`);
}

main()
  .catch((e) => { console.error('[seed-dev] failed:', e.message); process.exitCode = 1; })
  .finally(() => db.$disconnect());
