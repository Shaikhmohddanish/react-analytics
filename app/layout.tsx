import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { DataProvider } from "@/contexts/data-context"
import { FilterProvider } from "@/contexts/filter-context"
import { Header } from "@/components/header"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Advanced Delivery Analytics Dashboard",
  description: "Professional analytics dashboard for delivery challan data with advanced features",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <DataProvider>
            <FilterProvider>
              <SidebarProvider>
                <div className="flex min-h-screen w-full overflow-x-hidden">
                  <AppSidebar />
                  <SidebarInset className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
                    <SidebarTrigger className="hidden md:inline-flex absolute left-2 top-2 z-20 md:peer-data-[state=collapsed]:inline-flex md:peer-data-[state=expanded]:hidden" />
                    <Header />
                    <main className="flex-1 overflow-auto overflow-x-hidden p-3 sm:p-4 lg:p-6 bg-background">{children}</main>
                  </SidebarInset>
                </div>
              </SidebarProvider>
            </FilterProvider>
          </DataProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
