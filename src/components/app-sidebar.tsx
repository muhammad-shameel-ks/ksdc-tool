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
  const [status, setStatus] = React.useState({ message: "", dbName: "" });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
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
    <div className="z-50 group-data-[collapsible=icon]:hidden">
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
              {loading
                ? "Checking..."
                : error
                ? "Error"
                : status.dbName}
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto">
          <p>
            {loading
              ? "Checking connection..."
              : error
              ? `Error: ${error}`
              : "Connected"}
          </p>
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
