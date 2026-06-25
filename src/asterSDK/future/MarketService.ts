import { HttpClient } from "../transport/HttpClient.ts";
import * as M from "../models/future/MarketModels.ts";

export class MarketService {
  constructor(private http: HttpClient) {}

  async ping(): Promise<void> {
    await this.http.request("GET", "/fapi/v3/ping");
  }

  async getExchangeInfo(): Promise<M.FuturesExchangeInfo> {
    return await this.http.request<M.FuturesExchangeInfo>(
      "GET",
      "/fapi/v3/exchangeInfo",
    );
  }

  async getOrderBook(
    symbol: string,
    limit: number = 500,
  ): Promise<M.OrderBook> {
    return await this.http.request<M.OrderBook>("GET", "/fapi/v3/depth", {
      symbol,
      limit,
    });
  }

  async getPremiumIndex(
    symbol?: string,
  ): Promise<M.PremiumIndex | M.PremiumIndex[]> {
    return await this.http.request<M.PremiumIndex | M.PremiumIndex[]>(
      "GET",
      "/fapi/v3/premiumIndex",
      symbol ? { symbol } : {},
    );
  }

  async get24hTicker(symbol?: string): Promise<M.Ticker24h | M.Ticker24h[]> {
    return await this.http.request<M.Ticker24h | M.Ticker24h[]>(
      "GET",
      "/fapi/v3/ticker/24hr",
      symbol ? { symbol } : {},
    );
  }

  async getLatestPrice(
    symbol?: string,
  ): Promise<M.PriceTicker | M.PriceTicker[]> {
    return await this.http.request<M.PriceTicker | M.PriceTicker[]>(
      "GET",
      "/fapi/v3/ticker/price",
      symbol ? { symbol } : {},
    );
  }
}
