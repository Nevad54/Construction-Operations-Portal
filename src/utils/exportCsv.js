// Utility for exporting arrays of objects to CSV files
// Usage: exportToCsv('filename.csv', dataArray);

export function exportToCsv(filename, rows) {
  if (!rows || !rows.length) return;

  // Derive header from first row's keys
  const header = Object.keys(rows[0]);

  const csvRows = [header.join(',')];

  for (const row of rows) {
    const values = header.map((key) => {
      let val = row[key] == null ? '' : row[key];
      if (typeof val === 'object') {
        // stringify objects/arrays
        try {
          val = JSON.stringify(val);
        } catch (_e) {
          val = String(val);
        }
      }
      val = String(val);
      // escape double quotes by doubling them
      if (val.includes('"')) {
        val = val.replace(/"/g, '""');
      }
      // wrap in quotes if it contains commas/newlines/quotes
      if (val.search(/,|\n|\r|"/) >= 0) {
        val = `"${val}"`;
      }
      return val;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  if (navigator.msSaveBlob) { // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
