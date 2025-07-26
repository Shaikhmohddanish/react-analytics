"use client"

import {
  BarChart3,
  TrendingUp,
  FileText,
  Calendar,
  LineChart,
  PieChart,
  Users,
  Package,
  DollarSign,
  Target,
  Zap,
  Brain,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const mainItems = [
  {
    title: "Overview Dashboard",
    url: "/overview",
    icon: BarChart3,
  },
  {
    title: "Dealer Dashboard",
    url: "/dealer-dashboard",
    icon: Users,
  },
  {
    title: "Dealer Analytics",
    url: "/dealer-analytics",
    icon: TrendingUp,
  },
  {
    title: "Product Analytics",
    url: "/product-analytics",
    icon: Package,
  },
]

const advancedItems = [
  {
    title: "Advanced Reports",
    url: "/advanced-reports",
    icon: FileText,
  },
  {
    title: "Predictive Analytics",
    url: "/predictive-analytics",
    icon: Brain,
  },
  {
    title: "Performance Metrics",
    url: "/performance-metrics",
    icon: Target,
  },
  {
    title: "Real-time Insights",
    url: "/real-time-insights",
    icon: Zap,
  },
]

const visualizationItems = [
  {
    title: "Weekly Flow",
    url: "/weekly-flow",
    icon: Calendar,
  },
  {
    title: "Yearly Trends",
    url: "/yearly-trend",
    icon: LineChart,
  },
  {
    title: "Market Analysis",
    url: "/market-analysis",
    icon: PieChart,
  },
  {
    title: "Financial Overview",
    url: "/financial-overview",
    icon: DollarSign,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Advanced Features</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {advancedItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Visualizations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visualizationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
