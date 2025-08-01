import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ClipboardCopy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiFetch } from "@/lib/utils";

const TransactionCanceller: React.FC = () => {
  const [loanNo, setLoanNo] = useState("");
  const [transNo, setTransNo] = useState("");
  const [fetchedData, setFetchedData] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [isSqlDialogOpen, setIsSqlDialogOpen] = useState(false);
  const [generatedSql, setGeneratedSql] = useState("");

  const handleFetchTransaction = async () => {
    if (!loanNo || !transNo) {
      setError("Please enter both Loan Number and Transaction Number.");
      return;
    }
    setIsFetching(true);
    setError("");
    setFetchedData([]);
    setPreviewData([]);

    try {
      const response = await apiFetch(`/api/transaction/${loanNo}/${transNo}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(
          err.error || `Failed to fetch transaction. Status: ${response.status}`
        );
      }
      const data = await response.json();
      setFetchedData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (fetchedData.length > 0) {
      const transformedData = fetchedData.map((row) => ({
        ...row,
        chr_Acc_Name: "CANCELLED",
        int_Rec: 0,
      }));
      setPreviewData(transformedData);
    }
  }, [fetchedData]);

  const handleCopy = (data: any) => {
    const tsvData = Object.values(data).join("\t");
    navigator.clipboard.writeText(tsvData).then(() => {
      setShowCopyPopup(true);
      setTimeout(() => setShowCopyPopup(false), 2000);
    });
  };

  const handleCopyAll = () => {
    const tsvData = previewData
      .map((row) => Object.values(row).join("\t"))
      .join("\n");
    navigator.clipboard.writeText(tsvData).then(() => {
      setShowCopyPopup(true);
      setTimeout(() => setShowCopyPopup(false), 2000);
    });
  };

  const resetForm = () => {
    setLoanNo("");
    setTransNo("");
    setFetchedData([]);
    setPreviewData([]);
    setError("");
  };

  const handleGenerateSql = () => {
    if (previewData.length === 0) {
      toast.error("No data available to generate SQL.");
      return;
    }

    const insertStatements = previewData
      .map((row) => {
        const columns = Object.keys(row).join(", ");
        const values = Object.values(row)
          .map((val) => {
            if (typeof val === "string") {
              return `'${val.replace(/'/g, "''")}'`;
            }
            if (val === null || val === undefined) {
              return "NULL";
            }
            return val;
          })
          .join(", ");
        return `INSERT INTO tbl_Acctrans (${columns}) VALUES (${values});`;
      })
      .join("\n");

    const selectStatement = `SELECT * FROM tbl_Acctrans WHERE int_loanno = '${loanNo}' AND vchr_TransNo = '${transNo}';`;

    const fullSql = `-- Verify the original transaction\n${selectStatement}\n\n-- Insert the new cancelled transaction\n${insertStatements}`;
    setGeneratedSql(fullSql);
    setIsSqlDialogOpen(true);
  };

  const headers = [
    "vchr_TransNo",
    "chr_Trans_Type",
    "int_Code",
    "chr_Acc_Name",
    "chr_Type",
    "int_Rec",
    "int_Pay",
    "dt_TDate",
    "int_loanno",
    "chr_Name",
    "vchr_remarks",
    "vchr_offid",
    "vchr_uname",
    "dte_time",
    "vchr_offidC",
    "Remarks",
    "GST_percent",
    "GST_Amount",
  ];

  return (
    <div className="relative flex justify-center w-full">
      <Card className="w-full max-w-4xl p-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Transaction Canceller
          </CardTitle>
          <CardDescription className="text-center">
            Enter a Loan Number and Transaction Number to fetch and cancel a
            transaction.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="loanNo">Loan Number</Label>
                <Input
                  id="loanNo"
                  value={loanNo}
                  onChange={(e) => setLoanNo(e.target.value)}
                  placeholder="e.g., 140102037"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transNo">Transaction Number</Label>
                <Input
                  id="transNo"
                  value={transNo}
                  onChange={(e) => setTransNo(e.target.value)}
                  placeholder="e.g., 332"
                />
              </div>
              <Button onClick={handleFetchTransaction} disabled={isFetching}>
                {isFetching ? "Fetching..." : "Fetch Transaction"}
              </Button>
            </div>
          </div>

          {error && <p className="text-red-500 text-center">{error}</p>}

          <div className="w-full flex flex-col items-center mt-6">
            <Label className="text-xl font-bold mb-4 block">Preview</Label>
            <div className="w-full border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    {headers.map((header) => (
                      <th
                        key={header}
                        className="p-2 font-semibold text-slate-700 dark:text-slate-200"
                      >
                        {header}
                      </th>
                    ))}
                    <th className="p-2 font-semibold text-slate-700 dark:text-slate-200">
                      Copy
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="border-t border-slate-200 dark:border-slate-700"
                    >
                      {headers.map((header) => (
                        <td
                          key={header}
                          className="p-2 text-gray-800 font-bold"
                        >
                          {row[header]}
                        </td>
                      ))}
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(row)}
                        >
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
                <Button onClick={handleCopyAll} className="flex-1">
                  Copy All
                </Button>
                <Button
                  onClick={handleGenerateSql}
                  className="flex-1"
                  variant="secondary"
                >
                  Generate SQL
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="flex-1"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={isSqlDialogOpen} onOpenChange={setIsSqlDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Generated SQL Query</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              value={generatedSql}
              readOnly
              className="min-h-[200px] font-mono text-xs"
            />
          </div>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(generatedSql);
              toast.success("SQL Query copied to clipboard!");
            }}
            className="mt-2"
          >
            Copy Query
          </Button>
        </DialogContent>
      </Dialog>
      {showCopyPopup && (
        <div className="fixed bottom-5 right-5 bg-gray-800 text-white py-2 px-4 rounded-lg shadow-lg transition-opacity duration-300">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default TransactionCanceller;
