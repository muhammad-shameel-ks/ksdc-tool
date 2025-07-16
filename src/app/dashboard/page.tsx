"use client"

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar"
import BusinessCalculators from "@/components/BusinessCalculators"
import DeductionCalculator from "@/components/DeductionCalculator"
import SmartPartPaymentGen from "@/components/SmartPartPaymentGen"
import { ReceiptChecker } from "@/components/ReceiptChecker"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

const pages: { [key: string]: React.ComponentType } = {
  "/business-calculators": BusinessCalculators,
  "/deduction": DeductionCalculator,
  "/smart-part-payment-gen": SmartPartPaymentGen,
  "/receipt-checker": ReceiptChecker,
};

export default function DashboardPage() {
  const [page, setPage] = useState("/business-calculators");
  const PageComponent = pages[page];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <AppSidebar setPage={setPage} />
        <SidebarInset>
          <div className={`flex-1 ${page === "/receipt-checker" ? "" : "p-8"}`}>
            {PageComponent && <PageComponent />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}