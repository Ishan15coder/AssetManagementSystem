/**
 * Downloads a standard CSV file directly in the user's browser.
 *
 * @param filename - The name of the file (without .csv extension)
 * @param headers - Array of string column headers
 * @param rows - 2D array representing data rows
 */
export function downloadCSV(filename: string, headers: string[], rows: any[][]) {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => {
        if (cell === null || cell === undefined) return '""';
        return `"${String(cell).replace(/"/g, '""')}"`;
      }).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Legacy exportToCSV for array of objects (used in ReportsAnalytics)
 */
export function exportToCSV(filename: string, data: Record<string, any>[]) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((item) => headers.map((h) => item[h]));
  downloadCSV(filename.replace(".csv", ""), headers, rows);
}

