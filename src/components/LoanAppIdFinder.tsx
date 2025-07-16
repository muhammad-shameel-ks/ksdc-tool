import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Copy, Check, Search } from "lucide-react";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    <Popover open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <PopoverTrigger asChild>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
          size="icon"
        >
          <Search className="h-8 w-8" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="sm:max-w-md bg-white rounded-lg shadow-xl w-96"
      >
        <div className="p-4">
          <h2 className="text-2xl font-bold text-gray-800">Universal Loan Finder</h2>
          <p className="text-gray-500">Enter a Loan No, App ID, or App. Reg. No. to find loan details.</p>
        </div>
        <div className="grid w-full items-center gap-4 py-4 px-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="searchTerm" className="text-gray-600">Search Term</Label>
            <Input
              id="searchTerm"
              placeholder="Enter search term..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFindLoanDetails()}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex flex-col items-start sm:justify-start border-t pt-4 p-4">
          <Button onClick={handleFindLoanDetails} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? 'Searching...' : 'Find Loan Details'}
          </Button>
          {error && <p className="text-red-500 mt-4">Error: {error}</p>}
          {loanDetails && (
            <div className="mt-4 space-y-3 w-full bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Loan Details Found:</h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-700"><strong>Applicant Name:</strong> {loanDetails.vchr_applname}</span>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(loanDetails.vchr_applname, 'name')}>
                  {copiedField === 'name' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-500" />}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700"><strong>Loan Application ID:</strong> {loanDetails.int_loanappid}</span>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(String(loanDetails.int_loanappid), 'appid')}>
                  {copiedField === 'appid' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-500" />}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700"><strong>App. Reg. No.:</strong> {loanDetails.vchr_appreceivregno}</span>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(loanDetails.vchr_appreceivregno, 'regno')}>
                  {copiedField === 'regno' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-500" />}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700"><strong>Loan Number:</strong> {loanDetails.int_loanno}</span>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(loanDetails.int_loanno, 'loanno')}>
                  {copiedField === 'loanno' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-500" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};