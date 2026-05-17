#!/usr/bin/env node
/**
 * COSS Cloud Solutions – WordPress Image Downloader
 * ================================================
 * Run this script ONCE from your project root:
 *
 *   node scripts/download-wp-images.mjs
 *
 * It downloads all original WordPress images into /public/wp-images/
 * so your Next.js site uses local copies instead of fetching from WP.
 *
 * Requirements: Node 18+ (uses built-in fetch)
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const WP_BASE = 'https://nextjs.cosscloudsol.com/wp-content/uploads';
const OUT_DIR = path.join(process.cwd(), 'public', 'wp-images');

// All image URLs extracted from your MDX content files
const IMAGES = [
  // ── Course Category Icons (2026/02) ────────────────────────────
  `${WP_BASE}/2026/02/Data-Analytics-BI.png`,
  `${WP_BASE}/2026/02/Data-Analytics-BI-1.png`,
  `${WP_BASE}/2026/02/Cloud-Computing-2.png`,
  `${WP_BASE}/2026/02/Cloud-Computing-3.png`,
  `${WP_BASE}/2026/02/Cloud-Computing-4-256x190.png`,
  `${WP_BASE}/2026/02/DevOps-Multi-Cloud-Courses.png`,
  `${WP_BASE}/2026/02/DevOps-and-Multi-Cloud.png`,
  `${WP_BASE}/2026/02/DevOps-Automation.png`,
  `${WP_BASE}/2026/02/Programming-Full-Stack-Development.png`,
  `${WP_BASE}/2026/02/Programming-Full-Stack-Development-2.png`,
  `${WP_BASE}/2026/02/Data-Engineering.png`,
  `${WP_BASE}/2026/02/Data-Engineering-1.png`,
  `${WP_BASE}/2026/02/Data-Engineering-2.png`,
  `${WP_BASE}/2026/02/Cyber-Security-Networking.png`,
  `${WP_BASE}/2026/02/Cyber-Security-Networking-1.png`,
  `${WP_BASE}/2026/02/Cyber-Security.png`,
  `${WP_BASE}/2026/02/ERP-CRM-Enterprise-Tools.png`,
  `${WP_BASE}/2026/02/ERP-CRM-Enterprise-Tools-1.png`,
  `${WP_BASE}/2026/02/ERP-CRM.png`,
  `${WP_BASE}/2026/02/Software-Testing-OS.png`,
  `${WP_BASE}/2026/02/Software-Testing-OS-1.png`,
  `${WP_BASE}/2026/02/Digital-Design.png`,
  `${WP_BASE}/2026/02/Digital-Design-Courses.png`,
  `${WP_BASE}/2026/02/Professional-Soft-Skills.png`,
  `${WP_BASE}/2026/02/Professional-Soft-Skills-Courses.png`,
  `${WP_BASE}/2026/02/IT-certification-courses.png`,
  `${WP_BASE}/2026/02/IT-Certification-Courses-2.png`,

  // ── Sub-course images ─────────────────────────────────────────
  `${WP_BASE}/2026/02/Data-Analytics-570x321.jpg`,
  `${WP_BASE}/2025/08/Data-Science-1-570x321.jpg`,
  `${WP_BASE}/2026/02/big-data-570x321.jpg`,
  `${WP_BASE}/2025/08/Machine-Learning-1.jpg`,
  `${WP_BASE}/2025/08/Artificial-intelligence-1-570x321.webp`,
  `${WP_BASE}/2025/08/Full-Stack-Power-BI-1-570x321.jpeg`,
  `${WP_BASE}/2025/08/SQL-MySQL-PostgreSQL-1-1.jpg`,
  `${WP_BASE}/2024/11/AWS-Cloud-Training-Institute.jpg`,
  `${WP_BASE}/2024/11/Azure-Cloud-Training-Institute-image-banner.jpg`,
  `${WP_BASE}/2025/01/Google-Cloud-Training-scaled.jpg`,
  `${WP_BASE}/2026/02/Multi-Cloud-Engineer.jpg`,
  `${WP_BASE}/2026/02/Multi-Cloud-with-DevOps.jpg`,
  `${WP_BASE}/2024/11/AWS-DevOps-Training-in-Hyderabad.jpg`,
  `${WP_BASE}/2024/12/AWS-DevOps-Training-Image-Banner.jpg`,
  `${WP_BASE}/2025/09/AzureDevops-Training-Hyderabad.png`,
  `${WP_BASE}/2024/11/DevOps-Training-Image-Banner.jpg`,
  `${WP_BASE}/2026/02/Python-Full-Stack.jpg`,
  `${WP_BASE}/2026/02/Java-Full-Stack.jpg`,
  `${WP_BASE}/2025/03/Python-Training-Institute-in-Dilsukhnagar-Hyderabad.jpg`,
  `${WP_BASE}/2025/02/Java.jpg`,
  `${WP_BASE}/2026/02/Programming.png`,
  `${WP_BASE}/2025/09/Azure-Data-Engineer-Training-in-Hyderabad.jpg`,
  `${WP_BASE}/2026/02/Cloud-Data-Engineer-570x321.jpg`,
  `${WP_BASE}/2025/03/Best-Cyber-Security-Institute-in-Dilsukhnagar-Hyderabad.png`,
  `${WP_BASE}/2026/02/CCNA-Networking.jpg`,
  `${WP_BASE}/2025/09/SAP-FICO-Training-at-COSS-Cloud-Solutions-1.jpg`,
  `${WP_BASE}/2026/02/Oracle-Fusion-Cloud-HCM.jpg`,
  `${WP_BASE}/2025/03/Coss-Cloud-Solutions-Salesforce-Training-Hyderabad.jpg`,
  `${WP_BASE}/2026/02/ERP-CRM.png`,
  `${WP_BASE}/2025/01/Linux-Institute-in-Hyderabad.jpg`,
  `${WP_BASE}/2026/02/Testing-Tools.jpg`,
  `${WP_BASE}/2025/08/BECOME-A-CERTIFIED-REDLINUX-ON-RED-HAT-ENTERPRISE-LINUX-1-800x800.jpg`,
  `${WP_BASE}/2025/03/Digital-Marketing.jpg`,
  `${WP_BASE}/2026/02/UI-UX-Design.jpg`,
  `${WP_BASE}/2025/04/Best-Digital-Marketing-Institute-in-Hyderabad.png`,
  `${WP_BASE}/2025/08/Spoken-English-Institute-in-Hyderabad-COSS-Cloud-Solutions-scaled.jpg`,
  `${WP_BASE}/2025/08/Best-Communication-Skills-Institute-in-Hyderabad-COSS-Cloud-Solutions-scaled.jpg`,
  `${WP_BASE}/2026/02/MS-Office.jpg`,
  `${WP_BASE}/2025/04/Best-Tally-Institute-in-Dilsukhnagar-Hyderabad.jpg`,

  // ── Site-wide images ─────────────────────────────────────────
  `${WP_BASE}/2026/02/Corporate-Training.jpg`,
  `${WP_BASE}/2026/02/Training-Built-Around-Career-Outcomes-Banner.jpg`,
  `${WP_BASE}/2026/02/learn.png`,
  `${WP_BASE}/2026/02/build.png`,
  `${WP_BASE}/2026/02/Get-Placed.png`,
  `${WP_BASE}/2026/01/enroll.png`,
  `${WP_BASE}/2026/02/Placement-Assistance.png`,
  `${WP_BASE}/2026/02/Resume-Building-1.jpg`,
  `${WP_BASE}/2026/02/Mock-Inter.png`,
  `${WP_BASE}/2026/02/Job-Referrals-1.jpg`,
  `${WP_BASE}/2026/02/Next-Batch-Filling-Fast-1.png`,
  `${WP_BASE}/2026/02/Industry-Expert-Trainers-2.png`,
  `${WP_BASE}/2026/02/Practical-Training.png`,
  `${WP_BASE}/2026/02/Live-Projects.png`,
  `${WP_BASE}/2026/01/Coss-Cloud-Solutions-Theme-Backgroud.jpg`,
  `${WP_BASE}/2026/02/footer-backgrounde.jpg`,

  // ── Company logos ─────────────────────────────────────────────
  `${WP_BASE}/2021/12/google.jpg`,
  `${WP_BASE}/2021/12/ibm.jpg`,
  `${WP_BASE}/2021/12/oracle.jpg`,
  `${WP_BASE}/2021/12/wipro.jpg`,
  `${WP_BASE}/2021/12/tcs.jpg`,
  `${WP_BASE}/2021/12/hcl.jpg`,
  `${WP_BASE}/2021/12/tech_mahindra.jpg`,
  `${WP_BASE}/2021/12/airtel.jpg`,
  `${WP_BASE}/2021/12/genpact.jpg`,
  `${WP_BASE}/2021/12/synopsys.jpg`,
  `${WP_BASE}/2021/12/sonata.jpg`,
  `${WP_BASE}/2021/12/adp.jpg`,
  `${WP_BASE}/2021/12/jpmorgan-chase-co-logo-200x80.jpg`,
  `${WP_BASE}/2021/12/wells_fargo.jpg`,
  `${WP_BASE}/2021/12/ericsson.jpg`,
  `${WP_BASE}/2021/12/hsbc.jpg`,
  `${WP_BASE}/2021/12/bank_of_america.jpg`,
];

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    // Preserve folder structure: uploads/2026/02/filename.png
    const relativePath = urlObj.pathname.replace('/wp-content/uploads/', '');
    const localPath = path.join(OUT_DIR, relativePath);
    const dir = path.dirname(localPath);

    if (fs.existsSync(localPath)) {
      process.stdout.write('.');
      return resolve({ url, localPath, status: 'exists' });
    }

    fs.mkdirSync(dir, { recursive: true });

    const file = fs.createWriteStream(localPath);
    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Referer': 'https://nextjs.cosscloudsol.com/',
      },
      timeout: 15000,
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(localPath);
        return downloadFile(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        process.stdout.write('✗');
        return resolve({ url, status: 'failed', code: res.statusCode });
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        process.stdout.write('✓');
        resolve({ url, localPath, status: 'downloaded' });
      });
    });

    req.on('error', (err) => {
      file.close();
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      process.stdout.write('✗');
      resolve({ url, status: 'error', error: err.message });
    });
    req.on('timeout', () => { req.destroy(); });
  });
}

async function main() {
  console.log('📥 Coss Cloud Solutions – WordPress Image Downloader');
  console.log(`📁 Output: ${OUT_DIR}`);
  console.log(`🔢 Total images: ${IMAGES.length}\n`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const results = [];
  // Download in batches of 5 to avoid rate limiting
  for (let i = 0; i < IMAGES.length; i += 5) {
    const batch = IMAGES.slice(i, i + 5);
    const batchResults = await Promise.all(batch.map(downloadFile));
    results.push(...batchResults);
    await new Promise(r => setTimeout(r, 300)); // polite delay
  }

  console.log('\n\n📊 Summary:');
  const downloaded = results.filter(r => r.status === 'downloaded').length;
  const exists     = results.filter(r => r.status === 'exists').length;
  const failed     = results.filter(r => r.status === 'failed' || r.status === 'error').length;

  console.log(`  ✓ Downloaded: ${downloaded}`);
  console.log(`  ○ Already existed: ${exists}`);
  console.log(`  ✗ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed URLs:');
    results.filter(r => r.status !== 'downloaded' && r.status !== 'exists').forEach(r => {
      console.log(`  ${r.url} → ${r.status} ${r.code || r.error || ''}`);
    });
  }

  console.log('\n✅ Done! Images are in /public/wp-images/');
  console.log('💡 Update src/lib/wpImages.ts to use /wp-images/ paths for production.');
}

main().catch(console.error);
