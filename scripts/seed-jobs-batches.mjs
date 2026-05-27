import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const jobs = [
  {
    title: 'AWS DevOps Engineer',
    slug: 'aws-devops-engineer-hyderabad',
    company: 'Tata Consultancy Services',
    location: 'Hyderabad',
    type: 'Full Time',
    mode: 'On-site',
    category: 'DevOps & Multi-Cloud',
    experience: '3-5 Years',
    salary: '₹8–14 LPA',
    description: `## Role Overview\n\nWe are looking for an experienced AWS DevOps Engineer to join our cloud infrastructure team in Hyderabad.\n\n## Key Responsibilities\n\n- Design and implement CI/CD pipelines using Jenkins and GitHub Actions\n- Manage AWS infrastructure using Terraform and CloudFormation\n- Containerise applications using Docker and orchestrate with Kubernetes\n- Monitor system performance using CloudWatch, Prometheus, and Grafana\n\n## Requirements\n\n- 3-5 years of DevOps experience\n- Strong hands-on AWS knowledge (EC2, ECS, Lambda, RDS, S3)\n- Experience with Docker and Kubernetes\n- Proficiency in scripting (Python or Bash)\n- AWS certifications preferred (SAA-C03 or DevOps Professional)`,
    skills: ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'Python', 'CI/CD'],
    status: 'active',
    featured: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Data Analyst',
    slug: 'data-analyst-hyderabad',
    company: 'Infosys',
    location: 'Hyderabad (Hybrid)',
    type: 'Full Time',
    mode: 'Hybrid',
    category: 'Data, Analytics & BI',
    experience: 'Fresher',
    salary: '₹3.5–5 LPA',
    description: `## Role Overview\n\nInfosys is hiring fresher Data Analysts for its Hyderabad delivery centre.\n\n## Key Responsibilities\n\n- Analyse large datasets to identify trends and insights\n- Build dashboards and reports using Power BI and Excel\n- Write SQL queries for data extraction and transformation\n- Collaborate with business teams to understand reporting needs\n\n## Requirements\n\n- B.E/B.Tech or MBA with strong analytical skills\n- Proficiency in Python (Pandas, NumPy) and SQL\n- Experience with Power BI or Tableau\n- Good communication skills`,
    skills: ['Python', 'SQL', 'Power BI', 'Excel', 'Pandas', 'Tableau'],
    status: 'active',
    featured: true,
    expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'SAP FICO Consultant',
    slug: 'sap-fico-consultant-hyderabad',
    company: 'Wipro',
    location: 'Hyderabad',
    type: 'Full Time',
    mode: 'On-site',
    category: 'ERP, CRM & Enterprise Tools',
    experience: '1-3 Years',
    salary: '₹5–9 LPA',
    description: `## Role Overview\n\nWipro is hiring SAP FICO Consultants for client implementations in Hyderabad.\n\n## Key Responsibilities\n\n- Implement and configure SAP FICO modules\n- Support end-to-end S/4HANA implementations\n- Conduct user training and documentation\n- Troubleshoot and resolve SAP FICO issues\n\n## Requirements\n\n- 1-3 years SAP FICO implementation experience\n- Knowledge of FI (GL, AP, AR, AA) and CO (CCA, PCA, PA)\n- S/4HANA experience preferred\n- SAP certification is a plus`,
    skills: ['SAP FICO', 'S/4HANA', 'GL', 'AP', 'AR', 'SAP CO'],
    status: 'active',
    featured: false,
    expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'HR Recruiter',
    slug: 'hr-recruiter-hyderabad',
    company: 'Confidential',
    location: 'Hyderabad',
    type: 'Full Time',
    mode: 'On-site',
    category: 'Human Resource',
    experience: 'Fresher',
    salary: '₹3–4.5 LPA',
    description: `## Role Overview\n\nA leading IT company in Hyderabad is looking for HR Recruiters to join their talent acquisition team.\n\n## Key Responsibilities\n\n- Source candidates through job portals (Naukri, LinkedIn)\n- Screen resumes and conduct initial interviews\n- Coordinate with hiring managers for interview scheduling\n- Maintain ATS and recruitment trackers\n\n## Requirements\n\n- MBA HR or equivalent\n- Good communication skills\n- Knowledge of recruitment tools and job portals\n- Excel proficiency`,
    skills: ['Recruitment', 'LinkedIn', 'Naukri', 'ATS', 'Excel', 'Communication'],
    status: 'active',
    featured: false,
    expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Python Full Stack Developer',
    slug: 'python-full-stack-developer-hyderabad',
    company: 'Mphasis',
    location: 'Hyderabad',
    type: 'Full Time',
    mode: 'Hybrid',
    category: 'Programming & Full Stack',
    experience: '1-3 Years',
    salary: '₹5–8 LPA',
    description: `## Role Overview\n\nMphasis is hiring Python Full Stack Developers for its Hyderabad development centre.\n\n## Key Responsibilities\n\n- Build RESTful APIs using Django/FastAPI\n- Develop frontend interfaces using React\n- Work with PostgreSQL and MongoDB databases\n- Deploy applications on AWS\n\n## Requirements\n\n- 1-3 years Python development experience\n- Strong Django or FastAPI knowledge\n- React or Vue.js frontend skills\n- Git and CI/CD familiarity`,
    skills: ['Python', 'Django', 'React', 'PostgreSQL', 'AWS', 'FastAPI', 'Git'],
    status: 'active',
    featured: true,
    expiresAt: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
  },
]

async function seedBatches() {
  const course = await db.course.findFirst({
    where: { status: 'published' },
    orderBy: { createdAt: 'asc' },
  })

  if (!course) {
    console.log('  ⚠ No published courses found — skipping batch seed')
    return
  }

  const batches = [
    {
      courseId: course.id,
      batchName: `${course.title} June 2026 Batch`,
      mode: 'Classroom',
      centre: 'Dilsukhnagar',
      startDate: new Date('2026-06-10'),
      endDate: new Date('2026-07-25'),
      schedule: 'Weekdays 9AM–1PM',
      totalSeats: 20,
      seatsAvailable: 4,
      trainer: 'COSS Trainer',
      status: 'upcoming',
      featured: true,
    },
    {
      courseId: course.id,
      batchName: `${course.title} June 2026 Online Batch`,
      mode: 'Online',
      centre: null,
      startDate: new Date('2026-06-15'),
      endDate: new Date('2026-07-30'),
      schedule: 'Weekdays 6PM–9PM',
      totalSeats: null,
      seatsAvailable: null,
      status: 'upcoming',
      featured: true,
    },
    {
      courseId: course.id,
      batchName: `${course.title} Weekend Batch`,
      mode: 'Classroom',
      centre: 'Ameerpet',
      startDate: new Date('2026-06-20'),
      endDate: new Date('2026-08-10'),
      schedule: 'Weekend 9AM–5PM',
      totalSeats: 15,
      seatsAvailable: 2,
      status: 'upcoming',
      featured: true,
    },
  ]

  for (const batch of batches) {
    await db.batch.create({ data: batch })
    console.log(`  ✓ Batch: ${batch.batchName}`)
  }
}

async function seed() {
  console.log('=== Seeding Jobs & Batches ===\n')

  console.log('Seeding 5 jobs...')
  for (const job of jobs) {
    await db.job.upsert({
      where: { slug: job.slug },
      update: job,
      create: job,
    })
    console.log(`  ✓ ${job.title} — ${job.company}`)
  }

  console.log('\nSeeding 3 sample batches...')
  await seedBatches()

  console.log('\n✅ Jobs & Batches seed complete!')
  await db.$disconnect()
}

seed().catch(e => { console.error(e); process.exit(1) })
