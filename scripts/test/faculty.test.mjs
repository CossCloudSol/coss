// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseName, demoLabel, initialsOf, trackOf, matchCourse, parseTeaches, withoutHonorific } from '../../src/lib/faculty.ts';

test('name is split for the demo button; the stored name itself is never rewritten', () => {
  assert.deepEqual(parseName('Mr. Tharun Kumar Moluguri'), { honorific: 'Mr.', rest: 'Tharun Kumar Moluguri', first: 'Tharun' });
  assert.equal(demoLabel('Mr. Srikanth'), 'Demo with Mr. Srikanth');
  assert.equal(demoLabel('Mrs. Lakshmi Devi'), 'Demo with Mrs. Lakshmi');
  assert.equal(demoLabel('Dr Anitha Rao'), 'Demo with Dr. Anitha');
  assert.equal(demoLabel('Tharun Kumar Moluguri'), 'Demo with Tharun', 'no honorific stored: none is invented');
  assert.equal(demoLabel('K. Ramesh'), 'Demo with Ramesh', 'an initial is not a first name');
});

test('initials skip the honorific', () => {
  assert.equal(initialsOf('Mr. Ramesh Rudrapati'), 'RR');
  assert.equal(initialsOf('Mr. Mahender'), 'MA');
});

test('tracks come from the admin category, then the title', () => {
  assert.equal(trackOf('Cloud & DevOps', ''), 'cloud');
  assert.equal(trackOf(null, 'Lead Trainer - Multi Cloud ( AWS / Azure ) With DevOps & Linux'), 'cloud');
  assert.equal(trackOf(null, 'Lead Trainer - Red Hat Linux'), 'linux');
  assert.equal(trackOf(null, 'Lead Trainer - Data Science & Data Analytics'), 'ai-data');
  assert.equal(trackOf(null, 'Lead Trainer - AI FullStack ( Generative Ai, Agentic Ai, Prompt Engineering'), 'ai-data');
  assert.equal(trackOf(null, 'Lead Trainer - Cyber Security'), 'cyber');
  assert.equal(trackOf(null, 'Lead Trainer - Digital Marketing / Performance Marketing'), 'marketing');
  assert.equal(trackOf(null, 'Placement Coordinator'), 'hr');
  assert.equal(trackOf(null, 'Spoken English'), 'other');
});

// The admin's Teaches text for three trainers, as stored on the live /faculty page (11 Oct 2026).
const ADITYA =
  'Teaches: SEO, Local SEO, Keyword Research, On-Page & Off-Page SEO, Google Ads, PPC, Meta Ads, Facebook & Instagram Marketing, Social Media Management, YouTube Marketing & SEO, Content Marketing, Email Marketing, WhatsApp Marketing, Lead Generation, Google Analytics 4, Google Tag Manager, Google Business Profile, Canva, WordPress, Performance Marketing, Conversion Rate Optimization, Marketing Automation, AI & Generative AI Marketing Tools, Campaign Management, Competitor Analysis, Reporting & Analytics.  Teaching Approach: Hands-on practical training, live campaign demonstrations, real-time projects, assignments, case studies, analytics & reporting, lead-generation exercises, campaign optimization, and job/interview-oriented preparation.';
const MAHENDER =
  'Teaches: Python, SQL, Advanced Excel, Statistics, Data Cleaning & Preprocessing, EDA, Pandas, NumPy, Data Visualization, Power BI, Tableau, Machine Learning, Deep Learning, AI, Generative AI, Predictive Analytics, Feature Engineering, Model Building & Evaluation, Business Intelligence, Dashboard Development, ETL, Data Engineering, and MLOps.  Teaching Approach: Hands-on practical training with real-time datasets, live demonstrations, assignments, case studies, dashboards, machine learning projects, business problem-solving, assessments, and interview-oriented preparation, helping learners develop job-ready Data Science and Data Analytics skills.';
const RAMESH =
  'Teaches: Artificial Intelligence, Generative AI, Machine Learning, Deep Learning, LLMs, Prompt Engineering, AI Tools, OpenAI APIs, RAG, Vector Databases, LangChain, AI Agents, Agentic AI, Chatbot Development, NLP, Computer Vision, AI Automation, AI API Integration, Model Fine-Tuning, AI Workflows, AI Data Analysis, AI-Powered Application Development, AI Security, Responsible AI, and AI Cloud Deployment.  Teaching Approach: Practical, hands-on training with live AI tools, real-world use cases, prompt engineering exercises, chatbot and AI-agent projects, API integration, automation workflows, RAG applications, assessments, and project-based learning focused on job-ready AI skills.';

for (const [who, text, count, first, last, approachStart] of [
  ['Aditya', ADITYA, 26, 'SEO', 'Reporting & Analytics', 'Hands-on practical training'],
  ['Mahender', MAHENDER, 23, 'Python', 'MLOps', 'Hands-on practical training with real-time datasets'],
  ['Ramesh', RAMESH, 25, 'Artificial Intelligence', 'AI Cloud Deployment', 'Practical, hands-on training'],
]) {
  test(`TEACHES text of ${who}: label stripped, list split into short topics, approach kept as a paragraph`, () => {
    const { topics, approach } = parseTeaches(text);
    assert.equal(topics.length, count);
    assert.equal(topics[0], first);
    assert.equal(topics[topics.length - 1], last);
    assert.ok(approach?.startsWith(approachStart), 'the approach paragraph is separate');
    for (const t of topics) {
      assert.ok(!/^teaches/i.test(t) && !/teaching approach/i.test(t), `label left in "${t}"`);
      assert.ok(!/\.$/.test(t) && !/^and\s/i.test(t), `"${t}" has a trailing stop or a leading "and"`);
      assert.ok(t.split(/\s+/).length <= 10 && !/[.:]\s/.test(t), `"${t}" looks like a sentence`);
    }
    assert.ok(!topics.some((t) => /hands-on practical training|interview-oriented/i.test(t)), 'approach text is never a chip');
    assert.equal(new Set(topics.map((t) => t.toLowerCase())).size, topics.length, 'no duplicates');
  });
}

test('TEACHES parsing edge cases: semicolons, filler, duplicates, no label, no approach, markdown', () => {
  assert.deepEqual(parseTeaches('Teaches: Linux; Shell scripting, and Ansible, etc.').topics, ['Linux', 'Shell scripting', 'Ansible']);
  assert.deepEqual(parseTeaches('HRIS, HR Operations, HR Operations,  ,and ').topics, ['HRIS', 'HR Operations']);
  assert.equal(parseTeaches('HRIS, HRMS').approach, null);
  assert.deepEqual(parseTeaches(null), { topics: [], approach: null });
  // A long markdown description yields no chip that is a sentence, and its approach still separates.
  const md = '### Multi-Cloud DevOps - Topic-Wise Teaching  **1. AWS Cloud** Teaches AWS infrastructure, EC2, VPC, IAM, S3, Load Balancing, Auto Scaling, CloudWatch, RDS, and cloud security with hands-on implementation.  **Teaching Approach:** Instructor-led sessions combined with **live demonstrations, hands-on labs**.';
  const r = parseTeaches(md);
  assert.deepEqual(r.topics, [], 'a markdown description is not a list: no chips');
  assert.equal(r.approach, 'Instructor-led sessions combined with live demonstrations, hands-on labs .'.replace(' .', '.'));

});

test('a TEACHES chip links only when it names a published course', () => {
  const courses = [
    { title: 'Artificial Intelligence (AI) Course', url: '/artificial-intelligence-training-institute-in-hyderabad' },
    { title: 'AWS DevOps Training in Hyderabad', url: '/aws-devops-training-institute-in-hyderabad' },
    { title: 'Data Science', url: '/data-science' },
  ];
  assert.equal(matchCourse('Artificial Intelligence', courses)?.url, '/artificial-intelligence-training-institute-in-hyderabad');
  assert.equal(matchCourse('aws devops', courses)?.url, '/aws-devops-training-institute-in-hyderabad');
  assert.equal(matchCourse('Data Science', courses)?.url, '/data-science');
  for (const none of ['RAG', 'Generative AI', 'Python', 'Data', '']) assert.equal(matchCourse(none, courses), null, none);
  // Ramesh's real list against the courses above: only "Artificial Intelligence" is a course.
  const linked = parseTeaches(RAMESH).topics.filter((t) => matchCourse(t, courses));
  assert.deepEqual(linked, ['Artificial Intelligence']);
});

test('the trainers without an honorific are listed for the client', () => {
  assert.deepEqual(withoutHonorific([{ name: 'Mr. Aditya' }, { name: 'Tharun Kumar Moluguri' }]), ['Tharun Kumar Moluguri']);
});

test('page source: no selection checkbox, no inline long bio, drawer + demo form wired', () => {
  const view = fs.readFileSync(new URL('../../src/components/faculty/FacultyView.tsx', import.meta.url), 'utf8');
  assert.ok(!/type="checkbox"/.test(view) && !/line-clamp/.test(view));
  assert.ok(!/>Teaches</.test(view.slice(view.indexOf('<article'), view.indexOf('</article>'))), 'no Teaches section on the card');
  assert.match(view, /data-open-profile/);
  assert.match(view, /demoLabel\(t\.name\)/);
  assert.match(view, /years industry/);
});
