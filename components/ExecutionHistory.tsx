"use client"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { History, ExternalLink, Clock } from "lucide-react"
import { useExecutionHistory } from "@/hooks/useExecutionHistory"
import { TrailUtils } from "@/lib/trail-api"

export function ExecutionHistory() {
  const { executions, loading, error } = useExecutionHistory()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Your Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 border rounded-lg space-y-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Your Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">{error}</p>
        </CardContent>
      </Card>
    )
  }

  const getStepName = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return "USDC Approval"
      case 2:
        return "Donation"
      case 3:
        return "Refund Claim"
      default:
        return `Step ${stepNumber}`
    }
  }

  const getStepColor = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case 2:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case 3:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Your Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {executions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {executions.map((execution, execIndex) => (
              <div key={execution.id} className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Execution #{execIndex + 1}</h4>
                  <span className="text-xs text-muted-foreground">
                    {new Date(execution.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2">
                  {execution.steps.map((step) => (
                    <div
                      key={`${execution.id}-${step.stepNumber}`}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`text-xs ${getStepColor(step.stepNumber)}`}>
                          {getStepName(step.stepNumber)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {step.txBlockTimestamp ? TrailUtils.formatDate(step.txBlockTimestamp.toString()) : "Pending"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono">
                          {step.txHash.slice(0, 6)}...{step.txHash.slice(-4)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1"
                          onClick={() => window.open(TrailUtils.getExplorerLink("tx", step.txHash), "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {execution.steps.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No steps completed in this execution</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
