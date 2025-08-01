import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/utils";

const BankGenerator: React.FC = () => {
  const [loanAppId, setLoanAppId] = useState("");
  const [pastedData, setPastedData] = useState("");
  const [sqlQuery, setSqlQuery] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    exists: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const verifyLoanAppId = async () => {
      if (!loanAppId) {
        setVerificationStatus(null);
        return;
      }

      try {
        const response = await apiFetch(`/api/bank-details/${loanAppId}`);
        const data = await response.json();
        if (data.exists) {
          setVerificationStatus({
            exists: true,
            message: `Bank details already exist for Loan App ID: ${loanAppId}`,
          });
        } else {
          setVerificationStatus({
            exists: false,
            message: `No bank details found for Loan App ID: ${loanAppId}`,
          });
        }
      } catch (error) {
        setVerificationStatus({
          exists: false,
          message: "Error verifying Loan App ID.",
        });
      }
    };

    verifyLoanAppId();
  }, [loanAppId]);

  useEffect(() => {
    if (!pastedData || !loanAppId) {
      setSqlQuery("");
      return;
    }

    // Split by newline, filter out empty lines, and take the last line which should be the data.
    const lines = pastedData
      .trim()
      .split("\n")
      .filter((line) => line.trim() !== "");
    const dataLine = lines.length > 0 ? lines[lines.length - 1] : null;

    if (dataLine) {
      const values = dataLine.split("\t");
      if (values.length >= 4) {
        const [name, branch, ifsc, accNumber] = values;
        const insertQuery = `INSERT INTO tbl_BankDetails (int_loanappid, vchr_Bank, vchr_Branch, vchr_IFSC, int_BankAccNo, vchr_user, int_modify) VALUES ('${loanAppId}', '${name.trim()}', '${branch.trim()}', '${ifsc.trim()}', '${accNumber.trim()}', '1', 0);`;
        setSqlQuery(insertQuery);
      } else {
        setSqlQuery(
          "Error: Could not parse 4 columns from the last data line. Please ensure the data is tab-separated."
        );
      }
    } else {
      setSqlQuery("");
    }
  }, [pastedData, loanAppId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlQuery);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const resetForm = () => {
    setLoanAppId("");
    setPastedData("");
    setSqlQuery("");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Bank Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <Label htmlFor="loanAppId">Loan Application ID</Label>
            <Input
              id="loanAppId"
              type="number"
              value={loanAppId}
              onChange={(e) => setLoanAppId(e.target.value)}
            />
            {verificationStatus && (
              <p
                className={`text-sm ${
                  verificationStatus.exists ? "text-red-500" : "text-green-500"
                }`}
              >
                {verificationStatus.message}
              </p>
            )}
          </div>
          <div className="space-y-2 text-center">
            <Label htmlFor="pastedData">Paste Excel Data</Label>
            <Textarea
              id="pastedData"
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              placeholder="Paste bank details from Excel here..."
              rows={6}
            />
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <Label htmlFor="sqlQuery" className="text-lg font-semibold">
              Generated SQL
            </Label>
            <Textarea
              id="sqlQuery"
              value={sqlQuery}
              readOnly
              className="mt-2 font-mono bg-white"
              rows={8}
            />
          </div>
          <div className="flex gap-4">
            <Button onClick={handleCopy} className="flex-1">
              {isCopied ? "Copied!" : "Copy SQL"}
            </Button>
            <Button onClick={resetForm} variant="outline" className="flex-1">
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BankGenerator;
