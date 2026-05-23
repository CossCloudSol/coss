/**
 * Seed script — 3 sample courses + 3 sample blog posts for COSS Cloud Solutions.
 * Run: node scripts/seed-coss-content.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const courses = [
  {
    title: 'AWS Cloud Practitioner Certification',
    slug: 'aws-cloud-practitioner-certification',
    description:
      'Become an AWS Certified Cloud Practitioner with our comprehensive training program. This course covers foundational AWS concepts including core services, security, architecture, pricing, and support. You will gain hands-on experience with AWS Management Console, EC2, S3, RDS, VPC, IAM, and CloudWatch through real-world lab exercises guided by certified AWS trainers.\n\nThe program is designed for both beginners and professionals looking to validate their cloud knowledge with an official AWS certification.',
    excerpt:
      'Master AWS cloud fundamentals and earn your AWS Certified Cloud Practitioner badge. Hands-on labs, expert trainers, and 100% exam support — all in Hyderabad.',
    category: 'Cloud Computing',
    duration: '2 Months',
    mode: 'Classroom',
    level: 'Beginner',
    price: 18000,
    originalPrice: 25000,
    badge: 'Most Popular',
    thumbnail: null,
    syllabus: [
      { week: 'Week 1-2', topic: 'Cloud Fundamentals & AWS Overview', details: 'Cloud computing concepts, AWS global infrastructure, IAM, billing & pricing models' },
      { week: 'Week 3-4', topic: 'Core AWS Services', details: 'EC2, S3, RDS, VPC, Route 53, CloudFront, Lambda, EBS' },
      { week: 'Week 5-6', topic: 'Security & Compliance', details: 'Shared responsibility model, AWS Shield, WAF, KMS, CloudTrail, Config' },
      { week: 'Week 7-8', topic: 'Exam Preparation & Mock Tests', details: 'Practice exams, exam strategies, doubt-clearing sessions, certification registration' },
    ],
    highlights: [
      '100% exam pass guarantee',
      'Hands-on AWS lab access',
      'Certified AWS trainer',
      'Resume & interview prep',
      'Lifetime course access',
      'Official certification included',
    ],
    tools: ['AWS Management Console', 'EC2', 'S3', 'IAM', 'VPC', 'CloudWatch', 'RDS', 'Lambda'],
    status: 'published',
    featured: true,
    sortOrder: 1,
    seoTitle: 'AWS Cloud Practitioner Certification Course in Hyderabad | COSS',
    seoDesc: 'Join COSS Cloud Solutions in Hyderabad for AWS Certified Cloud Practitioner training. Hands-on labs, certified trainers, 100% exam support. Enrol now!',
  },
  {
    title: 'Full Stack Java Developer Bootcamp',
    slug: 'full-stack-java-developer-bootcamp',
    description:
      'Transform into a job-ready Full Stack Java Developer with our intensive bootcamp. This program covers both frontend and backend development — from Core Java, Spring Boot, REST APIs, and Hibernate on the backend, to HTML, CSS, JavaScript, and React.js on the frontend. You will build 5+ real-world projects and deploy them to production during the course.\n\nSuitable for fresh graduates and working professionals looking to upskill into full-stack development roles.',
    excerpt:
      'Become a job-ready Full Stack Java Developer. Learn Core Java, Spring Boot, REST APIs, React.js and deploy real projects. 100% placement support included.',
    category: 'Programming & Full Stack',
    duration: '5 Months',
    mode: 'Hybrid',
    level: 'Beginner to Advanced',
    price: 35000,
    originalPrice: 45000,
    badge: 'High Placement',
    thumbnail: null,
    syllabus: [
      { week: 'Month 1', topic: 'Core Java & OOP', details: 'Variables, data types, OOP concepts, collections, exception handling, multithreading' },
      { week: 'Month 2', topic: 'Spring & Hibernate', details: 'Spring Boot, Spring MVC, Spring Security, Hibernate ORM, JPA, REST APIs' },
      { week: 'Month 3', topic: 'Frontend Development', details: 'HTML5, CSS3, JavaScript ES6+, Bootstrap, React.js basics, React Hooks' },
      { week: 'Month 4', topic: 'Database & DevOps', details: 'MySQL, MongoDB, Git, Docker basics, AWS EC2 deployment' },
      { week: 'Month 5', topic: 'Projects & Placements', details: '2 full-stack projects, code review, mock interviews, resume building, job referrals' },
    ],
    highlights: [
      '5+ real-world projects built',
      'Spring Boot + React.js combo',
      '100% placement support',
      'Industry expert mentors',
      'Resume & LinkedIn profile help',
      'Mock technical interviews',
    ],
    tools: ['Java', 'Spring Boot', 'Hibernate', 'React.js', 'MySQL', 'Git', 'Docker', 'AWS EC2', 'REST APIs'],
    status: 'published',
    featured: false,
    sortOrder: 2,
    seoTitle: 'Full Stack Java Developer Course in Hyderabad | COSS',
    seoDesc: 'Learn Full Stack Java development at COSS Hyderabad. Core Java, Spring Boot, React.js, real projects, and 100% placement support. Enrol today!',
  },
  {
    title: 'Ethical Hacking & Cyber Security Professional',
    slug: 'ethical-hacking-cyber-security-professional',
    description:
      'Launch your cyber security career with our hands-on Ethical Hacking course. Learn penetration testing, network security, vulnerability assessment, and incident response using industry tools like Kali Linux, Metasploit, Burp Suite, and Wireshark. The course prepares you for globally recognised certifications including CEH (Certified Ethical Hacker) and CompTIA Security+.\n\nAll lab sessions are conducted in a safe, legal environment simulating real-world attack scenarios.',
    excerpt:
      'Master ethical hacking, penetration testing, and cyber security. Prep for CEH certification with hands-on Kali Linux labs and real attack simulations in Hyderabad.',
    category: 'Cyber Security & Networking',
    duration: '3 Months',
    mode: 'Classroom',
    level: 'Intermediate',
    price: 22000,
    originalPrice: 30000,
    badge: 'CEH Prep',
    thumbnail: null,
    syllabus: [
      { week: 'Week 1-2', topic: 'Networking & Security Fundamentals', details: 'OSI model, TCP/IP, firewalls, VPNs, DNS, cryptography basics, security principles' },
      { week: 'Week 3-4', topic: 'Reconnaissance & Footprinting', details: 'OSINT, Google hacking, Shodan, Maltego, Nmap, social engineering techniques' },
      { week: 'Week 5-7', topic: 'Exploitation & Penetration Testing', details: 'Metasploit, Burp Suite, SQL injection, XSS, buffer overflows, privilege escalation' },
      { week: 'Week 8-10', topic: 'Network & Web Security', details: 'Wireless attacks, MITM, OWASP Top 10, web application testing, WAF bypass' },
      { week: 'Week 11-12', topic: 'CEH Exam Prep & Case Studies', details: 'Mock exams, real-world incident case studies, report writing, certification guidance' },
    ],
    highlights: [
      'CEH exam preparation included',
      'Kali Linux hands-on labs',
      'Real attack simulations',
      'Legal & ethical framework',
      'Industry-recognised certification',
      'SOC analyst career path guidance',
    ],
    tools: ['Kali Linux', 'Metasploit', 'Burp Suite', 'Wireshark', 'Nmap', 'Maltego', 'John the Ripper', 'Aircrack-ng'],
    status: 'published',
    featured: false,
    sortOrder: 3,
    seoTitle: 'Ethical Hacking & CEH Certification Course Hyderabad | COSS',
    seoDesc: 'Best ethical hacking course in Hyderabad at COSS. CEH preparation, Kali Linux labs, penetration testing. Enrol for the next batch today!',
  },
];

const blogPosts = [
  {
    title: 'Why AWS Cloud Certification Can Transform Your IT Career in 2025',
    slug: 'aws-cloud-certification-career-2025',
    excerpt:
      'AWS certifications are the most in-demand credentials in the IT job market. Discover why getting certified in 2025 can fast-track your career and the exact roadmap COSS recommends.',
    content: `## Why AWS Certification Matters in 2025

The cloud computing job market in India is booming, with over 2 lakh cloud-related vacancies expected by the end of 2025. AWS holds a **32% share** of the global cloud market, making it the single most-demanded cloud platform skill on job boards like Naukri, LinkedIn, and Indeed.

## The Certification That Opens Doors

The **AWS Certified Cloud Practitioner** is the ideal starting point. It validates your understanding of:

- Core AWS services (EC2, S3, RDS, VPC, Lambda)
- AWS pricing, billing, and support models
- Security and compliance in the AWS cloud
- Cloud architecture fundamentals

## Why Hyderabad Professionals Are Choosing AWS

Hyderabad is home to major tech parks including HITEC City, Gachibowli, and Madhapur — all hubs for MNCs like Amazon, Microsoft, Google, Deloitte, and Infosys. These companies actively hire AWS-certified professionals at premium salaries.

### Salary benchmarks (2025):
- Cloud Support Engineer: ₹4–8 LPA
- AWS Solutions Architect: ₹10–22 LPA
- Cloud DevOps Engineer: ₹8–18 LPA

## The COSS Advantage

At **COSS Cloud Solutions**, Dilsukhnagar and Ameerpet, Hyderabad, our AWS training program offers:

1. **Certified AWS trainers** with 10+ years of industry experience
2. **Hands-on AWS lab access** — no theoretical-only sessions
3. **Exam pass guarantee** — we refund your exam fee if you fail
4. **Batch flexibility** — weekday, weekend, and fast-track batches
5. **100% placement support** — resume review, mock interviews, referrals

## Getting Started

The AWS Certified Cloud Practitioner exam costs approximately $100 USD (₹8,300). COSS covers exam vouchers for students who complete the course.

**Ready to begin?** Book a free demo class at COSS — no commitment required.

---

*COSS Cloud Solutions is a leading IT training institute in Hyderabad with centres in Dilsukhnagar and Ameerpet. Call us: +91 88851 66007*
`,
    category: 'Cloud Computing',
    tags: ['AWS', 'Cloud Certification', 'IT Career', 'Hyderabad', 'Cloud Computing'],
    author: 'COSS Training Team',
    authorRole: 'AWS Certified Trainer',
    readTime: '5 min read',
    status: 'published',
    featured: true,
    seoTitle: 'AWS Cloud Certification Career Guide 2025 | COSS Hyderabad',
    seoDesc: 'Discover why AWS certification is the top IT career move in 2025. Salary insights, exam guide, and how COSS Hyderabad prepares you for success.',
    publishedAt: new Date(),
  },
  {
    title: 'DevOps Engineer Roadmap: From Beginner to Job-Ready in 6 Months',
    slug: 'devops-engineer-roadmap-beginner-to-job-ready',
    excerpt:
      'A structured, month-by-month DevOps learning roadmap covering Docker, Kubernetes, Jenkins, Terraform, and CI/CD pipelines — with the exact tools you need to land your first DevOps job.',
    content: `## The DevOps Engineer Roadmap (2025 Edition)

DevOps engineers are among the highest-paid IT professionals in India, with average salaries of ₹10–25 LPA in Hyderabad. The role combines software development, system administration, and cloud infrastructure into one powerful skill set.

## Month-by-Month Roadmap

### Month 1: Linux & Scripting Foundations
Before touching DevOps tools, master the OS that powers 96% of cloud servers.

- Linux command line (bash, vim, grep, awk, sed)
- Shell scripting for automation
- File systems, permissions, process management
- Networking basics (SSH, DNS, HTTP, firewalls)

### Month 2: Version Control & CI/CD Basics
- Git fundamentals (branching, merging, rebasing)
- GitHub/GitLab workflows
- Jenkins installation and pipeline creation
- Automated build and test pipelines

### Month 3: Containerization with Docker
- Docker architecture and core concepts
- Writing Dockerfiles and docker-compose
- Container networking and volumes
- Pushing images to Docker Hub

### Month 4: Kubernetes & Orchestration
- Kubernetes architecture (pods, deployments, services)
- kubectl commands and YAML manifests
- Helm charts for package management
- Horizontal pod autoscaling

### Month 5: Cloud & Infrastructure as Code
- AWS core services for DevOps (EC2, EKS, ECS, S3, RDS)
- Terraform for infrastructure provisioning
- Ansible for configuration management
- Monitoring with CloudWatch and Prometheus + Grafana

### Month 6: Real Projects + Job Search
- Build a complete CI/CD pipeline for a sample application
- Deploy to AWS using Terraform + Kubernetes
- Portfolio GitHub repository and README
- Mock technical interviews and resume optimization

## Tools You Must Know

| Category | Tools |
|----------|-------|
| CI/CD | Jenkins, GitHub Actions, GitLab CI |
| Containers | Docker, Kubernetes, Helm |
| IaC | Terraform, Ansible |
| Cloud | AWS, Azure (basics) |
| Monitoring | Prometheus, Grafana, ELK Stack |

## Why Train at COSS?

COSS Cloud Solutions in Hyderabad offers a dedicated **AWS DevOps course** that covers this entire roadmap in 4 months with:

- Daily hands-on lab sessions
- Real project work (not just theory)
- Industry mentor sessions
- Job placement assistance with 50+ hiring partners

---

*Contact COSS: +91 88851 66007 | info@cosscloudsol.com | Dilsukhnagar & Ameerpet, Hyderabad*
`,
    category: 'DevOps',
    tags: ['DevOps', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'AWS', 'Career Roadmap'],
    author: 'COSS Training Team',
    authorRole: 'DevOps Trainer',
    readTime: '7 min read',
    status: 'published',
    featured: false,
    seoTitle: 'DevOps Engineer Roadmap 2025 — Month-by-Month Guide | COSS',
    seoDesc: 'Complete DevOps roadmap from beginner to job-ready. Docker, Kubernetes, Jenkins, Terraform and AWS — learn at COSS Hyderabad in 4 months.',
    publishedAt: new Date(),
  },
  {
    title: 'Top 10 Reasons to Choose a Cyber Security Career in Hyderabad',
    slug: 'top-10-reasons-cyber-security-career-hyderabad',
    excerpt:
      'Cyber security is one of the fastest-growing sectors in India. From high salaries to global remote opportunities, here are 10 compelling reasons to start your cyber security career in Hyderabad today.',
    content: `## Cyber Security in Hyderabad: A Career That Protects the World

With cybercrime damages projected to cost the world **$10.5 trillion annually by 2025**, every organisation — from banks and hospitals to e-commerce and government — is hiring cyber security professionals. And Hyderabad is right at the centre of this boom.

## 10 Reasons to Start Your Cyber Security Career Now

### 1. Massive Talent Shortage
India faces a shortfall of **3 million cyber security professionals**. With demand far outpacing supply, skilled professionals are in an employer's market.

### 2. Premium Salaries
Entry-level cyber security analysts in Hyderabad earn ₹4–7 LPA. With 3–5 years of experience, SOC Analysts and Penetration Testers can earn ₹12–25 LPA.

### 3. Hyderabad's HITEC City Advantage
HITEC City is home to 1,500+ IT companies including Microsoft, Amazon, Google, Deloitte, KPMG, and Cyient — all of which have active cyber security teams and vacancies.

### 4. Global Certification = Global Opportunities
Certifications like **CEH, CompTIA Security+, OSCP, and CISSP** are globally recognised. Getting certified in Hyderabad opens remote jobs in the US, UK, and Europe.

### 5. Work-from-Home Opportunities
Over 40% of cyber security roles are now fully remote. Skilled SOC analysts and ethical hackers regularly work for international clients from India.

### 6. Diverse Career Paths
Cyber security is not just one job — it's an ecosystem:
- SOC Analyst
- Penetration Tester (Ethical Hacker)
- Cloud Security Engineer
- Incident Response Analyst
- Security Architect
- Malware Analyst

### 7. Exciting Day-to-Day Work
No two days look the same. You might analyse a phishing campaign in the morning, reverse-engineer malware in the afternoon, and present findings to the CISO in the evening.

### 8. Government & BFSI Demand
RBI, SEBI, CERT-In, and major banks (HDFC, SBI, ICICI) now mandate cyber security teams. Government contracts are high-paying and stable.

### 9. AI Is Not Replacing Cyber Security
Unlike many IT roles, cyber security actually gets more important as AI evolves — AI systems themselves need to be secured, and AI is used to detect new attack patterns.

### 10. You Protect People
At its core, cyber security is about protecting individuals, businesses, and critical infrastructure from harm. It is one of the most meaningful career paths in technology.

## Start Your Journey at COSS

**COSS Cloud Solutions** offers a 3-month Ethical Hacking & Cyber Security course in Dilsukhnagar and Ameerpet, Hyderabad. The course prepares you for:
- CEH (Certified Ethical Hacker) examination
- SOC Analyst roles
- Penetration testing positions

Book a **free demo class** today — no payment required upfront.

---

*📞 +91 88851 66007 | 📧 info@cosscloudsol.com | 📍 Dilsukhnagar & Ameerpet, Hyderabad*
`,
    category: 'Cyber Security',
    tags: ['Cyber Security', 'Ethical Hacking', 'CEH', 'SOC Analyst', 'IT Career', 'Hyderabad'],
    author: 'COSS Editorial Team',
    authorRole: 'Editorial Team',
    readTime: '6 min read',
    status: 'published',
    featured: false,
    seoTitle: 'Top 10 Reasons for Cyber Security Career in Hyderabad | COSS',
    seoDesc: 'Discover why cyber security is the best IT career choice in Hyderabad. High salaries, global demand, and CEH certification at COSS Cloud Solutions.',
    publishedAt: new Date(),
  },
];

async function main() {
  console.log('🌱  Seeding COSS content…\n');

  for (const course of courses) {
    const existing = await prisma.course.findUnique({ where: { slug: course.slug } });
    if (existing) {
      console.log(`⏭  Course already exists: ${course.slug}`);
      continue;
    }
    await prisma.course.create({ data: course });
    console.log(`✅  Created course: ${course.title}`);
  }

  console.log('');

  for (const post of blogPosts) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
    if (existing) {
      console.log(`⏭  Blog post already exists: ${post.slug}`);
      continue;
    }
    await prisma.blogPost.create({ data: post });
    console.log(`✅  Created blog post: ${post.title}`);
  }

  console.log('\n🎉  Seeding complete!');
}

main()
  .catch((err) => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
