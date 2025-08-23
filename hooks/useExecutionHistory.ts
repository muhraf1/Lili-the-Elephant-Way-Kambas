"use client"

import { useState, useEffect, useCallback } from "react"
import { useAccount } from "wagmi"
import { TrailAPI } from "@/lib/trail-api"

export interface ExecutionStep {
  stepNumber: number
  nodeId: string | null
  txHash: string
  txBlockTimestamp: number | null
  txBlockNumber: number | null
  createdAt: string
}

export interface ExecutionData {
  id: string
  createdAt: string
  updatedAt: string
  steps: ExecutionStep[]
}

export interface StepStatus {
  status: "pending" | "active" | "completed" | "disabled"
  canExecute: boolean
  txHash?: string
  executionId?: string
}

export function useExecutionHistory() {
  const { address } = useAccount()
  const [executions, setExecutions] = useState<ExecutionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchExecutionHistory = async () => {
    if (!address) {
      setExecutions([])
      setLoading(false)
      return
    }

    try {
      console.log("[v0] Fetching execution history for:", address)
      const response = await TrailAPI.queryExecutions({
        walletAddresses: [address.toLowerCase()],
      })

      const walletExecution = response.walletExecutions?.find(
        (we: any) => we.walletAddress.toLowerCase() === address.toLowerCase(),
      )

      if (walletExecution?.executions) {
        // Filter out step 0 (trail start marker) and sort by creation date
        const filteredExecutions = walletExecution.executions.map((exec: any) => ({
          ...exec,
          steps: exec.steps.filter((step: any) => step.stepNumber > 0),
        }))

        setExecutions(filteredExecutions)
        console.log("[v0] Execution history loaded:", filteredExecutions)
      } else {
        setExecutions([])
      }
    } catch (err) {
      console.error("[v0] Failed to fetch execution history:", err)
      setError("Failed to load execution history")
    } finally {
      setLoading(false)
    }
  }

  const getLatestExecution = useCallback((): ExecutionData | null => {
    if (executions.length === 0) return null
    return executions.reduce((latest, current) =>
      new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest,
    )
  }, [executions])

  const getStepStatus = useCallback(
    (stepNumber: number): StepStatus => {
      if (!address) {
        return { status: "disabled", canExecute: false }
      }

      const latestExecution = getLatestExecution()

      if (!latestExecution) {
        // No executions yet - only step 1 should be active
        return {
          status: stepNumber === 1 ? "active" : "pending",
          canExecute: stepNumber === 1,
        }
      }

      // Find the step in the latest execution
      const executedStep = latestExecution.steps.find((step) => step.stepNumber === stepNumber)

      if (executedStep) {
        // Step has been executed
        return {
          status: "completed",
          canExecute: true, // Allow re-execution
          txHash: executedStep.txHash,
          executionId: latestExecution.id,
        }
      }

      // Step hasn't been executed yet
      // Check if previous steps are completed
      const maxCompletedStep = Math.max(0, ...latestExecution.steps.map((step) => step.stepNumber))

      if (stepNumber === maxCompletedStep + 1) {
        // This is the next step to execute
        return { status: "active", canExecute: true }
      } else if (stepNumber > maxCompletedStep + 1) {
        // Future step - not yet available
        return { status: "pending", canExecute: false }
      } else {
        // This shouldn't happen, but handle it gracefully
        return { status: "pending", canExecute: false }
      }
    },
    [address, executions],
  )

  const getCurrentStep = useCallback((): number => {
    const latestExecution = getLatestExecution()
    if (!latestExecution || latestExecution.steps.length === 0) {
      return 1 // Start with step 1
    }

    const maxCompletedStep = Math.max(...latestExecution.steps.map((step) => step.stepNumber))
    return Math.min(maxCompletedStep + 1, 3) // Max step is 3
  }, [executions])

  const refetchHistory = () => {
    setLoading(true)
    setError(null)
    fetchExecutionHistory()
  }

  useEffect(() => {
    fetchExecutionHistory()
  }, [address])

  return {
    executions,
    loading,
    error,
    getStepStatus,
    getCurrentStep,
    getLatestExecution,
    refetchHistory,
  }
}
