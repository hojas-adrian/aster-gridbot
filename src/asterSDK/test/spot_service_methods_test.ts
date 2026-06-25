import {
    assert,
    assertEquals,
} from "https://deno.land/std@0.216.0/testing/asserts.ts";
import { ApiConfig } from "../config/ApiConfig.ts";
import { Signer } from "../auth/Signer.ts";
import { HttpClient } from "../transport/HttpClient.ts";
import { MarketService } from "../spot/MarketService.ts";
import { AccountService } from "../spot/AccountService.ts";

const PRIVATE_KEY =
    "0x0123456789012345678901234567890123456789012345678901234567890123";
const USER_ADDRESS = "0x0000000000000000000000000000000000000001";
const SIGNER_ADDRESS = "0x0000000000000000000000000000000000000002";

function createClient() {
    const config: ApiConfig = {
        baseUrl: "https://sapi.asterdex.com",
        user: USER_ADDRESS,
        signer: SIGNER_ADDRESS,
        privateKey: PRIVATE_KEY,
        authMode: "EIP712",
    };
    return new HttpClient(config, new Signer(config));
}

async function withMockFetch(
    fn: (capture: { url: string; body: string }) => Promise<void>,
    mockResponse: Record<string, unknown> = { success: true },
) {
    const originalFetch = globalThis.fetch;
    const capture = { url: "", body: "" };

    globalThis.fetch = async (input, init) => {
        capture.url = input.toString();
        capture.body = typeof init?.body === "string"
            ? init.body
            : init?.body instanceof Uint8Array
            ? new TextDecoder().decode(init.body)
            : "";

        return new Response(JSON.stringify(mockResponse), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    };

    try {
        await fn(capture);
    } finally {
        globalThis.fetch = originalFetch;
    }
}

Deno.test("MarketService noop calls POST /api/v3/noop", async () => {
    const market = new MarketService(createClient());
    await withMockFetch(async (capture) => {
        await market.noop();
        assert(capture.url.includes("/api/v3/noop"));
        assertEquals(capture.body, "");
    });
});

Deno.test("MarketService ping calls GET /api/v3/ping", async () => {
    const market = new MarketService(createClient());
    await withMockFetch(async (capture) => {
        await market.ping();
        assert(capture.url.includes("/api/v3/ping"));
        assertEquals(capture.body, "");
    });
});

Deno.test("MarketService getServerTime calls GET /api/v3/time", async () => {
    const market = new MarketService(createClient());
    await withMockFetch(async (capture) => {
        await market.getServerTime();
        assert(capture.url.endsWith("/api/v3/time"));
    });
});

Deno.test("MarketService getExchangeInfo calls GET /api/v3/exchangeInfo", async () => {
    const market = new MarketService(createClient());
    await withMockFetch(async (capture) => {
        await market.getExchangeInfo();
        assert(capture.url.endsWith("/api/v3/exchangeInfo"));
    });
});

Deno.test("MarketService getOrderBook calls GET /api/v3/depth with symbol and limit", async () => {
    const market = new MarketService(createClient());
    await withMockFetch(async (capture) => {
        await market.getOrderBook("ASTERUSDT", 50);
        assert(capture.url.includes("/api/v3/depth"));
        assert(capture.url.includes("symbol=ASTERUSDT"));
        assert(capture.url.includes("limit=50"));
    });
});

Deno.test("MarketService getRecentTrades calls GET /api/v3/trades with symbol and limit", async () => {
    const market = new MarketService(createClient());
    await withMockFetch(async (capture) => {
        await market.getRecentTrades("ASTERUSDT", 25);
        assert(capture.url.includes("/api/v3/trades"));
        assert(capture.url.includes("symbol=ASTERUSDT"));
        assert(capture.url.includes("limit=25"));
    });
});

Deno.test("MarketService getHistoricalTrades calls signed GET /api/v3/historicalTrades", async () => {
    const market = new MarketService(createClient());
    await withMockFetch(async (capture) => {
        await market.getHistoricalTrades("ASTERUSDT", 10, 123);
        assert(capture.url.includes("/api/v3/historicalTrades"));
        assert(capture.url.includes("symbol=ASTERUSDT"));
        assert(capture.url.includes("limit=10"));
        assert(capture.url.includes("fromId=123"));
        assert(capture.url.includes("signature="));
    });
});

Deno.test("MarketService getAggregatedTrades calls GET /api/v3/aggTrades with extra options", async () => {
    const market = new MarketService(createClient());
    await withMockFetch(async (capture) => {
        await market.getAggregatedTrades("ASTERUSDT", { fromId: 42 });
        assert(capture.url.includes("/api/v3/aggTrades"));
        assert(capture.url.includes("symbol=ASTERUSDT"));
        assert(capture.url.includes("fromId=42"));
    });
});

Deno.test("MarketService getKlines calls GET /api/v3/klines with interval and options", async () => {
    const market = new MarketService(createClient());
    await withMockFetch(async (capture) => {
        await market.getKlines("ASTERUSDT", "1m", { limit: 5, endTime: 1000 });
        assert(capture.url.includes("/api/v3/klines"));
        assert(capture.url.includes("symbol=ASTERUSDT"));
        assert(capture.url.includes("interval=1m"));
        assert(capture.url.includes("limit=5"));
        assert(capture.url.includes("endTime=1000"));
    });
});

Deno.test("MarketService get24hTicker calls GET /api/v3/ticker/24hr with symbol", async () => {
    const market = new MarketService(createClient());
    await withMockFetch(async (capture) => {
        await market.get24hTicker("ASTERUSDT");
        assert(capture.url.includes("/api/v3/ticker/24hr"));
        assert(capture.url.includes("symbol=ASTERUSDT"));
    });
});

Deno.test("MarketService getLatestPrice calls GET /api/v3/ticker/price without symbol", async () => {
    const market = new MarketService(createClient());
    await withMockFetch(async (capture) => {
        await market.getLatestPrice();
        assert(capture.url.includes("/api/v3/ticker/price"));
        assert(!capture.url.includes("symbol="));
    });
});

Deno.test("MarketService getBookTicker calls GET /api/v3/ticker/bookTicker with symbol", async () => {
    const market = new MarketService(createClient());
    await withMockFetch(async (capture) => {
        await market.getBookTicker("ASTERUSDT");
        assert(capture.url.includes("/api/v3/ticker/bookTicker"));
        assert(capture.url.includes("symbol=ASTERUSDT"));
    });
});

Deno.test("MarketService getCommissionRate calls signed GET /api/v3/commissionRate", async () => {
    const market = new MarketService(createClient());
    await withMockFetch(async (capture) => {
        await market.getCommissionRate("ASTERUSDT");
        assert(capture.url.includes("/api/v3/commissionRate"));
        assert(capture.url.includes("symbol=ASTERUSDT"));
        assert(capture.url.includes("signature="));
    });
});

Deno.test("AccountService createOrder calls signed POST /api/v3/order with parameters", async () => {
    const account = new AccountService(createClient());
    await withMockFetch(async (capture) => {
        await account.createOrder({
            symbol: "ASTERUSDT",
            side: "BUY",
            type: "LIMIT",
            quantity: 10,
            price: 0.5,
            timeInForce: "GTC",
        });
        assert(capture.url.endsWith("/api/v3/order"));
        assert(capture.body.includes("symbol=ASTERUSDT"));
        assert(capture.body.includes("side=BUY"));
        assert(capture.body.includes("type=LIMIT"));
        assert(capture.body.includes("price=0.5"));
        assert(capture.body.includes("timeInForce=GTC"));
        assert(capture.body.includes("signature="));
    });
});

Deno.test("AccountService createOrder defaults timeInForce to GTC for LIMIT orders", async () => {
    const account = new AccountService(createClient());
    await withMockFetch(async (capture) => {
        await account.createOrder({
            symbol: "ASTERUSDT",
            side: "BUY",
            type: "LIMIT",
            quantity: 10,
            price: 0.5,
        });
        assert(capture.url.endsWith("/api/v3/order"));
        assert(capture.body.includes("timeInForce=GTC"));
        assert(capture.body.includes("signature="));
    });
});

Deno.test("AccountService getAccountInfo calls signed GET /api/v3/account", async () => {
    const account = new AccountService(createClient());
    await withMockFetch(async (capture) => {
        await account.getAccountInfo();
        assert(capture.url.includes("/api/v3/account"));
        assert(capture.url.includes("signature="));
    });
});

Deno.test("AccountService getMyTrades calls signed GET /api/v3/userTrades with symbol and limit", async () => {
    const account = new AccountService(createClient());
    await withMockFetch(async (capture) => {
        await account.getMyTrades("ASTERUSDT", 20);
        assert(capture.url.includes("/api/v3/userTrades"));
        assert(capture.url.includes("symbol=ASTERUSDT"));
        assert(capture.url.includes("limit=20"));
        assert(capture.url.includes("signature="));
    });
});

Deno.test("AccountService cancelOrder calls signed DELETE /api/v3/order", async () => {
    const account = new AccountService(createClient());
    await withMockFetch(async (capture) => {
        await account.cancelOrder("ASTERUSDT", 12345);
        assert(capture.url.includes("/api/v3/order"));
        assert(capture.url.includes("symbol=ASTERUSDT"));
        assert(capture.url.includes("orderId=12345"));
        assert(capture.url.includes("signature="));
    });
});

Deno.test("AccountService transferSpotToFuture calls signed POST /api/v3/asset/wallet/transfer", async () => {
    const account = new AccountService(createClient());
    await withMockFetch(async (capture) => {
        await account.transferSpotToFuture(100, "USDT");
        assert(capture.url.endsWith("/api/v3/asset/wallet/transfer"));
        assert(capture.body.includes("amount=100"));
        assert(capture.body.includes("asset=USDT"));
        assert(capture.body.includes("kindType=SPOT_FUTURE"));
        assert(capture.body.includes("signature="));
    });
});

Deno.test("AccountService getListenKey calls signed POST /api/v3/userDataStream", async () => {
    const account = new AccountService(createClient());
    await withMockFetch(async (capture) => {
        await account.getListenKey();
        assert(capture.url.endsWith("/api/v3/userDataStream"));
        assert(capture.body.includes("signature="));
    });
});
