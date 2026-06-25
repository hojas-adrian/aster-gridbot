// src/services/futures/FuturesService.ts
import { HttpClient } from "../transport/HttpClient.ts";
import { AccountService } from "./AccountService.ts";
import { MarketService } from "./MarketService.ts";
import { FutureWsService } from "./WsService.ts";

export class FutureService {
  public market: MarketService;
  public account: AccountService;
  public ws?: FutureWsService;

  constructor(
    http: HttpClient,
    wsUrl?: string,
    onMessage?: (data: unknown) => void,
  ) {
    this.market = new MarketService(http);
    this.account = new AccountService(http);

    if (wsUrl && onMessage) {
      this.ws = new FutureWsService(wsUrl, onMessage);
    }
  }
}
