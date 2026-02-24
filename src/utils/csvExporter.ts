/**
 * Converts an array of objects to a CSV string.
 * @param data Array of objects.
 * @returns A string in CSV format.
 */
function convertToCSV(data: any[]): string {
    if (!data || data.length === 0) {
        return '';
    }

    const replacer = (key: string, value: any) => value === null ? '' : value;
    const header = Object.keys(data[0]);
    
    // Sanitize headers to remove complex objects/arrays
    const simpleHeaders = header.filter(h => typeof data[0][h] !== 'object' || data[0][h] === null);

    const csv = [
        simpleHeaders.join(','), // header row
        ...data.map(row => simpleHeaders.map(fieldName => {
            let fieldData = row[fieldName];
            // Stringify JSON fields to keep them in one column
            if (typeof fieldData === 'object' && fieldData !== null) {
                fieldData = JSON.stringify(fieldData);
            }
            // Escape commas and quotes
            const stringifiedData = String(fieldData).replace(/"/g, '""');
            return `"${stringifiedData}"`;
        }).join(','))
    ].join('\r\n');

    return csv;
}

/**
 * Triggers a browser download for a CSV file.
 * @param filename The desired filename for the downloaded file.
 * @param data The array of objects to be converted and downloaded.
 */
export function exportToCsv(filename: string, data: any[]) {
    if (!data || data.length === 0) {
        console.warn("Export to CSV failed: No data provided.");
        return;
    }

    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    if (link.download !== undefined) { // feature detection
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}