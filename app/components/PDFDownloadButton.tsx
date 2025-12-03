'use client';

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from './InvoicePDF';

interface PDFDownloadButtonProps {
  data: any;
  fileName: string;
  disabled?: boolean;
}

const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({ data, fileName, disabled }) => {
  return (
    <PDFDownloadLink
      document={<InvoicePDF data={data} />}
      fileName={fileName}
    >
      {({ loading: pdfLoading }) => (
        <button 
          className="bg-slate-100 text-slate-600 hover:bg-slate-100 rounded-lg px-4 py-2"
          disabled={pdfLoading || disabled}
        >
          {pdfLoading ? 'Generating PDF...' : 'Preview PDF'}
        </button>
      )}
    </PDFDownloadLink>
  );
};

export default PDFDownloadButton; 






















