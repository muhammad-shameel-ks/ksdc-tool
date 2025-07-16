"use client"

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import BusinessCalculators from "@/components/BusinessCalculators";
import DeductionCalculator from "@/components/DeductionCalculator";
import SmartPartPaymentGen from "@/components/SmartPartPaymentGen";
import { SidebarProvider } from "@/components/ui/sidebar";

const pages: { [key: string]: React.ComponentType } = {
  "/business-calculators": BusinessCalculators,
  "/deduction": DeductionCalculator,
  "/smart-part-payment-gen": SmartPartPaymentGen,
};

export default function DashboardPage() {
  const [page, setPage] = useState("/business-calculators");
  const PageComponent = pages[page];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <AppSidebar setPage={setPage} />
        <main className="flex-1 p-8 flex items-center justify-center">
          {PageComponent && <PageComponent />}
        </main>
      </div>
    </SidebarProvider>
  );
}