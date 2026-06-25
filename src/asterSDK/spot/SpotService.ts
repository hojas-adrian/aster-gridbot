import { HttpClient } from "../transport/HttpClient.ts";
import { MarketService } from "./MarketService.ts";
import { AccountService } from "./AccountService.ts";
import { SpotWsService } from "./WsService.ts";

export class SpotService {
  public market: MarketService;
  public account: AccountService;
  public ws?: SpotWsService;

  constructor(
    http: HttpClient,
    wsUrl?: string,
    onMessage?: (data: unknown) => void,
  ) {
    this.market = new MarketService(http);
    this.account = new AccountService(http);

    if (wsUrl && onMessage) {
      this.ws = new SpotWsService(wsUrl, onMessage);
    }
  }
}
