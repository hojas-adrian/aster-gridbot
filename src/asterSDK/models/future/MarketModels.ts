export interface FuturesExchangeInfo {
  timezone: string;
  serverTime: number;
  assets: { asset: string; marginAvailable: boolean }[];
  symbols: {
    symbol: string;
    contractType: string;
    baseAsset: string;
    quoteAsset: string;
  }[];
}

export interface OrderBook {
  lastUpdateId: number;
  E: number;
  T: number;
  bids: [string, string][];
  asks: [string, string][];
}

export interface PremiumIndex {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
  time: number;
}

export interface Ticker24h {
  symbol: string;
  priceChange: string;
  lastPrice: string;
  volume: string;
  quoteVolume: string;
}

export interface PriceTicker {
  symbol: string;
  price: string;
  time: number;
}
