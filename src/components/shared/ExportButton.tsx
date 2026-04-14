import { useState } from 'react';
import { Button } from '../ui/button';
import { Download, Loader2 } from 'lucide-react';
import { exportToCSV, exportMarksToPDF } from '../../lib/export';

interface ExportButtonProps {
  type: 'csv' | 'pdf';
  filename: string;
  data: any[];
  headers?: string[]; // for CSV
  studentName?: string; // for PDF
  variant?: 'outline' | 'default' | 'secondary';
}

export function ExportButton({ type, filename, data, headers, studentName, variant = 'outline' }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // simulate slight delay for UI feedback if generation is instant
      await new Promise(r => setTimeout(r, 300));
      if (type === 'csv') {
        exportToCSV(filename, headers || [], data);
      } else if (type === 'pdf') {
        exportMarksToPDF(data, studentName || 'Student');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant={variant} onClick={handleExport} disabled={loading || data.length === 0} size="sm">
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Export {type.toUpperCase()}
    </Button>
  );
}
