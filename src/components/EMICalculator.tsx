import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { parse, isValid, format } from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface EMIResult {
  monthlyEMI: number;
  totalAmount: number;
  totalInterest: number;
  tenureMonths: number;
  tenureYears: number;
}

export function EMICalculator() {
  const [fromDateText, setFromDateText] = useState<string>("");
  const [toDateText, setToDateText] = useState<string>("");
  const [loanDurationMonths, setLoanDurationMonths] = useState<string>("");
  const [loanAmount, setLoanAmount] = useState<string>("");
  const [interestRate, setInterestRate] = useState<string>("");
  const [result, setResult] = useState<EMIResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculationMode, setCalculationMode] = useState<'emi' | 'interest_only' | null>(null);

  // Smart date parser function
  const parseSmartDate = (dateText: string): Date | null => {
    if (!dateText.trim()) return null;

    const text = dateText.trim().toLowerCase();

    // Try different date formats
    const formats = [
      "dd-MM-yyyy",
      "dd/MM/yyyy",
      "dd.MM.yyyy",
      "yyyy-MM-dd",
      "MM/dd/yyyy",
      "dd-MM-yy",
      "dd/MM/yy",
    ];

    // Try parsing with different formats
    for (const formatStr of formats) {
      try {
        const parsed = parse(dateText, formatStr, new Date());
        if (isValid(parsed)) {
          return parsed;
        }
      } catch (e) {
        // Continue to next format
      }
    }

    // Try parsing natural language dates
    try {
      // Handle formats like "june 10 2025", "jan 15 2024", etc.
      const monthNames = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
      ];

      const monthAbbr = [
        "jan",
        "feb",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec",
      ];

      // Match patterns like "june 10 2025" or "jan 15 2024"
      const naturalMatch = text.match(/(\w+)\s+(\d{1,2})\s+(\d{4})/);
      if (naturalMatch) {
        const [, monthStr, day, year] = naturalMatch;
        let monthIndex = monthNames.indexOf(monthStr);
        if (monthIndex === -1) {
          monthIndex = monthAbbr.indexOf(monthStr);
        }
        if (monthIndex !== -1) {
          const date = new Date(parseInt(year), monthIndex, parseInt(day));
          if (isValid(date)) {
            return date;
          }
        }
      }

      // Try native Date parsing as fallback
      const nativeDate = new Date(dateText);
      if (isValid(nativeDate) && nativeDate.getFullYear() > 1900) {
        return nativeDate;
      }
    } catch (e) {
      // Ignore parsing errors
    }

    return null;
  };

  const validateInputs = () => {
    const newErrors: Record<string, string> = {};

    // Parse dates
    const fromDate = fromDateText.trim() ? parseSmartDate(fromDateText) : null;
    const toDate = toDateText.trim() ? parseSmartDate(toDateText) : null;
    const duration = loanDurationMonths.trim()
      ? parseInt(loanDurationMonths)
      : null;

    // Validate date formats
    if (fromDateText.trim() && !fromDate) {
      newErrors.fromDate =
        "Invalid date format. Try: 21-10-2025 or June 10 2025";
    }
    if (toDateText.trim() && !toDate) {
      newErrors.toDate = "Invalid date format. Try: 21-10-2025 or June 10 2025";
    }

    // Validate duration format
    if (
      loanDurationMonths.trim() &&
      (!duration || duration <= 0 || duration > 600)
    ) {
      newErrors.loanDuration = "Duration must be between 1 and 600 months";
    }

    // Check valid combinations - either date range OR duration only
    const hasValidFromDate = fromDateText.trim() && fromDate;
    const hasValidToDate = toDateText.trim() && toDate;
    const hasValidDuration = loanDurationMonths.trim() && duration;

    const hasDateRange = hasValidFromDate && hasValidToDate;
    const hasDurationOnly =
      hasValidDuration && !fromDateText.trim() && !toDateText.trim();

    if (!hasDateRange && !hasDurationOnly) {
      if (hasValidDuration && (fromDateText.trim() || toDateText.trim())) {
        newErrors.general = "When using Duration, leave both date fields empty";
      } else if ((hasValidFromDate || hasValidToDate) && hasValidDuration) {
        newErrors.general =
          "Choose either Date Range (From+To) OR Duration only";
      } else if (hasValidFromDate && !hasValidToDate) {
        newErrors.toDate = "Add To Date to complete the date range";
      } else if (!hasValidFromDate && hasValidToDate) {
        newErrors.fromDate = "Add From Date to complete the date range";
      } else {
        newErrors.general = "Choose either: From+To dates OR Duration only";
      }
    }

    // Validate date logic
    if (fromDate && toDate) {
      if (fromDate >= toDate) {
        newErrors.toDate = "To date must be after from date";
      }
    }

    if (!loanAmount || parseFloat(loanAmount) <= 0) {
      newErrors.loanAmount = "Valid loan amount is required";
    }

    if (
      !interestRate ||
      parseFloat(interestRate) <= 0 ||
      parseFloat(interestRate) > 100
    ) {
      newErrors.interestRate = "Interest rate must be between 0 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateEMI = () => {
    if (!validateInputs()) return;

    const principal = parseFloat(loanAmount);
    const annualRate = parseFloat(interestRate);
    const monthlyRate = annualRate / (12 * 100);

    // Parse available inputs
    const fromDate = fromDateText.trim() ? parseSmartDate(fromDateText) : null;
    const toDate = toDateText.trim() ? parseSmartDate(toDateText) : null;
    const duration = loanDurationMonths.trim()
      ? parseInt(loanDurationMonths)
      : null;

    let tenureMonths: number = 0;
    let calculatedMonthlyEMI: number = 0;
    let calculatedTotalAmount: number = 0;
    let calculatedTotalInterest: number = 0;
    let calculatedTenureYears: number = 0;

    if (fromDate && toDate) {
      // Simple Interest Calculation Mode: From Date + To Date
      const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Total days in the period

      // Calculate simple interest based on 30-day month convention for interest calculation
      // Interest = Principal * Rate * (Days / 365)
      calculatedTotalInterest = principal * (annualRate / 100) * (diffDays / 365);
      calculatedTotalAmount = principal + calculatedTotalInterest;
      
      // For display purposes, we can still represent tenure in months/years
      // Using 30 days per month for tenure display consistency with the interest calculation basis
      tenureMonths = Math.round(diffDays / 30);
      calculatedTenureYears = Math.floor(tenureMonths / 12);

      setCalculationMode('interest_only');

    } else if (duration && !fromDateText.trim() && !toDateText.trim()) {
      // EMI Calculation Mode: Just loan duration
      tenureMonths = duration;

      // EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
      calculatedMonthlyEMI =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1);

      calculatedTotalAmount = calculatedMonthlyEMI * tenureMonths;
      calculatedTotalInterest = calculatedTotalAmount - principal;
      calculatedTenureYears = Math.floor(tenureMonths / 12);

      setCalculationMode('emi');
    } else {
      return; // Should not reach here due to validation
    }

    setResult({
      monthlyEMI: calculatedMonthlyEMI,
      totalAmount: calculatedTotalAmount,
      totalInterest: calculatedTotalInterest,
      tenureMonths: tenureMonths,
      tenureYears: calculatedTenureYears,
    });
  };

  const resetForm = () => {
    setFromDateText("");
    setToDateText("");
    setLoanDurationMonths("");
    setLoanAmount("");
    setInterestRate("");
    setResult(null);
    setErrors({});
  };

  // Real-time calculation
  useEffect(() => {
    const principal = parseFloat(loanAmount);
    const annualRate = parseFloat(interestRate);

    const fromDate = fromDateText.trim() ? parseSmartDate(fromDateText) : null;
    const toDate = toDateText.trim() ? parseSmartDate(toDateText) : null;
    const duration = loanDurationMonths.trim()
      ? parseInt(loanDurationMonths)
      : null;

    const hasValidFromDate = fromDateText.trim() && fromDate;
    const hasValidToDate = toDateText.trim() && toDate;
    const hasValidDuration = loanDurationMonths.trim() && duration;

    const hasDateRange = hasValidFromDate && hasValidToDate;
    const hasDurationOnly =
      hasValidDuration && !fromDateText.trim() && !toDateText.trim();

    // Determine if inputs are in a state where a calculation can proceed
    const isReadyForCalculation =
      (hasDateRange || hasDurationOnly) &&
      !isNaN(principal) && principal > 0 &&
      !isNaN(annualRate) && annualRate > 0 && annualRate <= 100 &&
      Object.keys(errors).length === 0;

    if (isReadyForCalculation) {
      calculateEMI();
    } else {
      // If not ready for calculation, clear the result if it's currently displayed
      if (result !== null) {
        setResult(null);
      }
    }
  }, [fromDateText, toDateText, loanDurationMonths, loanAmount, interestRate, errors]);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          EMI Calculator
        </CardTitle>
        <CardDescription className="text-center">
          Calculate your Equated Monthly Installment for loans
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date and Duration Section */}
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <h4 className="font-medium text-blue-800 mb-2">
              Loan Tenure Options
            </h4>
            <p className="text-sm text-blue-700">
              Choose <strong>either</strong> Date Range (From + To dates){" "}
              <strong>OR</strong> Duration only
            </p>
          </div>

          {/* Side by Side Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Date Range Section */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-4">
              <h5 className="font-medium text-green-800 mb-2">
                Option 1: Date Range
              </h5>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fromDate">From Date</Label>
                  <Input
                    id="fromDate"
                    type="text"
                    placeholder="e.g., 21-10-2025"
                    value={fromDateText}
                    onChange={(e) => setFromDateText(e.target.value)}
                    className={errors.fromDate ? "border-red-500" : ""}
                    disabled={loanDurationMonths.trim() !== ""}
                  />
                  {errors.fromDate && (
                    <p className="text-sm text-red-600">{errors.fromDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toDate">To Date</Label>
                  <Input
                    id="toDate"
                    type="text"
                    placeholder="e.g., June 10 2045"
                    value={toDateText}
                    onChange={(e) => setToDateText(e.target.value)}
                    className={errors.toDate ? "border-red-500" : ""}
                    disabled={loanDurationMonths.trim() !== ""}
                  />
                  {errors.toDate && (
                    <p className="text-sm text-red-600">{errors.toDate}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Duration Section */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 space-y-4">
              <h5 className="font-medium text-orange-800 mb-2">
                Option 2: Duration Only
              </h5>
              <div className="space-y-2">
                <Label htmlFor="loanDuration">Loan Duration (Months)</Label>
                <Input
                  id="loanDuration"
                  type="number"
                  placeholder="e.g., 60 (5 years)"
                  value={loanDurationMonths}
                  onChange={(e) => setLoanDurationMonths(e.target.value)}
                  className={errors.loanDuration ? "border-red-500" : ""}
                  max="600"
                  disabled={
                    fromDateText.trim() !== "" || toDateText.trim() !== ""
                  }
                />
                {errors.loanDuration && (
                  <p className="text-sm text-red-600">{errors.loanDuration}</p>
                )}
              </div>
            </div>
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600 font-medium">
                {errors.general}
              </p>
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Date formats: 21-10-2025, June 10 2025, 2025-10-21</p>
            <p>• When using dates, both From and To dates are required</p>
            <p>• When using duration, leave both date fields empty</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="loanAmount">
              {fromDateText.trim() || toDateText.trim()
                ? "Outstanding Principal (₹)"
                : "Loan Amount (₹)"}
            </Label>
            <Input
              id="loanAmount"
              type="number"
              placeholder={
                fromDateText.trim() || toDateText.trim()
                  ? "Enter outstanding principal"
                  : "Enter loan amount"
              }
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              className={errors.loanAmount ? "border-red-500" : ""}
            />
            {errors.loanAmount && (
              <p className="text-sm text-red-600">{errors.loanAmount}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="interestRate">
              {fromDateText.trim() || toDateText.trim()
                ? "Rate of Interest* (if RR or Period Over take Interest+Penal as Interest)"
                : "Interest Rate (%)"}
            </Label>
            <Input
              id="interestRate"
              type="number"
              step="0.01"
              placeholder="Enter interest rate"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className={errors.interestRate ? "border-destructive" : ""}
            />
            {errors.interestRate && (
              <p className="text-sm text-red-600">{errors.interestRate}</p>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={calculateEMI} className="flex-1">
            Calculate EMI
          </Button>
          <Button onClick={resetForm} variant="outline" className="flex-1">
            Reset
          </Button>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-6">
            <h3 className="text-lg font-semibold mb-3">Calculation Results</h3>

            {/* Show parsed start date */}
            {fromDateText && (
              <div className="mb-3 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Loan Start Date:</span>
                  <span className="font-medium text-blue-800">
                    {parseSmartDate(fromDateText)
                      ? format(parseSmartDate(fromDateText)!, "PPP")
                      : "Invalid date"}
                  </span>
                </div>
              </div>
            )}

            {calculationMode === 'interest_only' ? (
              // Display for Interest Only Calculation (full width)
              <div className="space-y-4 pt-4">
                <h3 className="text-xl font-bold text-center text-purple-700">
                  Interest Calculation Result
                </h3>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium text-lg">
                    Interest:
                  </span>
                  <span className="text-3xl font-extrabold text-purple-800">
                    ₹{Number(result.totalInterest.toFixed(2)).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-t pt-3">
                  <span className="text-gray-600 font-medium text-lg">
                    Total Amount (Principal + Interest):
                  </span>
                  <span className="text-xl font-bold text-purple-700">
                    ₹{Number(result.totalAmount.toFixed(2)).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ) : (
              // Existing EMI Calculation Display (grid layout with pie chart)
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Numerical Results */}
                <div className="space-y-4">
                  {/* Input Summary */}
                  <div className="bg-white p-4 rounded-lg border space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        {fromDateText.trim() || toDateText.trim()
                          ? "Outstanding Principal"
                          : "Loan amount"}
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        ₹ {parseFloat(loanAmount).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Rate of interest (p.a)
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        {parseFloat(interestRate)} %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            parseFloat(interestRate) * 5,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Loan tenure</span>
                      <span className="text-2xl font-bold text-green-600">
                        {Math.floor(result.tenureMonths / 12)} Yr
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            (result.tenureMonths / 12) * 3.33,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">
                        Monthly EMI
                      </span>
                      <span className="text-xl font-bold">
                        ₹{Math.round(result.monthlyEMI).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">
                        Principal amount
                      </span>
                      <span className="text-lg font-semibold">
                        ₹{parseFloat(loanAmount).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">
                        Total interest
                      </span>
                      <span className="text-lg font-semibold">
                        ₹
                        {Math.round(result.totalInterest).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t pt-3">
                      <span className="text-gray-600 font-medium">
                        Total amount
                      </span>
                      <span className="text-xl font-bold">
                        ₹{Math.round(result.totalAmount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">Loan Breakdown</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Principal Amount",
                              value: parseFloat(loanAmount),
                              color: "#3b82f6",
                            },
                            {
                              name: "Total Interest",
                              value: result.totalInterest,
                              color: "#ef4444",
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${percent !== undefined ? (percent * 100).toFixed(1) : 'N/A'}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [
                            formatCurrency(value),
                            "",
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>
                        Principal (
                        {(
                          (parseFloat(loanAmount) / result.totalAmount) *
                          100
                        ).toFixed(1)}
                        %)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>
                        Interest (
                        {(
                          (result.totalInterest / result.totalAmount) *
                          100
                        ).toFixed(1)}
                        %)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
