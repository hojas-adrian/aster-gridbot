import { HttpClient } from "../transport/HttpClient.ts";
import * as M from "../models/spot/AccountModels.ts";

export class AccountService {
  constructor(private http: HttpClient) {}

  async createOrder(params: {
    symbol: string;
    side: "BUY" | "SELL";
    type: "LIMIT" | "MARKET";
    quantity?: number;
    quoteOrderQty?: number;
    price?: number;
    timeInForce?: "GTC" | "IOC" | "FOK";
    newClientOrderId?: string;
  }): Promise<M.OrderResponse> {
    const requestParams = {
      ...params,
      timeInForce: params.type === "LIMIT" && params.timeInForce === undefined
        ? "GTC"
        : params.timeInForce,
    };

    return await this.http.request<M.OrderResponse>(
      "POST",
      "/api/v3/order",
      requestParams,
      true,
    );
  }

  async getAccountInfo(): Promise<M.AccountInfo> {
    return await this.http.request<M.AccountInfo>(
      "GET",
      "/api/v3/account",
      {},
      true,
    );
  }

  async getMyTrades(symbol: string, limit = 500): Promise<M.UserTrade[]> {
    return await this.http.request<M.UserTrade[]>("GET", "/api/v3/userTrades", {
      symbol,
      limit,
    }, true);
  }

  async cancelOrder(
    symbol: string,
    orderId?: number,
    origClientOrderId?: string,
  ): Promise<unknown> {
    return await this.http.request("DELETE", "/api/v3/order", {
      symbol,
      orderId,
      origClientOrderId,
    }, true);
  }

  async transferSpotToFuture(
    amount: number,
    asset: string,
  ): Promise<{ tranId: number; status: string }> {
    return await this.http.request("POST", "/api/v3/asset/wallet/transfer", {
      amount,
      asset,
      kindType: "SPOT_FUTURE",
    }, true);
  }

  // --- CORRECCIONES A CONTINUACIÓN ---

  /**
   * Genera o extiende la listenKey (POST /api/v3/listenKey)
   */
  async getListenKey(): Promise<{ listenKey: string }> {
    return await this.http.request<{ listenKey: string }>(
      "POST",
      "/api/v3/listenKey", // Cambiado de userDataStream a listenKey
      {},
      true,
    );
  }

  /**
   * Extiende la validez de la listenKey por 60 min (PUT /api/v3/listenKey)
   */
  async extendListenKey(listenKey: string): Promise<void> {
    return await this.http.request<void>(
      "PUT",
      "/api/v3/listenKey",
      { listenKey },
      true,
    );
  }

  /**
   * Cierra el stream (DELETE /api/v3/listenKey)
   */
  async closeListenKey(listenKey: string): Promise<void> {
    return await this.http.request<void>(
      "DELETE",
      `/api/v3/listenKey?listenKey=${listenKey}`,
      {},
      true,
    );
  }
}
