"use client"

import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { ChevronDown, ChevronRight, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StepCardProps {
  stepNumber: number
  title: string
  description: string
  status?: "pending" | "active" | "completed" | "disabled"
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  children?: ReactNode
  error?: string
}

export function StepCard({
  stepNumber,
  title,
  description,
  status,
  isCollapsed = false,
  onToggleCollapse,
  children,
  error,
}: StepCardProps) {
  const getStatusIcon = () => {
    if (!status) return null
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "active":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />
      case "disabled":
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = () => {
    if (!status) return null
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>
      case "active":
        return <Badge variant="secondary">Active</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "disabled":
        return <Badge variant="outline">Disabled</Badge>
    }
  }

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        status === "active" && "ring-2 ring-primary/20",
        status === "disabled" && "opacity-60",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
              {stepNumber}
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {title}
                {getStatusIcon()}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {status === "completed" && onToggleCollapse && (
              <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {(!isCollapsed || status !== "completed") && (
        <CardContent className="pt-0">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {children}
        </CardContent>
      )}
    </Card>
  )
}
