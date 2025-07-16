import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DeductionCalculator: React.FC = () => {
  const [loanAppId, setLoanAppId] = useState('');
  const [proFee, setProFee] = useState('');
  const [legalFee, setLegalFee] = useState('');
  const [bc, setBc] = useState('');
  const [total, setTotal] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [preview, setPreview] = useState<(string | number)[]>([]);

  const headers = [
    "int_remitid", "int_loanappid", "int_profee", "int_ldrf", "int_legalfee",
    "int_landverfee", "int_postageamt", "vchr_postrem", "int_othersamt",
    "vchr_otherrem", "int_bc", "int_total"
  ];

  useEffect(() => {
    const proFeeNum = parseFloat(proFee) || 0;
    const legalFeeNum = parseFloat(legalFee) || 0;
    const bcNum = parseFloat(bc) || 0;
    const totalDeduction = proFeeNum + legalFeeNum + bcNum;
    setTotal(totalDeduction);

    const rowData = [
      0, // int_remitid
      loanAppId,
      proFee,
      0, // int_ldrf
      legalFee,
      0, // int_landverfee
      0, // int_postageamt
      '', // vchr_postrem
      0, // int_othersamt
      '', // vchr_otherrem
      bc,
      totalDeduction,
    ];
    setPreview(rowData);
  }, [proFee, legalFee, bc, loanAppId]);

  const handleCopy = () => {
    const tsvData = preview
      .map((cell, index) => {
        const header = headers[index];
        if (header.startsWith('int_') && cell === '') {
          return 0;
        }
        return cell;
      })
      .join('\t');
    navigator.clipboard.writeText(tsvData);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const resetForm = () => {
    setLoanAppId('');
    setProFee('');
    setLegalFee('');
    setBc('');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Deduction Quick-Copy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-4">
              <div className="space-y-2 text-center">
                <Label htmlFor="loanAppId">Loan Application ID</Label>
                <Input id="loanAppId" type="number" value={loanAppId} onChange={(e) => setLoanAppId(e.target.value)} />
              </div>
              <div className="space-y-2 text-center">
                <Label htmlFor="proFee">Processing Fee</Label>
                <Input id="proFee" type="number" value={proFee} onChange={(e) => setProFee(e.target.value)} />
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-4">
              <div className="space-y-2 text-center">
                <Label htmlFor="legalFee">Legal Fee</Label>
                <Input id="legalFee" type="number" value={legalFee} onChange={(e) => setLegalFee(e.target.value)} />
              </div>
              <div className="space-y-2 text-center">
                <Label htmlFor="bc">Beneficiary Charges</Label>
                <Input id="bc" type="number" value={bc} onChange={(e) => setBc(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg text-center">
            <Label htmlFor="total" className="text-lg font-semibold">Total Deduction</Label>
            <Input id="total" type="number" value={total} readOnly className="mt-2 font-bold text-3xl text-center bg-white" />
          </div>
          <div className="flex gap-4">
            <Button onClick={handleCopy} className="flex-1">{isCopied ? 'Copied!' : 'Copy for Excel'}</Button>
            <Button onClick={resetForm} variant="outline" className="flex-1">Reset</Button>
          </div>
          <div className="flex flex-col pt-6">
            <Label className="text-xl font-bold mb-4 block text-center">Row Preview</Label>
            <div className="w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="text-sm text-left">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    {headers.map((header) => (
                      <th key={header} className="p-2 font-semibold text-slate-700 dark:text-slate-200">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-200 dark:border-slate-700">
                    {preview.map((cell, index) => (
                      <td key={index} className="p-2 text-gray-800 font-bold">
                        {cell}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeductionCalculator;