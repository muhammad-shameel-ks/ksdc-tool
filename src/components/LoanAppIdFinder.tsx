import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Copy, Check } from "lucide-react";

interface LoanDetails {
  int_loanappid: number;
  vchr_appreceivregno: string;
  vchr_applname: string;
  int_loanno: string;
}

export const LoanAppIdFinder = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loanDetails, setLoanDetails] = useState<LoanDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFindLoanDetails = async () => {
    if (!searchTerm) {
      setError('Please enter a search term.');
      return;
    }
    setLoading(true);
    setError(null);
    setLoanDetails(null);
    try {
      const response = await fetch(`/api/loan-details?searchTerm=${searchTerm}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLoanDetails(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Universal Loan Finder</CardTitle>
        <CardDescription>Enter a Loan No, App ID, or App. Reg. No. to find loan details.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="searchTerm">Search Term</Label>
            <Input
              id="searchTerm"
              placeholder="Enter search term..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start">
        <Button onClick={handleFindLoanDetails} disabled={loading}>
          {loading ? 'Searching...' : 'Find Loan Details'}
        </Button>
        {error && <p className="text-red-500 mt-4">Error: {error}</p>}
        {loanDetails && (
          <div className="mt-4 space-y-2 w-full">
            <h3 className="text-lg font-semibold">Loan Details Found:</h3>
            <div className="flex items-center justify-between">
              <span><strong>Applicant Name:</strong> {loanDetails.vchr_applname}</span>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(loanDetails.vchr_applname, 'name')}>
                {copiedField === 'name' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span><strong>Loan Application ID:</strong> {loanDetails.int_loanappid}</span>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(String(loanDetails.int_loanappid), 'appid')}>
                {copiedField === 'appid' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span><strong>App. Reg. No.:</strong> {loanDetails.vchr_appreceivregno}</span>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(loanDetails.vchr_appreceivregno, 'regno')}>
                {copiedField === 'regno' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span><strong>Loan Number:</strong> {loanDetails.int_loanno}</span>
              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(loanDetails.int_loanno, 'loanno')}>
                {copiedField === 'loanno' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};