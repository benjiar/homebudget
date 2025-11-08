/**
 * CSV Export Utilities
 */

export const convertToCSV = (data: any[], headers: string[]): string => {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row =>
        headers.map(header => {
            const value = row[header];
            // Handle values that contain commas, quotes, or newlines
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
        }).join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
};

export const downloadCSV = (csvContent: string, filename: string): void => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

export const generateReportFilename = (prefix: string, format: string = 'csv'): string => {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${prefix}_${timestamp}.${format}`;
};
