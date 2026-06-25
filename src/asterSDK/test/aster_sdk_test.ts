import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.216.0/testing/asserts.ts";
import { ApiConfig } from "../config/ApiConfig.ts";
import { Signer } from "../auth/Signer.ts";
import { HttpClient } from "../transport/HttpClient.ts";

const PRIVATE_KEY =
  "0x0123456789012345678901234567890123456789012345678901234567890123";
const USER_ADDRESS = "0x0000000000000000000000000000000000000001";
const SIGNER_ADDRESS = "0x0000000000000000000000000000000000000002";

Deno.test("Signer EIP712 produces a 130-hex character signature", async () => {
  const signer = new Signer({
    privateKey: PRIVATE_KEY,
    authMode: "EIP712",
    chainId: 1666,
  });

  const signature = await signer.sign("symbol=ASTERUSDT&side=BUY");

  assertEquals(signature.length, 130);
  assert(/^[0-9a-f]+$/.test(signature));
});

Deno.test("HttpClient sends EIP712 signed body for POST auth requests", async () => {
  const config: ApiConfig = {
    baseUrl: "https://sapi.asterdex.com",
    user: USER_ADDRESS,
    signer: SIGNER_ADDRESS,
    privateKey: PRIVATE_KEY,
    authMode: "EIP712",
  };

  const signer = new Signer(config);
  const http = new HttpClient(config, signer);

  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedBody = "";

  globalThis.fetch = async (input, init) => {
    capturedUrl = input.toString();
    capturedBody = typeof init?.body === "string"
      ? init.body
      : init?.body instanceof Uint8Array
      ? new TextDecoder().decode(init.body)
      : "";

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const result = await http.request(
      "POST",
      "/api/v3/order",
      { symbol: "ASTERUSDT", side: "BUY" },
      true,
      0,
    );

    assertEquals(result, { success: true });
    assert(capturedBody.includes("user="), "El body debe contener user");
    assert(capturedBody.includes("signer="), "El body debe contener signer");
    assert(capturedBody.includes("nonce="), "El body debe contener nonce");
    assert(
      capturedBody.includes("signature="),
      "El body debe contener signature",
    );
    assert(
      !capturedUrl.includes("signature="),
      "La firma debe estar en el cuerpo para POST EIP712",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
