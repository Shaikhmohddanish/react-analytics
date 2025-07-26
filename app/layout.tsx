import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
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
                <div className="flex min-h-screen w-full">
                  <AppSidebar />
                  <SidebarInset className="flex-1 flex flex-col min-w-0">
                    <Header />
                    <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 bg-background">{children}</main>
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
