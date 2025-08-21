import { useState } from "react";
import BusinessCalculators from "./components/BusinessCalculators";
import DeductionCalculator from "./components/DeductionCalculator";
import SmartPartPaymentGen from "./components/SmartPartPaymentGen";
import { ReceiptChecker } from "./components/ReceiptChecker";
import TransactionCanceller from "./components/TransactionCanceller";
import BankGenerator from "./components/BankGenerator";
import SchemeChanger from "./components/SchemeChanger";
import { AppSidebar } from "./components/app-sidebar";
import { SiteHeader } from "./components/site-header";
import { SidebarProvider, SidebarInset } from "./components/ui/sidebar";
import { LoanAppIdFinder } from "./components/LoanAppIdFinder";

function App() {
  const [page, setPage] = useState("business-calculators");

  const renderPage = () => {
    if (page === "business-calculators") {
      return <BusinessCalculators />;
    } else if (page === "deduction") {
      return <DeductionCalculator />;
    } else if (page === "smart-part-payment-gen") {
      return <SmartPartPaymentGen />;
    } else if (page === "receipt-checker") {
      return <ReceiptChecker />;
    } else if (page === "transaction-canceller") {
      return <TransactionCanceller />;
    } else if (page === "bank-generator") {
      return <BankGenerator />;
    } else if (page === "scheme-changer") {
      return <SchemeChanger />;
    }
    return <BusinessCalculators />;
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AppSidebar setPage={setPage} className="w-64" />
        <SidebarInset>
          <div className="flex-1 flex flex-col">
            <SiteHeader />
            <main className="flex-1 p-6 overflow-auto">{renderPage()}</main>
          </div>
        </SidebarInset>
        <LoanAppIdFinder />
      </div>
    </SidebarProvider>
  );
}

export default App;
