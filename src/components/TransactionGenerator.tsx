import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ClipboardCopy } from 'lucide-react';
import { parse, isValid } from 'date-fns';

const TransactionGenerator: React.FC = () => {
  // Common Fields
  const [loanNo, setLoanNo] = useState('');
  const [name, setName] = useState('');
  const [officeId, setOfficeId] = useState('');
  const [transactionDate, setTransactionDate] = useState<Date | null>(null);
  const [transactionDateText, setTransactionDateText] = useState('');
  const [dateError, setDateError] = useState('');

  // Row-specific fields
  const [rows, setRows] = useState([
    { vchr_TransNo: '', int_Rec: '' },
    { vchr_TransNo: '', int_Rec: '' },
    { vchr_TransNo: '', int_Rec: '' },
  ]);

  // Generated data for preview
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleRowChange = (index: number, field: string, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const parseSmartDate = (dateText: string): Date | null => {
    if (!dateText.trim()) return null;
    const formats = ["dd-MM-yyyy", "dd/MM/yyyy", "dd.MM.yyyy", "yyyy-MM-dd", "MM/dd/yyyy", "dd-MM-yy", "dd/MM/yy"];
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
    const parsedDate = parseSmartDate(transactionDateText);
    if (transactionDateText && !parsedDate) {
        setDateError('Invalid date format. Try dd-mm-yyyy');
    } else {
        setDateError('');
    }
    setTransactionDate(parsedDate);
  }, [transactionDateText]);

  useEffect(() => {
    const generatedData = rows.map((row, index) => {
      const receivedAmount = parseFloat(row.int_Rec) || 0;
      const gstAmount = index === 1 ? receivedAmount * 0.18 : 0;
      const formattedDate = transactionDate ? transactionDate.toISOString().split('T')[0] + ' 00:00:00.000' : '1900-01-01 00:00:00.000';

      return {
        vchr_TransNo: row.vchr_TransNo,
        chr_Trans_Type: hardcodedData[index].chr_Trans_Type,
        int_Code: hardcodedData[index].int_Code,
        chr_Acc_Name: hardcodedData[index].chr_Acc_Name,
        chr_Type: hardcodedData[index].chr_Type,
        int_Rec: receivedAmount.toFixed(2),
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
  }, [rows, loanNo, name, officeId, transactionDate]);

  const handleCopy = (data: any) => {
    const tsvData = Object.values(data).join('\t');
    navigator.clipboard.writeText(tsvData);
  };

  const handleCopyAll = () => {
    const tsvData = previewData.map(row => Object.values(row).join('\t')).join('\n');
    navigator.clipboard.writeText(tsvData);
  };

  const headers = [
    "vchr_TransNo", "chr_Trans_Type", "int_Code", "chr_Acc_Name", "chr_Type", "int_Rec", "int_Pay",
    "dt_TDate", "int_loanno", "chr_Name", "vchr_remarks", "vchr_offid", "vchr_uname", "dte_time",
    "vchr_offidC", "Remarks", "GST_percent", "GST_Amount"
  ];

  return (
    <Card className="w-full max-w-6xl mx-auto p-4">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Transaction Generator</CardTitle>
        <CardDescription className="text-center">
          Enter the details to generate transaction rows.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Common Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="transactionDate">Transaction Date</Label>
              <Input
                id="transactionDate"
                type="text"
                placeholder="e.g., 21-10-2025"
                value={transactionDateText}
                onChange={(e) => setTransactionDateText(e.target.value)}
                className={dateError ? "border-red-500" : ""}
              />
              {dateError && <p className="text-sm text-red-600">{dateError}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {rows.map((row, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>Transaction {index + 1}: {hardcodedData[index].chr_Acc_Name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`transNo-${index}`}>Transaction No.</Label>
                  <Input id={`transNo-${index}`} value={row.vchr_TransNo} onChange={(e) => handleRowChange(index, 'vchr_TransNo', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`amount-${index}`}>Received Amount</Label>
                  <Input id={`amount-${index}`} type="number" value={row.int_Rec} onChange={(e) => handleRowChange(index, 'int_Rec', e.target.value)} />
                </div>
              </CardContent>
            </Card>
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
            <Button onClick={handleCopyAll}>Copy All</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionGenerator;