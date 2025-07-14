import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ClipboardCopy } from 'lucide-react';
import { parse, isValid } from 'date-fns';

interface TransactionGeneratorProps {
  initialData?: {
    loanNo: string;
    name: string;
    officeId: string;
    legalFee: { amount: string; date: string; receiptNo: string };
    processingFee: { amount:string; date: string; receiptNo: string };
    bc: { amount: string; date: string; receiptNo: string };
  };
}

const TransactionGenerator: React.FC<TransactionGeneratorProps> = ({ initialData }) => {
  // Common Fields
  const [loanNo, setLoanNo] = useState('');
  const [name, setName] = useState('');
  const [officeId, setOfficeId] = useState('');
  // Row-specific fields
  const [rows, setRows] = useState([
    { vchr_TransNo: '', int_Rec: '', transactionDate: null as Date | null, transactionDateText: '', dateError: '' },
    { vchr_TransNo: '', int_Rec: '', transactionDate: null as Date | null, transactionDateText: '', dateError: '' },
    { vchr_TransNo: '', int_Rec: '', transactionDate: null as Date | null, transactionDateText: '', dateError: '' },
  ]);

  // Generated data for preview
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showCopyPopup, setShowCopyPopup] = useState(false);

  useEffect(() => {
    if (initialData) {
      setLoanNo(initialData.loanNo);
      setName(initialData.name);
      setOfficeId(initialData.officeId);

      const newRows = [...rows];
      
      const formatDate = (date: any) => {
        if (date instanceof Date) {
          return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
        }
        return date;
      };
      
      // Legal Fee
      newRows[0].vchr_TransNo = initialData.legalFee.receiptNo;
      newRows[0].int_Rec = initialData.legalFee.amount;
      const legalFeeDate = formatDate(initialData.legalFee.date);
      newRows[0].transactionDateText = legalFeeDate;
      newRows[0].transactionDate = parseSmartDate(legalFeeDate);

      // Processing Fee
      newRows[1].vchr_TransNo = initialData.processingFee.receiptNo;
      newRows[1].int_Rec = initialData.processingFee.amount;
      const processingFeeDate = formatDate(initialData.processingFee.date);
      newRows[1].transactionDateText = processingFeeDate;
      newRows[1].transactionDate = parseSmartDate(processingFeeDate);

      // BC
      newRows[2].vchr_TransNo = initialData.bc.receiptNo;
      newRows[2].int_Rec = initialData.bc.amount;
      const bcDate = formatDate(initialData.bc.date);
      newRows[2].transactionDateText = bcDate;
      newRows[2].transactionDate = parseSmartDate(bcDate);

      setRows(newRows);
    }
  }, [initialData]);

  const handleRowChange = (index: number, field: string, value: any) => {
    const newRows = [...rows];
    const row = newRows[index];
    (row as any)[field] = value;

    if (field === 'transactionDateText') {
      const parsedDate = parseSmartDate(value);
      if (value && !parsedDate) {
        row.dateError = 'Invalid date format. Try mm-dd-yyyy';
      } else {
        row.dateError = '';
      }
      row.transactionDate = parsedDate;
    }

    setRows(newRows);
  };

  const parseSmartDate = (dateText: string | Date): Date | null => {
    if (!dateText) return null;

    if (dateText instanceof Date) {
      return isValid(dateText) ? dateText : null;
    }

    if (typeof dateText !== 'string' || !dateText.trim()) {
      return null;
    }
    
    const formats = ["MM-dd-yyyy", "dd-MM-yyyy", "dd/MM/yyyy", "dd.MM.yyyy", "yyyy-MM-dd", "MM/dd/yyyy", "dd-MM-yy", "dd/MM/yy"];
    for (const formatStr of formats) {
        try {
            const parsed = parse(dateText, formatStr, new Date());
            if (isValid(parsed)) {
                return parsed;
            }
        } catch (e) {
            // continue
        }
    }
    try {
        const nativeDate = new Date(dateText);
        if (isValid(nativeDate) && nativeDate.getFullYear() > 1900) {
            return nativeDate;
        }
    } catch (e) {
        // ignore
    }
    return null;
  };

  const hardcodedData = [
    { chr_Trans_Type: 'Receipt', int_Code: 1039, chr_Acc_Name: 'LEGAL FEE', chr_Type: 'Cash', vchr_remarks: 'LEGAL FEE', vchr_uname: '6', GST_percent: 0 },
    { chr_Trans_Type: 'Receipt', int_Code: 1041, chr_Acc_Name: 'PROCESSING FEE', chr_Type: 'Cash', vchr_remarks: 'PROCESSING FEE', vchr_uname: '6', GST_percent: 18 },
    { chr_Trans_Type: 'Receipt', int_Code: 24103, chr_Acc_Name: 'Beneficiary Contribution', chr_Type: 'Cash', vchr_remarks: 'Beneficiary Contribution', vchr_uname: '6', GST_percent: 0 },
  ];

  useEffect(() => {
    const generatedData = rows.map((row, index) => {
      const total = parseFloat(row.int_Rec) || 0;
      let gstAmount = 0;
      
      if (index === 1) { // PROCESSING FEE row
        // Reverse GST calculation: Amount is GST-inclusive
        const baseAmount = (total * 100) / 118;
        gstAmount = total - baseAmount;
      }
      const date = row.transactionDate;
      const formattedDate = date
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} 00:00:00.000`
        : '1900-01-01 00:00:00.000';

      return {
        vchr_TransNo: row.vchr_TransNo,
        chr_Trans_Type: hardcodedData[index].chr_Trans_Type,
        int_Code: hardcodedData[index].int_Code,
        chr_Acc_Name: hardcodedData[index].chr_Acc_Name,
        chr_Type: hardcodedData[index].chr_Type,
        int_Rec: total.toFixed(2),
        int_Pay: '0.00',
        dt_TDate: formattedDate,
        int_loanno: loanNo,
        chr_Name: name,
        vchr_remarks: hardcodedData[index].vchr_remarks,
        vchr_offid: officeId,
        vchr_uname: hardcodedData[index].vchr_uname,
        dte_time: '1900-01-01 00:00:00.000',
        vchr_offidC: officeId,
        Remarks: '',
        GST_percent: hardcodedData[index].GST_percent,
        GST_Amount: gstAmount.toFixed(2),
      };
    });
    setPreviewData(generatedData);
  }, [rows, loanNo, name, officeId]);

  const handleCopy = (data: any) => {
    const tsvData = Object.values(data).join('\t');
    navigator.clipboard.writeText(tsvData).then(() => {
      setShowCopyPopup(true);
      setTimeout(() => setShowCopyPopup(false), 2000);
    });
  };

  const handleCopyAll = () => {
    const tsvData = previewData.map(row => Object.values(row).join('\t')).join('\n');
    navigator.clipboard.writeText(tsvData).then(() => {
      setShowCopyPopup(true);
      setTimeout(() => setShowCopyPopup(false), 2000);
    });
  };

  const resetForm = () => {
    setLoanNo('');
    setName('');
    setOfficeId('');
    setRows([
      { vchr_TransNo: '', int_Rec: '', transactionDate: null as Date | null, transactionDateText: '', dateError: '' },
      { vchr_TransNo: '', int_Rec: '', transactionDate: null as Date | null, transactionDateText: '', dateError: '' },
      { vchr_TransNo: '', int_Rec: '', transactionDate: null as Date | null, transactionDateText: '', dateError: '' },
    ]);
  };

  const headers = [
    "vchr_TransNo", "chr_Trans_Type", "int_Code", "chr_Acc_Name", "chr_Type", "int_Rec", "int_Pay",
    "dt_TDate", "int_loanno", "chr_Name", "vchr_remarks", "vchr_offid", "vchr_uname", "dte_time",
    "vchr_offidC", "Remarks", "GST_percent", "GST_Amount"
  ];

  return (
    <div className="relative">
      <Card className="w-full max-w-6xl mx-auto p-4">
        <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Transaction Generator</CardTitle>
        <CardDescription className="text-center">
          Enter the details to generate transaction rows.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-4">
          <h3 className="font-medium text-blue-800 mb-2">Common Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loanNo">Loan Number</Label>
              <Input id="loanNo" value={loanNo} onChange={(e) => setLoanNo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="officeId">Office ID</Label>
              <Input id="officeId" value={officeId} onChange={(e) => setOfficeId(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {rows.map((row, index) => (
            <div key={index} className={`p-4 rounded-lg border space-y-4 ${
              index === 0 ? 'bg-green-50 border-green-200' :
              index === 1 ? 'bg-orange-50 border-orange-200' :
              'bg-purple-50 border-purple-200'
            }`}>
              <h3 className={`font-medium mb-2 ${
                index === 0 ? 'text-green-800' :
                index === 1 ? 'text-orange-800' :
                'text-purple-800'
              }`}>Transaction {index + 1}: {hardcodedData[index].chr_Acc_Name}</h3>
              <div className="space-y-2">
                <Label htmlFor={`transNo-${index}`}>Transaction No.</Label>
                <Input id={`transNo-${index}`} value={row.vchr_TransNo} onChange={(e) => handleRowChange(index, 'vchr_TransNo', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`amount-${index}`}>Received Amount</Label>
                <Input id={`amount-${index}`} type="number" value={row.int_Rec} onChange={(e) => handleRowChange(index, 'int_Rec', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`transactionDate-${index}`}>Transaction Date</Label>
                <Input
                  id={`transactionDate-${index}`}
                  type="text"
                  placeholder="e.g., 10-21-2025"
                  value={row.transactionDateText}
                  onChange={(e) => handleRowChange(index, 'transactionDateText', e.target.value)}
                  className={row.dateError ? "border-red-500" : ""}
                />
                {row.dateError && <p className="text-sm text-red-600">{row.dateError}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="w-full flex flex-col items-center mt-6">
          <Label className="text-xl font-bold mb-4 block">Preview</Label>
          <div className="w-full border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  {headers.map((header) => (
                    <th key={header} className="p-2 font-semibold text-slate-700 dark:text-slate-200">
                      {header}
                    </th>
                  ))}
                  <th className="p-2 font-semibold text-slate-700 dark:text-slate-200">Copy</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-slate-200 dark:border-slate-700">
                    {headers.map(header => <td key={header} className="p-2 text-gray-800 font-bold">{row[header]}</td>)}
                    <td className="p-2">
                      <Button variant="ghost" size="sm" onClick={() => handleCopy(row)}>
                        <ClipboardCopy className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <div className="flex gap-4">
              <Button onClick={handleCopyAll} className="flex-1">Copy All</Button>
              <Button onClick={resetForm} variant="outline" className="flex-1">Reset</Button>
            </div>
          </div>
        </div>
      </CardContent>
      </Card>
      {showCopyPopup && (
        <div className="fixed bottom-5 right-5 bg-gray-800 text-white py-2 px-4 rounded-lg shadow-lg transition-opacity duration-300">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default TransactionGenerator;