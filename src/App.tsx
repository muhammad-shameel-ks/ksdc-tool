import { useState, useEffect } from "react";
import { EMICalculator } from "./components/EMICalculator";
import { GSTCalculator } from "./components/GSTCalculator";
import DeductionCalculator from "./components/DeductionCalculator";
import SmartPartPaymentGen from "./components/SmartPartPaymentGen";
import { LoanAppIdFinder } from "./components/LoanAppIdFinder";
import { Bug } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const DbStatus = () => {
  const [status, setStatus] = useState({ message: "", dbName: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/test");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setStatus({ message: data.message, dbName: data.dbName });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50">
      <Popover>
        <PopoverTrigger>
          <div className="flex items-center space-x-2 cursor-pointer rounded-full bg-card p-2 border">
            <div
              className={`w-3 h-3 rounded-full ${
                loading
                  ? "bg-yellow-500 animate-pulse"
                  : error
                  ? "bg-red-500"
                  : "bg-green-500"
              }`}
            ></div>
            <span className="text-sm text-muted-foreground">
              {loading ? "Checking..." : error ? "Error" : "Connected"}
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto">
          {loading && <p>Loading...</p>}
          {error && <p>Error: {error}</p>}
          {!loading && !error && (
            <div>
              <p className="font-semibold">Database</p>
              <p>{status.dbName}</p>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};


function App() {
  return (
    <div className="min-h-screen bg-background">
      <DbStatus />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Financial Calculators
          </h1>
          <p className="text-lg text-muted-foreground">
            Professional EMI, GST and Deduction calculation tools
          </p>
        </div>

        <Tabs defaultValue="smart-part-payment-gen" className="w-full max-w-7xl mx-auto">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="emi">EMI Calculator</TabsTrigger>
            <TabsTrigger value="gst">GST Calculator</TabsTrigger>
            <TabsTrigger value="deduction">Deduction Calculator</TabsTrigger>
            <TabsTrigger value="transaction-generator">Smart Part Payment Gen</TabsTrigger>
          </TabsList>
          <TabsContent value="emi">
            <div className="flex justify-center mt-8">
              <EMICalculator />
            </div>
          </TabsContent>
          <TabsContent value="gst">
            <div className="flex justify-center mt-8">
              <GSTCalculator />
            </div>
          </TabsContent>
          <TabsContent value="deduction">
            <div className="flex justify-center mt-8">
              <DeductionCalculator />
            </div>
          </TabsContent>
          <TabsContent value="transaction-generator">
            <div className="flex justify-center mt-8">
              <SmartPartPaymentGen />
            </div>
          </TabsContent>
        </Tabs>

        <div className="fixed bottom-4 left-4">
          <Popover>
            <PopoverTrigger>
              <Bug className="h-8 w-8 text-muted-foreground hover:text-foreground" />
            </PopoverTrigger>
            <PopoverContent>
              <LoanAppIdFinder />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

export default App;
