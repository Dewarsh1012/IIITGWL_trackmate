import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { authenticate, requireRole } from '../middleware/auth';
import { Incident } from '../models/Incident';
import { Zone } from '../models/Zone';

const router = Router();

router.post('/audit', authenticate, requireRole('authority', 'admin'), async (req, res) => {
    try {
        const { startDate, endDate, sections = ['incidents', 'zones'] } = req.body;

        const query: any = {};
        if (startDate && endDate) {
            query.created_at = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (startDate) {
            query.created_at = { $gte: new Date(startDate) };
        } else if (endDate) {
            query.created_at = { $lte: new Date(endDate) };
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=TrackMate_Audit_Report_${new Date().toISOString().split('T')[0]}.pdf`);

        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        doc.font('Helvetica-Bold').fontSize(24).text('TrackMate OPUS', { align: 'center' });
        doc.fontSize(16).text('Safety Command Audit Report', { align: 'center' });
        doc.moveDown(2);

        doc.font('Helvetica').fontSize(12).text(`Generated On: ${new Date().toLocaleString()}`);
        if (startDate || endDate) {
            doc.text(`Reporting Period: ${startDate ? new Date(startDate).toLocaleDateString() : 'Beginning'} - ${endDate ? new Date(endDate).toLocaleDateString() : 'Now'}`);
        }

        doc.moveDown();
        doc.font('Helvetica').fontSize(10).text(`Requested By User ID: ${(req as any).user.userId}`);
        doc.moveDown(2);

        if (sections.includes('incidents')) {
            doc.font('Helvetica-Bold').fontSize(18).text('Incident Log', { underline: true });
            doc.moveDown();

            const incidents = await Incident.find(query).sort({ created_at: -1 });

            if (incidents.length === 0) {
                doc.font('Helvetica').fontSize(12).text('No incidents found in this period.');
            } else {
                incidents.forEach((inc: any, i: number) => {
                    doc.font('Helvetica-Bold').fontSize(12).text(`${i + 1}. ${inc.title || 'Untitled'} [${inc.incident_type}]`);
                    doc.font('Helvetica').fontSize(10)
                        .text(`Severity: ${inc.severity || 'N/A'} | Status: ${inc.status || 'N/A'}`)
                        .text(`Time: ${new Date(inc.created_at || inc.createdAt).toLocaleString()}`)
                        .text(`Desc: ${inc.description || 'N/A'}`);
                    doc.moveDown(0.5);
                });
            }
            doc.moveDown();
        }

        if (sections.includes('zones')) {
            doc.addPage();
            doc.font('Helvetica-Bold').fontSize(18).text('Active Safety Zones', { underline: true });
            doc.moveDown();

            const zones = await Zone.find().sort({ created_at: -1 });

            if (zones.length === 0) {
                doc.font('Helvetica').fontSize(12).text('No active zones found.');
            } else {
                zones.forEach((z: any, i: number) => {
                    doc.font('Helvetica-Bold').fontSize(12).text(`${i + 1}. ${z.name}`);
                    doc.font('Helvetica').fontSize(10)
                        .text(`Risk Level: ${z.risk_level} | Radius: ${z.radius_meters}m`)
                        .text(`Description: ${z.description || 'N/A'}`);
                    doc.moveDown(0.5);
                });
            }
        }

        // Finalize PDF file
        doc.end();

    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Failed to generate report' });
        }
    }
});

export default router;
