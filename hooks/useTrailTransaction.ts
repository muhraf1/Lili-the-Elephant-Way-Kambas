"use client"

import { useState } from "react"
import { useAccount, useSendTransaction, useSwitchChain } from "wagmi"
import { base } from "wagmi/chains"
import { TrailAPI, TrailInputBuilder } from "@/lib/trail-api"
import { STEPS } from "@/lib/trail-constants"

export function useTrailTransaction(onSuccess?: () => void) {
  const { address } = useAccount()
  const { switchChain } = useSwitchChain()
  const [isProcessing, setIsProcessing] = useState(false)

  // Switch to Base chain when connected
  const ensureCorrectChain = async () => {
    try {
      await switchChain({ chainId: base.id })
    } catch (error) {
      console.error("[v0] Failed to switch chain:", error)
      throw new Error("Please switch to Base network")
    }
  }

  const {
    sendTransaction,
    isPending,
    error: txError,
  } = useSendTransaction({
    mutation: {
      onSuccess: async (hash: string, variables) => {
        console.log("[v0] Transaction successfully sent:", hash)

        // Extract the primary node ID from the transaction metadata
        const primaryNodeId = (variables as any).primaryNodeId

        if (primaryNodeId && address) {
          try {
            await TrailAPI.saveExecution({
              nodeId: primaryNodeId,
              transactionHash: hash,
              walletAddress: address,
              execution: { type: "latest" },
            })
            console.log("[v0] Execution saved successfully")

            onSuccess?.()
          } catch (err) {
            console.error("[v0] Failed to save execution:", err)
            // Note: Transaction was successful but execution save failed
            // User should still see the transaction hash for investigation
          }
        }

        setIsProcessing(false)
      },
      onError: (error: Error) => {
        console.error("[v0] Transaction failed:", error)
        setIsProcessing(false)
      },
    },
  })

  const executeStep = async (stepNumber: number, amount?: string) => {
    if (!address) {
      throw new Error("Wallet not connected")
    }

    setIsProcessing(true)

    try {
      await ensureCorrectChain()

      let userInputs
      let primaryNodeId

      // Build inputs based on step
      switch (stepNumber) {
        case 1: // Approve USDC
          if (!amount) throw new Error("Amount required for approval")
          userInputs = TrailInputBuilder.buildApproveInputs(amount)
          primaryNodeId = STEPS.APPROVE.primaryNodeId
          break
        case 2: // Donate
          if (!amount) throw new Error("Amount required for donation")
          userInputs = TrailInputBuilder.buildDonateInputs(amount)
          primaryNodeId = STEPS.DONATE.primaryNodeId
          break
        case 3: // Claim Refund
          userInputs = {} // No user inputs required for refund
          primaryNodeId = STEPS.REFUND.primaryNodeId
          break
        default:
          throw new Error("Invalid step number")
      }

      // Get transaction calldata from evaluations API
      console.log("[v0] Getting evaluation for step", stepNumber)
      const evaluation = await TrailAPI.getEvaluation(stepNumber, {
        walletAddress: address,
        userInputs,
        execution: { type: "latest" },
      })

      // Create transaction request
      const transactionRequest = {
        from: address as `0x${string}`,
        to: evaluation.contractAddress as `0x${string}`,
        data: evaluation.callData as `0x${string}`,
        value: BigInt(evaluation.payableAmount || "0"),
        primaryNodeId, // Add metadata for the success callback
      } as any

      console.log("[v0] Sending transaction:", transactionRequest)

      // Send transaction onchain
      sendTransaction(transactionRequest)
    } catch (error) {
      console.error("[v0] Failed to execute step:", error)
      setIsProcessing(false)
      throw error
    }
  }

  return {
    executeStep,
    isProcessing: isProcessing || isPending,
    error: txError,
  }
}
