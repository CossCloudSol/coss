// scripts/seed-hr-quantum-static.mjs
// Static-content seed — no Gemini API needed.
// Run: node --env-file=.env scripts/seed-hr-quantum-static.mjs
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const NEW_CATEGORIES = [
  {
    name: 'Human Resource',
    slug: 'human-resource',
    description: 'HR training covering recruitment, operations, business partnering and leadership — built for Hyderabad professionals moving into or growing within HR roles.',
    icon: 'ti-users',
    color: '#D4537E',
    sortOrder: 11,
    isLegacy: false,
    status: 'published',
    seoTitle: 'HR Training Courses in Hyderabad | COSS',
    seoDesc: 'HR recruitment, operations & leadership training in Hyderabad. COSS — practical, placement-focused batches at Dilsukhnagar & Ameerpet.',
  },
  {
    name: 'Quantum Computing',
    slug: 'quantum-computing',
    description: 'Future-focused quantum computing training for Hyderabad IT professionals who want to get ahead of the curve before the market matures.',
    icon: 'ti-atom',
    color: '#534AB7',
    sortOrder: 12,
    isLegacy: false,
    status: 'published',
    seoTitle: 'Quantum Computing Training in Hyderabad | COSS',
    seoDesc: 'Quantum computing course in Hyderabad. Get ahead of the curve — COSS training for forward-thinking IT professionals.',
  },
]

const COURSES = [
  // ── 1. HR Recruitment Training ─────────────────────────────────────────────
  {
    title: 'HR Recruitment Training',
    categorySlug: 'human-resource',
    price: 12000,
    originalPrice: 15000,
    badge: 'Popular',
    level: 'Beginner',
    slug: 'hr-recruitment-training-in-hyderabad',
    excerpt: 'Master end-to-end hiring — sourcing on LinkedIn & Naukri, ATS workflows, structured interviews, and onboarding. Practical, placement-focused.',
    description: `So you want to be the person who finds the right talent before anyone else does? That's exactly what this course trains you for.

You'll work through every stage of the recruitment lifecycle — writing job descriptions that attract the right candidates, sourcing on LinkedIn Recruiter and Naukri.com, screening with structured scorecards, running competency-based interviews, and setting up an onboarding process that sticks.

What makes this different from reading an HR textbook? You'll practice with live ATS platforms. Mock sourcing assignments on Keka Recruit and Zoho Recruit, building Boolean search strings that Cognizant's Hyderabad talent team would actually use. By week 3, you'll have a complete hiring pipeline documented — one you can show in interviews.

Companies like TCS and Wipro at Gachibowli hire Recruitment Coordinators starting at ₹3.5–5.5 LPA. Experienced Talent Acquisition Specialists grow to ₹7–12 LPA within 3–4 years. This course gets you ready for that first role.

Weekend batches run at our Dilsukhnagar centre — built for working professionals who want to switch into HR without leaving their current job. Next batch starts [BATCH_DATE]. [STUDENT_COUNT] students placed in the last 12 months.`,
    highlights: [
      'Hands-on ATS practice with Keka Recruit and Zoho Recruit',
      'Live sourcing sessions on LinkedIn Recruiter and Naukri.com',
      'Build 5 complete job descriptions with scoring criteria',
      'Competency-based interview framework with 20+ question bank',
      'Mock end-to-end hiring pipeline project reviewed by a recruiter',
      'Placement support and mock HR interview preparation included',
      'Weekend batches at Dilsukhnagar for working professionals',
      'Certificate with practical project portfolio',
    ],
    syllabus: [
      {
        module: 'Module 1: Recruitment Fundamentals',
        topics: [
          'Recruitment vs. Talent Acquisition — role clarity',
          'HR department structure and the recruiter\'s position in it',
          'Types of hiring: lateral, bulk, campus, contractual',
          'Core metrics: time-to-fill, cost-per-hire, quality-of-hire',
          'Legal compliance in hiring: POSH, equal opportunity basics',
        ],
      },
      {
        module: 'Module 2: Job Analysis & JD Writing',
        topics: [
          'Job analysis techniques: interviews, observation, O*NET framework',
          'Writing JDs that attract vs. filter — structure and language',
          'Person spec vs. job spec',
          'Salary benchmarking with Glassdoor, LinkedIn Salary Insights, Naukri reports',
          'Employee referral templates and internal posting formats',
        ],
      },
      {
        module: 'Module 3: Sourcing Strategies',
        topics: [
          'Boolean search strings on LinkedIn Recruiter and Naukri.com',
          'Active vs. passive candidate sourcing tactics',
          'Campus recruitment planning and college tie-ups',
          'Social sourcing: GitHub, HackerEarth for tech roles',
          'Building a talent pipeline CRM in Excel and Google Sheets',
        ],
      },
      {
        module: 'Module 4: Screening & Assessment',
        topics: [
          'Resume screening frameworks: must-have vs. nice-to-have',
          'Telephonic and video pre-screening scripts',
          'Assessment platforms: Mettl, HackerRank — setup and analysis',
          'Competency-based interview design and scoring rubrics',
          'Panel interview coordination and structured debrief facilitation',
        ],
      },
      {
        module: 'Module 5: ATS Deep-Dive',
        topics: [
          'Keka Recruit: configuring job pipelines and approval workflows',
          'Zoho Recruit: candidate stages, email templates, custom fields',
          'Offer letter generation and ATS approval workflows',
          'Recruiter dashboards: pipeline reports, funnel analysis',
          'MS Excel recruitment trackers for teams without ATS',
        ],
      },
      {
        module: 'Module 6: Onboarding & Integration',
        topics: [
          'Pre-boarding vs. onboarding — what happens before Day 1',
          '30-60-90 day onboarding plans by role type',
          'Documentation checklist: BGV, offer acceptance, Form 16',
          'Orientation program design and facilitator guide',
          'New hire feedback surveys and early-warning indicators',
        ],
      },
      {
        module: 'Module 7: Capstone — End-to-End Hiring Simulation',
        topics: [
          'Full recruitment cycle project for a mock IT company scenario',
          'Source 10 candidates, screen to shortlist 3, conduct structured interviews',
          'ATS pipeline setup and reporting dashboard',
          'Presentation of hiring report to a mock stakeholder panel',
          'Portfolio documentation for job applications',
        ],
      },
    ],
    tools: [
      'LinkedIn Recruiter',
      'Naukri.com Recruiter Dashboard',
      'Keka Recruit ATS',
      'Zoho Recruit',
      'HackerRank Assessments',
      'Mettl Assessment Platform',
      'MS Excel (recruitment trackers)',
      'Google Forms (candidate surveys)',
    ],
    duration: '45 Days',
    seoTitle: 'HR Recruitment Training in Hyderabad | COSS',
    seoDesc: 'Master LinkedIn, ATS & structured interviews. HR Recruitment course Hyderabad — 45 days, placement support, weekend batches at COSS Dilsukhnagar.',
  },

  // ── 2. HR Operations Training ──────────────────────────────────────────────
  {
    title: 'HR Operations Training',
    categorySlug: 'human-resource',
    price: 12000,
    originalPrice: 15000,
    badge: 'High Demand',
    level: 'Beginner',
    slug: 'hr-operations-training-in-hyderabad',
    excerpt: 'Payroll, PF/ESI compliance, and HRIS on GreytHR, Keka & Darwinbox. Build the hands-on skills Hyderabad HR Ops roles actually need.',
    description: `Most HR roles in Hyderabad's IT sector are operations-heavy. If you can't run payroll, manage compliance, or navigate an HRIS, you're constantly asking your colleagues for help. This course changes that.

You'll work through the complete HR Operations function — payroll processing from salary structure setup to full-and-final settlements, statutory compliance covering PF, ESI, Professional Tax, TDS and Gratuity, HRIS administration, and the full employee lifecycle from joining to exit formalities.

Companies like Infosys and HCL in Madhapur process payroll for thousands of employees every month. They need HR Operations executives who can run payroll independently, handle compliance queries, and work in the HRIS without handholding. That's exactly what you'll be doing by the end of this course.

You'll get hands-on time on GreytHR, Keka HRMS, and Darwinbox — the three platforms most Hyderabad companies actually use. You'll also build MS Excel proficiency for payroll reconciliation, something every HR Ops interview tests you on.

HR Operations roles in Hyderabad start at ₹3–5 LPA for freshers and grow to ₹8–14 LPA with 4–5 years of HRIS and compliance expertise. There aren't many HR professionals who can do both payroll AND compliance confidently — that combination is exactly what this course builds.

Weekend batches at our Ameerpet centre. Next intake: [BATCH_DATE]. Trained [STUDENT_COUNT] students so far.`,
    highlights: [
      'Hands-on practice on GreytHR, Keka HRMS, and Darwinbox',
      'Full payroll cycle: salary structures, variable pay, F&F settlements',
      'Statutory compliance: PF, ESI, PT, TDS, Gratuity — with real calculations',
      'Employee lifecycle management from joining forms to exit clearance',
      'Excel-based payroll reconciliation with industry-standard templates',
      'Leave, attendance, and shift management in live HRIS platforms',
      'Weekend batches at Ameerpet for working professionals',
      'Placement support and mock HR Ops interview preparation',
    ],
    syllabus: [
      {
        module: 'Module 1: HR Operations Fundamentals',
        topics: [
          'HR Ops vs. HR Generalist vs. HRBP — role boundaries',
          'HR team structure in mid-size and large IT companies',
          'Employee lifecycle stages and HR touchpoints at each stage',
          'Key HR Ops metrics: attrition rate, headcount, absenteeism, cost-per-employee',
          'HR compliance calendar: monthly, quarterly, annual obligations',
        ],
      },
      {
        module: 'Module 2: Payroll Management',
        topics: [
          'Salary structure design: CTC breakdown, components (basic, HRA, LTA, special allowance)',
          'Variable pay and incentive structures',
          'Net salary calculation: deductions, reimbursements, investment declarations',
          'Full & Final settlement: notice period, gratuity, earned leave encashment, recovery',
          'Payslip generation, Form 16, and payroll audit trails',
        ],
      },
      {
        module: 'Module 3: Statutory Compliance',
        topics: [
          'Provident Fund (EPF Act): registration, contribution rates, UAN management, ECR filing on EPFO portal',
          'ESI: eligibility, contribution calculation, claim filing, ESIC portal walkthrough',
          'Professional Tax: Telangana state slabs, payment challans',
          'TDS on salary: Form 24Q, section 192, investment proof collection',
          'Gratuity Act, Maternity Benefit Act, POSH compliance basics',
        ],
      },
      {
        module: 'Module 4: HRIS Administration',
        topics: [
          'GreytHR: org setup, leave policies, attendance rules, payroll run',
          'Keka HRMS: employee database, document management, approval workflows',
          'Darwinbox: onboarding module, performance setup, separation workflows',
          'Generating MIS reports: headcount, attrition, leave balance, compliance reports',
          'Bulk data migration via Excel templates — employee master data uploads',
        ],
      },
      {
        module: 'Module 5: Leave, Attendance & Workforce Admin',
        topics: [
          'Leave policy design: CL, PL, SL, compensatory off — best practices for IT/ITES',
          'Biometric and RFID attendance integration with HRIS',
          'Shift scheduling and overtime calculation',
          'Absenteeism trend analysis and early intervention frameworks',
          'Remote work attendance tracking policies and tools',
        ],
      },
      {
        module: 'Module 6: Exit Management',
        topics: [
          'Resignation process: notice period, handover documentation',
          'Exit interview design, administration, and analysis',
          'PF withdrawal and PF transfer via EPFO portal walkthrough',
          'Relieving letter, experience certificate, and NOC issuance',
          'Attrition report generation and retention risk flagging',
        ],
      },
      {
        module: 'Module 7: Capstone — HR Ops Simulation',
        topics: [
          'End-to-end payroll run for a simulated 50-employee IT company',
          'PF ECR filing and ESI return exercise on demo portals',
          'HRIS configuration project on GreytHR trial account',
          'Building an HR Ops dashboard in Excel with real templates',
          'Peer review and presentation of completed HR Ops portfolio',
        ],
      },
    ],
    tools: [
      'GreytHR',
      'Keka HRMS',
      'Darwinbox',
      'SAP HCM (overview module)',
      'EPFO Portal',
      'ESIC Portal',
      'MS Excel (payroll templates)',
      'Traces Portal (TDS)',
    ],
    duration: '45 Days',
    seoTitle: 'HR Operations Training in Hyderabad | COSS',
    seoDesc: 'Payroll, PF/ESI & HRIS training on GreytHR, Keka & Darwinbox. HR Operations course Hyderabad — 45 days, weekend batches, placement support at COSS.',
  },

  // ── 3. HR Business Partner Training ───────────────────────────────────────
  {
    title: 'HR Business Partner Training',
    categorySlug: 'human-resource',
    price: 14000,
    originalPrice: 18000,
    badge: 'High Demand',
    level: 'Intermediate',
    slug: 'hr-business-partner-training-in-hyderabad',
    excerpt: 'Move from HR admin to strategic partner. Workforce planning, org design, data-driven HR, and stakeholder influence — for mid-career HR professionals.',
    description: `Most HR professionals spend their careers in administration. This course is for the ones who want a seat at the business table.

The HRBP role is where HR stops being reactive and starts driving decisions. You'll work directly alongside business heads — translating people data into workforce plans, running organizational development initiatives, and owning the talent agenda for your business unit.

This course covers the four pillars of the strategic HRBP role: workforce planning, organizational development, talent management, and stakeholder influence. You'll build the frameworks that HRBPs at TCS and Wipro in HITEC City actually use — competency frameworks, 9-box talent grids, succession plans, and workforce analytics dashboards built in Power BI and Excel.

What separates a good HRBP from a great one? Numbers. You'll learn to build attrition prediction models, engagement heatmaps, and span-of-control analyses — the kind of data that makes business leaders pay attention during quarterly reviews.

Senior HRBP roles in Hyderabad's IT sector command ₹10–18 LPA. HR Business Partners with 5+ years at companies like Cognizant and HCL earn ₹18–28 LPA. This course is built for HR professionals who are 3–5 years in and ready to shift from generalist to strategic partner.

This isn't a beginner course. You need a working understanding of HR operations before you join. Weekend batches at Ameerpet. Next cohort: [BATCH_DATE].`,
    highlights: [
      'Workforce planning frameworks used by HRBPs at top Hyderabad IT firms',
      '9-box talent grid and succession planning practicals',
      'Org design and restructuring — applied to IT company case studies',
      'HR analytics: attrition prediction, engagement scoring in Power BI',
      'Stakeholder influence and executive communication for HRBPs',
      'Change management using Kotter\'s 8-Step and Prosci ADKAR models',
      'Intermediate-level course — prior HR operations experience required',
      'Weekend batches at Ameerpet, placement support for HRBP roles',
    ],
    syllabus: [
      {
        module: 'Module 1: The HRBP Role — Scope & Mindset',
        topics: [
          'HRBP model: Ulrich\'s HR Business Partner framework',
          'Difference between HR Generalist, HR Ops, and HRBP scope of work',
          'Building credibility with business stakeholders: the first 90 days',
          'HRBP calendar: annual HR rhythm in a mid-size IT company',
          'Common HRBP failure modes and how to avoid them',
        ],
      },
      {
        module: 'Module 2: Workforce Planning',
        topics: [
          'Demand and supply forecasting for headcount',
          'Gap analysis: identifying skill shortages before they become crises',
          'Scenario planning: workforce models for growth, consolidation, and restructure',
          'Hiring plan creation linked to business unit P&L',
          'Workforce planning dashboards in Excel and Power BI',
        ],
      },
      {
        module: 'Module 3: Organizational Development',
        topics: [
          'Org design principles: spans, layers, reporting structures',
          'Competency framework design and rollout',
          'Culture assessment tools: engagement surveys, focus groups, pulse checks',
          'Team effectiveness models: Lencioni\'s Five Dysfunctions, Tuckman stages',
          'OD intervention planning and stakeholder buy-in',
        ],
      },
      {
        module: 'Module 4: Talent Management',
        topics: [
          '9-box grid: performance vs. potential mapping',
          'Succession planning: identifying and developing Hi-Po talent',
          'Individual Development Plans (IDPs) — design and tracking',
          'Career patching frameworks for IT professionals',
          'Retention risk analysis and targeted retention strategies',
        ],
      },
      {
        module: 'Module 5: HR Analytics for HRBPs',
        topics: [
          'Building an HR data model: what to measure and why',
          'Attrition analysis: cohort analysis, regression basics in Excel',
          'Engagement survey design, analysis, and action planning',
          'Power BI for HR: building workforce dashboards',
          'Presenting HR data to business leaders: storytelling with numbers',
        ],
      },
      {
        module: 'Module 6: Change Management',
        topics: [
          'Kotter\'s 8-Step Change Model applied to HR transformation scenarios',
          'Prosci ADKAR Model: awareness, desire, knowledge, ability, reinforcement',
          'Resistance management: identifying and addressing key resistors',
          'Communication planning for change programs',
          'Post-change stabilization and sustainability',
        ],
      },
      {
        module: 'Module 7: Capstone — HRBP Business Case Project',
        topics: [
          'Full HRBP project: workforce plan + talent strategy for a simulated IT BU',
          'Build and present 9-box talent review to a mock leadership team',
          'HR analytics dashboard: attrition and engagement data in Power BI',
          'Change management plan for a simulated HRIS migration',
          'Peer review and feedback from practicing HRBP guest reviewer',
        ],
      },
    ],
    tools: [
      'Microsoft Power BI',
      'MS Excel (HR analytics models)',
      'Darwinbox (performance management module)',
      'SurveyMonkey / Google Forms (engagement surveys)',
      'Miro (org design canvases)',
      'LinkedIn Talent Insights (workforce market data)',
    ],
    duration: '2 Months',
    seoTitle: 'HR Business Partner Training Hyderabad | COSS',
    seoDesc: 'Strategic HRBP skills: workforce planning, 9-box, org design & HR analytics. HRBP course Hyderabad for mid-career HR professionals — COSS Ameerpet.',
  },

  // ── 4. HR Leadership Training ──────────────────────────────────────────────
  {
    title: 'HR Leadership Training',
    categorySlug: 'human-resource',
    price: 15000,
    originalPrice: 20000,
    badge: 'New',
    level: 'Advanced',
    slug: 'hr-leadership-training-in-hyderabad',
    excerpt: 'For senior HR professionals ready to lead. People strategy, change management, executive communication, and HR board reporting — applied to Hyderabad IT company scenarios.',
    description: `If you're already a senior HR professional wondering why your influence stops at the HR department — this course is specifically built for you.

HR leadership isn't about knowing more HR processes. It's about building the judgment to make people decisions that affect the business, the communication skills to influence the C-suite, and the operational discipline to run a high-performing HR function.

You'll work through people strategy frameworks — how to design a 3-year HR roadmap that aligns to business goals. You'll practice change management using Kotter and Prosci models, applied to real HR transformation scenarios like HRIS migrations, restructuring, and culture shifts that Hyderabad IT companies face regularly.

The business communication module is practical: you'll build an HR metrics board presentation, write a workforce risk memo for the CFO, and practice executive-level Q&A. Because the skills that make an HR Director credible in a board meeting are completely different from what makes an HR executive good at their day job.

HR Manager roles in companies like Mphasis and Cyient at HITEC City pay ₹15–25 LPA. Senior HR Directors earn ₹25–45 LPA. This is the course that builds the bridge between where you are and that first leadership milestone.

This is an advanced course. You'll get the most from it with at least 5 years of HR experience across multiple functions. Weekend batches at Dilsukhnagar. Next cohort: [BATCH_DATE].`,
    highlights: [
      '3-year HR strategy framework tied to business unit P&L',
      'Change management: Kotter\'s 8-Step and Prosci ADKAR in practice',
      'Executive presence and C-suite communication for HR leaders',
      'Board-level HR reporting: workforce risk, talent pipeline, DEI metrics',
      'HR function design: team structure, CoE vs. HRBP vs. Shared Services models',
      'People analytics for senior leaders: building the HR scorecard',
      'Advanced course — 5+ years of HR experience strongly recommended',
      'Weekend batches at Dilsukhnagar, limited cohort size for quality learning',
    ],
    syllabus: [
      {
        module: 'Module 1: HR Leadership Foundations',
        topics: [
          'Evolution of the HR function: from admin to strategic partner to business driver',
          'HR leadership models: the HR Director vs. CHRO mindset',
          'Building HR credibility with the CEO and business heads',
          'The HR leader\'s annual business calendar',
          'Common HR leadership derailment factors — and how to avoid them',
        ],
      },
      {
        module: 'Module 2: People Strategy',
        topics: [
          'Designing a 3-year people strategy aligned to company growth plans',
          'Workforce planning at the enterprise level: headcount, skills, location',
          'Employer branding strategy: how to position the company for talent attraction',
          'Diversity, equity and inclusion: setting goals, measuring progress',
          'Total rewards strategy: compensation philosophy and market positioning',
        ],
      },
      {
        module: 'Module 3: Organizational Design & Change',
        topics: [
          'Org design at scale: spans, layers, matrix structures in IT companies',
          'Leading restructuring and rightsizing with minimal culture damage',
          'Kotter\'s 8-Step Change Model: application to large-scale HR programs',
          'Prosci ADKAR: change readiness assessments and intervention design',
          'Post-merger and acquisition HR integration frameworks',
        ],
      },
      {
        module: 'Module 4: Executive Communication',
        topics: [
          'The CFO conversation: presenting HR initiatives with an ROI lens',
          'Board reporting: workforce risk, succession, and DEI dashboards',
          'Writing executive briefings: workforce risk memos, policy proposals',
          'Influencing without authority: navigating the C-suite',
          'Crisis communication: handling layoffs, misconduct, leadership transitions',
        ],
      },
      {
        module: 'Module 5: HR Metrics & People Analytics',
        topics: [
          'The HR Scorecard: what to measure, what to ignore',
          'Predictive analytics: flight risk models, succession readiness scores',
          'HR function ROI measurement: cost per hire, training ROI, productivity metrics',
          'Building an HR dashboard in Power BI for executive consumption',
          'Benchmarking HR function performance against industry standards',
        ],
      },
      {
        module: 'Module 6: HR Function Management',
        topics: [
          'Designing the HR operating model: CoE, HRBP, Shared Services',
          'HR budget planning and headcount justification',
          'Building and managing an HR team: hiring, development, and succession',
          'HR technology roadmap: when to upgrade, what to automate',
          'Vendor management: HRIS, payroll, benefits, and RPO partners',
        ],
      },
      {
        module: 'Module 7: Capstone — HR Leadership Simulation',
        topics: [
          'Build a 3-year people strategy for a 2,000-employee IT company scenario',
          'Present to a mock board: workforce risk report with recommendations',
          'Design a change management plan for a company-wide HRIS migration',
          'Executive communication exercise with feedback from HR Director guest',
          'Portfolio documentation: strategy doc + board deck + change plan',
        ],
      },
    ],
    tools: [
      'Microsoft Power BI',
      'MS Excel (HR scorecard templates)',
      'PowerPoint (executive deck design)',
      'Miro (strategy and org design canvases)',
      'Workday HCM (overview — enterprise HRIS)',
      'LinkedIn Talent Insights (market benchmarking)',
    ],
    duration: '2 Months',
    seoTitle: 'HR Leadership Training in Hyderabad | COSS',
    seoDesc: 'People strategy, change management & C-suite communication for senior HR. HR Leadership course Hyderabad — advanced cohort at COSS Dilsukhnagar.',
  },

  // ── 5. HR Learning and Development Training ───────────────────────────────
  {
    title: 'HR Learning and Development Training',
    categorySlug: 'human-resource',
    price: 12000,
    originalPrice: 15000,
    badge: 'New',
    level: 'Beginner',
    slug: 'hr-learning-development-training-in-hyderabad',
    excerpt: 'TNA, instructional design, LMS administration, and L&D metrics — build a career designing learning programs for Hyderabad\'s IT and GCC sector.',
    description: `L&D is one of the fastest-growing specialisms within HR. Hyderabad's tech companies — and the wave of GCCs setting up in the city — are all investing in internal learning functions. If you want to build a career designing and running learning programs, this is the right time.

You'll learn Training Needs Analysis — how to identify skill gaps using surveys, performance data, and stakeholder interviews, not guesswork. From there, you'll move into instructional design: building course outlines, writing learning objectives using Bloom's Taxonomy, and creating e-learning content in Articulate 360 and Canva.

You'll get hands-on time with LMS platforms: Moodle and Cornerstone OnDemand, the two most used in mid-to-large IT companies. You'll configure courses, set up learner groups, and pull completion reports.

The final section covers L&D measurement — calculating training ROI using the Kirkpatrick Model, building learning dashboards, and making the business case for the L&D function. This is the part that gets L&D professionals taken seriously.

Companies like Amazon Hyderabad and Microsoft IDC have active L&D teams. L&D Executive roles start at ₹4–7 LPA and grow to ₹12–20 LPA for L&D Managers with instructional design experience and LMS expertise.

Weekend batches at Ameerpet. Next batch: [BATCH_DATE]. [STUDENT_COUNT] students trained so far.`,
    highlights: [
      'Training Needs Analysis using surveys, performance data, and stakeholder interviews',
      'Instructional design with Bloom\'s Taxonomy — 3 course outlines built during training',
      'Hands-on: create e-learning content in Articulate 360 and Canva',
      'LMS administration on Moodle and Cornerstone OnDemand',
      'Kirkpatrick Model L&D evaluation and ROI calculation',
      'Build a complete L&D dashboard in Excel presented to a mock stakeholder',
      'Weekend batches at Ameerpet for working HR professionals',
      'Placement support for L&D Executive and Instructional Designer roles',
    ],
    syllabus: [
      {
        module: 'Module 1: L&D Function Fundamentals',
        topics: [
          'Role of L&D in an HR department: scope and career paths',
          'L&D team structures in IT companies vs. GCCs vs. MNCs',
          'Types of learning: formal, informal, social, on-the-job',
          'Adult learning principles: Malcolm Knowles\' Andragogy',
          'L&D annual calendar and budget planning basics',
        ],
      },
      {
        module: 'Module 2: Training Needs Analysis (TNA)',
        topics: [
          'Org-level, job-level, and individual-level TNA frameworks',
          'TNA methods: surveys, interviews, observation, performance data analysis',
          'Skills gap matrix: building a skills inventory vs. current capability',
          'Prioritizing training requests: impact vs. urgency scoring',
          'Writing a TNA report with actionable recommendations',
        ],
      },
      {
        module: 'Module 3: Instructional Design',
        topics: [
          'ADDIE model: Analysis, Design, Development, Implementation, Evaluation',
          'Learning objectives using Bloom\'s Taxonomy: action verbs and measurable outcomes',
          'Course outline design: sequencing, pacing, and chunking content',
          'Assessment design: knowledge checks, practical exercises, scenario-based tests',
          'Storyboarding for e-learning: from script to screen',
        ],
      },
      {
        module: 'Module 4: Content Creation Tools',
        topics: [
          'Articulate 360: building interactive e-learning slides and branching scenarios',
          'Canva for L&D: creating visual job aids, infographics, and facilitator decks',
          'Video creation basics: screen recording, talking-head format for microlearning',
          'Gamification elements: badges, leaderboards, scenario challenges',
          'Accessibility in e-learning: WCAG basics for learning content',
        ],
      },
      {
        module: 'Module 5: LMS Administration',
        topics: [
          'Moodle: course creation, learner enrollment, quiz configuration, completion reports',
          'Cornerstone OnDemand: catalog setup, curricula, learning plans, compliance training',
          'SCORM packages: what they are, how to upload and track them',
          'LMS reports: completion rates, time-on-course, assessment scores',
          'Learner communication: automated notifications, nudges, reminders',
        ],
      },
      {
        module: 'Module 6: L&D Measurement & ROI',
        topics: [
          'Kirkpatrick Model: Level 1 (Reaction), 2 (Learning), 3 (Behaviour), 4 (Results)',
          'Post-training surveys: design, administration, and analysis',
          'Calculating training ROI: cost inputs, productivity output, revenue attribution',
          'Building an L&D dashboard: program utilization, completion, cost-per-learner',
          'Presenting L&D results to business stakeholders',
        ],
      },
      {
        module: 'Module 7: Capstone — Full L&D Program Design',
        topics: [
          'TNA for a simulated IT company: surveys + data analysis + gap report',
          'Design and develop one 30-minute e-learning module in Articulate 360',
          'Upload to Moodle: configure, enroll learners, pull completion report',
          'L&D ROI presentation to mock leadership panel',
          'Portfolio review and peer feedback',
        ],
      },
    ],
    tools: [
      'Articulate 360 (Storyline + Rise)',
      'Moodle LMS',
      'Cornerstone OnDemand (overview)',
      'Canva for Education',
      'LinkedIn Learning (as content reference)',
      'MS Excel (L&D dashboards)',
      'Google Forms (TNA surveys)',
      'Loom (video microlearning)',
    ],
    duration: '45 Days',
    seoTitle: 'HR L&D Training in Hyderabad | COSS',
    seoDesc: 'TNA, instructional design & LMS on Moodle & Articulate 360. Learning & Development course Hyderabad — 45 days, weekend batches at COSS Ameerpet.',
  },

  // ── 6. HR Management Training ─────────────────────────────────────────────
  {
    title: 'HR Management Training',
    categorySlug: 'human-resource',
    price: 10000,
    originalPrice: 13000,
    badge: 'Bestseller',
    level: 'All Levels',
    slug: 'hr-management-training-in-hyderabad',
    excerpt: 'The complete HR course for beginners and career switchers. Covers the full HR lifecycle from recruitment to exit — with live HRMS practice and placement support.',
    description: `Never worked in HR before? You're in the right place. This is the course that gives you the complete picture of how an HR department actually works — from the day someone applies for a job to the day they eventually leave.

You'll cover every major HR function: recruitment and onboarding, payroll and statutory compliance, performance management, training and development, employee relations, and exit management. Not just theory — you'll practice on live HRMS platforms, build real HR documents, and put together a portfolio you can bring to interviews.

Why is this the most popular course at COSS? Because it's genuinely accessible. You don't need an MBA or prior HR experience. By the end of week 6, you'll understand how companies like Infosys at Madhapur structure their HR team, what each function does, and where you'd fit.

HR Generalist and HR Executive roles in Hyderabad's IT sector start at ₹2.5–4.5 LPA. With 2–3 years of experience across multiple HR functions, you can move to ₹6–10 LPA. This course is where that career starts.

Monthly batches at our Dilsukhnagar and Ameerpet centres. Weekend batches available. Next start: [BATCH_DATE]. Join [STUDENT_COUNT] COSS students who launched their HR careers from exactly this course.`,
    highlights: [
      'Complete HR lifecycle from recruitment to exit — no prior experience needed',
      'Hands-on practice on Keka HRMS and GreytHR',
      'Build a real HR document portfolio: JDs, offer letters, payslips, policies',
      'Payroll and PF/ESI basics: practical walkthroughs not just theory',
      'Performance management: appraisal forms, PIP templates, rating scales',
      'Interview prep: mock HR Generalist and HR Executive interviews',
      'Monthly batches at Dilsukhnagar and Ameerpet — weekday and weekend options',
      'Placement support included — [STUDENT_COUNT] HR careers launched from COSS',
    ],
    syllabus: [
      {
        module: 'Module 1: Introduction to HR Management',
        topics: [
          'What HR does — the complete picture beyond "hire and fire"',
          'HR functions: recruitment, L&D, payroll, compliance, ER, exit',
          'HR team structures in small, mid-size, and large IT companies',
          'HR career paths: Generalist, Specialist, HRBP, HR Manager',
          'Day-in-the-life of an HR Executive in a Hyderabad IT company',
        ],
      },
      {
        module: 'Module 2: Recruitment & Onboarding',
        topics: [
          'Job description writing: JD structure, must-haves vs. nice-to-haves',
          'Sourcing basics: LinkedIn, Naukri.com, employee referrals',
          'Screening and shortlisting: resume evaluation frameworks',
          'Interview types: telephonic, technical, HR round — what each tests',
          'Onboarding documentation and first-day experience design',
        ],
      },
      {
        module: 'Module 3: Payroll & Statutory Compliance Basics',
        topics: [
          'Salary structure components: CTC, gross, net — demystified',
          'PF basics: what it is, how it works, UAN registration',
          'ESI basics: who it covers, contribution rates',
          'Professional Tax: Telangana slab structure',
          'Payslip reading and payroll calendar management',
        ],
      },
      {
        module: 'Module 4: HRMS Fundamentals',
        topics: [
          'Keka HRMS: employee records, leave requests, document storage',
          'GreytHR: attendance, payroll basics, self-service portal',
          'How to generate standard HR reports: headcount, leave, joining/exit',
          'Data maintenance: updating employee master, handling transfers and promotions',
          'HRMS vs. Excel-based HR: when each is appropriate',
        ],
      },
      {
        module: 'Module 5: Performance Management',
        topics: [
          'Performance appraisal cycles: annual, mid-year, continuous feedback',
          'Rating scales: 3-point, 5-point, and bell-curve systems',
          'Goal setting: SMART goals and OKR basics for HR practitioners',
          'Performance Improvement Plans (PIPs): when to use them, how to write them',
          'Promotion and increment management processes',
        ],
      },
      {
        module: 'Module 6: Employee Relations & Exit Management',
        topics: [
          'Employee relations basics: grievances, disciplinary process, counseling',
          'HR policies: leave, code of conduct, POSH — what every HR executive must know',
          'Resignation handling: notice period, handover, full & final checklist',
          'Exit interviews: how to conduct them and what to do with the data',
          'Employee engagement activities: what works in IT companies',
        ],
      },
      {
        module: 'Module 7: HR Generalist Project & Interview Prep',
        topics: [
          'Build an HR document portfolio: 8 key HR documents from scratch',
          'Mock HR Generalist interview: 20 most common HR interview questions',
          'HR case studies: how to handle common workplace scenarios',
          'LinkedIn profile and resume optimization for HR job search',
          'Job search strategy: niche vs. broad application, follow-up etiquette',
        ],
      },
    ],
    tools: [
      'Keka HRMS',
      'GreytHR',
      'LinkedIn (job search and sourcing)',
      'Naukri.com',
      'MS Excel (HR trackers)',
      'Google Workspace (Docs, Sheets, Forms)',
      'MS Word (HR document templates)',
    ],
    duration: '2 Months',
    seoTitle: 'HR Management Training in Hyderabad | COSS',
    seoDesc: 'Complete HR course for freshers and career switchers. Full HR lifecycle, live HRMS practice, placement support — COSS Hyderabad, from ₹10,000.',
  },

  // ── 7. Business Development Training ──────────────────────────────────────
  {
    title: 'Business Development Training',
    categorySlug: 'human-resource',
    price: 12000,
    originalPrice: 15000,
    badge: 'High Demand',
    level: 'Beginner',
    slug: 'business-development-training-in-hyderabad',
    excerpt: 'B2B sales, lead generation, CRM on Salesforce & HubSpot, negotiation, and client acquisition. BD training in Hyderabad for IT services and GCC sector roles.',
    description: `BD is a skill set that works in every industry — and in Hyderabad's booming IT services and GCC ecosystem, the demand for business development professionals has never been higher. This course teaches you how to actually win business, not just attend networking events.

You'll start with B2B sales strategy — how to map your target market, build an ideal customer profile, and prioritize your pipeline. From there, you'll move into hands-on work with Salesforce CRM and HubSpot, learning to structure your pipeline, build follow-up sequences, and report on conversion rates.

The prospecting module is the most practical part. You'll use LinkedIn Sales Navigator to build targeted prospect lists, write cold outreach scripts, and run mock discovery calls designed for IT services and software sales scenarios.

Negotiation and deal-closing complete the curriculum — handling price objections, navigating multi-stakeholder decisions, and writing proposals that actually convert.

Companies like Tech Mahindra and Cyient at HITEC City hire BD Executives starting at ₹4–7 LPA plus commission. Senior BD Managers with a proven track record earn ₹12–20 LPA. The commission structure means high performers earn significantly more than the base.

Weekend batches available at our Ameerpet centre — ideal for working professionals exploring a BD career switch. Next batch: [BATCH_DATE]. [STUDENT_COUNT] students placed in BD roles last year.`,
    highlights: [
      'B2B sales strategy and ICP (Ideal Customer Profile) building from scratch',
      'Hands-on Salesforce CRM and HubSpot — pipeline management and reporting',
      'LinkedIn Sales Navigator: build prospect lists and craft outreach sequences',
      'Mock discovery calls and pitch presentations for IT services scenarios',
      'Negotiation and deal-closing: objection handling frameworks',
      'Proposal writing that converts: structure, pricing, and follow-up',
      'Weekend batches at Ameerpet — designed for career-switchers into BD',
      'Placement support with BD-specific interview and role-play prep',
    ],
    syllabus: [
      {
        module: 'Module 1: Business Development Fundamentals',
        topics: [
          'BD vs. Sales vs. Account Management — role clarity',
          'B2B vs. B2C BD: how the strategies differ',
          'Revenue model types: project-based, retainer, SaaS, T&M — impact on BD',
          'BD team structures in IT services companies and GCCs',
          'The BD funnel: awareness → interest → consideration → decision → close',
        ],
      },
      {
        module: 'Module 2: Market Research & Target Mapping',
        topics: [
          'Ideal Customer Profile (ICP): industry, company size, geography, buying behavior',
          'Total Addressable Market (TAM) sizing and market segmentation',
          'Competitor analysis: positioning and differentiation',
          'Hyderabad market context: IT services, GCCs, product companies, startups',
          'Using LinkedIn, Crunchbase, and ZoomInfo for account research',
        ],
      },
      {
        module: 'Module 3: Prospecting & Lead Generation',
        topics: [
          'LinkedIn Sales Navigator: advanced search, prospect list building, InMail campaigns',
          'Cold outreach: email sequences, connection requests, follow-up cadences',
          'Cold calling fundamentals: opening, qualifying, objection handling, close',
          'Content-led prospecting: using thought leadership to attract inbound leads',
          'Lead scoring: qualifying MQLs and SQLs, prioritization frameworks',
        ],
      },
      {
        module: 'Module 4: CRM Management',
        topics: [
          'Salesforce CRM: lead and opportunity management, pipeline stages, activity logging',
          'HubSpot CRM: contact management, deal pipeline, email sequences, reporting',
          'CRM hygiene: data entry discipline, regular pipeline reviews',
          'Sales forecasting: commit, upside, and pipeline categories',
          'BD dashboards: weekly activity reports, conversion rate tracking',
        ],
      },
      {
        module: 'Module 5: Discovery & Pitching',
        topics: [
          'Discovery call structure: BANT and MEDDIC qualification frameworks',
          'Active listening techniques and probing question types',
          'Solution selling: matching your offer to the prospect\'s specific problem',
          'Pitch deck structure for IT services and software solutions',
          'Mock pitch presentations with recorded feedback',
        ],
      },
      {
        module: 'Module 6: Negotiation & Closing',
        topics: [
          'Negotiation fundamentals: ZOPA, BATNA, value vs. price conversations',
          'Common objection types and scripted handling techniques',
          'Multi-stakeholder deals: navigating the buying committee',
          'Proposal writing: structure, pricing presentation, scope clarity',
          'Closing techniques: trial close, assumptive close, urgency creation',
        ],
      },
      {
        module: 'Module 7: Capstone — Full BD Simulation',
        topics: [
          'Target account research and ICP validation for a mock IT services firm',
          'Build a 10-account prospect list with outreach sequences in HubSpot',
          'Run 2 live mock discovery calls with structured feedback',
          'Write a full proposal for a simulated ₹50L IT services deal',
          'Final pitch presentation to mock panel — recorded and reviewed',
        ],
      },
    ],
    tools: [
      'Salesforce CRM (Sales Cloud)',
      'HubSpot CRM',
      'LinkedIn Sales Navigator',
      'MS Excel (pipeline trackers)',
      'PowerPoint (pitch decks)',
      'Zoom / Google Meet (mock calls)',
      'Crunchbase (account research)',
    ],
    duration: '45 Days',
    seoTitle: 'Business Development Training Hyderabad | COSS',
    seoDesc: 'B2B sales, CRM on Salesforce & HubSpot, LinkedIn prospecting & negotiation. BD training Hyderabad for IT services roles — 45 days at COSS Ameerpet.',
  },

  // ── 8. Quantum Computing Training ─────────────────────────────────────────
  {
    title: 'Quantum Computing Training',
    categorySlug: 'quantum-computing',
    price: 18000,
    originalPrice: 22000,
    badge: 'New',
    level: 'Intermediate',
    slug: 'quantum-computing-training-in-hyderabad',
    excerpt: 'Qiskit, quantum circuits, Shor\'s & Grover\'s algorithms, and quantum cryptography. For Hyderabad IT professionals building skills for the decade ahead.',
    description: `Let's be direct: quantum computing jobs aren't posted on Naukri today. But five years from now, the engineers who understood this technology early will be the ones who define where their organizations go next. This course is for professionals who think that way.

You'll start with the physics — not a PhD-level treatment, but enough to genuinely understand why quantum computers work the way they do. Qubits, superposition, entanglement, and quantum interference explained in terms that a software engineer or data scientist can actually use.

From there, you'll move into practical programming with IBM's Qiskit SDK on IBM Quantum Experience. You'll write quantum circuits in Python, implement Grover's algorithm for search acceleration, and explore Shor's algorithm for factoring — the one that will eventually break RSA encryption. You'll also work with Google's Cirq framework as an alternative perspective.

The final modules cover real industry applications — quantum optimization for logistics routing, quantum chemistry simulations for drug discovery, and the basics of quantum-safe cryptography (QKD and post-quantum encryption standards).

Who is this for? Developers, data scientists, and researchers who want to get ahead before the market arrives. Organizations like TCS Research, IIT Hyderabad, IBM India, and Microsoft Research India are actively building quantum capability right now. Research and early-adoption roles are the current entry point.

This is an intermediate course — you need basic Python and some comfort with linear algebra. Weekend batches at Dilsukhnagar. Next batch: [BATCH_DATE].`,
    highlights: [
      'Quantum computing fundamentals — qubits, superposition, entanglement in plain English',
      'Hands-on Qiskit (IBM) programming on IBM Quantum Experience cloud platform',
      'Implement Grover\'s and Shor\'s algorithms from scratch in Python',
      'Quantum circuit design and simulation — 6 practical exercises',
      'Google Cirq framework as an alternative to Qiskit',
      'Industry applications: pharma, finance, logistics, and quantum cryptography (QKD)',
      'Honest positioning: future-ready skills, not a promise of immediate job placement',
      'Weekend batches at Dilsukhnagar — requires Python basics and linear algebra',
    ],
    syllabus: [
      {
        module: 'Module 1: Quantum Computing Foundations (No PhD Required)',
        topics: [
          'Classical vs. quantum computing: why qubits outperform bits for specific problems',
          'Superposition: the "both at once" property explained with probability amplitudes',
          'Entanglement: correlated qubits and why distance doesn\'t matter',
          'Interference: how quantum algorithms cancel wrong answers',
          'Quantum speedup: what problems benefit and what problems don\'t',
        ],
      },
      {
        module: 'Module 2: Qubits & Quantum Gates',
        topics: [
          'Qubit representations: Dirac notation (bra-ket) and Bloch sphere',
          'Single-qubit gates: Hadamard (H), Pauli-X/Y/Z, S, T gates',
          'Multi-qubit gates: CNOT, Toffoli, SWAP — controlling entanglement',
          'Quantum circuit diagrams: reading, writing, and composing',
          'Noise and decoherence: why current quantum computers are "noisy"',
        ],
      },
      {
        module: 'Module 3: Programming with Qiskit (IBM)',
        topics: [
          'Qiskit SDK installation and IBM Quantum Experience account setup',
          'Building your first quantum circuit in Python with Qiskit Terra',
          'Running circuits on IBM simulators and real quantum hardware',
          'Measurement and classical register handling',
          'Visualizing results: histogram plots, statevector visualization',
        ],
      },
      {
        module: 'Module 4: Quantum Algorithms',
        topics: [
          'Deutsch-Jozsa algorithm: the first proof of quantum advantage',
          'Grover\'s algorithm: quadratic speedup for unstructured search problems',
          'Quantum Fourier Transform (QFT): the building block of many algorithms',
          'Shor\'s algorithm: polynomial-time integer factoring and its cryptographic implications',
          'Variational Quantum Eigensolver (VQE): an intro to near-term quantum algorithms',
        ],
      },
      {
        module: 'Module 5: Google Cirq & Alternative Frameworks',
        topics: [
          'Cirq SDK: circuit objects, simulators, and Google Quantum AI hardware',
          'Comparing Qiskit and Cirq: syntax, abstraction levels, hardware targets',
          'PennyLane basics: quantum machine learning interface',
          'Quantum cloud platforms comparison: IBM Quantum, Google Quantum AI, IonQ, AWS Braket',
          'Open-source quantum ecosystem: community, resources, and staying current',
        ],
      },
      {
        module: 'Module 6: Quantum Cryptography',
        topics: [
          'Why RSA is vulnerable to Shor\'s algorithm — and what that means',
          'Quantum Key Distribution (QKD): BB84 protocol explained',
          'Post-quantum cryptography: NIST PQC standards (CRYSTALS-Kyber, CRYSTALS-Dilithium)',
          'Quantum-safe migration planning for IT systems',
          'Real deployments: quantum cryptography networks in Europe and China',
        ],
      },
      {
        module: 'Module 7: Industry Applications & Capstone',
        topics: [
          'Quantum optimization: QUBO formulation for logistics and scheduling problems',
          'Quantum chemistry: VQE for molecular energy calculations (pharma applications)',
          'Quantum finance: portfolio optimization and Monte Carlo speedup',
          'Capstone project: implement and present one quantum algorithm from start to finish',
          'Career pathways: research roles, certifications, and staying ahead of the market',
        ],
      },
    ],
    tools: [
      'Qiskit (IBM SDK)',
      'IBM Quantum Experience (cloud platform)',
      'Cirq (Google SDK)',
      'Python 3.11+',
      'Jupyter Notebooks',
      'NumPy and SciPy (quantum math foundations)',
      'Matplotlib (result visualization)',
    ],
    duration: '2 Months',
    seoTitle: 'Quantum Computing Training Hyderabad | COSS',
    seoDesc: 'Qiskit, quantum circuits & algorithms for IT professionals. Future-ready quantum computing course Hyderabad — 2 months, weekend batches at COSS.',
  },
]

async function main() {
  console.log('\n=== COSS Static Seed: Human Resource + Quantum Computing ===\n')

  // ── Phase 1: Create categories ──────────────────────────────────────────────
  console.log('Phase 1 — Upserting 2 categories...\n')
  const categoryMap = {}

  for (const cat of NEW_CATEGORIES) {
    const created = await db.courseCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    })
    categoryMap[cat.slug] = created
    console.log(`  ✓ ${cat.name} (id: ${created.id})`)
  }

  console.log('\n✅ Categories ready.\n')

  // ── Phase 2: Create courses ─────────────────────────────────────────────────
  console.log('Phase 2 — Inserting 8 courses...\n')
  const createdCourses = []

  for (let idx = 0; idx < COURSES.length; idx++) {
    const c = COURSES[idx]
    const cat = categoryMap[c.categorySlug]

    try {
      const course = await db.course.create({
        data: {
          title: c.title,
          slug: c.slug,
          excerpt: c.excerpt,
          description: c.description,
          highlights: c.highlights,
          syllabus: c.syllabus,
          tools: c.tools,
          duration: c.duration,
          level: c.level,
          mode: 'Classroom',
          badge: c.badge,
          price: c.price,
          originalPrice: c.originalPrice,
          status: 'published',
          featured: false,
          sortOrder: idx + 1,
          seoTitle: c.seoTitle,
          seoDesc: c.seoDesc,
          category: cat.name,
          categoryId: cat.id,
          categorySlug: cat.slug,
          urlType: 'new',
        },
      })
      createdCourses.push({ title: c.title, slug: course.slug, categorySlug: c.categorySlug })
      console.log(`  ✓ [${idx + 1}/8] ${c.title}`)
      console.log(`       → /courses/${c.categorySlug}/${course.slug}`)
    } catch (err) {
      if (err.code === 'P2002') {
        console.warn(`  ⚠ [${idx + 1}/8] Slug "${c.slug}" already exists — skipping.`)
      } else {
        console.error(`  ❌ [${idx + 1}/8] DB error for "${c.title}": ${err.message}`)
      }
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n\n=== DONE ===\n')
  console.log(`  Created: ${createdCourses.length} / 8 courses\n`)
  console.log('  Course URLs:')
  for (const c of createdCourses) {
    console.log(`    /courses/${c.categorySlug}/${c.slug}`)
  }

  console.log('\n  Category pages:')
  console.log('    /courses/human-resource     (should show 7 courses)')
  console.log('    /courses/quantum-computing  (should show 1 course)')

  const qc = createdCourses.find(c => c.categorySlug === 'quantum-computing')
  if (qc) {
    const qcCourse = await db.course.findUnique({
      where: { slug: qc.slug },
      select: { description: true },
    })
    if (qcCourse) {
      const firstPara = qcCourse.description.split('\n').find(l => l.trim().length > 30) ?? ''
      console.log('\n  === Quantum Computing — first paragraph (tone check) ===')
      console.log(' ', firstPara)
    }
  }

  await db.$disconnect()
}

main().catch(e => {
  console.error('\n❌ Fatal error:', e)
  db.$disconnect()
  process.exit(1)
})
