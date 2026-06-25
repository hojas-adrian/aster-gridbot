import { HttpClient } from "../transport/HttpClient.ts";
import * as M from "../models/future/AccountModels.ts";

export class AccountService {
  constructor(private http: HttpClient) {}

  // --- Operaciones de Trading (Requieren Firma) ---
  async createOrder(params: {
    symbol: string;
    side: "BUY" | "SELL";
    type: "LIMIT" | "MARKET";
    quantity?: number;
    price?: number;
    positionSide?: "LONG" | "SHORT" | "BOTH";
    timeInForce?: "GTC" | "IOC" | "FOK";
  }): Promise<M.FuturesOrderResponse> {
    // La firma se inyecta en el HttpClient mediante el flag 'signed: true'
    return await this.http.request<M.FuturesOrderResponse>(
      "POST",
      "/fapi/v3/order",
      params,
      true,
    );
  }

  async cancelOrder(
    symbol: string,
    orderId?: number,
    origClientOrderId?: string,
  ): Promise<unknown> {
    return await this.http.request("DELETE", "/fapi/v3/order", {
      symbol,
      orderId,
      origClientOrderId,
    }, true);
  }

  // --- Configuraciones de Cuenta ---
  async setPositionMode(
    dualSidePosition: boolean,
  ): Promise<{ code: number; msg: string }> {
    return await this.http.request("POST", "/fapi/v3/positionSide/dual", {
      dualSidePosition,
    }, true);
  }

  async getAccountInfo(): Promise<M.FuturesAccount> {
    return await this.http.request<M.FuturesAccount>(
      "GET",
      "/fapi/v3/accountWithJoinMargin",
      {},
      true,
    );
  }

  async setLeverage(
    symbol: string,
    leverage: number,
  ): Promise<{ leverage: number; symbol: string }> {
    return await this.http.request("POST", "/fapi/v3/leverage", {
      symbol,
      leverage,
    }, true);
  }

  // --- Gestión de Emergencia ---
  async noop(): Promise<{ code: number; msg: string }> {
    return await this.http.request("POST", "/fapi/v3/noop", {}, true);
  }

  async countdownCancelAll(
    symbol: string,
    countdownTime: number,
  ): Promise<unknown> {
    return await this.http.request("POST", "/fapi/v3/countdownCancelAll", {
      symbol,
      countdownTime,
    }, true);
  }
}
