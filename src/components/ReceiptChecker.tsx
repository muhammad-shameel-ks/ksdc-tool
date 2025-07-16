import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, XCircle, Loader, ChevronDown, Bug } from 'lucide-react';
import { parse, isValid } from "date-fns";

export const ReceiptChecker = () => {
  const [loanno, setLoanno] = useState('');
  const [receiptAmount, setReceiptAmount] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [receiptNo, setReceiptNo] = useState('');
  const [dateText, setDateText] = useState('');
  const [dateError, setDateError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [stepStatus, setStepStatus] = useState<'idle' | 'checking1' | 'checking2' | 'done'>('idle');

  const parseSmartDate = (dateText: string | Date): Date | null => {
    if (!dateText) return null;
    if (dateText instanceof Date) {
      return isValid(dateText) ? dateText : null;
    }
    if (typeof dateText !== "string" || !dateText.trim()) {
      return null;
    }
    const formats = [
      "MM-dd-yyyy", "dd-MM-yyyy", "dd/MM/yyyy", "dd.MM.yyyy",
      "yyyy-MM-dd", "MM/dd/yyyy", "dd-MM-yy", "dd/MM/yy",
    ];
    for (const formatStr of formats) {
      const parsed = parse(dateText, formatStr, new Date());
      if (isValid(parsed)) return parsed;
    }
    try {
      const nativeDate = new Date(dateText);
      if (isValid(nativeDate) && nativeDate.getFullYear() > 1900) return nativeDate;
    } catch (e) {}
    return null;
  };

  const handleDateChange = (value: string) => {
    setDateText(value);
    const parsedDate = parseSmartDate(value);
    if (value && !parsedDate) {
      setDateError("Invalid date format. Try mm-dd-yyyy");
    } else {
      setDateError("");
    }
    setDate(parsedDate ?? undefined);
  };

  const formatDateForAPI = (date: Date | undefined): string | undefined => {
    if (!date) return undefined;
    // Manually format to YYYY-MM-DD to avoid timezone issues from toISOString()
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleCheckReceipt = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setStepStatus('checking1');

    // Simulate the first check
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStepStatus('checking2');

    try {
      const response = await fetch('/api/check-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loanno,
          receiptAmount,
          date: formatDateForAPI(date),
          receiptNo,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setStepStatus('done');
    }
  };

  return (
    <div className="h-full flex items-center justify-center">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Missing Receipt Checker</CardTitle>
          <CardDescription>Check if a receipt already exists in the database.</CardDescription>
        </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="loanno">Loan Number</Label>
            <Input id="loanno" value={loanno} onChange={(e) => setLoanno(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receiptNo">Receipt Number</Label>
            <Input id="receiptNo" value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receiptAmount">Receipt Amount</Label>
            <Input id="receiptAmount" type="number" value={receiptAmount} onChange={(e) => setReceiptAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="text"
              placeholder="e.g., 10-21-2025"
              value={dateText}
              onChange={(e) => handleDateChange(e.target.value)}
              className={dateError ? "border-red-500" : ""}
            />
            {dateError && <p className="text-sm text-red-600">{dateError}</p>}
          </div>
        </div>
        <Button onClick={handleCheckReceipt} disabled={loading} className="w-full">
          {loading ? 'Checking...' : 'Check Receipt'}
        </Button>

        {error && <p className="text-red-500 mt-4">Error: {error}</p>}

        {stepStatus !== 'idle' && !result && (
          <div className="mt-6 space-y-4">
            <Step
              title="Checking for exact receipt match"
              status={stepStatus === 'checking1' ? 'running' : 'success'}
              query="Running..."
              data={[]}
            />
            {stepStatus === 'checking2' && (
              <Step
                title="Checking for other receipts on the same date"
                status="running"
                query="Running..."
                data={[]}
              />
            )}
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-4">
            <Step
              title="Checking for exact receipt match"
              status={result.status === 'found' ? 'success' : 'success'}
              query={result.query1}
              data={result.status === 'found' ? result.result : result.result1}
              isInitiallyOpen={result.status === 'found'}
              debugInfo={result.debugInfo}
            />
            {result.status !== 'found' && (
              <Step
                title="Checking for other receipts on the same date"
                status={result.status === 'not_found_warning' ? 'warning' : 'success'}
                query={result.query2}
                data={result.result2}
                isInitiallyOpen={true}
                debugInfo={result.debugInfo}
              />
            )}
          </div>
        )}
      </CardContent>
      </Card>
    </div>
  );
};

interface StepProps {
  title: string;
  status: 'success' | 'warning' | 'error' | 'running';
  query: string;
  data: any[];
  isInitiallyOpen?: boolean;
  debugInfo?: any;
}

const Step = ({ title, status, query, data, isInitiallyOpen = false, debugInfo }: StepProps) => {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);
  const [showDebug, setShowDebug] = useState(false);

  const statusIndicator = {
    success: <CheckCircle className="h-6 w-6 text-green-500" />,
    warning: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
    error: <XCircle className="h-6 w-6 text-red-500" />,
    running: <Loader className="h-6 w-6 animate-spin text-blue-500" />,
  }[status];

  return (
    <div className="border rounded-lg">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-4">
          {statusIndicator}
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
        <ChevronDown className={`h-6 w-6 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="p-4 border-t">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold">SQL Query:</h4>
            {debugInfo && (
              <Bug
                className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600"
                onClick={() => setShowDebug(!showDebug)}
              />
            )}
          </div>
          <pre className="bg-gray-100 p-2 rounded-md text-sm overflow-x-auto">
            <code>{query}</code>
          </pre>

          {showDebug && debugInfo && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold">Query Parameters:</h4>
              <pre className="bg-blue-100 p-2 rounded-md text-sm overflow-x-auto">
                <code>{JSON.stringify(debugInfo, null, 2)}</code>
              </pre>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <h4 className="font-semibold">Result:</h4>
            {data.length > 0 ? (
              <pre className="bg-gray-100 p-2 rounded-md text-sm overflow-x-auto">
                <code>{JSON.stringify(data, null, 2)}</code>
              </pre>
            ) : (
              <p className="text-gray-500">No records found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};