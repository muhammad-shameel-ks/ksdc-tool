import React, { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiFetch } from "@/lib/utils";

const SchemeChanger: React.FC = () => {
  const [loanNo, setLoanNo] = useState("");
  const [schemes, setSchemes] = useState<any[]>([]);
  const [currentScheme, setCurrentScheme] = useState<any>(null);
  const [selectedScheme, setSelectedScheme] = useState("");
  const [error, setError] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [showCopyPopup] = useState(false);
  const [isSqlDialogOpen, setIsSqlDialogOpen] = useState(false);
  const [generatedSql, setGeneratedSql] = useState("");

  const handleFetchTransaction = async () => {
    if (!loanNo) {
      setError("Please enter a Loan Number.");
      return;
    }
    setIsFetching(true);
    setError("");

    try {
      const response = await apiFetch(
        `/api/scheme/${encodeURIComponent(loanNo)}`
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(
          err.error || `Failed to fetch transaction. Status: ${response.status}`
        );
      }
      const data = await response.json();
      setCurrentScheme(data.currentScheme);
      setSchemes(data.allSchemes);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsFetching(false);
    }
  };

  const resetForm = () => {
    setLoanNo("");
    setCurrentScheme(null);
    setSchemes([]);
    setSelectedScheme("");
    setError("");
  };

  const handleGenerateSql = () => {
    if (!selectedScheme) {
      toast.error("Please select a new scheme.");
      return;
    }

    const updateStatement = `UPDATE tbl_loanapp SET int_schemeid = ${selectedScheme} WHERE vchr_appreceivregno = '${loanNo}';`;
    const verificationStatement = `SELECT vchr_appreceivregno, int_schemeid FROM tbl_loanapp WHERE vchr_appreceivregno = '${loanNo}';`;

    const fullSql = `-- Verify the current scheme before update\n${verificationStatement}\n\n-- Update the scheme\n${updateStatement}\n\n-- Verify the scheme after update\n${verificationStatement}`;
    setGeneratedSql(fullSql);
    setIsSqlDialogOpen(true);
  };

  return (
    <div className="relative flex justify-center w-full">
      <Card className="w-full max-w-4xl p-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Scheme Changer
          </CardTitle>
          <CardDescription className="text-center">
            Enter a Loan Number to fetch the current scheme and change it to a
            new one.
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
              <Button onClick={handleFetchTransaction} disabled={isFetching}>
                {isFetching ? "Fetching..." : "Fetch Scheme"}
              </Button>
            </div>
          </div>

          {error && <p className="text-red-500 text-center">{error}</p>}

          {currentScheme && (
            <div className="space-y-4">
              <div>
                <Label>Current Scheme</Label>
                <Input
                  value={`${currentScheme.int_schemeid} - ${currentScheme.Scheme}`}
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="scheme">New Scheme</Label>
                <select
                  id="scheme"
                  value={selectedScheme}
                  onChange={(e) => setSelectedScheme(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select a new scheme</option>
                  {schemes.map((scheme) => (
                    <option key={scheme.Id} value={scheme.Id}>
                      {scheme.Id} - {scheme.Scheme}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <Button onClick={handleGenerateSql} className="flex-1">
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
          )}
        </CardContent>
      </Card>
      <Dialog open={isSqlDialogOpen} onOpenChange={setIsSqlDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Generated SQL Query</DialogTitle>
            <DialogDescription>
              Copy and run this query to update the scheme.
            </DialogDescription>
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

export default SchemeChanger;
