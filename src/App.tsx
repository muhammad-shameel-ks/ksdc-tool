import { EMICalculator } from "./components/EMICalculator";
import { GSTCalculator } from "./components/GSTCalculator";
import DeductionCalculator from "./components/DeductionCalculator";
import TransactionGenerator from "./components/TransactionGenerator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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

        <Tabs defaultValue="transaction-generator" className="w-full max-w-7xl mx-auto">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="emi">EMI Calculator</TabsTrigger>
            <TabsTrigger value="gst">GST Calculator</TabsTrigger>
            <TabsTrigger value="deduction">Deduction Calculator</TabsTrigger>
            <TabsTrigger value="transaction-generator">Transaction Generator</TabsTrigger>
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
              <TransactionGenerator />
            </div>
          </TabsContent>
        </Tabs>

        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>Built with React, TypeScript, and shadcn/ui</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
