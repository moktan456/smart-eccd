// SMART ECCD – Report Service
// PDF generation using Puppeteer (Phase 5)
// Falls back to JSON when ENABLE_PDF_REPORTS is false

const { BLOOM_COLORS } = require('../utils/constants');

/**
 * Generate a child PDF report using Puppeteer
 * Only runs when ENABLE_PDF_REPORTS=true
 *
 * @param {Object} reportData
 * @returns {Buffer} PDF buffer
 */
const generateChildPDF = async (reportData) => {
  if (process.env.ENABLE_PDF_REPORTS !== 'true') {
    throw new Error('PDF reports are not enabled. Set ENABLE_PDF_REPORTS=true in .env');
  }

  const puppeteer = require('puppeteer');
  const html = buildChildReportHTML(reportData);

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
  await browser.close();

  return pdf;
};

const buildChildReportHTML = (data) => {
  const { child, bloomProfile, performances, attendanceSummary, generatedAt } = data;
  const bloomRows = Object.entries(bloomProfile)
    .map(([level, score]) => `
      <tr>
        <td style="color:${BLOOM_COLORS[level]};font-weight:bold;">${level}</td>
        <td>
          <div style="background:#f0f0f0;border-radius:4px;height:12px;width:100%">
            <div style="background:${BLOOM_COLORS[level]};width:${score}%;height:12px;border-radius:4px;"></div>
          </div>
        </td>
        <td style="text-align:right">${score}%</td>
      </tr>
    `)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; padding: 20px; }
        h1 { color: #2c3e50; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .section { margin-bottom: 25px; }
        .section h2 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px; border-bottom: 1px solid #eee; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; color: white; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>SMART ECCD – Child Performance Report</h1>
          <p>${child.firstName} ${child.lastName} | Class: ${child.class?.name || 'N/A'} | Generated: ${new Date(generatedAt).toLocaleDateString()}</p>
        </div>
      </div>
      <div class="section">
        <h2>Bloom's Taxonomy Profile</h2>
        <table>${bloomRows}</table>
      </div>
      <div class="section">
        <h2>Attendance Summary</h2>
        <p>Present: ${attendanceSummary.PRESENT || 0} | Absent: ${attendanceSummary.ABSENT || 0} | Late: ${attendanceSummary.LATE || 0} | Excused: ${attendanceSummary.EXCUSED || 0}</p>
      </div>
    </body>
    </html>
  `;
};

module.exports = { generateChildPDF };
