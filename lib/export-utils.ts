export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Escape commas and quotes
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        .join(","),
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function exportToExcel(data: any[], filename: string) {
  if (data.length === 0) return
  
  try {
    // Dynamic import of xlsx library to avoid SSR issues
    const XLSX = await import('xlsx');
    
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Create Blob and download
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xlsx`;
    link.click();
    
    // Cleanup
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    // Fallback to CSV
    exportToCSV(data, filename);
  }
}

export async function exportToPDF(
  data: any[], 
  filename: string, 
  includeCharts = false,
  chartElements?: HTMLElement[]
) {
  try {
    // Dynamic import of jspdf libraries to avoid SSR issues
    const jsPDF = (await import('jspdf')).default;
    await import('jspdf-autotable');
    
    // Initialize PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add title
    doc.setFontSize(18);
    doc.text(filename, 14, 15);
    
    // Add timestamp
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
    
    let yPos = 30;
    
    // Add charts if needed
    if (includeCharts && chartElements && chartElements.length > 0) {
      for (const element of chartElements) {
        try {
          // Import html-to-image dynamically
          const htmlToImage = await import('html-to-image');
          
          // Convert chart to PNG
          const chartImage = await htmlToImage.toPng(element, { quality: 0.95 });
          
          // Add chart image to PDF
          const imgWidth = 180; // mm
          const imgHeight = 90; // mm
          
          doc.addImage(chartImage, 'PNG', 14, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 10;
          
          // Add a new page if we're running out of space
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }
        } catch (error) {
          console.error('Error converting chart to image:', error);
        }
      }
    }
    
    // Add table of data
    if (data.length > 0) {
      // Add a new page if there were charts
      if (includeCharts && chartElements && chartElements.length > 0) {
        doc.addPage();
        yPos = 20;
      }
      
      // Create table headers and rows
      const headers = Object.keys(data[0]);
      const rows = data.map(item => headers.map(key => item[key]));
      
      // @ts-ignore - jspdf-autotable extends jsPDF prototype
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: yPos,
        margin: { top: 10 },
        styles: { overflow: 'linebreak', cellWidth: 'wrap' },
        columnStyles: { 
          // Make sure date columns have enough width
          2: { cellWidth: 25 } 
        },
        didDrawPage: (data: any) => {
          // Footer with page numbers
          doc.setFontSize(10);
          doc.text(
            `Page ${data.pageNumber} of ${doc.getNumberOfPages()}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
        }
      });
    }
    
    // Save PDF
    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    // Fallback to CSV
    exportToCSV(data, filename);
  }
}

// Helper function to capture chart elements
export async function captureChartElements(selectors: string[]): Promise<HTMLElement[]> {
  const elements: HTMLElement[] = [];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      elements.push(element);
    }
  }
  
  return elements;
}
