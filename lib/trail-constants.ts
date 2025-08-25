// Trail reference document for debugging and details:
// https://trails-api.herd.eco/v1/trails/0198d5f9-8412-737e-afc2-4c6816208d9f/versions/0198d5f9-841b-7d10-9d67-1b426d3b7a2d/guidebook.txt?promptObject=farcaster_miniapp&trailAppId=0198d5fd-ef37-7140-b3e1-eab1ce3464d0

export const TRAIL_CONFIG = {
  trailId: "0198e00e-de57-7daf-81b9-133db5520147",
  versionId: "0198e00e-de63-7f79-be98-81b08e0a355c",
  trailAppId: "0198e014-2be1-7a23-93c5-32915deb0a44",
  crowdfundId: "3356",
  baseUrl: "https://trails-api.herd.eco/v1",
  explorerUrl: "https://herd.eco/base",
} as const



export const HEADERS = {
  "Content-Type": "application/json",
  "Herd-Trail-App-Id": TRAIL_CONFIG.trailAppId,
} as const

// Step configurations based on trail data
export const STEPS = {
  APPROVE: {
    stepNumber: 1,
    primaryNodeId: "0198d5f9-841e-7841-8173-3a47159517a7",
    title: "Approve USDC",
    description: "Allow the crowdfund contract to spend your USDC",
  },
  DONATE: {
    stepNumber: 2,
    primaryNodeId: "0198d5f9-841e-7841-8173-3a45cb035b81",
    title: "Donate to Crowdfund",
    description: "Make your donation to help save elephants",
  },
  REFUND: {
    stepNumber: 3,
    primaryNodeId: "0198e00e-de68-70e3-892e-6cc1969f27c7",
    title: "Claim Refund",
    description: "Get your money back if the goal was not reached",
  },
} as const

// Read node IDs sourced from the Trail guidebook for this version
export const READ_NODES = {
  USDC_BALANCE: "0198d5f9-841e-7841-8173-3a46904055f5",
  USER_DONATION: "0198e00e-de66-743a-81f7-c993b215c046",
  CROWDFUND_DETAILS: "0198e00e-de67-7f26-b5ac-7d92f89ec3c6",
  DONORS_COUNT: "0198d5f9-841f-7678-92f4-75b2ccf054a4",
} as const

export const TOKEN_CONFIG = {
  USDC: {
    address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    decimals: 6,
    symbol: "USDC",
    name: "USD Coin",
  },
} as const
