import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate PDF for booking details
 * @param {Array} bookings - Array of booking objects
 * @param {String} fileName - Name of the PDF file (default: 'bookings.pdf')
 * @param {Object} options - Additional options like title, userName, etc.
 */
export const generateBookingsPDF = (bookings, fileName = 'bookings.pdf', options = {}) => {
  const doc = new jsPDF();
  
  // Add title
  const title = options.title || 'Booking Details';
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);
  
  // Add generated date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleString();
  doc.text(`Generated on: ${dateStr}`, 14, 28);
  
  // Add user info if provided
  if (options.userName) {
    doc.text(`Generated for: ${options.userName}`, 14, 34);
  }
  
  // Prepare table data
  const tableData = bookings.map((booking, index) => {
    const status = getStatusText(booking.status);
    const resourceName = booking.resourceName || booking.resourceId || 'N/A';
    const date = new Date(booking.bookingDate).toLocaleDateString();
    const time = `${booking.startTime} - ${booking.endTime}`;
    
    return [
      index + 1,
      resourceName,
      booking.purpose || 'N/A',
      date,
      time,
      status,
      booking.rejectionReason || '-'
    ];
  });
  
  // Define table columns
  const columns = [
    { header: '#', dataKey: 'no' },
    { header: 'Resource', dataKey: 'resource' },
    { header: 'Purpose', dataKey: 'purpose' },
    { header: 'Date', dataKey: 'date' },
    { header: 'Time', dataKey: 'time' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Remarks', dataKey: 'remarks' }
  ];
  
  // Add table with autoTable
  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: tableData,
    startY: options.userName ? 40 : 34,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246], // Blue
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    didDrawCell: (data) => {
      // Color code status column
      if (data.column.index === 5 && data.section === 'body') {
        const status = data.cell.raw;
        let color = [0, 0, 0];
        
        if (status === 'Applied') {
          color = [59, 130, 246]; // Blue
        } else if (status === 'Staff Approved') {
          color = [234, 179, 8]; // Yellow/Orange
        } else if (status === 'Admin Approved') {
          color = [34, 197, 94]; // Green
        } else if (status === 'Rejected') {
          color = [239, 68, 68]; // Red
        }
        
        doc.setTextColor(...color);
      }
    }
  });
  
  // Add footer with page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Add summary at the end
  const finalY = doc.lastAutoTable.finalY || 40;
  
  if (finalY < doc.internal.pageSize.getHeight() - 40) {
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', 14, finalY + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Bookings: ${bookings.length}`, 14, finalY + 17);
    
    // Count by status
    const statusCounts = bookings.reduce((acc, booking) => {
      const status = getStatusText(booking.status);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    let yPos = finalY + 24;
    Object.entries(statusCounts).forEach(([status, count]) => {
      doc.text(`${status}: ${count}`, 14, yPos);
      yPos += 7;
    });
  }
  
  // Save the PDF
  doc.save(fileName);
};

/**
 * Generate PDF for a single booking detail
 */
export const generateSingleBookingPDF = (booking, fileName = 'booking-detail.pdf') => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Booking Details', 14, 20);
  
  // Booking ID
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Booking ID: ${booking.id || 'N/A'}`, 14, 30);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);
  
  // Add a line
  doc.setLineWidth(0.5);
  doc.line(14, 40, 196, 40);
  
  // Booking Information
  let yPos = 50;
  const lineHeight = 8;
  
  const details = [
    { label: 'Resource', value: booking.resourceName || booking.resourceId || 'N/A' },
    { label: 'Purpose', value: booking.purpose || 'N/A' },
    { label: 'Booking Date', value: new Date(booking.bookingDate).toLocaleDateString() },
    { label: 'Start Time', value: booking.startTime },
    { label: 'End Time', value: booking.endTime },
    { label: 'Status', value: getStatusText(booking.status) },
  ];
  
  if (booking.userName) {
    details.unshift({ label: 'Booked By', value: booking.userName });
  }
  
  if (booking.userEmail) {
    details.push({ label: 'Email', value: booking.userEmail });
  }
  
  if (booking.userPhone) {
    details.push({ label: 'Phone', value: booking.userPhone });
  }
  
  if (booking.rejectionReason) {
    details.push({ label: 'Rejection Reason', value: booking.rejectionReason });
  }
  
  details.forEach(detail => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${detail.label}:`, 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(detail.value, 60, yPos);
    yPos += lineHeight;
  });
  
  // Save
  doc.save(fileName);
};

/**
 * Helper function to convert status enum to readable text
 */
const getStatusText = (status) => {
  const statusMap = {
    'APPLIED': 'Applied',
    'STAFF_APPROVED': 'Staff Approved',
    'ADMIN_APPROVED': 'Admin Approved',
    'REJECTED': 'Rejected'
  };
  return statusMap[status] || status;
};

export default {
  generateBookingsPDF,
  generateSingleBookingPDF
};
