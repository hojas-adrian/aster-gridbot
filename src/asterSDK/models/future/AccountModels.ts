export interface FuturesOrderResponse {
  orderId: number;
  symbol: string;
  status: string;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  side: string;
  positionSide: string;
  type: string;
  timeInForce: string;
  updateTime: number;
}

export interface FuturesAccount {
  totalWalletBalance: string;
  availableBalance: string;
  totalUnrealizedProfit: string;
  assets: { asset: string; walletBalance: string; availableBalance: string }[];
  positions: {
    symbol: string;
    positionAmt: string;
    entryPrice: string;
    leverage: string;
  }[];
}

export interface PositionRisk {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  leverage: string;
  marginType: "isolated" | "crossed";
  positionSide: "LONG" | "SHORT" | "BOTH";
}

export interface LeverageBracket {
  symbol: string;
  brackets: {
    bracket: number;
    initialLeverage: number;
    notionalCap: number;
    maintMarginRatio: number;
  }[];
}

export interface AgentRegistrationParams {
  user: string;
  nonce: number;
  agentName: string;
  agentAddress: string;
  expired: number;
  signatureChainId: number;
  signature: string;
  canSpotTrade: boolean;
  canPerpTrade: boolean;
  canWithdraw: boolean;
  ipWhitelist?: string;
  agentCode?: string;
}

export interface Announcement {
  id: number;
  category: string;
  publishTime: number;
  jumpLink: string;
  contents: {
    language: string;
    title: string;
    subtitle: string;
    content: string;
  }[];
}

export interface LeverageResponse {
  leverage: number;
  maxNotionalValue: string;
  symbol: string;
}

export interface SimpleResponse {
  code: number;
  msg: string;
}

export interface PositionMarginResponse {
  amount: number;
  code: number;
  msg: string;
  type: number;
}

export interface IncomeHistory {
  symbol: string;
  incomeType: string;
  income: string;
  asset: string;
  info: string;
  time: number;
  tranId: string;
  tradeId: string;
}

export interface AnnouncementResponse {
  total: number;
  rows: Announcement[];
}
