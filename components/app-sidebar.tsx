"use client"

import {
  BarChart3,
  TrendingUp,
  FileText,
  Calendar,
  LineChart,
  Users,
  BarChart,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/components/ui/sidebar"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
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
    title: "Dealer Performance",
    url: "/dealer-performance",
    icon: TrendingUp,
  },
  {
    title: "Product Trends",
    url: "/product-trends",
    icon: LineChart,
  },
  {
    title: "Dealer Analytics",
    url: "/dealer-analytics",
    icon: TrendingUp,
  },
  // Keep only routes that exist in the app
]

const advancedItems = [
  {
    title: "Advanced Reports",
    url: "/advanced-reports",
    icon: FileText,
  },
]

const visualizationItems = [
  {
    title: "Monthly Breakdown",
    url: "/monthly-breakdown",
    icon: BarChart,
  },
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
  // Only include pages that exist
]

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile, isMobile } = useSidebar()

  const handleNavigation = () => {
    // Only close mobile menu when navigation link is clicked
    // Don't affect desktop sidebar state
    if (isMobile) {
      setOpenMobile(false)
    }
  }

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
                    <Link href={item.url} onClick={handleNavigation}>
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
                    <Link href={item.url} onClick={handleNavigation}>
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
                    <Link href={item.url} onClick={handleNavigation}>
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
      <SidebarRail />
    </Sidebar>
  )
}
