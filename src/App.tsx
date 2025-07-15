import { useState, useEffect } from "react";
import { EMICalculator } from "./components/EMICalculator";
import { GSTCalculator } from "./components/GSTCalculator";
import DeductionCalculator from "./components/DeductionCalculator";
import SmartPartPaymentGen from "./components/SmartPartPaymentGen";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const DbStatus = () => {
  const [status, setStatus] = useState({ message: '', version: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/test');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setStatus({ message: data.message, version: data.version });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  return (
    <div className="text-center p-4 my-4 rounded-md">
      <h2 className="text-lg font-semibold">Database Connection Status</h2>
      {loading && <p className="text-blue-500">Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && (
        <>
          <p className="text-green-500">{status.message}</p>
          <p className="text-sm text-muted-foreground">{status.version}</p>
        </>
      )}
    </div>
  );
};


function App() {
  return (
    <div className="min-h-screen bg-background">
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

        <DbStatus />

        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>Built with React, TypeScript, and shadcn/ui</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
