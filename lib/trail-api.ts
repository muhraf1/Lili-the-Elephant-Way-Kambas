import { TRAIL_CONFIG, HEADERS } from "./trail-constants"

// Types based on the trail API documentation
export interface UserInputs {
  [nodeId: string]: {
    [inputPath: string]: {
      value: string
    }
  }
}

export interface EvaluationRequest {
  walletAddress: string
  userInputs: UserInputs
  execution: { type: "latest" } | { type: "new" } | { type: "manual"; executionId: string }
}

export interface EvaluationResponse {
  finalInputValues: Record<string, string>
  payableAmount: string
  contractAddress: string
  callData: string
}

export interface ExecutionRequest {
  nodeId: string
  transactionHash: string
  walletAddress: string
  execution: { type: "latest" } | { type: "new" } | { type: "manual"; executionId: string }
}

export interface ExecutionQueryRequest {
  walletAddresses: string[]
}

export interface ReadRequest {
  walletAddress: string
  userInputs: UserInputs
  execution: { type: "latest" } | { type: "new" } | { type: "manual"; executionId: string }
}

// API Functions
export class TrailAPI {
  private static async makeRequest<T>(endpoint: string, method: "GET" | "POST" = "GET", body?: any): Promise<T> {
    const url = `${TRAIL_CONFIG.baseUrl}${endpoint}`

    console.log(`[v0] Trail API ${method} request to:`, url)
    if (body) {
      console.log("[v0] Request body:", JSON.stringify(body, null, 2))
    }

    try {
      const response = await fetch(url, {
        method,
        headers: HEADERS,
        body: body ? JSON.stringify(body) : undefined,
      })

      const responseData = await response.json()
      console.log("[v0] Trail API response:", responseData)

      if (!response.ok) {
        throw new Error(`Trail API error: ${response.status} - ${JSON.stringify(responseData)}`)
      }

      return responseData
    } catch (error) {
      console.error("[v0] Trail API request failed:", error)
      throw error
    }
  }

  // Get transaction calldata for a step
  static async getEvaluation(stepNumber: number, request: EvaluationRequest): Promise<EvaluationResponse> {
    const endpoint = `/trails/${TRAIL_CONFIG.trailId}/versions/${TRAIL_CONFIG.versionId}/steps/${stepNumber}/evaluations`
    return this.makeRequest<EvaluationResponse>(endpoint, "POST", request)
  }

  // Save transaction hash after submission
  static async saveExecution(request: ExecutionRequest): Promise<void> {
    const endpoint = `/trails/${TRAIL_CONFIG.trailId}/versions/${TRAIL_CONFIG.versionId}/executions`
    return this.makeRequest<void>(endpoint, "POST", request)
  }

  // Query execution history
  static async queryExecutions(request: ExecutionQueryRequest) {
    const endpoint = `/trails/${TRAIL_CONFIG.trailId}/versions/${TRAIL_CONFIG.versionId}/executions/query`
    return this.makeRequest(endpoint, "POST", request)
  }

  // Get read node data
  static async getReadData(nodeId: string, request: ReadRequest) {
    const endpoint = `/trails/${TRAIL_CONFIG.trailId}/versions/${TRAIL_CONFIG.versionId}/nodes/${nodeId}/read`
    return this.makeRequest(endpoint, "POST", request)
  }
}

// Helper functions for building user inputs
export class TrailInputBuilder {
  // Build user inputs for Step 1 (Approve USDC)
  static buildApproveInputs(amount: string): UserInputs {
    return {
      "0198d5f9-841e-7841-8173-3a47159517a7": {
        "inputs.value": {
          value: amount, // Amount already has 6 decimals applied per alreadyAppliedDecimals
        },
      },
    }
  }

  // Build user inputs for Step 2 (Donate)
  static buildDonateInputs(amount: string): UserInputs {
    return {
      "0198d5f9-841e-7841-8173-3a45cb035b81": {
        "inputs.amount": {
          value: amount, // Amount already has 6 decimals applied per alreadyAppliedDecimals
        },
      },
    }
  }

  // Build user inputs for read nodes
  static buildReadInputs(nodeId: string, inputs: Record<string, string>): UserInputs {
    return {
      [nodeId]: Object.entries(inputs).reduce(
        (acc, [key, value]) => {
          acc[key] = { value }
          return acc
        },
        {} as Record<string, { value: string }>,
      ),
    }
  }
}

// Read node helpers
export class TrailReadAPI {
  // Get user's USDC balance
  static async getUserUSDCBalance(walletAddress: string, executionId?: string) {
    const request: ReadRequest = {
      walletAddress,
      userInputs: TrailInputBuilder.buildReadInputs("0198d5f9-841e-7841-8173-3a46904055f5", {
        "inputs.token": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", // USDC contract address on Base
      }),
      execution: executionId ? { type: "manual", executionId } : { type: "latest" },
    }

    return TrailAPI.getReadData("0198d5f9-841e-7841-8173-3a46904055f5", request)
  }

  // Get user's donation amount for the crowdfund
  static async getUserDonation(walletAddress: string, executionId?: string) {
    const request: ReadRequest = {
      walletAddress,
      userInputs: TrailInputBuilder.buildReadInputs("0198d5f9-841d-7242-9672-93e0b12d5186", {
        "inputs.arg_0": TRAIL_CONFIG.crowdfundId,
      }),
      execution: executionId ? { type: "manual", executionId } : { type: "latest" },
    }

    return TrailAPI.getReadData("0198d5f9-841d-7242-9672-93e0b12d5186", request)
  }

  // Get crowdfund details
  static async getCrowdfundDetails(walletAddress = "0x0000000000000000000000000000000000000000", executionId?: string) {
    const request: ReadRequest = {
      walletAddress,
      userInputs: TrailInputBuilder.buildReadInputs("0198d5f9-841f-7678-92f4-75b1f7f00d19", {
        "inputs.arg_0": TRAIL_CONFIG.crowdfundId,
      }),
      execution: executionId ? { type: "manual", executionId } : { type: "latest" },
    }

    return TrailAPI.getReadData("0198d5f9-841f-7678-92f4-75b1f7f00d19", request)
  }

  // Get total donors count
  static async getDonorsCount(walletAddress = "0x0000000000000000000000000000000000000000", executionId?: string) {
    const request: ReadRequest = {
      walletAddress,
      userInputs: TrailInputBuilder.buildReadInputs("0198d5f9-841f-7678-92f4-75b2ccf054a4", {
        "inputs.crowdfundId": TRAIL_CONFIG.crowdfundId,
      }),
      execution: executionId ? { type: "manual", executionId } : { type: "latest" },
    }

    return TrailAPI.getReadData("0198d5f9-841f-7678-92f4-75b2ccf054a4", request)
  }
}

// Utility functions
export class TrailUtils {
  // Convert raw blockchain values to human readable (divide by 10^decimals)
  static formatTokenAmount(rawAmount: string, decimals = 6, displayDecimals = 4): string {
    const amount = BigInt(rawAmount)
    const divisor = BigInt(10 ** decimals)
    const wholePart = amount / divisor
    const fractionalPart = amount % divisor

    if (fractionalPart === 0n) {
      return `${wholePart}.${"0".repeat(displayDecimals)}`
    }

    const fractionalStr = fractionalPart.toString().padStart(decimals, "0")
    // Take only the first displayDecimals digits for display
    const displayFractional = fractionalStr.slice(0, displayDecimals)

    return `${wholePart}.${displayFractional}`
  }

  // Convert human readable amount to raw blockchain value (multiply by 10^decimals)
  static parseTokenAmount(amount: string, decimals = 6): string {
    const [wholePart, fractionalPart = ""] = amount.split(".")
    const paddedFractional = fractionalPart.padEnd(decimals, "0").slice(0, decimals)
    const rawAmount = BigInt(wholePart) * BigInt(10 ** decimals) + BigInt(paddedFractional)
    return rawAmount.toString()
  }

  // Check if crowdfund has ended
  static isCrowdfundEnded(endTimestamp: string): boolean {
    const endTime = Number.parseInt(endTimestamp) * 1000 // Convert to milliseconds
    return Date.now() > endTime
  }

  // Check if crowdfund goal was reached
  static isGoalReached(totalRaised: string, goal: string): boolean {
    return BigInt(totalRaised) >= BigInt(goal)
  }

  // Format timestamp to readable date
  static formatDate(timestamp: string): string {
    const date = new Date(Number.parseInt(timestamp) * 1000)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Generate explorer links
  static getExplorerLink(type: "tx" | "contract" | "wallet", address: string): string {
    return `${TRAIL_CONFIG.explorerUrl}/${type}/${address}`
  }
}
