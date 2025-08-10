"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  RefreshCw, 
  Trash2, 
  Database, 
  HardDrive, 
  Cpu, 
  Activity,
  TrendingUp,
  Clock,
  AlertTriangle
} from "lucide-react"

export default function CacheSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cache Settings</h1>
        <p className="text-muted-foreground">
          Manage application caching and performance settings
        </p>
      </div>

      {/* Cache Status */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Status</CardTitle>
          <CardDescription>
            Current cache performance and statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Memory Cache</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Local Storage</p>
                <p className="text-xs text-muted-foreground">Enabled</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Server Cache</p>
                <p className="text-xs text-muted-foreground">5 min TTL</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Performance</p>
                <p className="text-xs text-muted-foreground">Optimized</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
          <CardDescription>
            Clear caches and refresh data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <Cpu className="h-4 w-4 mr-2" />
              Clear Memory Cache
            </Button>
            <Button variant="outline">
              <HardDrive className="h-4 w-4 mr-2" />
              Clear Local Storage
            </Button>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Caches
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cache Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Configuration</CardTitle>
          <CardDescription>
            Current cache settings and TTL values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Cache TTL Settings</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Short Cache:</span>
                  <span>5 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Medium Cache:</span>
                  <span>15 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Long Cache:</span>
                  <span>1 hour</span>
                </div>
                <div className="flex justify-between">
                  <span>Very Long Cache:</span>
                  <span>24 hours</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Cache Features</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Memory caching enabled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Local storage persistence</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Automatic cache invalidation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Performance monitoring</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>
            Cache hit rates and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Cache Hit Rate</span>
                <span>85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Memory Usage</span>
                <span>45%</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Response Time</span>
                <span>120ms avg</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
