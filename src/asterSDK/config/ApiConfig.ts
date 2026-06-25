/**
 * Configuración mínima requerida para inicializar el SDK de Aster.
 */
export type AuthMode = "EIP712" | "HMAC";

export interface ApiConfig {
  apiKey?: string;
  apiSecret?: string;
  privateKey?: string;
  walletAddress?: string;
  user?: string;
  signer?: string;
  authMode?: AuthMode;
  chainId?: number;
  verifyingContract?: string;
  signingName?: string;
  signingVersion?: string;
  baseUrl?: string;
  timeoutMs?: number;
  spotWsUrl?: string;
  futureWsUrl?: string;
  onSpotMessage?: (message: unknown) => void;
  onFutureMessage?: (message: unknown) => void;
}
