import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const categories = [
  {
    name: 'Data, Analytics & BI',
    slug: 'data-analytics-bi',
    description: 'Master data analysis, business intelligence, and analytics tools used by top Hyderabad firms.',
    icon: 'ti-chart-bar',
    color: '#378ADD',
    sortOrder: 1,
    isLegacy: true,
    status: 'published',
    seoTitle: 'Data Analytics & BI Courses in Hyderabad | COSS',
    seoDesc: 'Learn Data Analytics and Business Intelligence at COSS Hyderabad. Hands-on training, placement support, weekend batches.',
  },
  {
    name: 'Cloud Computing',
    slug: 'cloud-computing',
    description: 'AWS, Azure, and GCP training for Hyderabad professionals targeting cloud roles in HITEC City.',
    icon: 'ti-cloud',
    color: '#0F6E56',
    sortOrder: 2,
    isLegacy: true,
    status: 'published',
    seoTitle: 'Cloud Computing Courses in Hyderabad | COSS',
    seoDesc: 'AWS, Azure & GCP training in Hyderabad. Get cloud certified at COSS — placement support, hands-on labs, weekend batches.',
  },
  {
    name: 'DevOps & Multi-Cloud',
    slug: 'devops-multi-cloud',
    description: 'Docker, Kubernetes, CI/CD and multi-cloud pipelines — the complete DevOps skillset Hyderabad employers want.',
    icon: 'ti-settings',
    color: '#534AB7',
    sortOrder: 3,
    isLegacy: true,
    status: 'published',
    seoTitle: 'DevOps Training in Hyderabad | COSS',
    seoDesc: 'Best DevOps training in Hyderabad. Docker, Kubernetes, Jenkins & Terraform. COSS — Dilsukhnagar & Ameerpet.',
  },
  {
    name: 'Programming & Full Stack',
    slug: 'programming-full-stack',
    description: 'Full stack development with modern frameworks. React, Node, Java, Python — job-ready in 90 days.',
    icon: 'ti-code',
    color: '#D85A30',
    sortOrder: 4,
    isLegacy: true,
    status: 'published',
    seoTitle: 'Full Stack Development Courses Hyderabad | COSS',
    seoDesc: 'Full Stack & programming courses in Hyderabad. React, Node.js, Java, Python. COSS — placement support included.',
  },
  {
    name: 'Data Engineering',
    slug: 'data-engineering',
    description: 'Build data pipelines, ETL workflows and lakehouse architectures for Hyderabad data engineering roles.',
    icon: 'ti-database',
    color: '#BA7517',
    sortOrder: 5,
    isLegacy: true,
    status: 'published',
    seoTitle: 'Data Engineering Courses in Hyderabad | COSS',
    seoDesc: 'Data Engineering training in Hyderabad — Spark, Kafka, Airflow, dbt. COSS placement-focused batches.',
  },
  {
    name: 'Cyber Security & Networking',
    slug: 'cyber-security',
    description: 'Ethical hacking, network security, and cybersecurity certifications for Hyderabad IT professionals.',
    icon: 'ti-shield',
    color: '#E24B4A',
    sortOrder: 6,
    isLegacy: true,
    status: 'published',
    seoTitle: 'Cybersecurity Courses in Hyderabad | COSS',
    seoDesc: 'Ethical hacking & cybersecurity training in Hyderabad. CEH, CompTIA Security+. COSS — Dilsukhnagar.',
  },
  {
    name: 'ERP, CRM & Enterprise Tools',
    slug: 'erp-crm-enterprise-tools',
    description: 'SAP, Salesforce, ServiceNow and enterprise platform training for Hyderabad consultants.',
    icon: 'ti-building',
    color: '#1D9E75',
    sortOrder: 7,
    isLegacy: true,
    status: 'published',
    seoTitle: 'ERP & CRM Training in Hyderabad | COSS',
    seoDesc: 'SAP, Salesforce & ServiceNow training in Hyderabad. COSS — enterprise tools for IT consultants.',
  },
  {
    name: 'Software Testing & OS',
    slug: 'software-testing-os',
    description: 'Manual testing, automation with Selenium, and Linux/OS fundamentals for QA roles in Hyderabad.',
    icon: 'ti-bug',
    color: '#888780',
    sortOrder: 8,
    isLegacy: true,
    status: 'published',
    seoTitle: 'Software Testing Courses in Hyderabad | COSS',
    seoDesc: 'Software testing & QA training in Hyderabad. Selenium, manual testing, Linux. COSS placement support.',
  },
  {
    name: 'Digital & Design',
    slug: 'digital-design',
    description: 'Digital marketing, UI/UX design and creative tools — skills for Hyderabad\'s growing digital economy.',
    icon: 'ti-palette',
    color: '#D4537E',
    sortOrder: 9,
    isLegacy: true,
    status: 'published',
    seoTitle: 'Digital Marketing & Design Courses Hyderabad | COSS',
    seoDesc: 'Digital marketing & UI/UX design training in Hyderabad. COSS — practical, project-based batches.',
  },
  {
    name: 'Professional & Soft Skills',
    slug: 'professional-soft-skills',
    description: 'Communication, leadership and professional skills to complement your technical career in Hyderabad IT.',
    icon: 'ti-users',
    color: '#7F77DD',
    sortOrder: 10,
    isLegacy: true,
    status: 'published',
    seoTitle: 'Professional Skills Training in Hyderabad | COSS',
    seoDesc: 'Professional & soft skills training in Hyderabad. Communication, leadership, interview prep. COSS.',
  },
]

const categoryMap = {
  'Cloud': 'cloud-computing',
  'Cloud Computing': 'cloud-computing',
  'DevOps': 'devops-multi-cloud',
  'DevOps & Multi-Cloud': 'devops-multi-cloud',
  'Data Science': 'data-analytics-bi',
  'Data, Analytics & BI': 'data-analytics-bi',
  'Python': 'programming-full-stack',
  'Programming & Full Stack': 'programming-full-stack',
  'AI/ML': 'data-analytics-bi',
  'Cybersecurity': 'cyber-security',
  'Cyber Security & Networking': 'cyber-security',
  'Full Stack': 'programming-full-stack',
  'Database': 'data-engineering',
  'Data Engineering': 'data-engineering',
  'ERP, CRM & Enterprise Tools': 'erp-crm-enterprise-tools',
  'Software Testing & OS': 'software-testing-os',
  'Digital & Design': 'digital-design',
  'Professional & Soft Skills': 'professional-soft-skills',
}

async function seed() {
  console.log('Seeding 10 legacy categories...')

  for (const cat of categories) {
    await db.courseCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    })
    console.log(`  ✓ ${cat.name}`)
  }

  console.log('\nLinking existing courses to categories...')

  const existingCourses = await db.course.findMany()

  for (const course of existingCourses) {
    const targetSlug = categoryMap[course.category]
    if (!targetSlug) {
      console.log(`  ⚠ No category mapping for: ${course.category} (${course.title})`)
      continue
    }

    const category = await db.courseCategory.findUnique({
      where: { slug: targetSlug }
    })

    if (!category) continue

    await db.course.update({
      where: { id: course.id },
      data: {
        categoryId: category.id,
        categorySlug: category.slug,
        urlType: 'legacy',
      }
    })
    console.log(`  ✓ Linked "${course.title}" → ${category.name}`)
  }

  console.log('\n✅ Category seed complete!')
  await db.$disconnect()
}

seed().catch(e => { console.error(e); process.exit(1) })
