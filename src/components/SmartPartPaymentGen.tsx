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
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCopy } from "lucide-react";
import { parse, isValid } from "date-fns";
import * as XLSX from "xlsx";
import { headerMappings } from "@/lib/headerMappings";
import { apiFetch } from "@/lib/utils";

const SmartPartPaymentGen: React.FC = () => {
  // Merged state from SmartPartPayment
  const [data, setData] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [showWarningToast, setShowWarningToast] = useState(false);
  const [pastedData, setPastedData] = useState("");

  // State from TransactionGenerator
  const [loanNo, setLoanNo] = useState("");
  const [name, setName] = useState("");
  const [officeId, setOfficeId] = useState("");
  const [rows, setRows] = useState([
    {
      vchr_TransNo: "",
      int_Rec: "",
      transactionDate: null as Date | null,
      transactionDateText: "",
      dateError: "",
    },
    {
      vchr_TransNo: "",
      int_Rec: "",
      transactionDate: null as Date | null,
      transactionDateText: "",
      dateError: "",
    },
    {
      vchr_TransNo: "",
      int_Rec: "",
      transactionDate: null as Date | null,
      transactionDateText: "",
      dateError: "",
    },
  ]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showCopyPopup, setShowCopyPopup] = useState(false);

  // Merged helper functions from SmartPartPayment
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
    const textMatch = loanNo.match(/^([A-Z]{3})\//);
    if (textMatch && officeIdMap[textMatch[1]]) {
      return officeIdMap[textMatch[1]];
    }
    if (/^\d{8,}/.test(loanNo)) {
      return loanNo.substring(0, 4);
    }
    return "";
  };

  const isValidLoanNoFormat = (loanNo: string): boolean => {
    return /^[A-Z]{3}\/\d+$/.test(loanNo);
  };

  const processExcelData = (excelData: ArrayBuffer) => {
    try {
      const workbook = XLSX.read(excelData, { type: "array", cellDates: true });
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
            typeof cell === "string" && normalize(cell).includes("LEGAL FEE")
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
        const corrected = new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate() + 1
        );
        debugLog.push({
          label,
          originalDate: new Date(d).toString(),
          correctedDate: corrected.toString(),
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
          if (row.every((cell) => cell === "")) return null;
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
              date: correctDate(row[processingFeeIndex + 1], "Processing Fee"),
              receiptNo: row[processingFeeIndex + 2],
            },
            bc: {
              amount: parseFee(row[bcIndex]),
              date: correctDate(row[bcIndex + 1], "BC"),
              receiptNo: row[bcIndex + 2],
            },
            bankDetails: {
              accountNo:
                row[
                  getHeaderIndex(headerMappings.bankAccountNo, bankStartIndex)
                ],
              ifsc: row[
                getHeaderIndex(headerMappings.bankIfsc, bankStartIndex)
              ],
              bankName:
                row[getHeaderIndex(headerMappings.bankName, bankStartIndex)],
              branch:
                row[getHeaderIndex(headerMappings.bankBranch, bankStartIndex)],
            },
          };
        })
        .filter(Boolean);

      setData(parsedData);
      setCurrentIndex(0);
      setError("");
      setUrlError("");
    } catch (err) {
      console.error(err);
      setError(
        "Error parsing the Excel file. Make sure it follows the template."
      );
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          processExcelData(e.target.result as ArrayBuffer);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleFetchFromUrl = async () => {
    if (!googleSheetUrl) {
      setUrlError("Please enter a Google Sheets URL.");
      return;
    }

    const sheetIdRegex = /spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = googleSheetUrl.match(sheetIdRegex);

    if (!match || !match[1]) {
      setUrlError("Invalid Google Sheets URL. Please check the format.");
      return;
    }

    const sheetId = match[1];
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;

    setIsFetching(true);
    setUrlError("");
    setError("");

    try {
      const response = await apiFetch(exportUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch spreadsheet. Status: ${response.status}`
        );
      }
      const arrayBuffer = await response.arrayBuffer();
      setFileName(googleSheetUrl); // Use URL as filename
      processExcelData(arrayBuffer);
    } catch (err: any) {
      console.error(err);
      setUrlError(`Error fetching from URL: ${err.message}`);
    } finally {
      setIsFetching(false);
    }
  };

  // Effect to update form when data is loaded or index changes
  useEffect(() => {
    if (data.length > 0) {
      const currentRecord = data[currentIndex];
      const officeId = getOfficeId(currentRecord.loanNo);

      setLoanNo(currentRecord.loanNo);
      setName(currentRecord.name);
      setOfficeId(officeId);

      const newRows = [...rows];
      const formatDate = (date: any) => {
        if (date instanceof Date) {
          return `${date.getDate().toString().padStart(2, "0")}-${(
            date.getMonth() + 1
          )
            .toString()
            .padStart(2, "0")}-${date.getFullYear()}`;
        }
        return date;
      };

      newRows[0].vchr_TransNo = currentRecord.legalFee.receiptNo;
      newRows[0].int_Rec = currentRecord.legalFee.amount;
      const legalFeeDate = formatDate(currentRecord.legalFee.date);
      newRows[0].transactionDateText = legalFeeDate;
      newRows[0].transactionDate = parseSmartDate(legalFeeDate);

      newRows[1].vchr_TransNo = currentRecord.processingFee.receiptNo;
      newRows[1].int_Rec = currentRecord.processingFee.amount;
      const processingFeeDate = formatDate(currentRecord.processingFee.date);
      newRows[1].transactionDateText = processingFeeDate;
      newRows[1].transactionDate = parseSmartDate(processingFeeDate);

      newRows[2].vchr_TransNo = currentRecord.bc.receiptNo;
      newRows[2].int_Rec = currentRecord.bc.amount;
      const bcDate = formatDate(currentRecord.bc.date);
      newRows[2].transactionDateText = bcDate;
      newRows[2].transactionDate = parseSmartDate(bcDate);

      setRows(newRows);
    }
  }, [data, currentIndex]);

  useEffect(() => {
    if (data.length > 0) {
      setShowWarningToast(true);
      const timer = setTimeout(() => {
        setShowWarningToast(false);
      }, 5000); // Hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [data]);

  const handleRowChange = (index: number, field: string, value: any) => {
    const newRows = [...rows];
    const row = newRows[index];
    (row as any)[field] = value;

    if (field === "transactionDateText") {
      const parsedDate = parseSmartDate(value);
      if (value && !parsedDate) {
        row.dateError = "Invalid date format. Try mm-dd-yyyy";
      } else {
        row.dateError = "";
      }
      row.transactionDate = parsedDate;
    }

    setRows(newRows);
  };

  const parseSmartDate = (dateText: string | Date): Date | null => {
    if (!dateText) return null;
    if (dateText instanceof Date) {
      return isValid(dateText) ? dateText : null;
    }
    if (typeof dateText !== "string" || !dateText.trim()) {
      return null;
    }
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

  const hardcodedData = [
    {
      chr_Trans_Type: "Receipt",
      int_Code: 1039,
      chr_Acc_Name: "LEGAL FEE",
      chr_Type: "Cash",
      vchr_remarks: "LEGAL FEE",
      vchr_uname: "6",
      GST_percent: 0,
    },
    {
      chr_Trans_Type: "Receipt",
      int_Code: 1041,
      chr_Acc_Name: "PROCESSING FEE",
      chr_Type: "Cash",
      vchr_remarks: "PROCESSING FEE",
      vchr_uname: "6",
      GST_percent: 18,
    },
    {
      chr_Trans_Type: "Receipt",
      int_Code: 24103,
      chr_Acc_Name: "Beneficiary Contribution",
      chr_Type: "Cash",
      vchr_remarks: "Beneficiary Contribution",
      vchr_uname: "6",
      GST_percent: 0,
    },
  ];

  useEffect(() => {
    const generatedData = rows.map((row, index) => {
      const total = parseFloat(row.int_Rec) || 0;
      let gstAmount = 0;
      if (index === 1) {
        const baseAmount = (total * 100) / 118;
        gstAmount = total - baseAmount;
      }
      const date = row.transactionDate;
      const formattedDate = date
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(date.getDate()).padStart(2, "0")} 00:00:00.000`
        : "1900-01-01 00:00:00.000";
      return {
        vchr_TransNo: row.vchr_TransNo,
        chr_Trans_Type: hardcodedData[index].chr_Trans_Type,
        int_Code: hardcodedData[index].int_Code,
        chr_Acc_Name: hardcodedData[index].chr_Acc_Name,
        chr_Type: hardcodedData[index].chr_Type,
        int_Rec: total.toFixed(2),
        int_Pay: "0.00",
        dt_TDate: formattedDate,
        int_loanno: loanNo,
        chr_Name: name,
        vchr_remarks: hardcodedData[index].vchr_remarks,
        vchr_offid: officeId,
        vchr_uname: hardcodedData[index].vchr_uname,
        dte_time: "1900-01-01 00:00:00.000",
        vchr_offidC: officeId,
        Remarks: "",
        GST_percent: hardcodedData[index].GST_percent,
        GST_Amount: gstAmount.toFixed(2),
      };
    });
    setPreviewData(generatedData);
  }, [rows, loanNo, name, officeId]);

  useEffect(() => {
    if (!pastedData) {
      return;
    }

    const lines = pastedData
      .trim()
      .split("\n")
      .filter((line) => line.trim() !== "");
    const dataLine = lines.length > 0 ? lines[lines.length - 1] : null;

    if (dataLine) {
      const values = dataLine.split("\t");
      if (values.length >= 9) {
        const newRows = [...rows];

        newRows[0].int_Rec = values[0];
        newRows[0].transactionDateText = values[1];
        newRows[0].vchr_TransNo = values[2];

        newRows[1].int_Rec = values[3];
        newRows[1].transactionDateText = values[4];
        newRows[1].vchr_TransNo = values[5];

        newRows[2].int_Rec = values[6];
        newRows[2].transactionDateText = values[7];
        newRows[2].vchr_TransNo = values[8];

        setRows(newRows);
      }
    }
  }, [pastedData]);

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
    setName("");
    setOfficeId("");
    setRows([
      {
        vchr_TransNo: "",
        int_Rec: "",
        transactionDate: null,
        transactionDateText: "",
        dateError: "",
      },
      {
        vchr_TransNo: "",
        int_Rec: "",
        transactionDate: null,
        transactionDateText: "",
        dateError: "",
      },
      {
        vchr_TransNo: "",
        int_Rec: "",
        transactionDate: null,
        transactionDateText: "",
        dateError: "",
      },
    ]);
    setPastedData("");
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
      <Card className="w-full max-w-6xl p-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Smart Part Payment Gen
          </CardTitle>
          <CardDescription className="text-center">
            Upload an Excel file or enter details manually to generate
            transaction rows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Google Sheet URL Input Section */}
          <div className="space-y-2">
            <Label htmlFor="google-sheet-url">
              Or Fetch from Google Sheets URL
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="google-sheet-url"
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={googleSheetUrl}
                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                disabled={isFetching}
              />
              <Button onClick={handleFetchFromUrl} disabled={isFetching}>
                {isFetching ? "Fetching..." : "Fetch"}
              </Button>
            </div>
            {urlError && <p className="text-sm text-red-600">{urlError}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Note: Your Google Sheet must be public for the fetch to work.
            </p>
          </div>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-400"></div>
            <span className="flex-shrink mx-4 text-gray-400">OR</span>
            <div className="flex-grow border-t border-gray-400"></div>
          </div>

          {/* File Upload Section */}
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

          <div className="space-y-2 text-center">
            <Label htmlFor="pastedData">Paste Excel Data</Label>
            <Textarea
              id="pastedData"
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              placeholder="Paste data from Excel here..."
              rows={6}
            />
          </div>

          {data.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Button
                  onClick={() =>
                    setCurrentIndex((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentIndex === 0}
                >
                  Previous
                </Button>
                <p className="font-medium">
                  Record {currentIndex + 1} of {data.length}
                </p>
                <Button
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      Math.min(data.length - 1, prev + 1)
                    )
                  }
                  disabled={currentIndex === data.length - 1}
                >
                  Next
                </Button>
              </div>
              {!isValidLoanNoFormat(data[currentIndex].loanNo) && (
                <div
                  className="p-3 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50"
                  role="alert"
                >
                  <span className="font-medium">Warning!</span> The loan number
                  "{data[currentIndex].loanNo}" might be incorrect.
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-4">
            <h3 className="font-medium text-blue-800 mb-2">
              Common Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loanNo">Loan Number</Label>
                <Input
                  id="loanNo"
                  value={loanNo}
                  onChange={(e) => setLoanNo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="officeId">Office ID</Label>
                <Input
                  id="officeId"
                  value={officeId}
                  onChange={(e) => setOfficeId(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {rows.map((row, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border space-y-4 ${
                  index === 0
                    ? "bg-green-50 border-green-200"
                    : index === 1
                    ? "bg-orange-50 border-orange-200"
                    : "bg-purple-50 border-purple-200"
                }`}
              >
                <h3
                  className={`font-medium mb-2 ${
                    index === 0
                      ? "text-green-800"
                      : index === 1
                      ? "text-orange-800"
                      : "text-purple-800"
                  }`}
                >
                  Transaction {index + 1}: {hardcodedData[index].chr_Acc_Name}
                </h3>
                <div className="space-y-2">
                  <Label htmlFor={`transNo-${index}`}>Transaction No.</Label>
                  <Input
                    id={`transNo-${index}`}
                    value={row.vchr_TransNo}
                    onChange={(e) =>
                      handleRowChange(index, "vchr_TransNo", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`amount-${index}`}>Received Amount</Label>
                  <Input
                    id={`amount-${index}`}
                    type="number"
                    value={row.int_Rec}
                    onChange={(e) =>
                      handleRowChange(index, "int_Rec", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`transactionDate-${index}`}>
                    Transaction Date
                  </Label>
                  <Input
                    id={`transactionDate-${index}`}
                    type="text"
                    placeholder="e.g., 10-21-2025"
                    value={row.transactionDateText}
                    onChange={(e) =>
                      handleRowChange(
                        index,
                        "transactionDateText",
                        e.target.value
                      )
                    }
                    className={row.dateError ? "border-red-500" : ""}
                  />
                  {row.dateError && (
                    <p className="text-sm text-red-600">{row.dateError}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

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
      {showCopyPopup && (
        <div className="fixed bottom-5 right-5 bg-gray-800 text-white py-2 px-4 rounded-lg shadow-lg transition-opacity duration-300">
          Copied to clipboard!
        </div>
      )}
      {showWarningToast && (
        <div
          className="fixed top-5 right-5 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg shadow-lg transition-opacity duration-300"
          role="alert"
        >
          <p className="font-bold">Warning</p>
          <p>Always double or triple-check data before copying.</p>
        </div>
      )}
    </div>
  );
};

export default SmartPartPaymentGen;
