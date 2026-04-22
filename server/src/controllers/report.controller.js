// SMART ECCD – Report Controller
// PDF report generation using Puppeteer (when enabled)

const prisma = require('../config/db');
const bloomService = require('../services/bloom.service');

/**
 * GET /api/reports/child/:id – CM | SA
 * Generate child performance PDF report data
 */
const getChildReport = async (req, res, next) => {
  try {
    const childId = req.params.id;

    const [child, bloomProfile, performances, attendance] = await Promise.all([
      prisma.child.findUnique({
        where: { id: childId },
        include: {
          class: { include: { teacher: { select: { name: true } } } },
          parents: { include: { parent: { select: { name: true, email: true } } } },
        },
      }),
      bloomService.getChildBloomProfile(childId),
      prisma.childPerformance.findMany({
        where: { childId },
        include: { record: { include: { assignment: { include: { activity: { select: { title: true, bloomLevels: true } } } } } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.attendance.groupBy({
        by: ['status'],
        where: { childId },
        _count: true,
      }),
    ]);

    if (!child) return res.status(404).json({ success: false, message: 'Child not found.' });

    const reportData = {
      generatedAt: new Date().toISOString(),
      child,
      bloomProfile,
      performances,
      attendanceSummary: Object.fromEntries(attendance.map((a) => [a.status, a._count])),
    };

    // If PDF generation is enabled, return PDF
    if (process.env.ENABLE_PDF_REPORTS === 'true') {
      const { generateChildPDF } = require('../services/report.service');
      const pdfBuffer = await generateChildPDF(reportData);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="child-report-${childId}.pdf"`);
      return res.send(pdfBuffer);
    }

    // Otherwise return JSON
    res.json({ success: true, data: reportData });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reports/center – CM | SA
 * Center-wide performance report
 */
const getCenterReport = async (req, res, next) => {
  try {
    const centerId = req.user.centerId || req.query.centerId;
    const { month } = req.query;

    const [classes, bloomCoverage, flaggedChildren] = await Promise.all([
      prisma.class.findMany({
        where: { centerId, isActive: true },
        include: {
          _count: { select: { children: true } },
          teacher: { select: { name: true } },
        },
      }),
      bloomService.getCenterBloomCoverage(centerId, month),
      prisma.childPerformance.findMany({
        where: { isFlagged: true, child: { centerId } },
        include: { child: { select: { firstName: true, lastName: true, class: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    res.json({
      success: true,
      data: { generatedAt: new Date().toISOString(), classes, bloomCoverage, flaggedChildren },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getChildReport, getCenterReport };
