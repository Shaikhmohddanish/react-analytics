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
  // For now, export as CSV since we don't have xlsx library
  // In a real implementation, you'd use a library like xlsx
  exportToCSV(data, filename)
}

export async function exportToPDF(data: any[], filename: string, includeCharts = false) {
  // For now, export as CSV since we don't have PDF library
  // In a real implementation, you'd use a library like jsPDF
  exportToCSV(data, filename)
}
