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
  const [preview, setPreview] = useState('');

  useEffect(() => {
    const proFeeNum = parseFloat(proFee) || 0;
    const legalFeeNum = parseFloat(legalFee) || 0;
    const bcNum = parseFloat(bc) || 0;
    const totalDeduction = proFeeNum + legalFeeNum + bcNum;
    setTotal(totalDeduction);
  }, [proFee, legalFee, bc]);

  const handleCopy = () => {
    const rowData = [
      0, // int_remitid
      loanAppId || 0,
      proFee || 0,
      0, // int_ldrf
      legalFee || 0,
      0, // int_landverfee
      0, // int_postageamt
      0, // vchr_postrem
      0, // int_othersamt
      0, // vchr_otherrem
      bc || 0,
      total,
    ];

    const tsvData = rowData.join('\t');
    navigator.clipboard.writeText(tsvData);
    setPreview(tsvData);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Deduction Quick-Copy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="loanAppId">Loan Application ID</Label>
            <Input id="loanAppId" type="number" value={loanAppId} onChange={(e) => setLoanAppId(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="proFee">Processing Fee</Label>
            <Input id="proFee" type="number" value={proFee} onChange={(e) => setProFee(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="legalFee">Legal Fee</Label>
            <Input id="legalFee" type="number" value={legalFee} onChange={(e) => setLegalFee(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bc">Bank Charges</Label>
            <Input id="bc" type="number" value={bc} onChange={(e) => setBc(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="total">Total Deduction</Label>
            <Input id="total" type="number" value={total} readOnly />
          </div>
          <Button onClick={handleCopy}>{isCopied ? 'Copied!' : 'Copy for Excel'}</Button>
          {preview && (
            <div className="mt-4 p-2 bg-gray-100 rounded dark:bg-gray-800">
              <Label>Row Preview:</Label>
              <pre className="text-sm whitespace-pre-wrap break-all">{preview}</pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeductionCalculator;