import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { logger } from './logger';

/**
 * PDF Generator Utility
 * Generates professional-looking PDFs for timesheets
 */

interface TimesheetPDFData {
  id: string;
  date: string;
  title?: string;
  notes?: string;
  status: string;
  createdByUser: {
    firstName: string;
    lastName: string;
  };
  timeEntries: Array<{
    employee: {
      firstName: string;
      lastName: string;
      classification: string;
    };
    project: {
      name: string;
      projectNumber: string;
    };
    hoursWorked: number;
    workType: string;
    description?: string;
    taskPerformed?: string;
  }>;
}

/**
 * Generate and stream a timesheet PDF
 */
export const generateTimesheetPDF = (data: TimesheetPDFData, res: Response): void => {
  try {
    // Create a new PDF document
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=timesheet-${data.date}.pdf`
    );

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add company header
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Electrical Construction Timesheet', { align: 'center' });

    doc.moveDown(0.5);

    // Add timesheet info
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Date: ${formatDateForDisplay(data.date)}`, 50, 120)
      .text(`Status: ${data.status}`, 50, 135)
      .text(`Created By: ${data.createdByUser.firstName} ${data.createdByUser.lastName}`, 50, 150);

    if (data.title) {
      doc.text(`Title: ${data.title}`, 50, 165);
    }

    // Draw a line
    doc
      .moveTo(50, 190)
      .lineTo(562, 190)
      .stroke();

    // Add notes section if present
    let yPosition = 205;
    if (data.notes) {
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Notes:', 50, yPosition);
      
      yPosition += 15;
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(data.notes, 50, yPosition, { width: 512 });
      
      yPosition += 30;
      
      // Draw another line
      doc
        .moveTo(50, yPosition)
        .lineTo(562, yPosition)
        .stroke();
      
      yPosition += 15;
    }

    // Group time entries by employee
    const entriesByEmployee = groupEntriesByEmployee(data.timeEntries);

    // Add time entries table
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Time Entries', 50, yPosition);

    yPosition += 20;

    // Render each employee's entries
    Object.entries(entriesByEmployee).forEach(([employeeName, entries]) => {
      // Check if we need a new page
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      // Employee header
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(employeeName, 50, yPosition);

      yPosition += 15;

      // Table headers
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Project', 50, yPosition)
        .text('Hours', 250, yPosition)
        .text('Work Type', 310, yPosition)
        .text('Task', 390, yPosition);

      yPosition += 15;

      // Draw line under headers
      doc
        .moveTo(50, yPosition)
        .lineTo(562, yPosition)
        .stroke();

      yPosition += 5;

      // Entry rows
      doc.fontSize(9).font('Helvetica');
      
      entries.forEach((entry: any) => {
        // Check if we need a new page
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        // Project
        doc.text(
          `${entry.project.name} (${entry.project.projectNumber})`,
          50,
          yPosition,
          { width: 190, ellipsis: true }
        );

        // Hours
        doc.text(entry.hoursWorked.toString(), 250, yPosition);

        // Work Type
        doc.text(entry.workType || 'Regular', 310, yPosition, { width: 70 });

        // Task
        doc.text(
          entry.taskPerformed || entry.description || '-',
          390,
          yPosition,
          { width: 172, ellipsis: true }
        );

        yPosition += 20;
      });

      // Employee total
      const employeeTotal = entries.reduce(
        (sum: number, e: any) => sum + e.hoursWorked,
        0
      );

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`Total Hours: ${employeeTotal.toFixed(2)}`, 50, yPosition);

      yPosition += 25;

      // Draw separator line
      doc
        .moveTo(50, yPosition)
        .lineTo(562, yPosition)
        .stroke();

      yPosition += 15;
    });

    // Add grand total
    const grandTotal = data.timeEntries.reduce(
      (sum, entry) => sum + entry.hoursWorked,
      0
    );

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`Grand Total: ${grandTotal.toFixed(2)} hours`, 50, yPosition);

    // Add footer to all pages BEFORE finalizing
    const range = doc.bufferedPageRange();
    const pageCount = range.count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Add page number at bottom (within page boundaries)
      // Letter size: 792 points tall, bottom margin at 50, so use 720-730
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          `Page ${i + 1} of ${pageCount} | Generated on ${new Date().toLocaleString()}`,
          50,
          722,
          { align: 'center', width: 512, lineBreak: false }
        );
    }

    // Finalize the PDF
    doc.end();

    logger.info('Timesheet PDF generated successfully', { timesheetId: data.id });
  } catch (error: any) {
    logger.error('Error generating PDF', { error: error.message });
    throw new Error('Failed to generate PDF');
  }
};

/**
 * Classification hierarchy for sorting
 */
const classificationOrder: Record<string, number> = {
  'SUPERVISOR': 1,
  'PROJECT_MANAGER': 2,
  'GENERAL_FOREMAN': 3,
  'FOREMAN': 4,
  'JOURNEYMAN': 5,
  'APPRENTICE': 6,
};

/**
 * Get classification sort order
 */
function getClassificationOrder(classification: string): number {
  return classificationOrder[classification.toUpperCase()] || 999;
}

/**
 * Group time entries by employee and sort by classification
 */
function groupEntriesByEmployee(entries: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  entries.forEach((entry) => {
    const employeeName = `${entry.employee.firstName} ${entry.employee.lastName} (${entry.employee.classification})`;
    
    if (!grouped[employeeName]) {
      grouped[employeeName] = [];
    }
    
    grouped[employeeName].push(entry);
  });

  // Sort employees by classification
  const sortedGrouped: Record<string, any[]> = {};
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    // Extract classification from the employee name string
    const entriesA = grouped[a];
    const entriesB = grouped[b];
    
    // Defensive checks
    if (!entriesA || entriesA.length === 0) return 1;
    if (!entriesB || entriesB.length === 0) return -1;
    
    const classA = entriesA[0]?.employee?.classification || '';
    const classB = entriesB[0]?.employee?.classification || '';
    return getClassificationOrder(classA) - getClassificationOrder(classB);
  });

  sortedKeys.forEach(key => {
    const entries = grouped[key];
    if (entries) {
      sortedGrouped[key] = entries;
    }
  });

  return sortedGrouped;
}

/**
 * Format date for display
 */
function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

