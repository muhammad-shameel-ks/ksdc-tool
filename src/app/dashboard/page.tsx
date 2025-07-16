"use client"

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { EMICalculator } from "@/components/EMICalculator";
import { GSTCalculator } from "@/components/GSTCalculator";
import DeductionCalculator from "@/components/DeductionCalculator";
import SmartPartPaymentGen from "@/components/SmartPartPaymentGen";
import { SidebarProvider } from "@/components/ui/sidebar";

const pages: { [key: string]: React.ComponentType } = {
  "/emi": EMICalculator,
  "/gst": GSTCalculator,
  "/deduction": DeductionCalculator,
  "/smart-part-payment-gen": SmartPartPaymentGen,
};

export default function DashboardPage() {
  const [page, setPage] = useState("/emi");
  const PageComponent = pages[page];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <AppSidebar setPage={setPage} />
        <main className="flex-1 p-8">
          {PageComponent && <PageComponent />}
        </main>
      </div>
    </SidebarProvider>
  );
}