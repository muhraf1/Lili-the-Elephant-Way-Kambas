"use client"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { ExternalLink, Users, TrendingUp } from "lucide-react"
import { useCommunityData } from "@/hooks/useCommunityData"
import { TrailUtils } from "@/lib/trail-api"

export function CommunityFeed() {
  const { communityData, loading, error } = useCommunityData()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Community Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                  <div className="h-2 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !communityData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Community Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">Failed to load community data</p>
        </CardContent>
      </Card>
    )
  }

  const { totals } = communityData
  const allTransactions: Array<{ stepNumber: number; transaction: any }> = []

  // Collect all transactions from all steps
  Object.entries(totals.stepStats || {}).forEach(([stepNumber, stepStats]) => {
    stepStats.transactionHashes?.forEach((tx) => {
      allTransactions.push({
        stepNumber: Number.parseInt(stepNumber),
        transaction: tx,
      })
    })
  })

  // Sort by block timestamp (most recent first)
  allTransactions.sort((a, b) => b.transaction.blockTimestamp - a.transaction.blockTimestamp)

  const getStepName = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return "Approved USDC"
      case 2:
        return "Donated"
      case 3:
        return "Claimed Refund"
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Community Activity
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>{totals.wallets} donors</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Community Stats */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold">{totals.transactions}</div>
            <div className="text-xs text-muted-foreground">Total Transactions</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{totals.wallets}</div>
            <div className="text-xs text-muted-foreground">Unique Donors</div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Recent Activity</h4>
          <div className="max-h-64 overflow-y-auto space-y-3">
            {allTransactions.slice(0, 10).map(({ stepNumber, transaction }, index) => (
              <div
                key={`${transaction.txHash}-${index}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={transaction.farcasterData?.pfp_url || "/placeholder.svg"}
                    alt={transaction.farcasterData?.username || "User"}
                  />
                  <AvatarFallback className="text-xs">
                    {transaction.farcasterData?.username?.[0]?.toUpperCase() ||
                      transaction.walletAddress.slice(2, 4).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate">
                      {transaction.farcasterData?.username
                        ? `@${transaction.farcasterData.username}`
                        : `${transaction.walletAddress.slice(0, 6)}...${transaction.walletAddress.slice(-4)}`}
                    </span>
                    <Badge variant="secondary" className={`text-xs ${getStepColor(stepNumber)}`}>
                      {getStepName(stepNumber)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{TrailUtils.formatDate(transaction.blockTimestamp.toString())}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => window.open(TrailUtils.getExplorerLink("tx", transaction.txHash), "_blank")}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {allTransactions.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No community activity yet</p>
                <p className="text-xs">Be the first to donate!</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
