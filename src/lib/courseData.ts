export interface CourseItem {
  name: string;
  duration: string;
  level: string;
  highlights: string[];
  fee?: string;
}

export interface CourseCategoryData {
  name: string;
  slug: string;
  emoji: string;
  tagline: string;
  description: string;
  courses: CourseItem[];
  whyLearn: string[];
  tools: string[];
  careers: string[];
  faqs: { q: string; a: string }[];
}

const cloudCourses: CourseCategoryData = {
  name: 'Cloud Computing',
  slug: 'cloud-computing',
  emoji: '☁️',
  tagline: 'Master AWS, Azure & Google Cloud',
  description: 'Become a certified cloud professional with hands-on training in AWS, Microsoft Azure, and Google Cloud Platform. Our industry-led curriculum prepares you for real-world cloud roles with practical labs and globally recognized certifications.',
  courses: [
    { name: 'AWS Cloud Training', duration: '2–3 Months', level: 'Beginner to Advanced', highlights: ['EC2, S3, RDS, Lambda', 'VPC & Security Groups', 'AWS Solutions Architect', 'Hands-on Labs'], fee: '₹ 15,000–25,000' },
    { name: 'Microsoft Azure Training', duration: '2–3 Months', level: 'Beginner to Advanced', highlights: ['Azure Virtual Machines', 'Azure Active Directory', 'Azure DevOps', 'AZ-900 / AZ-104 Certification'], fee: '₹ 15,000–25,000' },
    { name: 'Google Cloud Training', duration: '2 Months', level: 'Intermediate', highlights: ['GCP Core Services', 'BigQuery & Dataflow', 'Kubernetes Engine', 'Associate Cloud Engineer'], fee: '₹ 12,000–20,000' },
    { name: 'Multi-Cloud Engineer', duration: '4 Months', level: 'Advanced', highlights: ['AWS + Azure + GCP', 'Cloud Migration', 'Cost Optimization', 'Multi-Cloud Architecture'], fee: '₹ 25,000–40,000' },
    { name: 'Cloud Architecture', duration: '3 Months', level: 'Advanced', highlights: ['Solution Design', 'High Availability', 'DR & Backup Strategies', 'Cost Management'], fee: '₹ 20,000–35,000' },
  ],
  whyLearn: ['Highest paying IT domain globally', 'Cloud jobs growing 30%+ year over year', 'Remote work opportunities worldwide', 'Industry certifications from AWS, Microsoft, Google'],
  tools: ['AWS Console', 'Azure Portal', 'Google Cloud Console', 'Terraform', 'CloudFormation', 'Ansible'],
  careers: ['Cloud Engineer', 'Solutions Architect', 'Cloud Administrator', 'DevOps Engineer', 'Cloud Consultant'],
  faqs: [
    { q: 'Do I need prior IT experience for cloud courses?', a: 'Our beginner batches start from scratch. Basic computer knowledge is sufficient.' },
    { q: 'Which cloud certification should I start with?', a: 'AWS Solutions Architect Associate or Azure AZ-900 are ideal starting points.' },
    { q: 'Are lab sessions included?', a: 'Yes, all cloud courses include hands-on labs on real cloud environments.' },
  ],
};

const devopsCourses: CourseCategoryData = {
  name: 'DevOps & Multi-Cloud',
  slug: 'devops-multi-cloud',
  emoji: '⚙️',
  tagline: 'Master CI/CD, Docker & Kubernetes',
  description: 'Become a DevOps Engineer with comprehensive training in CI/CD pipelines, containerization, infrastructure automation and multi-cloud deployments. Learn the tools and practices used by top tech companies worldwide.',
  courses: [
    { name: 'AWS DevOps', duration: '3 Months', level: 'Intermediate', highlights: ['CodePipeline & CodeDeploy', 'CloudFormation', 'ECS & EKS', 'Monitoring with CloudWatch'] },
    { name: 'Azure DevOps', duration: '3 Months', level: 'Intermediate', highlights: ['Azure Pipelines', 'Boards & Repos', 'Azure Kubernetes Service', 'ARM Templates'] },
    { name: 'Docker & Kubernetes', duration: '2 Months', level: 'Intermediate', highlights: ['Container Fundamentals', 'Docker Compose', 'Kubernetes Orchestration', 'Helm Charts'] },
    { name: 'Terraform & IaC', duration: '1.5 Months', level: 'Advanced', highlights: ['Infrastructure as Code', 'Multi-cloud Provisioning', 'State Management', 'Modules & Workspaces'] },
    { name: 'Jenkins & CI/CD', duration: '1 Month', level: 'Intermediate', highlights: ['Pipeline as Code', 'Integration with Git', 'Build Automation', 'Deployment Strategies'] },
    { name: 'Full DevOps Bootcamp', duration: '5 Months', level: 'Beginner to Advanced', highlights: ['Git & GitHub', 'Linux Admin', 'Docker + K8s', 'AWS/Azure + Jenkins + Terraform'] },
  ],
  whyLearn: ['DevOps engineers earn 40–60% more than traditional developers', 'Fastest-growing engineering role in 2024–25', 'Automation skills are universally in demand', 'Bridge between dev and ops teams'],
  tools: ['Jenkins', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Git', 'SonarQube', 'Prometheus', 'Grafana'],
  careers: ['DevOps Engineer', 'Site Reliability Engineer', 'Cloud Infrastructure Engineer', 'Platform Engineer', 'Release Manager'],
  faqs: [
    { q: 'Should I learn Linux before DevOps?', a: 'Yes, basic Linux knowledge is recommended. We cover Linux essentials in our bootcamp.' },
    { q: 'Is Docker and Kubernetes mandatory?', a: 'Absolutely — they are the backbone of modern DevOps. All our programs include them.' },
    { q: 'What certifications can I get?', a: 'AWS DevOps Professional, Azure DevOps Expert, CKA (Kubernetes) are popular choices.' },
  ],
};

const programmingCourses: CourseCategoryData = {
  name: 'Programming & Full Stack Development',
  slug: 'programming-full-stack',
  emoji: '💻',
  tagline: 'Build Full-Stack Web Applications',
  description: 'Learn to build end-to-end web applications with Java, Python, React, Node.js and more. Our full-stack programs cover both front-end and back-end development with real-world project experience.',
  courses: [
    { name: 'Java Full Stack', duration: '5 Months', level: 'Beginner to Advanced', highlights: ['Core Java & Advanced Java', 'Spring Boot & Microservices', 'React.js Frontend', 'MySQL & MongoDB'] },
    { name: 'Python Full Stack', duration: '4 Months', level: 'Beginner to Advanced', highlights: ['Python Fundamentals', 'Django / Flask', 'React.js', 'REST APIs & Databases'] },
    { name: 'MERN Stack', duration: '4 Months', level: 'Intermediate', highlights: ['MongoDB', 'Express.js', 'React.js', 'Node.js'] },
    { name: 'React.js', duration: '2 Months', level: 'Intermediate', highlights: ['Component Architecture', 'React Hooks', 'Redux', 'API Integration'] },
    { name: 'Core Java', duration: '2 Months', level: 'Beginner', highlights: ['OOPs Concepts', 'Collections & Generics', 'Exception Handling', 'JDBC'] },
  ],
  whyLearn: ['Web development is the backbone of every digital business', 'High demand for full-stack developers worldwide', 'Ability to build complete products independently', 'Freelancing and startup opportunities'],
  tools: ['VS Code', 'IntelliJ IDEA', 'Git & GitHub', 'Postman', 'MySQL Workbench', 'MongoDB Compass', 'npm/yarn'],
  careers: ['Full Stack Developer', 'Java Developer', 'Python Developer', 'React Developer', 'Backend Engineer', 'Software Engineer'],
  faqs: [
    { q: 'Which language should I start with — Java or Python?', a: 'Both are excellent. Java is widely used in enterprise; Python is popular in AI/data. Our trainers help you decide.' },
    { q: 'Will I build real projects?', a: 'Yes — every course includes 2–3 real-world projects that you can showcase in your portfolio.' },
    { q: 'Is this course suitable for non-IT graduates?', a: 'Absolutely. Many of our successful students are from non-IT backgrounds.' },
  ],
};

const dataEngCourses: CourseCategoryData = {
  name: 'Data Engineering',
  slug: 'data-engineering',
  emoji: '🔧',
  tagline: 'Build Scalable Data Pipelines',
  description: 'Master the tools and technologies used to build, maintain and optimize large-scale data infrastructure. Learn Azure Data Engineering, Spark, Hadoop, and ETL pipeline development.',
  courses: [
    { name: 'Azure Data Engineer', duration: '3 Months', level: 'Intermediate', highlights: ['Azure Data Factory', 'Azure Synapse Analytics', 'Databricks', 'DP-203 Certification'] },
    { name: 'Apache Spark & PySpark', duration: '2 Months', level: 'Intermediate', highlights: ['Spark Architecture', 'PySpark DataFrames', 'Streaming', 'Spark ML'] },
    { name: 'Hadoop Ecosystem', duration: '2 Months', level: 'Intermediate', highlights: ['HDFS & MapReduce', 'Hive & Pig', 'HBase', 'Sqoop & Flume'] },
    { name: 'ETL & Data Pipelines', duration: '1.5 Months', level: 'Intermediate', highlights: ['ETL Design Patterns', 'SSIS & Informatica', 'Airflow', 'Pipeline Orchestration'] },
  ],
  whyLearn: ['Data engineering is among the highest-paid IT roles', 'Every company needs engineers to manage data at scale', 'Bridge between raw data and insights', 'Growing demand in fintech, healthcare, and e-commerce'],
  tools: ['Azure Data Factory', 'Databricks', 'Apache Spark', 'Hadoop', 'Airflow', 'dbt', 'Kafka'],
  careers: ['Data Engineer', 'Azure Data Engineer', 'Big Data Engineer', 'ETL Developer', 'Data Pipeline Engineer'],
  faqs: [
    { q: 'Do I need to know Python for data engineering?', a: 'Yes, basic Python is essential. We include a Python primer in the course.' },
    { q: 'Is DP-203 covered in the Azure Data Engineer course?', a: 'Yes, the curriculum is aligned with the DP-203 exam objectives.' },
  ],
};

const cyberCourses: CourseCategoryData = {
  name: 'Cyber Security & Networking',
  slug: 'cyber-security',
  emoji: '🔒',
  tagline: 'Become a Certified Security Expert',
  description: 'Learn ethical hacking, penetration testing, SOC analysis and network security with hands-on labs. Gain the skills needed to protect organizations from modern cyber threats.',
  courses: [
    { name: 'Ethical Hacking & CEH', duration: '3 Months', level: 'Intermediate', highlights: ['Penetration Testing', 'Network Scanning', 'Vulnerability Assessment', 'CEH Certification'] },
    { name: 'SOC Analyst', duration: '2 Months', level: 'Beginner to Intermediate', highlights: ['SIEM Tools', 'Incident Response', 'Threat Intelligence', 'Log Analysis'] },
    { name: 'CCNA Networking', duration: '2 Months', level: 'Beginner', highlights: ['Network Fundamentals', 'Routing & Switching', 'VLANs', 'CCNA Certification'] },
    { name: 'Network Security', duration: '2 Months', level: 'Intermediate', highlights: ['Firewall Configuration', 'VPN Setup', 'IDS/IPS', 'Security Policies'] },
  ],
  whyLearn: ['Cyber attacks are increasing — security talent is scarce', 'High-paying roles in banking, government, and IT', 'Work as a freelance penetration tester', 'Globally recognized certifications'],
  tools: ['Kali Linux', 'Metasploit', 'Wireshark', 'Nmap', 'Splunk', 'Burp Suite', 'Nessus'],
  careers: ['Ethical Hacker', 'Penetration Tester', 'SOC Analyst', 'Network Security Engineer', 'CISO', 'Security Consultant'],
  faqs: [
    { q: 'Is ethical hacking legal?', a: 'Ethical hacking is completely legal when done with proper authorization. Our course covers legal frameworks too.' },
    { q: 'What are the prerequisites for cyber security?', a: 'Basic networking and OS knowledge. We provide foundational modules in the course.' },
  ],
};

const erpCourses: CourseCategoryData = {
  name: 'ERP, CRM & Enterprise Tools',
  slug: 'erp-crm-enterprise-tools',
  emoji: '🏢',
  tagline: 'Master SAP, Salesforce & Oracle',
  description: 'Learn industry-standard enterprise platforms used by Fortune 500 companies. Our ERP/CRM training covers SAP, Salesforce, Oracle Fusion HCM and business process automation.',
  courses: [
    { name: 'SAP FICO', duration: '3 Months', level: 'Beginner to Advanced', highlights: ['Financial Accounting', 'Controlling Module', 'SAP S/4HANA', 'Real-time Configuration'] },
    { name: 'Salesforce CRM', duration: '2 Months', level: 'Beginner', highlights: ['Salesforce Admin', 'Sales Cloud', 'Service Cloud', 'Salesforce Certification'] },
    { name: 'Oracle Fusion HCM', duration: '2.5 Months', level: 'Intermediate', highlights: ['HR Management', 'Payroll & Benefits', 'Workforce Management', 'Oracle Cloud'] },
    { name: 'SAP HR', duration: '2 Months', level: 'Beginner to Intermediate', highlights: ['Personnel Management', 'Payroll in SAP', 'Org Management', 'Time Management'] },
  ],
  whyLearn: ['SAP & Salesforce skills command premium salaries', 'Enterprise tools are used in 90% of large companies', 'Limited talent pool means better career opportunities', 'Remote and consulting opportunities worldwide'],
  tools: ['SAP S/4HANA', 'Salesforce Lightning', 'Oracle HCM Cloud', 'MS Dynamics', 'ServiceNow'],
  careers: ['SAP Consultant', 'Salesforce Admin/Developer', 'Oracle HCM Consultant', 'ERP Analyst', 'Business Analyst'],
  faqs: [
    { q: 'Do I need a finance background for SAP FICO?', a: 'Basic accounting knowledge helps but is not mandatory. We cover the basics in our course.' },
    { q: 'Can I get a job after Salesforce training?', a: 'Yes, Salesforce certified professionals have very high placement rates in our alumni network.' },
  ],
};

const testingCourses: CourseCategoryData = {
  name: 'Software Testing & OS',
  slug: 'software-testing-os',
  emoji: '🧪',
  tagline: 'QA, Automation & Linux Administration',
  description: 'Master software quality assurance, test automation with Selenium, and Linux system administration. Build the skills to ensure software quality and manage enterprise Linux environments.',
  courses: [
    { name: 'Manual Testing', duration: '1.5 Months', level: 'Beginner', highlights: ['SDLC & STLC', 'Test Case Design', 'Bug Reporting', 'Agile/Scrum'] },
    { name: 'Selenium Automation', duration: '2 Months', level: 'Intermediate', highlights: ['Selenium WebDriver', 'Java/Python with Selenium', 'TestNG / PyTest', 'CI/CD Integration'] },
    { name: 'Linux Administration', duration: '2 Months', level: 'Beginner to Intermediate', highlights: ['Linux Commands', 'Shell Scripting', 'User Management', 'Server Administration'] },
    { name: 'API Testing', duration: '1 Month', level: 'Intermediate', highlights: ['REST & SOAP APIs', 'Postman', 'REST Assured', 'JSON/XML Parsing'] },
  ],
  whyLearn: ['QA engineers are in high demand at every software company', 'Linux is fundamental for cloud and DevOps roles', 'Automation testing multiplies your productivity', 'Lower entry barrier compared to development roles'],
  tools: ['Selenium', 'JIRA', 'TestNG', 'Postman', 'Jenkins', 'Linux Terminal', 'Git', 'Maven'],
  careers: ['QA Engineer', 'Automation Test Engineer', 'Linux System Admin', 'SDET', 'DevOps Engineer'],
  faqs: [
    { q: 'Is coding required for automation testing?', a: 'Basic Java or Python is needed. We include a programming primer in the automation course.' },
    { q: 'Is Linux training useful for non-developers?', a: 'Absolutely — it is essential for cloud, networking, and DevOps careers.' },
  ],
};

const digitalCourses: CourseCategoryData = {
  name: 'Digital & Design',
  slug: 'digital-design',
  emoji: '🎨',
  tagline: 'Digital Marketing & UI/UX Design',
  description: 'Learn digital marketing, SEO, social media management, and UI/UX design. Build skills to grow businesses online and create beautiful user experiences.',
  courses: [
    { name: 'Digital Marketing', duration: '2.5 Months', level: 'Beginner', highlights: ['SEO & Google Ads', 'Social Media Marketing', 'Email Marketing', 'Google Analytics'] },
    { name: 'UI/UX Design', duration: '2 Months', level: 'Beginner', highlights: ['Wireframing & Prototyping', 'Figma & Adobe XD', 'User Research', 'Design Systems'] },
    { name: 'Graphic Design', duration: '1.5 Months', level: 'Beginner', highlights: ['Adobe Photoshop', 'Illustrator', 'Canva', 'Brand Identity'] },
    { name: 'SEO & Content Marketing', duration: '1.5 Months', level: 'Beginner to Intermediate', highlights: ['On-page & Off-page SEO', 'Content Strategy', 'Link Building', 'SEO Audits'] },
  ],
  whyLearn: ['Every business needs a digital presence', 'Freelancing opportunities with global clients', 'Combine creativity with technology', 'Low investment, high return career choice'],
  tools: ['Google Ads', 'Meta Ads Manager', 'Figma', 'Adobe Creative Suite', 'Semrush', 'Ahrefs', 'Canva'],
  careers: ['Digital Marketing Executive', 'SEO Specialist', 'UI/UX Designer', 'Social Media Manager', 'Content Strategist'],
  faqs: [
    { q: 'Is a design degree required for UI/UX?', a: 'No. Anyone with an eye for aesthetics and willingness to learn can become a UI/UX designer.' },
    { q: 'Can I do freelancing after digital marketing training?', a: 'Yes, many of our students work as freelancers or start their own agencies.' },
  ],
};

const softSkillsCourses: CourseCategoryData = {
  name: 'Professional & Soft Skills',
  slug: 'professional-soft-skills',
  emoji: '🎯',
  tagline: 'Communication, MS Office & English',
  description: 'Build the professional skills that complement your technical expertise. Our courses in MS Office, Spoken English, and Communication Skills prepare you for workplace success.',
  courses: [
    { name: 'MS Office (Excel, Word, PPT)', duration: '1.5 Months', level: 'Beginner', highlights: ['Excel Formulas & Pivot Tables', 'Word Processing', 'PowerPoint Presentations', 'Excel Macros & VBA'] },
    { name: 'Spoken English', duration: '2 Months', level: 'Beginner', highlights: ['Grammar & Pronunciation', 'Business Communication', 'Group Discussion', 'Interview Preparation'] },
    { name: 'Communication Skills', duration: '1 Month', level: 'Beginner', highlights: ['Public Speaking', 'Business Writing', 'Presentation Skills', 'Body Language'] },
    { name: 'Tally ERP', duration: '1.5 Months', level: 'Beginner', highlights: ['GST Accounting', 'Payroll Management', 'Inventory Management', 'TDS & Reports'] },
  ],
  whyLearn: ['Soft skills are essential for career growth', 'MS Office is required in virtually every job', 'English fluency opens global career doors', 'Tally skills are must-have for accounting roles'],
  tools: ['MS Excel', 'MS Word', 'PowerPoint', 'Tally ERP 9', 'Google Workspace'],
  careers: ['Administrative Executive', 'Accountant', 'Data Entry Operator', 'Office Manager', 'HR Executive', 'Customer Service'],
  faqs: [
    { q: 'Is Tally useful in today\'s market?', a: 'Absolutely. Tally is the most widely used accounting software in India for SMEs.' },
    { q: 'Can students from regional medium benefit from spoken English?', a: 'Yes, this course is specifically designed for students who want to improve their English communication.' },
  ],
};

const dataAnalyticsCourses: CourseCategoryData = {
  name: 'Data, Analytics & BI',
  slug: 'data-analytics-bi',
  emoji: '📊',
  tagline: 'Data Science, AI, ML & Business Intelligence',
  description: 'Master data science, machine learning, AI, Power BI, Tableau and analytics. Learn to extract insights from data and drive business decisions with cutting-edge tools.',
  courses: [
    { name: 'Data Science', duration: '5 Months', level: 'Beginner to Advanced', highlights: ['Python for Data Science', 'Machine Learning', 'Deep Learning', 'NLP & Computer Vision'] },
    { name: 'Machine Learning', duration: '3 Months', level: 'Intermediate', highlights: ['Supervised & Unsupervised ML', 'Scikit-learn', 'Model Evaluation', 'Feature Engineering'] },
    { name: 'Artificial Intelligence (AI)', duration: '4 Months', level: 'Intermediate to Advanced', highlights: ['Neural Networks', 'TensorFlow & PyTorch', 'Generative AI', 'AI Applications'] },
    { name: 'Power BI', duration: '1.5 Months', level: 'Beginner', highlights: ['Data Modeling', 'DAX Measures', 'Interactive Dashboards', 'Power Query'] },
    { name: 'Full Stack Power BI', duration: '3 Months', level: 'Beginner to Advanced', highlights: ['Power BI + SQL + Excel', 'Data Warehousing', 'Paginated Reports', 'Power BI Service'] },
    { name: 'Azure Data Analyst', duration: '2 Months', level: 'Intermediate', highlights: ['Azure Synapse', 'Power BI Integration', 'DP-100 Prep', 'Data Visualization'] },
  ],
  whyLearn: ['Data science is the #1 most in-demand job globally', 'AI skills are the future of every industry', 'Power BI is used in 90% of Fortune 500 companies', 'Salary packages of ₹6–25 LPA for freshers'],
  tools: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'Power BI', 'Tableau', 'SQL', 'Azure ML'],
  careers: ['Data Scientist', 'ML Engineer', 'AI Engineer', 'Business Intelligence Analyst', 'Data Analyst', 'Power BI Developer'],
  faqs: [
    { q: 'Do I need a math background for data science?', a: 'Basic mathematics helps but is not a strict requirement. We cover statistics as part of the curriculum.' },
    { q: 'Is Power BI difficult to learn?', a: 'Not at all. Power BI is one of the easiest BI tools with a drag-and-drop interface. Beginners pick it up quickly.' },
    { q: 'What is the difference between Data Science and AI?', a: 'Data Science focuses on analysis and modelling; AI is a broader field including robotics, NLP and neural networks. Both overlap significantly.' },
  ],
};

export const courseData: Record<string, CourseCategoryData> = {
  'cloud-computing': cloudCourses,
  'devops-multi-cloud': devopsCourses,
  'programming-full-stack-development': programmingCourses,
  'programming-full-stack': programmingCourses,
  'data-engineering': dataEngCourses,
  'cyber-security-networking': cyberCourses,
  'cyber-security': cyberCourses,
  'erp-crm-enterprise-tools': erpCourses,
  'software-testing-os': testingCourses,
  'digital-design': digitalCourses,
  'professional-soft-skills': softSkillsCourses,
  'data-analytics-bi': dataAnalyticsCourses,
};
