import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding 4 missing courses...\n')

  // ── 1. MS Office ────────────────────────────────────────────
  const officeCategory = await prisma.courseCategory.findFirst({
    where: {
      OR: [
        { slug: 'office-productivity' },
        { slug: 'ms-office' },
        { slug: 'business-communication' },
        { name: { contains: 'Office', mode: 'insensitive' } },
        { name: { contains: 'Productivity', mode: 'insensitive' } },
      ]
    }
  })

  if (!officeCategory) {
    console.log('⚠ No matching category for MS Office — skipping. Run: SELECT id,slug,name FROM "CourseCategory" in Supabase to find the right slug and update this script.')
  } else {
    const existing = await prisma.course.findFirst({ where: { slug: 'ms-office-advanced-excel' } })
    if (existing) {
      console.log('⏭ Skipping MS Office (already exists)')
    } else {
      await prisma.course.create({
        data: {
          title:         'MS Office & Advanced Excel',
          slug:          'ms-office-advanced-excel',
          description:   'Master Microsoft Office Suite including Word, Excel, PowerPoint, and Outlook. Learn Advanced Excel with formulas, pivot tables, macros, VBA, and data analysis for corporate productivity.',
          excerpt:       'Complete MS Office training with Advanced Excel, Word, PowerPoint and Outlook for corporate professionals.',
          category:      officeCategory.name,
          categorySlug:  officeCategory.slug,
          categoryId:    officeCategory.id,
          duration:      '45 Days',
          mode:          'Classroom / Online',
          level:         'Beginner to Advanced',
          price:         8000,
          originalPrice: 12000,
          badge:         'Most Popular',
          status:        'published',
          featured:      false,
          sortOrder:     50,
          highlights: [
            'MS Word — formatting, templates, mail merge',
            'MS Excel — formulas, VLOOKUP, pivot tables',
            'Advanced Excel — macros, VBA, dashboards',
            'MS PowerPoint — presentations, animations',
            'MS Outlook — email, calendar, tasks',
            'Real-world corporate projects',
            'Interview preparation included',
            'Certificate on completion',
          ],
          tools: ['Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint', 'Microsoft Outlook', 'VBA Editor'],
          syllabus: [
            { module: 'MS Word Essentials', topics: ['Document formatting', 'Styles and themes', 'Mail merge', 'Tables and images', 'Templates'] },
            { module: 'MS Excel Foundation', topics: ['Worksheets and workbooks', 'Basic formulas (SUM, AVERAGE, COUNT)', 'Cell references', 'Charts and graphs', 'Data sorting and filtering'] },
            { module: 'Advanced Excel', topics: ['VLOOKUP, HLOOKUP, INDEX-MATCH', 'Pivot tables and pivot charts', 'Conditional formatting', 'Data validation', 'What-if analysis'] },
            { module: 'Excel Macros & VBA', topics: ['Recording macros', 'VBA editor basics', 'Writing simple macros', 'Automating repetitive tasks', 'User forms'] },
            { module: 'MS PowerPoint', topics: ['Slide design principles', 'Animations and transitions', 'SmartArt and charts', 'Presenter view', 'Corporate presentation templates'] },
            { module: 'MS Outlook', topics: ['Email management', 'Calendar and scheduling', 'Tasks and reminders', 'Contact management', 'Rules and filters'] },
          ],
          seoTitle: 'MS Office & Advanced Excel Training in Hyderabad | Coss Cloud Solutions',
          seoDesc:  'Learn MS Office and Advanced Excel in Hyderabad. Expert-led training in Word, Excel, PowerPoint, VBA macros. Job-oriented course with certificate.',
        },
      })
      console.log('✓ Created: MS Office & Advanced Excel (slug: ms-office-advanced-excel, category: ' + officeCategory.slug + ')')
    }
  }

  // ── 2. Soft Skills ──────────────────────────────────────────
  const softCategory = await prisma.courseCategory.findFirst({
    where: {
      OR: [
        { slug: 'soft-skills' },
        { slug: 'soft-skills-personality' },
        { slug: 'personality-development' },
        { name: { contains: 'Soft', mode: 'insensitive' } },
        { name: { contains: 'Personality', mode: 'insensitive' } },
      ]
    }
  })

  if (!softCategory) {
    console.log('⚠ No matching category for Soft Skills — skipping.')
  } else {
    const existing = await prisma.course.findFirst({ where: { slug: 'soft-skills-personality-development' } })
    if (existing) {
      console.log('⏭ Skipping Soft Skills (already exists)')
    } else {
      await prisma.course.create({
        data: {
          title:         'Soft Skills & Personality Development',
          slug:          'soft-skills-personality-development',
          description:   'Develop essential soft skills for career success. This course covers communication, leadership, teamwork, time management, interview skills, and professional etiquette to help you thrive in corporate environments.',
          excerpt:       'Build communication, leadership, and interpersonal skills for career growth and corporate success.',
          category:      softCategory.name,
          categorySlug:  softCategory.slug,
          categoryId:    softCategory.id,
          duration:      '30 Days',
          mode:          'Classroom / Online',
          level:         'Beginner to Intermediate',
          price:         6000,
          originalPrice: 10000,
          badge:         'Career Essential',
          status:        'published',
          featured:      false,
          sortOrder:     51,
          highlights: [
            'Business communication skills',
            'Public speaking and presentation',
            'Leadership and teamwork',
            'Time and stress management',
            'Interview preparation and mock interviews',
            'Professional grooming and etiquette',
            'Body language and confidence building',
            'Resume writing and LinkedIn profile',
          ],
          tools: ['Presentation Tools', 'Mock Interview Platform', 'Video Recording for Self-Review'],
          syllabus: [
            { module: 'Communication Skills', topics: ['Verbal communication', 'Non-verbal communication', 'Active listening', 'Email writing', 'Report writing'] },
            { module: 'Public Speaking', topics: ['Overcoming stage fear', 'Structuring a speech', 'Voice modulation', 'Presentation skills', 'Group discussions'] },
            { module: 'Leadership & Teamwork', topics: ['Leadership styles', 'Team dynamics', 'Conflict resolution', 'Delegation skills', 'Motivation techniques'] },
            { module: 'Professional Etiquette', topics: ['Corporate dress code', 'Business meeting etiquette', 'Networking skills', 'Phone and email etiquette', 'Social media professionalism'] },
            { module: 'Interview Preparation', topics: ['Resume writing', 'Cover letter', 'Common interview questions', 'Mock interviews', 'Salary negotiation'] },
          ],
          seoTitle: 'Soft Skills & Personality Development Training in Hyderabad | Coss Cloud Solutions',
          seoDesc:  'Soft skills training in Hyderabad. Communication, leadership, interview preparation, and personality development. Job-oriented with placement support.',
        },
      })
      console.log('✓ Created: Soft Skills & Personality Development (slug: soft-skills-personality-development, category: ' + softCategory.slug + ')')
    }
  }

  // ── 3. Spoken English ───────────────────────────────────────
  const englishCategory = await prisma.courseCategory.findFirst({
    where: {
      OR: [
        { slug: 'spoken-english' },
        { slug: 'business-communication' },
        { slug: 'communication-skills' },
        { name: { contains: 'English', mode: 'insensitive' } },
        { name: { contains: 'Communication', mode: 'insensitive' } },
      ]
    }
  })

  if (!englishCategory) {
    console.log('⚠ No matching category for Spoken English — skipping.')
  } else {
    const existing = await prisma.course.findFirst({ where: { slug: 'spoken-english-communication' } })
    if (existing) {
      console.log('⏭ Skipping Spoken English (already exists)')
    } else {
      await prisma.course.create({
        data: {
          title:         'Spoken English & Business Communication',
          slug:          'spoken-english-communication',
          description:   'Improve your spoken English and business communication for professional environments. This course covers fluency, grammar, vocabulary, business writing, and professional conversation skills with daily practice sessions.',
          excerpt:       'Spoken English and business communication training for professionals and freshers seeking fluency.',
          category:      englishCategory.name,
          categorySlug:  englishCategory.slug,
          categoryId:    englishCategory.id,
          duration:      '45 Days',
          mode:          'Classroom / Online',
          level:         'Beginner to Advanced',
          price:         7000,
          originalPrice: 11000,
          badge:         'High Demand',
          status:        'published',
          featured:      false,
          sortOrder:     52,
          highlights: [
            'Daily spoken English practice sessions',
            'Grammar and vocabulary building',
            'Business writing — emails, reports, proposals',
            'Professional conversation and telephony',
            'Accent neutralisation techniques',
            'Group discussion and debate practice',
            'Interview English preparation',
            'Certificate on completion',
          ],
          tools: ['Language Lab Software', 'Audio-Video Practice Tools', 'Business Writing Templates'],
          syllabus: [
            { module: 'Foundation English', topics: ['Parts of speech', 'Tenses and their usage', 'Common grammar errors', 'Vocabulary building', 'Pronunciation basics'] },
            { module: 'Spoken English Practice', topics: ['Daily conversation practice', 'Accent and intonation', 'Telephone English', 'Meeting and discussion English', 'Extempore speaking'] },
            { module: 'Business Writing', topics: ['Professional email writing', 'Business letter format', 'Report writing', 'Proposal writing', 'Meeting minutes'] },
            { module: 'Advanced Communication', topics: ['Negotiation language', 'Presentation English', 'Client communication', 'Cross-cultural communication', 'Corporate vocabulary'] },
            { module: 'Interview English', topics: ['Introducing yourself', 'Answering HR questions in English', 'Group discussion practice', 'Common interview phrases', 'Mock interviews'] },
          ],
          seoTitle: 'Spoken English & Business Communication Training in Hyderabad | Coss Cloud Solutions',
          seoDesc:  'Spoken English training in Hyderabad. Business communication, grammar, fluency, and interview English. Daily practice sessions with expert trainers.',
        },
      })
      console.log('✓ Created: Spoken English & Business Communication (slug: spoken-english-communication, category: ' + englishCategory.slug + ')')
    }
  }

  // ── 4. Tally ERP ────────────────────────────────────────────
  const tallyCategory = await prisma.courseCategory.findFirst({
    where: {
      OR: [
        { slug: 'tally' },
        { slug: 'tally-erp' },
        { slug: 'accounting' },
        { slug: 'erp-enterprise-tools' },
        { slug: 'finance-accounting' },
        { name: { contains: 'Tally', mode: 'insensitive' } },
        { name: { contains: 'Account', mode: 'insensitive' } },
        { name: { contains: 'ERP', mode: 'insensitive' } },
      ]
    }
  })

  if (!tallyCategory) {
    console.log('⚠ No matching category for Tally ERP — skipping.')
  } else {
    const existing = await prisma.course.findFirst({ where: { slug: 'tally-erp-prime-accounting' } })
    if (existing) {
      console.log('⏭ Skipping Tally ERP (already exists)')
    } else {
      await prisma.course.create({
        data: {
          title:         'Tally ERP 9 & TallyPrime',
          slug:          'tally-erp-prime-accounting',
          description:   'Complete Tally ERP 9 and TallyPrime training covering accounting, inventory management, GST, payroll, and financial reporting. Ideal for accountants, commerce students, and business owners.',
          excerpt:       'Master Tally ERP 9 and TallyPrime for accounting, GST, inventory, and payroll management.',
          category:      tallyCategory.name,
          categorySlug:  tallyCategory.slug,
          categoryId:    tallyCategory.id,
          duration:      '45 Days',
          mode:          'Classroom / Online',
          level:         'Beginner to Advanced',
          price:         9000,
          originalPrice: 14000,
          badge:         'Industry Standard',
          status:        'published',
          featured:      false,
          sortOrder:     53,
          highlights: [
            'Tally ERP 9 complete training',
            'TallyPrime latest version',
            'GST filing and returns',
            'Payroll processing',
            'Inventory and stock management',
            'Financial statements and reports',
            'Bank reconciliation',
            'Certificate recognised by employers',
          ],
          tools: ['Tally ERP 9', 'TallyPrime', 'GST Portal', 'Tally Vault'],
          syllabus: [
            { module: 'Accounting Fundamentals', topics: ['Double entry system', 'Journal entries', 'Ledger creation', 'Trial balance', 'Financial statements'] },
            { module: 'Tally ERP 9 Basics', topics: ['Company creation', 'Masters — ledgers, groups', 'Voucher entry', 'Bank reconciliation', 'Day book and registers'] },
            { module: 'GST in Tally', topics: ['GST setup and configuration', 'Sales and purchase with GST', 'GST returns (GSTR-1, GSTR-3B)', 'E-invoicing', 'GST reconciliation'] },
            { module: 'Inventory Management', topics: ['Stock groups and items', 'Godown management', 'Purchase and sales orders', 'Stock summary reports', 'Reorder levels'] },
            { module: 'Payroll & TallyPrime', topics: ['Employee masters', 'Attendance and payroll processing', 'PF and ESI', 'TallyPrime interface', 'Advanced reporting in TallyPrime'] },
          ],
          seoTitle: 'Tally ERP 9 & TallyPrime Training in Hyderabad | Coss Cloud Solutions',
          seoDesc:  'Tally ERP training in Hyderabad. Complete Tally ERP 9 and TallyPrime with GST, payroll, inventory. Job placement support included.',
        },
      })
      console.log('✓ Created: Tally ERP 9 & TallyPrime (slug: tally-erp-prime-accounting, category: ' + tallyCategory.slug + ')')
    }
  }

  console.log('\nDone.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
