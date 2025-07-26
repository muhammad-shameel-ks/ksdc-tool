import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader,
  Search,
  FileWarning,
  FileCheck,
  Ban,
} from "lucide-react";
import { parse, isValid } from "date-fns";

type Status =
  | "idle"
  | "checking"
  | "receipt_found"
  | "not_found"
  | "error"
  | "loan_not_found"
  | "duplicate_receipt_no"
  | "date_warning"
  | "double_entry_warning"
  | "amount_mismatch_warning"
  | "duplicate_receipt_in_office";

interface QueryDetail {
  title: string;
  query: string;
  result: any[];
  status: "success" | "warning" | "error" | "running";
  priority: "High" | "Medium" | "Low";
}

interface ResultData {
  status: Status;
  message: string;
  queries: QueryDetail[];
}

export const ReceiptChecker = () => {
  const [loanno, setLoanno] = useState("");
  const [receiptAmount, setReceiptAmount] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [receiptNo, setReceiptNo] = useState("");
  const [dateText, setDateText] = useState("");
  const [dateError, setDateError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [overallStatus, setOverallStatus] = useState<Status>("idle");

  const handleClear = () => {
    setLoanno("");
    setReceiptAmount("");
    setDate(undefined);
    setReceiptNo("");
    setDateText("");
    setDateError("");
    setResult(null);
    setOverallStatus("idle");
  };

  const parseSmartDate = (dateText: string | Date): Date | null => {
    if (!dateText) return null;
    if (dateText instanceof Date) return isValid(dateText) ? dateText : null;
    if (typeof dateText !== "string" || !dateText.trim()) return null;
    const formats = [
      "MM-dd-yyyy",
      "dd-MM-yyyy",
      "dd/MM/yyyy",
      "dd.MM.yyyy",
      "yyyy-MM-dd",
      "MM/dd/yyyy",
      "dd-MM-yy",
      "dd/MM/yy",
    ];
    for (const formatStr of formats) {
      const parsed = parse(dateText, formatStr, new Date());
      if (isValid(parsed)) return parsed;
    }
    try {
      const nativeDate = new Date(dateText);
      if (isValid(nativeDate) && nativeDate.getFullYear() > 1900)
        return nativeDate;
    } catch (e) {}
    return null;
  };

  const handleDateChange = (value: string) => {
    setDateText(value);
    const parsedDate = parseSmartDate(value);
    setDateError(
      value && !parsedDate ? "Invalid date format. Try mm-dd-yyyy" : ""
    );
    setDate(parsedDate ?? undefined);
  };

  const formatDateForAPI = (date: Date | undefined): string | undefined => {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleCheckReceipt = async () => {
    setLoading(true);
    setResult(null);
    setOverallStatus("checking");

    const initialQueries: QueryDetail[] = [
      {
        title: "Input Validation",
        query: "Checking for required fields...",
        result: [],
        status: "running",
        priority: "High",
      },
    ];
    setResult({
      status: "checking",
      message: "Starting validation...",
      queries: initialQueries,
    });

    await new Promise((res) => setTimeout(res, 500));

    if (!loanno || !receiptAmount || !date || !receiptNo) {
      const finalResult: ResultData = {
        status: "error",
        message: "Missing required fields. Please fill all inputs.",
        queries: [
          {
            ...initialQueries[0],
            status: "error",
            result: [{ error: "Missing fields" }],
          },
        ],
      };
      setResult(finalResult);
      setOverallStatus("error");
      setLoading(false);
      return;
    }

    initialQueries[0].status = "success";
    setResult({
      status: "checking",
      message: "Input validation passed.",
      queries: [...initialQueries],
    });
    await new Promise((res) => setTimeout(res, 500));

    try {
      const apiPayload = {
        loanno,
        receiptAmount,
        date: formatDateForAPI(date),
        receiptNo,
      };

      const allQueries: QueryDetail[] = [
        ...initialQueries,
        {
          title: "Exact Match Check",
          query: `SELECT * FROM tbl_loanTrans WHERE int_loanno = '${loanno}' AND chr_rec_no = '${receiptNo}' AND dt_transaction = '${formatDateForAPI(
            date
          )}' AND int_amt = ${receiptAmount}`,
          result: [],
          status: "running",
          priority: "High",
        },
        {
          title: "Amount Mismatch Check",
          query: `SELECT * FROM tbl_loanTrans WHERE int_loanno = '${loanno}' AND chr_rec_no = '${receiptNo}' AND dt_transaction = '${formatDateForAPI(
            date
          )}'`,
          result: [],
          status: "running",
          priority: "Medium",
        },
        {
          title: "Date Mismatch Check",
          query: `SELECT * FROM tbl_loanTrans WHERE int_loanno = '${loanno}' AND chr_rec_no = '${receiptNo}'`,
          result: [],
          status: "running",
          priority: "Medium",
        },
        {
          title: "Duplicate Receipt No. Check",
          query: `SELECT * FROM tbl_loanTrans WHERE chr_rec_no = '${receiptNo}'`,
          result: [],
          status: "running",
          priority: "High",
        },
        {
          title: "Duplicate Receipt in Office Check",
          query: `SELECT * FROM tbl_Loantrans WHERE vchr_offidC = '${loanno.substring(
            0,
            4
          )}' AND chr_rec_no = '${receiptNo}' AND int_loanno != '${loanno}'`,
          result: [],
          status: "running",
          priority: "High",
        },
        {
          title: "Loan Existence Check",
          query: `SELECT * FROM loans WHERE loanno = '${loanno}'`,
          result: [],
          status: "running",
          priority: "Low",
        },
      ];

      let finalStatus: Status = "not_found";
      let finalMessage = "No issues found. Receipt appears to be new.";
      const statusHierarchy: Status[] = [
        "error",
        "receipt_found",
        "duplicate_receipt_no",
        "duplicate_receipt_in_office",
        "amount_mismatch_warning",
        "date_warning",
        "double_entry_warning",
        "not_found",
      ];

      for (let i = 1; i < allQueries.length; i++) {
        let displayedQueries = allQueries.slice(0, i + 1);
        setResult({
          status: "checking",
          message: `Running: ${allQueries[i].title}`,
          queries: displayedQueries,
        });
        await new Promise((res) => setTimeout(res, 400 + Math.random() * 300));

        const response = await fetch("/api/check-receipt-step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...apiPayload, step: allQueries[i].title }),
        });
        const stepResult = await response.json();

        allQueries[i].status = stepResult.status;
        allQueries[i].result = stepResult.result;

        let currentStepStatus: Status | null = null;
        if (stepResult.status === "error" && stepResult.result.length > 0) {
          currentStepStatus = stepResult.overallStatus || "error";
        } else if (
          allQueries[i].title === "Exact Match Check" &&
          stepResult.status === "success" &&
          stepResult.result.length > 0
        ) {
          currentStepStatus = "receipt_found";
        } else if (
          stepResult.status === "warning" &&
          stepResult.result.length > 0
        ) {
          currentStepStatus = stepResult.overallStatus || "not_found";
        }

        const statusMessages: Partial<Record<Status, string>> = {
          receipt_found: "This exact receipt already exists.",
          error: stepResult.message,
          duplicate_receipt_no: stepResult.message,
          duplicate_receipt_in_office: stepResult.message,
          amount_mismatch_warning: stepResult.message,
          date_warning: stepResult.message,
        };

        if (currentStepStatus) {
          if (
            statusHierarchy.indexOf(currentStepStatus) <
            statusHierarchy.indexOf(finalStatus)
          ) {
            finalStatus = currentStepStatus;
            finalMessage = statusMessages[currentStepStatus] || finalMessage;
          }
        }

        setResult({
          status: "checking",
          message: `Completed: ${allQueries[i].title}`,
          queries: [...allQueries],
        });
        await new Promise((res) => setTimeout(res, 150));
      }

      setResult({
        status: finalStatus,
        message: finalMessage,
        queries: allQueries,
      });
      setOverallStatus(finalStatus);
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setResult({
        status: "error",
        message: errorMessage,
        queries: result?.queries || [],
      });
      setOverallStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-full max-w-4xl">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Missing Receipt Checker
              </h2>
              <p className="text-sm text-muted-foreground">
                Check if a receipt already exists in the database.
              </p>
            </div>
            <StatusBadge status={overallStatus} />
          </div>
        </div>
        <div className="p-6 pt-0 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loanno">Loan Number</Label>
              <Input
                id="loanno"
                value={loanno}
                onChange={(e) => setLoanno(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiptNo">Receipt Number</Label>
              <Input
                id="receiptNo"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiptAmount">Receipt Amount</Label>
              <Input
                id="receiptAmount"
                type="number"
                value={receiptAmount}
                onChange={(e) => setReceiptAmount(e.target.value)}
              />
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
          <div className="flex space-x-2">
            <Button
              onClick={handleCheckReceipt}
              disabled={loading}
              className="flex-grow"
            >
              {loading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" /> Checking...
                </>
              ) : (
                "Check Receipt"
              )}
            </Button>
            <Button onClick={handleClear} variant="outline">
              Clear
            </Button>
          </div>
        </div>
        <div className="p-6 pt-0">
          {(overallStatus === "checking" || result) && (
            <LiveResultDisplay
              result={result}
              loading={loading}
              loanno={loanno}
              receiptAmount={receiptAmount}
              date={date}
              receiptNo={receiptNo}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: Status }) => {
  const statusConfig = useMemo(
    () => ({
      idle: { icon: Search, label: "Idle", color: "bg-gray-200 text-gray-800" },
      checking: {
        icon: Loader,
        label: "Checking...",
        color: "bg-blue-200 text-blue-800 animate-pulse",
      },
      receipt_found: {
        icon: FileCheck,
        label: "Already Exists",
        color: "bg-green-200 text-green-800",
      },
      not_found: {
        icon: FileWarning,
        label: "Not Found",
        color: "bg-yellow-200 text-yellow-800",
      },
      loan_not_found: {
        icon: Ban,
        label: "Loan Not Found",
        color: "bg-red-200 text-red-800",
      },
      duplicate_receipt_no: {
        icon: Ban,
        label: "Duplicate Receipt No.",
        color: "bg-red-200 text-red-800",
      },
      duplicate_receipt_in_office: {
        icon: Ban,
        label: "Duplicate in Office",
        color: "bg-red-200 text-red-800",
      },
      double_entry_warning: {
        icon: AlertTriangle,
        label: "Double Entry",
        color: "bg-orange-200 text-orange-800",
      },
      date_warning: {
        icon: FileWarning,
        label: "Date Warning",
        color: "bg-yellow-200 text-yellow-800",
      },
      amount_mismatch_warning: {
        icon: AlertTriangle,
        label: "Amount Mismatch",
        color: "bg-orange-200 text-orange-800",
      },
      error: {
        icon: XCircle,
        label: "Error",
        color: "bg-red-200 text-red-800",
      },
    }),
    []
  );

  const {
    icon: Icon,
    label,
    color,
  } = statusConfig[status] || statusConfig.idle;
  const isSpinning = status === "checking";

  return (
    <Badge className={`transition-all duration-300 ${color}`}>
      <Icon className={`mr-2 h-4 w-4 ${isSpinning ? "animate-spin" : ""}`} />
      {label}
    </Badge>
  );
};

const LiveResultDisplay = ({
  result,
  loading,
  loanno,
  receiptAmount,
  date,
  receiptNo,
}: {
  result: ResultData | null;
  loading: boolean;
  loanno: string;
  receiptAmount: string;
  date: Date | undefined;
  receiptNo: string;
}) => {
  if (!result) return null;

  const issues = result.queries.filter(
    (q) =>
      (q.status === "warning" || q.status === "error") && q.result.length > 0
  );
  const lastQuery = result.queries[result.queries.length - 1];

  return (
    <div className="bg-white text-gray-900 font-sans flex flex-col border rounded-lg">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="flex items-center text-base font-semibold">
              <StatusBadge status={result.status} />
              <span className="ml-4">{result.message}</span>
            </h3>
            {issues.length > 0 && !loading && (
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium">
                  Potential Issues ({issues.length}):
                </span>
                {issues.map((issue, index) => (
                  <PriorityBadge key={index} priority={issue.priority} />
                ))}
              </div>
            )}
          </div>
          <Button
            onClick={() => {
              const url = `http://ksdcsmart.kerala.gov.in/KSDC_IT_Personal_Ledger_View?Office_Code=0101&loan_no=${loanno}&name=`;
              window.open(url, "_blank");
            }}
            disabled={!loanno}
          >
            Open Ledger
          </Button>
        </div>
      </div>
      <div className="p-6 pt-0 flex-grow">
        <div className="space-y-2 h-full overflow-y-auto pr-2 text-sm">
          {result.queries.map((query, index) => (
            <Step key={index} {...query} />
          ))}
          {loading && (!lastQuery || lastQuery.status !== "running") && (
            <div className="flex items-center space-x-3 p-4">
              <Loader className="h-5 w-5 animate-spin text-blue-500" />
              <h3 className="text-sm font-medium">Waiting for next step...</h3>
            </div>
          )}
        </div>
      </div>
      <SQLQueryGenerator
        issues={issues}
        result={result}
        loanno={loanno}
        receiptAmount={receiptAmount}
        date={date}
        receiptNo={receiptNo}
      />
    </div>
  );
};

interface StepProps extends QueryDetail {}

const PriorityBadge = ({ priority }: { priority: StepProps["priority"] }) => {
  const config = {
    High: "bg-red-100 text-red-800 border-red-200",
    Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Low: "bg-blue-100 text-blue-800 border-blue-200",
  };
  return (
    <Badge className={`border text-xs ${config[priority]}`}>{priority}</Badge>
  );
};

const Step = ({ title, status, query, result: data, priority }: StepProps) => {
  const statusIndicator = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    running: <Loader className="h-5 w-5 animate-spin text-blue-500" />,
  }[status];

  return (
    <div className="border-gray-200 border rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {statusIndicator}
          <span className="text-sm text-gray-800">{title}</span>
        </div>
        <PriorityBadge priority={priority} />
      </div>
      {(status === "success" || status === "warning" || status === "error") && (
        <Accordion type="single" collapsible className="w-full mt-2">
          <AccordionItem value="query" className="border-none">
            <AccordionTrigger className="text-xs p-1 hover:no-underline text-gray-600">
              Details
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <h4 className="font-semibold text-xs text-gray-500 uppercase tracking-wider">
                SQL Query
              </h4>
              <pre className="bg-gray-100 p-2 rounded-md text-xs overflow-x-auto mt-1 text-gray-800">
                <code>{query}</code>
              </pre>
              <h4 className="font-semibold text-xs text-gray-500 uppercase tracking-wider mt-3">
                Result
              </h4>
              {data.length > 0 ? (
                <pre className="bg-gray-100 p-2 rounded-md text-xs overflow-x-auto mt-1 text-gray-800">
                  <code>{JSON.stringify(data, null, 2)}</code>
                </pre>
              ) : (
                <p className="text-gray-500 text-sm mt-1">No records found.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
};

const SQLQueryGenerator = ({
  issues,
  result,
  loanno,
  receiptAmount,
  date,
  receiptNo,
}: {
  issues: QueryDetail[];
  result: ResultData | null;
  loanno: string;
  receiptAmount: string;
  date: Date | undefined;
  receiptNo: string;
}) => {
  const [editableQuery, setEditableQuery] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCopyQuery = () => {
    navigator.clipboard
      .writeText(editableQuery)
      .then(() => {
        toast.success("SQL Query copied to clipboard!");
      })
      .catch((err) => {
        toast.error("Could not copy query to clipboard.");
        console.error("Copy failed", err);
      });
  };

  const formatDateForSQL = (date: Date | undefined): string => {
    if (!date) return "NULL";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const generateQuery = () => {
    let query = "";
    if (result?.status === "not_found") {
      const mode = receiptNo.toLowerCase().startsWith("b") ? "Bank" : "Cash";
      setPaymentMode(mode);
      query = `INSERT INTO tbl_Loantrans (int_loanno, dt_transaction, chr_rec_no, int_amt, chr_mod_payment, chr_transtype, int_prin_amt, int_int_amt, chr_remark, vchr_offidC)
VALUES ('${loanno}', '${formatDateForSQL(
        date
      )}', '${receiptNo}', ${receiptAmount}, '${mode}', 'Receipt', 0, 0, 'REPAYMENT', '${loanno.substring(
        0,
        4
      )}');`;
    } else if (issues.length > 0) {
      const highestPriorityIssue = issues.reduce((prev, current) => {
        const priorities = ["High", "Medium", "Low"];
        return priorities.indexOf(prev.priority) <
          priorities.indexOf(current.priority)
          ? prev
          : current;
      });
      switch (highestPriorityIssue.title) {
        case "Amount Mismatch Check":
          query = `-- Fix for Amount Mismatch:\nUPDATE tbl_loanTrans SET int_amt = ${receiptAmount} WHERE int_transid = ${highestPriorityIssue.result[0].int_transid};`;
          break;
        case "Date Mismatch Check":
          query = `-- Fix for Date Mismatch:\nUPDATE tbl_loanTrans SET dt_transaction = '${formatDateForSQL(
            date
          )}' WHERE int_transid = ${
            highestPriorityIssue.result[0].int_transid
          };`;
          break;
        case "Duplicate Receipt No. Check":
          query = `-- Fix for Duplicate Receipt No.:\n-- Manual intervention required. Cannot generate a safe query.`;
          break;
        default:
          query = `-- No specific query generated for this issue.`;
      }
    } else {
      query = "-- No issues found, so no query generated.";
    }
    setEditableQuery(query);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    if (result?.status === "not_found") {
      const newQuery = `INSERT INTO tbl_Loantrans (int_loanno, dt_transaction, chr_rec_no, int_amt, chr_mod_payment, chr_transtype, int_prin_amt, int_int_amt, chr_remark, vchr_offidC)
VALUES ('${loanno}', '${formatDateForSQL(
        date
      )}', '${receiptNo}', ${receiptAmount}, '${paymentMode}', 'Receipt', 0, 0, 'REPAYMENT', '${loanno.substring(
        0,
        4
      )}');`;
      setEditableQuery(newQuery);
    }
  }, [paymentMode, result, loanno, receiptAmount, date, receiptNo]);

  return (
    <div className="p-4">
      <Button onClick={generateQuery}>Generate SQL Fix</Button>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Generated SQL Query</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {result?.status === "not_found" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment-mode" className="text-right">
                  Payment Mode
                </Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank">Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Textarea
              value={editableQuery}
              onChange={(e) => setEditableQuery(e.target.value)}
              className="min-h-[200px] font-mono text-xs"
            />
          </div>
          <Button onClick={handleCopyQuery} className="mt-2">
            Copy Query
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
