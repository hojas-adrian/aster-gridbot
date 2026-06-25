import type { AuthMode } from "../config/ApiConfig.ts";
import { Wallet } from "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js";

export interface SignerOptions {
  apiSecret?: string;
  privateKey?: string;
  authMode?: AuthMode;
  chainId?: number;
  name?: string;
  version?: string;
  verifyingContract?: string;
}

export class Signer {
  private wallet?: Wallet;
  private authMode: AuthMode;

  constructor(private options: SignerOptions) {
    this.authMode = options.authMode ??
      (options.privateKey ? "EIP712" : "HMAC");

    if (this.authMode === "EIP712") {
      if (!options.privateKey) {
        throw new Error(
          "privateKey es requerido para firma EIP-712 (authMode=EIP712).",
        );
      }
    } else {
      if (!options.apiSecret) {
        throw new Error(
          "apiSecret es requerido para firma HMAC (authMode=HMAC).",
        );
      }
    }
  }

  private async importKey() {
    const encoder = new TextEncoder();
    return await crypto.subtle.importKey(
      "raw",
      encoder.encode(this.options.apiSecret ?? ""),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
  }

  private toHex(buffer: ArrayBuffer | Uint8Array) {
    const bytes = buffer instanceof ArrayBuffer
      ? new Uint8Array(buffer)
      : buffer;
    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  async sign(message: string): Promise<string> {
    if (this.authMode === "EIP712") {
      return await this.signEip712(message);
    }
    return await this.signHmac(message);
  }

  private async signHmac(message: string): Promise<string> {
    const key = await this.importKey();
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(message),
    );
    return this.toHex(signature);
  }

  private getWallet(): Wallet {
    if (!this.wallet) {
      this.wallet = new Wallet(this.options.privateKey!);
    }
    return this.wallet;
  }

  private getDomain() {
    return {
      name: this.options.name ?? "AsterSignTransaction",
      version: this.options.version ?? "1",
      chainId: this.options.chainId ?? 1666,
      verifyingContract: this.options.verifyingContract ??
        "0x0000000000000000000000000000000000000000",
    };
  }

  private async signEip712(message: string): Promise<string> {
    const wallet = this.getWallet();
    const signature = await wallet._signTypedData(
      this.getDomain(),
      { Message: [{ name: "msg", type: "string" }] },
      { msg: message },
    );
    return signature.startsWith("0x") ? signature.slice(2) : signature;
  }
}
