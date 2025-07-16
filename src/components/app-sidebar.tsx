import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconFolder,
  IconInnerShadowTop,
  IconSearch,
} from "@tabler/icons-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Business Calculators",
      url: "/business-calculators",
      icon: IconDashboard,
    },
    {
      title: "Deduction Calculator",
      url: "/deduction",
      icon: IconChartBar,
    },
    {
      title: "Smart Part Payment Gen",
      url: "/smart-part-payment-gen",
      icon: IconFolder,
    },
    {
      title: "Receipt Checker",
      url: "/receipt-checker",
      icon: IconSearch,
    },
  ],
}

const DbStatus = () => {
  const [currentDb, setCurrentDb] = React.useState("");
  const [selectedDb, setSelectedDb] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSwitching, setIsSwitching] = React.useState(false);

  const availableDbs = ["KSDC_SMART_LIVE_STAGING", "KSDC_SMART_LIVE"];

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/current-db");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCurrentDb(data.dbName);
      setSelectedDb(data.dbName);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStatus();
  }, []);

  const handleSwitch = async () => {
    try {
      setIsSwitching(true);
      setError(null);
      const response = await fetch("/api/switch-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dbName: selectedDb }),
      });
      if (!response.ok) {
        throw new Error("Failed to switch DB");
      }
      await fetchStatus(); // Refresh status
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="z-50 group-data-[collapsible=icon]:hidden">
      <Popover>
        <PopoverTrigger>
          <div className="flex items-center space-x-2 cursor-pointer rounded-full bg-card p-2 border">
            <div
              className={`w-3 h-3 rounded-full ${
                loading || isSwitching
                  ? "bg-yellow-500 animate-pulse"
                  : error
                  ? "bg-red-500"
                  : "bg-green-500"
              }`}
            ></div>
            <span className="text-sm text-muted-foreground">
              {loading
                ? "Checking..."
                : error
                ? "Error"
                : currentDb}
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Switch Database</p>
            <select
              value={selectedDb}
              onChange={(e) => setSelectedDb(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {availableDbs.map((db) => (
                <option key={db} value={db}>
                  {db}
                </option>
              ))}
            </select>
            <button
              onClick={handleSwitch}
              disabled={isSwitching || selectedDb === currentDb}
              className="w-full bg-primary text-primary-foreground p-2 rounded-md disabled:opacity-50"
            >
              {isSwitching ? "Switching..." : "Switch"}
            </button>
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export function AppSidebar({ setPage, ...props }: React.ComponentProps<typeof Sidebar> & { setPage: (page: string) => void }) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-between">
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 group-data-[collapsible=icon]:hidden"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">KSDC</span>
              </a>
            </SidebarMenuButton>
            <SidebarTrigger />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} setPage={setPage} />
      </SidebarContent>
      <SidebarFooter>
        <DbStatus />
      </SidebarFooter>
    </Sidebar>
  )
}
