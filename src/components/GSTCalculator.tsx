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
import { ClipboardCopy } from "lucide-react";

interface InclusiveGSTResult {
  totalAmount: number;
  processingFee: number;
  gstAmount: number;
}

interface ExclusiveGSTResult {
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
}

export function GSTCalculator() {
  // Section 1: Amount Includes GST (Reverse GST)
  const [inclusiveAmount, setInclusiveAmount] = useState<string>("");
  const [inclusiveResult, setInclusiveResult] =
    useState<InclusiveGSTResult | null>(null);

  // Section 2: Amount Excludes GST (Forward GST)
  const [exclusiveAmount, setExclusiveAmount] = useState<string>("");
  const [exclusiveResult, setExclusiveResult] =
    useState<ExclusiveGSTResult | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const GST_RATE = 18; // Fixed 18% GST rate

  // Calculate Reverse GST (Amount includes GST)
  const calculateInclusiveGST = () => {
    if (!inclusiveAmount || parseFloat(inclusiveAmount) <= 0) {
      setErrors({ inclusive: "Valid amount is required" });
      return;
    }

    const total = parseFloat(inclusiveAmount);
    // Processing Fee = Amount × 100 ÷ 118
    const processingFee = (total * 100) / 118;
    // GST Amount = Total Amount - Processing Fee
    const gstAmount = total - processingFee;

    setInclusiveResult({
      totalAmount: total,
      processingFee: Number(processingFee.toFixed(4)),
      gstAmount: Number(gstAmount.toFixed(4)),
    });
    setErrors({});
  };

  // Calculate Forward GST (Amount excludes GST)
  const calculateExclusiveGST = () => {
    if (!exclusiveAmount || parseFloat(exclusiveAmount) <= 0) {
      setErrors({ exclusive: "Valid amount is required" });
      return;
    }

    const base = parseFloat(exclusiveAmount);
    // Total Amount = Base Amount × 118%
    const totalAmount = (base * 118) / 100;
    // GST Amount = Total Amount - Base Amount
    const gstAmount = totalAmount - base;

    setExclusiveResult({
      baseAmount: base,
      gstAmount: Number(gstAmount.toFixed(4)),
      totalAmount: Number(totalAmount.toFixed(4)),
    });
    setErrors({});
  };

  const resetForm = () => {
    setInclusiveAmount("");
    setExclusiveAmount("");
    setInclusiveResult(null);
    setExclusiveResult(null);
    setErrors({});
  };

  // Real-time calculations
  useEffect(() => {
    if (inclusiveAmount && Object.keys(errors).length === 0) {
      calculateInclusiveGST();
    }
  }, [inclusiveAmount]);

  useEffect(() => {
    if (exclusiveAmount && Object.keys(errors).length === 0) {
      calculateExclusiveGST();
    }
  }, [exclusiveAmount]);

  return (
    <Card className="w-full max-w-5xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          GST Calculator
        </CardTitle>
        <CardDescription className="text-center">
          Calculate GST with 18% rate - Choose your calculation method
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* GST Rate Display */}
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400 text-center">
          <div className="flex justify-center items-center space-x-2">
            <span className="text-blue-700 font-medium">GST Rate:</span>
            <span className="font-bold text-xl text-blue-800">{GST_RATE}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section 1: Amount Includes GST (Reverse GST) */}
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
              <h3 className="font-semibold text-green-800 mb-2">
                Section 1: Amount Includes GST
              </h3>
              <p className="text-sm text-green-700">
                Calculate processing fee from GST-inclusive amount
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border space-y-3">
              <Label htmlFor="inclusiveAmount" className="text-gray-600">
                Total Amount (GST Inclusive)
              </Label>
              <Input
                id="inclusiveAmount"
                type="number"
                placeholder="e.g., 1000"
                value={inclusiveAmount}
                onChange={(e) => setInclusiveAmount(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                className={`text-lg font-semibold ${
                  errors.inclusive ? "border-red-500" : ""
                }`}
                step="0.01"
              />
              {errors.inclusive && (
                <p className="text-sm text-red-600">{errors.inclusive}</p>
              )}
            </div>

            {inclusiveResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4 text-center">
                <h4 className="font-medium text-gray-800">Results:</h4>

                {/* Main Results - Stand Out */}
                <div className="flex flex-col items-center gap-6">
                  <div className="bg-green-100 p-4 rounded-lg border-2 border-green-300 w-full max-w-md">
                    <div className="text-center">
                      <span className="text-sm text-green-700 font-medium block">
                        Processing Fee
                      </span>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xl font-bold text-green-800 whitespace-nowrap">
                          ₹{inclusiveResult.processingFee.toFixed(4)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopy(inclusiveResult.processingFee.toFixed(4))
                          }
                          className="p-1 h-auto flex-shrink-0"
                        >
                          <ClipboardCopy className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-100 p-4 rounded-lg border-2 border-blue-300 w-full max-w-md">
                    <div className="text-center">
                      <span className="text-sm text-blue-700 font-medium block">
                        GST Amount
                      </span>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xl font-bold text-blue-800 whitespace-nowrap">
                          ₹{inclusiveResult.gstAmount.toFixed(4)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopy(inclusiveResult.gstAmount.toFixed(4))
                          }
                          className="p-1 h-auto flex-shrink-0"
                        >
                          <ClipboardCopy className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-2 pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      Processing Fee (Exact):
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">
                        ₹{inclusiveResult.processingFee.toFixed(5)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopy(inclusiveResult.processingFee.toFixed(5))
                        }
                        className="p-1 h-auto"
                      >
                        <ClipboardCopy className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">GST Amount (Exact):</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">
                        ₹{inclusiveResult.gstAmount.toFixed(5)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopy(inclusiveResult.gstAmount.toFixed(5))
                        }
                        className="p-1 h-auto"
                      >
                        <ClipboardCopy className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-gray-600 font-medium">
                      Total Amount:
                    </span>
                    <span className="font-bold text-lg">
                      ₹{inclusiveResult.totalAmount.toFixed(5)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Amount Excludes GST (Forward GST) */}
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
              <h3 className="font-semibold text-orange-800 mb-2">
                Section 2: Amount Excludes GST
              </h3>
              <p className="text-sm text-orange-700">
                Calculate total amount from GST-exclusive base amount
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border space-y-3">
              <Label htmlFor="exclusiveAmount" className="text-gray-600">
                Base Amount (GST Exclusive)
              </Label>
              <Input
                id="exclusiveAmount"
                type="number"
                placeholder="e.g., 847.45"
                value={exclusiveAmount}
                onChange={(e) => setExclusiveAmount(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                className={`text-lg font-semibold ${
                  errors.exclusive ? "border-red-500" : ""
                }`}
                step="0.01"
              />
              {errors.exclusive && (
                <p className="text-sm text-red-600">{errors.exclusive}</p>
              )}
            </div>

            {exclusiveResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4 text-center">
                <h4 className="font-medium text-gray-800">Results:</h4>

                {/* Main Results - Stand Out */}
                <div className="flex flex-col items-center gap-6">
                  <div className="bg-green-100 p-4 rounded-lg border-2 border-green-300 w-full max-w-md">
                    <div className="text-center">
                      <span className="text-sm text-green-700 font-medium block">
                        Total Amount
                      </span>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xl font-bold text-green-800 whitespace-nowrap">
                          ₹{exclusiveResult.totalAmount.toFixed(4)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopy(exclusiveResult.totalAmount.toFixed(4))
                          }
                          className="p-1 h-auto flex-shrink-0"
                        >
                          <ClipboardCopy className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-100 p-4 rounded-lg border-2 border-blue-300 w-full max-w-md">
                    <div className="text-center">
                      <span className="text-sm text-blue-700 font-medium block">
                        GST Amount
                      </span>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xl font-bold text-blue-800 whitespace-nowrap">
                          ₹{exclusiveResult.gstAmount.toFixed(4)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopy(exclusiveResult.gstAmount.toFixed(4))
                          }
                          className="p-1 h-auto flex-shrink-0"
                        >
                          <ClipboardCopy className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-2 pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Amount (Exact):</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">
                        ₹{exclusiveResult.totalAmount.toFixed(4)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopy(exclusiveResult.totalAmount.toFixed(4))
                        }
                        className="p-1 h-auto"
                      >
                        <ClipboardCopy className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">GST Amount (Exact):</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">
                        ₹{exclusiveResult.gstAmount.toFixed(4)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopy(exclusiveResult.gstAmount.toFixed(4))
                        }
                        className="p-1 h-auto"
                      >
                        <ClipboardCopy className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-gray-600 font-medium">
                      Total Amount:
                    </span>
                    <span className="font-bold text-lg">
                      ₹{exclusiveResult.totalAmount.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex justify-center">
          <Button onClick={resetForm} variant="outline" className="px-8">
            Reset All Calculations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

async function handleCopy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  } catch (err) {
    console.error("Failed to copy: ", err);
    alert("Failed to copy to clipboard.");
  }
}
