import { EMICalculator } from "./components/EMICalculator";
import { GSTCalculator } from "./components/GSTCalculator";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Financial Calculators
          </h1>
          <p className="text-lg text-muted-foreground">
            Professional EMI and GST calculation tools
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-7xl mx-auto">
          <div className="flex justify-center">
            <EMICalculator />
          </div>
          <div className="flex justify-center">
            <GSTCalculator />
          </div>
        </div>

        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>Built with React, TypeScript, and shadcn/ui</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
