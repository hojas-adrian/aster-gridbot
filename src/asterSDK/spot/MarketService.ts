import { HttpClient } from "../transport/HttpClient.ts";
import * as M from "../models/spot/MarketModels.ts";

export class MarketService {
  constructor(private http: HttpClient) {}

  async noop(): Promise<{ code: number; msg: string }> {
    return await this.http.request("POST", "/api/v3/noop");
  }

  async ping(): Promise<Record<string, never>> {
    return await this.http.request("GET", "/api/v3/ping");
  }

  async getServerTime(): Promise<{ serverTime: number }> {
    return await this.http.request("GET", "/api/v3/time");
  }

  async getExchangeInfo(): Promise<M.ExchangeInfo> {
    return await this.http.request<M.ExchangeInfo>(
      "GET",
      "/api/v3/exchangeInfo",
    );
  }

  async getOrderBook(symbol: string, limit = 100): Promise<M.OrderBook> {
    return await this.http.request<M.OrderBook>("GET", "/api/v3/depth", {
      symbol,
      limit,
    });
  }

  async getRecentTrades(symbol: string, limit = 500): Promise<M.Trade[]> {
    return await this.http.request<M.Trade[]>("GET", "/api/v3/trades", {
      symbol,
      limit,
    });
  }

  async getHistoricalTrades(
    symbol: string,
    limit = 500,
    fromId?: number,
  ): Promise<M.Trade[]> {
    return await this.http.request<M.Trade[]>(
      "GET",
      "/api/v3/historicalTrades",
      { symbol, limit, fromId },
      true,
    );
  }

  async getAggregatedTrades(
    symbol: string,
    options?: Record<string, unknown>,
  ): Promise<M.AggTrade[]> {
    return await this.http.request<M.AggTrade[]>("GET", "/api/v3/aggTrades", {
      symbol,
      ...options,
    });
  }

  async getKlines(
    symbol: string,
    interval: string,
    options?: Record<string, unknown>,
  ): Promise<M.Kline[]> {
    return await this.http.request<M.Kline[]>("GET", "/api/v3/klines", {
      symbol,
      interval,
      ...options,
    });
  }

  async get24hTicker(symbol?: string): Promise<M.Ticker24h | M.Ticker24h[]> {
    return await this.http.request<M.Ticker24h | M.Ticker24h[]>(
      "GET",
      "/api/v3/ticker/24hr",
      symbol ? { symbol } : {},
    );
  }

  async getLatestPrice(
    symbol?: string,
  ): Promise<M.PriceTicker | M.PriceTicker[]> {
    return await this.http.request<M.PriceTicker | M.PriceTicker[]>(
      "GET",
      "/api/v3/ticker/price",
      symbol ? { symbol } : {},
    );
  }

  async getBookTicker(symbol?: string): Promise<M.BookTicker | M.BookTicker[]> {
    return await this.http.request<M.BookTicker | M.BookTicker[]>(
      "GET",
      "/api/v3/ticker/bookTicker",
      symbol ? { symbol } : {},
    );
  }

  async getCommissionRate(
    symbol: string,
  ): Promise<
    { symbol: string; makerCommissionRate: string; takerCommissionRate: string }
  > {
    return await this.http.request(
      "GET",
      "/api/v3/commissionRate",
      { symbol },
      true,
    );
  }
}
