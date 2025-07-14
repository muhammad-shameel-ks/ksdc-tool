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
import { Bug } from "lucide-react";
import * as XLSX from "xlsx";
import TransactionGenerator from "./TransactionGenerator";
import { headerMappings } from "@/lib/headerMappings";

const SmartPartPayment: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any[]>([]);

  const officeIdMap: { [key: string]: string } = {
    TVM: "0101",
    KMR: "0102",
    KLM: "0201",
    PTM: "0301",
    ALP: "0401",
    KTM: "0501",
    IDK: "0601",
    EKM: "0701",
    TSR: "0801",
    PKD: "0901",
    MPM: "1001",
    VDR: "1002",
    KKD: "1101",
    WYD: "1201",
    KNR: "1301",
    KSR: "1401",
    CKA: "0802",
  };

  const getOfficeId = (loanNo: string): string => {
    if (!loanNo) return "";
    // Handle cases like "PKD/3489"
    const textMatch = loanNo.match(/^([A-Z]{3})\//);
    if (textMatch && officeIdMap[textMatch[1]]) {
      return officeIdMap[textMatch[1]];
    }
    // Handle cases like "10201196"
    if (/^\d{8,}/.test(loanNo)) {
      return loanNo.substring(0, 4);
    }
    return "";
  };

  const isValidLoanNoFormat = (loanNo: string): boolean => {
    return /^[A-Z]{3}\/\d+$/.test(loanNo);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "array", cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
          });

          const nonEmptyRows = rows.filter(
            (row) => !row.every((cell) => cell === "")
          );

          const normalize = (str: string) =>
            (str || "").trim().toUpperCase().replace(/\s\s+/g, " ");

          const mainHeaderRowIndex = nonEmptyRows.findIndex((row) =>
            row.some(
              (cell) => typeof cell === "string" && normalize(cell) === "SL NO"
            )
          );

          if (mainHeaderRowIndex === -1) {
            setError(
              "Invalid Excel format: Could not find header row with 'SL NO'."
            );
            return;
          }

          const potentialFeeHeaderRows = nonEmptyRows.slice(0, mainHeaderRowIndex);
          const feeHeaderRowIndex = potentialFeeHeaderRows.findIndex((row) =>
            row.some(
              (cell) =>
                typeof cell === "string" &&
                normalize(cell).includes("LEGAL FEE")
            )
          );

          if (feeHeaderRowIndex === -1) {
            setError(
              "Invalid Excel format: Could not find fee header row with 'LEGAL FEE'."
            );
            return;
          }

          const mainHeaders = nonEmptyRows[mainHeaderRowIndex].map((h) =>
            typeof h === "string" ? normalize(h) : ""
          );
          const feeHeaders = potentialFeeHeaderRows[feeHeaderRowIndex].map((h) =>
            typeof h === "string" ? normalize(h) : ""
          );

          const getHeaderIndex = (aliases: string[], fromIndex = 0) => {
            for (const alias of aliases) {
              const normalizedAlias = normalize(alias);
              const index = mainHeaders.indexOf(normalizedAlias, fromIndex);
              if (index !== -1) return index;
            }
            return -1;
          };

          const getFeeHeaderIndex = (searchText: string) => {
            return feeHeaders.findIndex((h) => h.includes(normalize(searchText)));
          };

          const legalFeeIndex = getFeeHeaderIndex("LEGAL FEE");
          const processingFeeIndex = getFeeHeaderIndex("PROCESSING FEE");
          const bcIndex = getFeeHeaderIndex("BC");
          let bankStartIndex = getFeeHeaderIndex("BANK DETAILS");
          if (bankStartIndex === -1) {
            bankStartIndex = getFeeHeaderIndex("BANK");
          }

          const debugLog: any[] = [];

          const correctDate = (d: any, label: string): Date | any => {
            if (!(d instanceof Date)) {
              debugLog.push({
                label,
                input: d,
                inputType: typeof d,
                output: d,
                note: "Not a Date object, returned as-is",
              });
              return d;
            }

            const original = new Date(d);
            // Create date in local timezone, but add 1 day to compensate for timezone shift
            const corrected = new Date(
              d.getFullYear(),
              d.getMonth(),
              d.getDate() + 1
            );

            debugLog.push({
              label,
              originalDate: original.toString(),
              originalUTC: original.toUTCString(),
              originalISO: original.toISOString(),
              getFullYear: d.getFullYear(),
              getMonth: d.getMonth(),
              getDate: d.getDate(),
              correctedDate: corrected.toString(),
              correctedISO: corrected.toISOString(),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              note: "Added 1 day to compensate for timezone shift",
            });

            return corrected;
          };

          const dataRows = nonEmptyRows.slice(mainHeaderRowIndex + 1);

          const parseFee = (fee: any): number | any => {
            if (typeof fee === "string" && fee.includes("+")) {
              return fee
                .split("+")
                .reduce((acc, val) => acc + Number(val.trim()), 0);
            }
            return fee;
          };

          const parsedData = dataRows
            .map((row) => {
              if (row.every((cell) => cell === "")) return null; // Skip empty rows
              const loanNoRaw = row[getHeaderIndex(headerMappings.loanNo)];
              return {
                slNo: row[getHeaderIndex(headerMappings.slNo)],
                name: row[getHeaderIndex(headerMappings.name)],
                scheme: row[getHeaderIndex(headerMappings.scheme)],
                loanNo: String(loanNoRaw),
                agreementNumber:
                  row[getHeaderIndex(headerMappings.agreementNumber)],
                requiredAmount: row[getHeaderIndex(headerMappings.requiredAmount)],
                amountSanctioned:
                  row[getHeaderIndex(headerMappings.amountSanctioned)],
                installments: [
                  row[getHeaderIndex(headerMappings.installment1)],
                  row[getHeaderIndex(headerMappings.installment2)],
                  row[getHeaderIndex(headerMappings.installment3)],
                  row[getHeaderIndex(headerMappings.installment4)],
                ],
                legalFee: {
                  amount: parseFee(row[legalFeeIndex]),
                  date: correctDate(row[legalFeeIndex + 1], "Legal Fee"),
                  receiptNo: row[legalFeeIndex + 2],
                },
                processingFee: {
                  amount: parseFee(row[processingFeeIndex]),
                  date: correctDate(
                    row[processingFeeIndex + 1],
                    "Processing Fee"
                  ),
                  receiptNo: row[processingFeeIndex + 2],
                },
                bc: {
                  amount: parseFee(row[bcIndex]),
                  date: correctDate(row[bcIndex + 1], "BC"),
                  receiptNo: row[bcIndex + 2],
                },
                bankDetails: {
                  accountNo: row[getHeaderIndex(headerMappings.bankAccountNo, bankStartIndex)],
                  ifsc: row[
                    getHeaderIndex(headerMappings.bankIfsc, bankStartIndex)
                  ],
                  bankName: row[
                    getHeaderIndex(headerMappings.bankName, bankStartIndex)
                  ],
                  branch: row[
                    getHeaderIndex(headerMappings.bankBranch, bankStartIndex)
                  ],
                },
              };
            })
            .filter(Boolean); // remove nulls from empty rows

          setData(parsedData);
          setDebugInfo(debugLog);
          setCurrentIndex(0);
          setError("");
        } catch (err) {
          console.error(err);
          setError(
            "Error parsing the Excel file. Make sure it follows the template."
          );
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto p-4">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Smart Part Payment
        </CardTitle>
        <CardDescription className="text-center">
          Upload an Excel file to automatically populate transaction details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
          <Input
            id="file-upload"
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-10 h-10 mb-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                XLSX or XLS files
              </p>
            </div>
          </Label>
          {fileName && (
            <p className="text-sm text-gray-600 mt-2">
              Selected file: {fileName}
            </p>
          )}
        </div>

        {error && <p className="text-red-500 text-center">{error}</p>}

        {data.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              <p className="font-medium">
                Record {currentIndex + 1} of {data.length}
              </p>
              <Button
                onClick={() =>
                  setCurrentIndex((prev) => Math.min(data.length - 1, prev + 1))
                }
                disabled={currentIndex === data.length - 1}
              >
                Next
              </Button>
            </div>

            <div className="border p-4 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Preview</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDebug(!showDebug)}
                  className="flex items-center gap-2"
                >
                  <Bug className="h-4 w-4" />
                  Debug Dates
                </Button>
              </div>
              {!isValidLoanNoFormat(data[currentIndex].loanNo) && (
                <div
                  className="p-3 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50"
                  role="alert"
                >
                  <span className="font-medium">Warning!</span> The loan number
                  "{data[currentIndex].loanNo}" might be incorrect. It should be
                  in a format like "PKD/3489".
                </div>
              )}

              {showDebug && debugInfo.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">
                    Date Debug Information:
                  </h4>
                  <div className="space-y-2 text-xs">
                    {debugInfo.map((debug, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border">
                        <div className="font-medium text-blue-700">
                          {debug.label}:
                        </div>
                        {debug.note ? (
                          <div className="text-gray-600">{debug.note}</div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <div>
                              <div className="text-gray-600">Original:</div>
                              <div className="font-mono">
                                {debug.originalDate}
                              </div>
                              <div className="font-mono text-xs">
                                {debug.originalISO}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-600">Corrected:</div>
                              <div className="font-mono">
                                {debug.correctedDate}
                              </div>
                              <div className="font-mono text-xs">
                                {debug.correctedISO}
                              </div>
                            </div>
                            <div className="col-span-2 text-xs text-gray-500">
                              Components: Year={debug.getFullYear}, Month=
                              {debug.getMonth}, Date={debug.getDate} | TZ:{" "}
                              {debug.timezone}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <pre className="bg-white p-2 rounded overflow-auto">
                {JSON.stringify(
                  {
                    ...data[currentIndex],
                    officeId: getOfficeId(data[currentIndex].loanNo),
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="mt-8">
              <TransactionGenerator
                initialData={{
                  ...data[currentIndex],
                  officeId: getOfficeId(data[currentIndex].loanNo),
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartPartPayment;
