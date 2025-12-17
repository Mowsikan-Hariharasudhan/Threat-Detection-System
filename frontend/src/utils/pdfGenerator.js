import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to get colors based on risk level
const getLevelColor = (level) => {
    switch (level?.toUpperCase()) {
        case 'CRITICAL': return [220, 38, 38]; // Red
        case 'HIGH': return [220, 38, 38];
        case 'MEDIUM': return [202, 138, 4]; // Yellow/Orange
        case 'LOW': return [22, 163, 74]; // Green
        default: return [100, 116, 139]; // Grey
    }
};

export const generateGlobalReport = (threats) => {
    const doc = new jsPDF();

    // --- Branding & Header ---
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text("Security Threat Report", 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text("Confidential Security Audit", 196, 20, { align: 'right' });

    // --- Summary Statistics ---
    const total = threats.length;
    const critical = threats.filter(t => t.risk_level === 'CRITICAL').length;
    const high = threats.filter(t => t.risk_level === 'HIGH').length;

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Executive Summary", 14, 50);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Threats Detected: ${total}`, 14, 60);
    doc.text(`Critical Incidents: ${critical}`, 14, 66);
    doc.text(`High Priority Risks: ${high}`, 14, 72);

    // --- Data Table ---
    const tableData = threats.map(t => [
        new Date(t.timestamp).toLocaleString(),
        t.risk_level,
        t.scenario?.type || 'Unknown',
        `${t.risk_score}/100`,
        `${t.confidence}%`
    ]);

    autoTable(doc, {
        startY: 80,
        head: [['Timestamp', 'Risk Level', 'Threat Type', 'Score', 'Conf.']],
        body: tableData,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 3,
            textColor: [30, 41, 59]
        },
        headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { cellWidth: 45 },
            1: { cellWidth: 25, fontStyle: 'bold' },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 20, halign: 'center' }
        },
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 1) {
                const level = data.cell.raw;
                const color = getLevelColor(level);
                data.cell.styles.textColor = color;
            }
        }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, 196, 285, { align: 'right' });
        doc.text('AI-Powered Threat Detection System', 14, 285);
    }

    doc.save('threat-audit-report.pdf');
};

export const generateSingleThreatReport = (threat) => {
    const doc = new jsPDF();
    const primaryColor = [15, 23, 42]; // Dark Slate
    const accentColor = getLevelColor(threat.risk_level);

    // --- Header Background ---
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 50, 'F');

    // --- Title & Severity Tag ---
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text("Incident Verification Report", 14, 25);

    // Severity Badge
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.roundedRect(160, 15, 36, 12, 3, 3, 'F');
    doc.setFontSize(10);
    doc.text(threat.risk_level, 178, 22, { align: 'center' });

    // Sub-header Info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Incident ID: ${threat.id}`, 14, 38);
    doc.text(`Detected: ${new Date(threat.timestamp).toLocaleString()}`, 14, 44);

    // --- Threat Details Section ---
    let yPos = 65;

    // Threat Type Title
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(threat.scenario?.type || "Unknown Threat", 14, yPos);

    // Description Box
    yPos += 10;
    doc.setFillColor(248, 250, 252); // Light gray bg
    doc.setDrawColor(226, 232, 240); // Border color
    doc.roundedRect(14, yPos, 182, 30, 2, 2, 'FD');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 80, 100);
    const desc = doc.splitTextToSize(threat.scenario?.description || "No detailed description available.", 170);
    doc.text(desc, 20, yPos + 10);

    // --- Metrics Section (Risk Score & Confidence) ---
    yPos += 45;

    // Risk Score Box
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(1);
    doc.roundedRect(14, yPos, 85, 40, 3, 3, 'S');

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Risk Score", 56.5, yPos + 12, { align: 'center' });

    doc.setFontSize(28);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`${threat.risk_score}`, 56.5, yPos + 28, { align: 'center' });

    // Confidence Box
    doc.setDrawColor(100);
    doc.roundedRect(111, yPos, 85, 40, 3, 3, 'S');

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text("AI Confidence", 153.5, yPos + 12, { align: 'center' });

    doc.setFontSize(28);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`${threat.confidence}%`, 153.5, yPos + 28, { align: 'center' });

    // --- Risk Factors ---
    yPos += 55;
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Risk Factors Analysis", 14, yPos);

    yPos += 10;
    const factors = threat.risk_factors || {};
    const factorsData = Object.entries(factors).map(([key, value]) => [
        key.replace(/_/g, ' ').toUpperCase(),
        `${value}/5`
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Factor', 'Severity']],
        body: factorsData,
        theme: 'striped',
        margin: { left: 14, right: 110 }, // Only take up half width
        styles: { fontSize: 10 },
        headStyles: { fillColor: [51, 65, 85] }
    });

    // --- Recommendations ---
    // Calculate startY based on table height, or fixed if simple
    // We'll put recommendations on the right side or below depending on space. 
    // Let's put them below for cleaner flow.
    yPos = doc.lastAutoTable.finalY + 20;

    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text("Recommended Actions", 14, yPos);

    yPos += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const recs = threat.recommendations || ["No specific recommendations provided."];
    recs.forEach((rec) => {
        doc.setTextColor(220, 38, 38); // Bullet color
        doc.text("•", 14, yPos);
        doc.setTextColor(70, 80, 100); // Text color
        doc.text(rec, 20, yPos);
        yPos += 8;
    });

    // Footer with Watermark
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(60);
    doc.setFont('helvetica', 'bold');
    doc.text("CONFIDENTIAL", 105, 150, { align: 'center', angle: 45, renderingMode: 'fill' });

    // Bottom Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Report generated by AI-Powered Threat Detection System`, 14, 285);
    doc.text("Strictly for authorized personnel only.", 196, 285, { align: 'right' });

    doc.save(`incident-report-${threat.id.slice(0, 8)}.pdf`);
};
