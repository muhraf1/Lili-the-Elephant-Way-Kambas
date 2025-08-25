import { TRAIL_CONFIG, HEADERS, READ_NODES, STEPS, TOKEN_CONFIG } from "./trail-constants"
import { createPublicClient, http } from "viem"
import { base } from "viem/chains"

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

      const contentType = response.headers.get("content-type") || ""
      let responseData: any
      try {
        if (contentType.includes("application/json")) {
          responseData = await response.json()
        } else {
          const text = await response.text()
          // Attempt to parse JSON fallback
          try {
            responseData = JSON.parse(text)
          } catch {
            responseData = { message: text }
          }
        }
      } catch (parseErr) {
        const text = await response.text().catch(() => "")
        responseData = { message: text || "Failed to parse response" }
      }

      console.log("[v0] Trail API response:", responseData)

      if (!response.ok) {
        const message = typeof responseData === "object" ? JSON.stringify(responseData) : String(responseData)
        throw new Error(`Trail API error: ${response.status} - ${message}`)
      }

      return responseData as T
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
      [STEPS.APPROVE.primaryNodeId]: {
        "inputs.arg_0": {
          value: amount, // Amount already has 6 decimals applied per alreadyAppliedDecimals
        },
      },
    }
  }

  // Build user inputs for Step 2 (Donate)
  static buildDonateInputs(amount: string): UserInputs {
    return {
      [STEPS.DONATE.primaryNodeId]: {
        "inputs.arg_0": {
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
  private static publicClient = createPublicClient({ chain: base, transport: http() })
  private static ERC20_ABI = [
    {
      type: "function",
      name: "balanceOf",
      stateMutability: "view",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ name: "", type: "uint256" }],
    },
  ] as const

  // Get user's USDC balance
  static async getUserUSDCBalance(walletAddress: string, executionId?: string) {
    try {
      const balance = await this.publicClient.readContract({
        address: TOKEN_CONFIG.USDC.address as `0x${string}`,
        abi: this.ERC20_ABI,
        functionName: "balanceOf",
        args: [walletAddress as `0x${string}`],
      })
      return { outputs: [{ value: balance.toString() }] }
    } catch (err) {
      console.error("[v0] viem balanceOf failed, falling back to Trail read node:", err)
      const request: ReadRequest = {
        walletAddress,
        userInputs: TrailInputBuilder.buildReadInputs(READ_NODES.USDC_BALANCE, {
          "inputs.token": TOKEN_CONFIG.USDC.address,
        }),
        execution: executionId ? { type: "manual", executionId } : { type: "latest" },
      }
      return TrailAPI.getReadData(READ_NODES.USDC_BALANCE, request)
    }
  }

  // Get user's donation amount for the crowdfund
  static async getUserDonation(walletAddress: string, executionId?: string) {
    const request: ReadRequest = {
      walletAddress,
      userInputs: TrailInputBuilder.buildReadInputs(READ_NODES.USER_DONATION, {
        "inputs.arg_0": TRAIL_CONFIG.crowdfundId,
      }),
      execution: executionId ? { type: "manual", executionId } : { type: "latest" },
    }

    return TrailAPI.getReadData(READ_NODES.USER_DONATION, request)
  }

  // Get crowdfund details
  static async getCrowdfundDetails(walletAddress = "0x0000000000000000000000000000000000000000", executionId?: string) {
    const request: ReadRequest = {
      walletAddress,
      userInputs: TrailInputBuilder.buildReadInputs(READ_NODES.CROWDFUND_DETAILS, {
        "inputs.arg_0": TRAIL_CONFIG.crowdfundId,
      }),
      execution: executionId ? { type: "manual", executionId } : { type: "latest" },
    }

    return TrailAPI.getReadData(READ_NODES.CROWDFUND_DETAILS, request)
  }

  // Get total donors count
  static async getDonorsCount(walletAddress = "0x0000000000000000000000000000000000000000", executionId?: string) {
    const request: ReadRequest = {
      walletAddress,
      userInputs: TrailInputBuilder.buildReadInputs(READ_NODES.DONORS_COUNT, {
        "inputs.crowdfundId": TRAIL_CONFIG.crowdfundId,
      }),
      execution: executionId ? { type: "manual", executionId } : { type: "latest" },
    }

    return TrailAPI.getReadData(READ_NODES.DONORS_COUNT, request)
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

    if (fractionalPart === BigInt(0)) {
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
    const rawAmount = BigInt(wholePart + paddedFractional)
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
