import { ApiConfig } from "./config/ApiConfig.ts";
import { Signer } from "./auth/Signer.ts";
import { HttpClient } from "./transport/HttpClient.ts";
import { SpotService } from "./spot/SpotService.ts";
import { FutureService } from "./future/FutureService.ts";
import { SpotWsService } from "./spot/WsService.ts";

export class AsterSdk {
  public spot: SpotService;
  public future: FutureService;
  public ws: SpotWsService;

  constructor(config: ApiConfig) {
    const finalConfig: ApiConfig = {
      ...config,
      user: config.user || config.walletAddress,
      signer: config.signer || config.walletAddress,
    };

    const signer = new Signer({
      apiSecret: finalConfig.apiSecret,
      privateKey: finalConfig.privateKey,
      authMode: finalConfig.authMode,
      chainId: finalConfig.chainId,
      name: finalConfig.signingName,
      version: finalConfig.signingVersion,
      verifyingContract: finalConfig.verifyingContract,
    });

    const spotHttp = new HttpClient({
      ...finalConfig,
      baseUrl: "https://sapi.asterdex.com",
    }, signer);

    const futureHttp = new HttpClient({
      ...finalConfig,
      baseUrl: "https://fapi.asterdex.com",
    }, signer);

    this.spot = new SpotService(
      spotHttp,
      finalConfig.spotWsUrl ?? "wss://sstream.asterdex.com/ws",
      finalConfig.onSpotMessage,
    );

    this.future = new FutureService(
      futureHttp,
      finalConfig.futureWsUrl ?? "wss://fstream.asterdex.com/ws",
      finalConfig.onFutureMessage,
    );

    // Inicializamos el servicio WS pasándole el gestor de cuentas de Spot
    this.ws = new SpotWsService(
      finalConfig.spotWsUrl ?? "wss://sstream.asterdex.com/ws",
      this.spot.account,
      finalConfig.onSpotMessage,
    );
  }
}
