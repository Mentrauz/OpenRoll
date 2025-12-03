import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
  },
  container: {
    border: '1pt solid black',
    height: '100%',
  },
  header: {
    borderBottom: '1pt solid black',
    padding: 8,
  },
  headerText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  companyName: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
    marginVertical: 2,
  },
  companyInfo: {
    fontSize: 10,
    textAlign: 'center',
    borderBottom: '1pt solid black',
    padding: 2,
  },
  topSection: {
    flexDirection: 'row',
    borderBottom: '1pt solid black',
  },
  leftSection: {
    width: '60%',
    borderRight: '1pt solid black',
  },
  rightSection: {
    width: '40%',
  },
  detailRow: {
    borderBottom: '1pt solid black',
    padding: 4,
  },
  monthRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid black',
    padding: 4,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1pt solid black',
    padding: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid black',
    padding: 4,
    minHeight: 20,
  },
  slNo: {
    width: '8%',
    borderRight: '1pt solid black',
  },
  particulars: {
    width: '72%',
    borderRight: '1pt solid black',
    textAlign: 'left',
    paddingLeft: 10,
  },
  amount: {
    width: '20%',
    textAlign: 'right',
  },
  greenBg: {
    backgroundColor: '#90EE90',
  },
  yellowBg: {
    backgroundColor: '#ffeb3b',
  },
  companyDetails: {
    borderTop: '1pt solid black',
    padding: 4,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    height: 80,
  },
  taxRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid black',
    padding: 4,
  },
  taxLabel: {
    flex: 1,
    paddingRight: 4,
  },
  taxAmount: {
    width: '20%',
    textAlign: 'right',
    paddingRight: 4,
  },
  verticalLine: {
    width: '1pt',
    backgroundColor: 'black',
  },
  taxSection: {
    borderBottom: 'none',
  },
  registrationDetails: {
    padding: 8,
    borderBottom: '1pt solid black',
    alignItems: 'flex-start',
  },
  regText: {
    fontSize: 10,
    textAlign: 'left',
    marginVertical: 2,
  },
  spacer: {
    flex: 1,
    minHeight: 50,
  },
  signatureLine: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  signatureText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  authSignatory: {
    marginTop: 30,
  },
  footerSection: {
    border: '1pt solid black',
  },
});

const formatDate = (date: string | Date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).split('-').join('/');
};

interface PDFData {
  _id: string;
  createdAt: string | Date;
  month: string;
  unit: string;
  billTo: string;
  address: string;
  partyGstin: string;
  stateCode: string;
  invoiceNo: string;
  services: Array<{
    id: number;
    name: string;
    amount: string;
  }>;
  deductions: Array<{
    name: string;
    rate: number;
    baseAmount: number;
    amount: number;
    hasBaseAmount: boolean;
    isRateEditable: boolean;
  }>;
  totals: {
    totalEarnings: number;
    totalDeductions: number;
    grossTaxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    pt: number;
    grandTotal: number;
  };
}

const displayAmount = (value: any): string => {
  if (value === undefined || value === null) return '0.00';
  return String(value);
};

const InvoicePDF = ({ data }: { data: PDFData }) => {
  // Add debug log

  if (!data || !data.totals) {
    return null;
  }

  // Calculate totals from services and deductions
  const totalEarnings = data.services.reduce((sum, service) => 
    sum + (parseFloat(service.amount) || 0), 0);
  
  const totalDeductions = data.deductions.reduce((sum, deduction) => 
    sum + (deduction.amount || 0), 0);

  // Use the date from database instead of current date
  const invoiceDate = data.date ? formatDate(data.date) : '';


  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>TAX INVOICE</Text>
            <Text style={styles.companyName}>YOUR COMPANY NAME</Text>
            <Text style={styles.companyInfo}>EMAIL- YOUR COMPANY EMAIL</Text>
            <Text style={styles.companyInfo}>YOUR COMPANY ADDRESS</Text>
          </View>

          {/* Bill To Section */}
          <View style={styles.topSection}>
            <View style={styles.leftSection}>
              <Text style={styles.detailRow}>BILL TO</Text>
              <Text style={styles.detailRow}>M/S {data.billTo}</Text>
              <Text style={styles.detailRow}>ADDRESS</Text>
              <Text style={styles.detailRow}>{data.address}</Text>
            </View>
            <View style={styles.rightSection}>
              <Text style={styles.detailRow}>DATE: {invoiceDate}</Text>
              <Text style={styles.detailRow}>PARTY GSTIN: {data.partyGstin}</Text>
              <Text style={styles.detailRow}>HSN/SAC CODE: 998519</Text>
              <Text style={styles.detailRow}>STATE: {data.stateCode}</Text>
            </View>
          </View>

          {/* Month Row */}
          <View style={styles.monthRow}>
            <Text style={{ width: '25%' }}>INVOICE SUPPLY MONTH</Text>
            <Text style={{ width: '25%' }}>{data.month} {new Date(data.createdAt).getFullYear()}</Text>
            <Text style={{ width: '25%' }}>{data.unit}</Text>
            <Text style={{ width: '25%' }}>INVOICE NO   :</Text>
            <Text style={[styles.value, { marginLeft: 10 }]}>{data.invoiceNo}</Text>
          </View>

          {/* Services Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.slNo}>SL. NO.</Text>
              <Text style={styles.particulars}>PARTICULARS</Text>
              <Text style={styles.amount}>AMOUNT(Rs)</Text>
            </View>
            {data.services.map((service, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.slNo}>{index + 1}</Text>
                <Text style={styles.particulars}>{service.name}</Text>
                <Text style={styles.amount}>{service.amount || '0.00'}</Text>
              </View>
            ))}

            {/* Total Earnings Row */}
            <View style={[styles.tableRow, styles.greenBg]}>
              <Text style={styles.slNo}></Text>
              <Text style={styles.particulars}>TOTAL EARNINGS</Text>
              <Text style={styles.amount}>{totalEarnings.toFixed(2)}</Text>
            </View>

            {/* Deductions */}
            {data.deductions.map((deduction, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.slNo}>{index + 1}</Text>
                <Text style={styles.particulars}>{deduction.name}</Text>
                <Text style={styles.amount}>{deduction.amount || '0.00'}</Text>
              </View>
            ))}

            {/* Tax Details */}
            <View style={styles.taxSection}>
              <View style={[styles.taxRow, styles.yellowBg]}>
                <Text style={styles.taxLabel}>GROSS TAXABLE AMOUNT</Text>
                <Text style={styles.taxAmount}>
                  ₹{displayAmount(data.totals.grossTaxableAmount)}
                </Text>
              </View>

              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>C.G.S.T (9.00%)</Text>
                <Text style={styles.taxAmount}>
                  ₹{displayAmount(data.totals.cgstAmount)}
                </Text>
              </View>

              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>S.G.S.T (9.00%)</Text>
                <Text style={styles.taxAmount}>
                  ₹{displayAmount(data.totals.sgstAmount)}
                </Text>
              </View>

              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>I.G.S.T (18.00%)</Text>
                <Text style={styles.taxAmount}>
                  ₹{displayAmount(data.totals.igstAmount)}
                </Text>
              </View>

              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>P.T DEDUCTION</Text>
                <Text style={styles.taxAmount}>
                  ₹{displayAmount(data.totals.pt)}
                </Text>
              </View>

              <View style={[styles.taxRow, styles.yellowBg]}>
                <Text style={styles.taxLabel}>GRAND TOTAL INVOICE AMOUNT</Text>
                <Text style={styles.taxAmount}>
                  ₹{displayAmount(data.totals.grandTotal)}
                </Text>
              </View>
            </View>
          </View>

          {/* Company Registration Details with Signature Line */}
          <View style={styles.footerSection}>
            <View style={styles.registrationDetails}>
              <Text style={styles.regText}>COMPANY ESIC NO: 69000696210001000</Text>
              <Text style={styles.regText}>COMPANY EPF NO: GNGGN2253798000</Text>
              <Text style={styles.regText}>COMPANY PAN NO: ABMPY1914A</Text>
              <Text style={styles.regText}>COMPANY GSTIN NO: 06ABMPY1914A1ZS</Text>
            </View>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureText}>YOUR COMPANY NAME</Text>
              <Text style={[styles.signatureText, styles.authSignatory]}>AUTH. SIGNATORY</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;





















