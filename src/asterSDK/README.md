# Aster SDK

SDK de TypeScript/Deno para interactuar con la plataforma **Aster DEX**.
Proporciona acceso a mercados de trading al contado (Spot) y derivados (Futures)
con soporte para autenticación EIP-712 (blockchain) e HMAC.

## 📋 Características

- ✅ **Dos mercados**: Spot (trading al contado) y Futures (derivados)
- ✅ **Dos modos de autenticación**: EIP-712 (clave privada) e HMAC (API
  Key/Secret)
- ✅ **Servicios completos**: Market (información), Account (cuenta usuario),
  WebSocket (tiempo real)
- ✅ **Firma criptográfica**: Soporte para EIP-712 estándar de Ethereum
- ✅ **WebSocket**: Conexiones persistentes para datos en tiempo real
- ✅ **Tipos TypeScript**: Totalmente tipado para mejor experiencia de
  desarrollo
- ✅ **Helpers numéricos**: Utilities para conversiones de monedas y decimales

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd asterSDK

# Instalar dependencias (si es necesario)
deno cache --reload AsterSdk.ts
```

## 📦 Estructura del Proyecto

```
.
├── AsterSdk.ts                  # Clase principal del SDK
├── example.ts                   # Ejemplos de uso
├── auth/
│   └── Signer.ts               # Manejo de firmas (EIP712/HMAC)
├── config/
│   └── ApiConfig.ts            # Configuración y tipos
├── spot/
│   ├── SpotService.ts          # Servicio principal de Spot
│   ├── MarketService.ts        # Métodos de mercado (precios, info)
│   ├── AccountService.ts       # Métodos de cuenta (balance, órdenes)
│   └── WsService.ts            # WebSocket para Spot
├── future/
│   ├── FutureService.ts        # Servicio principal de Futures
│   ├── MarketService.ts        # Métodos de mercado
│   ├── AccountService.ts       # Métodos de cuenta
│   └── WsService.ts            # WebSocket para Futures
├── models/
│   ├── spot/                   # Modelos de datos Spot
│   │   ├── AccountModels.ts
│   │   └── MarketModels.ts
│   └── future/                 # Modelos de datos Futures
│       ├── AccountModels.ts
│       └── MarketModels.ts
├── helpers/
│   └── numberHelpers.ts        # Utilities para conversiones numéricos
├── transport/
│   ├── HttpClient.ts           # Cliente HTTP con autenticación
│   └── WsManager.ts            # Gestor de conexiones WebSocket
└── test/                       # Tests unitarios
```

## ⚙️ Configuración

### Autenticación EIP-712 (Recomendado para Blockchain)

Usa clave privada para firmar transacciones. Compatible con wallets Ethereum.

```typescript
import { AsterSdk } from "./AsterSdk.ts";

const sdk = new AsterSdk({
    privateKey: "0x1234567890abcdef...", // Tu clave privada
    walletAddress: "0x1234567890...", // Tu wallet (alternativa a user)
    user: "0x1234567890...", // Tu dirección (opcional si se usa walletAddress)
    signer: "0x1234567890...", // Wallet del firmante (opcional si se usa walletAddress)
    authMode: "EIP712",
    chainId: 1666, // ID de la cadena
    signingName: "Aster", // Nombre del dominio
    signingVersion: "1.0", // Versión del dominio
    verifyingContract: "0xcontract...", // Contrato verificador
});
```

### Autenticación HMAC (API Key/Secret)

Para integraciones de servidor a servidor con API Key y Secret.

```typescript
import { AsterSdk } from "./AsterSdk.ts";

const sdk = new AsterSdk({
    apiKey: "tu_api_key",
    apiSecret: "tu_api_secret",
    authMode: "HMAC",
    user: "0xtue_address",
});
```

## 💡 Uso

### Inicialización del SDK

```typescript
import { AsterSdk } from "./AsterSdk.ts";

// Con EIP712
const sdk = new AsterSdk({
    walletAddress: "0x55493E04A31A2E4726c5845A3Ce48DfC3389Bcd9",
    privateKey:
        "0xa836f91187a21538a218f421fbb59ec1fc7e539a5160c04398e10a965773b9b4",
    authMode: "EIP712",
});
```

### 1. Servicios de Mercado (Market)

Los servicios Market proporcionan información pública sobre el estado del
mercado.

#### Spot Market

```typescript
// Información del servidor
const serverTime = await sdk.spot.market.getServerTime();
console.log("Hora del servidor:", serverTime);

// Verificar que el servidor está activo
const ping = await sdk.spot.market.ping();
console.log("Servidor activo:", ping);

// Información del exchange (pares disponibles)
const exchangeInfo = await sdk.spot.market.getExchangeInfo();
console.log("Pares disponibles:", exchangeInfo.symbols);

// Obtener libro de órdenes
const orderBook = await sdk.spot.market.getOrderBook("ASTERUSDT", 50);
console.log("Pujas (Bids):", orderBook.bids);
console.log("Ofertas (Asks):", orderBook.asks);

// Obtener precio actual
const price = await sdk.spot.market.getLatestPrice("ASTERUSDT");
console.log("Precio actual:", price);

// Prueba de operación (noop)
const noop = await sdk.spot.market.noop();
```

#### Future Market

Mismos métodos que Spot Market, pero para contratos perpetuos.

```typescript
const serverTime = await sdk.future.market.getServerTime();
const exchangeInfo = await sdk.future.market.getExchangeInfo();
const orderBook = await sdk.future.market.getOrderBook("ASTERUSDT", 50);
const price = await sdk.future.market.getLatestPrice("ASTERUSDT");
```

### 2. Servicios de Cuenta (Account)

Los servicios Account proporcionan información de la cuenta del usuario
(requieren autenticación).

#### Spot Account

```typescript
// Información completa de la cuenta
const accountInfo = await sdk.spot.account.getAccountInfo();
console.log("Balances:", accountInfo.balances);
console.log("Permisos:", accountInfo.permissions);

// Información de una moneda específica
const walletInfo = await sdk.spot.account.getWalletInfo("USDT");
console.log("Balance de USDT:", walletInfo);
```

#### Future Account

```typescript
const accountInfo = await sdk.future.account.getAccountInfo();
console.log("Balance futuro:", accountInfo.totalWalletBalance);
```

### 3. WebSocket (Datos en Tiempo Real)

Las conexiones WebSocket permiten recibir actualizaciones en tiempo real.

#### Con callback en la inicialización

```typescript
const sdk = new AsterSdk({
    walletAddress: "0x...",
    privateKey: "0x...",
    onSpotMessage: (message) => {
        console.log("Mensaje Spot recibido:", message);
    },
    onFutureMessage: (message) => {
        console.log("Mensaje Futures recibido:", message);
    },
});

// Suscribir a eventos
sdk.spot.ws?.subscribeTicker("ASTERUSDT");
sdk.spot.ws?.subscribeDepth("ASTERUSDT", 20);

sdk.future.ws?.subscribeTicker("ASTERUSDT");
sdk.future.ws?.subscribeDepth("ASTERUSDT", 5);
```

#### Suscripciones disponibles

- `subscribeTicker(symbol)` - Actualizaciones de precio y volumen
- `subscribeDepth(symbol, levels)` - Cambios en el libro de órdenes
- `unsubscribeTicker(symbol)` - Dejar de recibir datos de ticker
- `unsubscribeDepth(symbol)` - Dejar de recibir datos del libro

### 4. Helpers Numéricos

Utilities para conversiones entre tokens y monedas estables.

```typescript
import * as NH from "./helpers/numberHelpers.ts";

const price = "42.5"; // Precio ASTERUSDT
const tokenAmount = "12.345678"; // Cantidad en tokens
const tokenDecimals = 6; // Decimales del token
const stableDecimals = 2; // Decimales de la moneda estable

// Inferir decimales de un precio
const priceDecimals = NH.inferDecimals(price); // 1

// Convertir token a moneda estable
const stableAmount = NH.tokenToStable(
    tokenAmount,
    tokenDecimals,
    price,
    priceDecimals,
    stableDecimals,
); // "525.02"

// Convertir moneda estable a token
const tokenFromStable = NH.stableToToken(
    "100.00",
    stableDecimals,
    price,
    priceDecimals,
    tokenDecimals,
); // "2.352941"
```

## 📡 Flujo de Solicitud HTTP

```
SDK → HttpClient
     ↓
   Signer (firma la solicitud)
     ↓
   API Aster DEX (sapi.asterdex.com para Spot, fapi.asterdex.com para Futures)
     ↓
   Respuesta JSON
```

Las solicitudes se firman automáticamente según el modo de autenticación
configurado.

## 🔗 Flujo de WebSocket

```
SDK → WsService
     ↓
   WsManager (gestiona conexión)
     ↓
   Servidor WebSocket (sstream.asterdex.com para Spot, fstream.asterdex.com para Futures)
     ↓
   Callback onSpotMessage o onFutureMessage
```

## 🧪 Testing

Ejecutar los tests:

```bash
deno test --allow-env --allow-net
```

## 📝 Ejemplo Completo

Ver [example.ts](./example.ts) para un ejemplo de uso completo que incluye:

- REST API calls
- Conversiones numéricas
- WebSocket de corta duración
- WebSocket de larga duración

Ejecutar el ejemplo:

```bash
source .env
deno run --allow-env --allow-net example.ts
```

## 🔐 Variables de Entorno

```env
API_WALLET_ADDRESS=0x55493E04A31A2E4726c5845A3Ce48DfC3389Bcd9
ASTER_PRIVATE_KEY=0xa836f91187a21538a218f421fbb59ec1fc7e539a5160c04398e10a965773b9b4
```

## 📚 Modelos de Datos

El SDK incluye tipos TypeScript completos para todas las respuestas:

- **Spot Models**: `AccountModels.ts`, `MarketModels.ts` en `models/spot/`
- **Future Models**: `AccountModels.ts`, `MarketModels.ts` en `models/future/`

Todos los tipos son totalmente tipados para autocompletado en el IDE.

````
### 2. Servicios de Cuenta (Account)

#### Spot Account

```typescript
// Ver información de la cuenta
const accountInfo = await sdk.spot.account.getAccountInfo();
console.log("Saldo disponible:", accountInfo.balances);

// Historial de órdenes
const orderHistory = await sdk.spot.account.getOrderHistory("ASTERUSDT");
console.log("Órdenes:", orderHistory);

// Crear una orden
const newOrder = await sdk.spot.account.createOrder({
    symbol: "ASTERUSDT",
    side: "BUY",
    quantity: 10,
    price: 1.5,
});
console.log("Orden creada:", newOrder.orderId);

// Cancelar orden
const cancelledOrder = await sdk.spot.account.cancelOrder("ASTERUSDT", orderId);
````

#### Future Account

```typescript
// Información de cuenta de futuros
const futureAccountInfo = await sdk.future.account.getAccountInfo();
console.log("Posiciones:", futureAccountInfo.positions);

// Crear orden de futuros
const futureOrder = await sdk.future.account.createOrder({
    symbol: "ASTERUSDT",
    side: "LONG",
    quantity: 5,
    leverage: 10,
});

// Ajustar apalancamiento
await sdk.future.account.setLeverage("ASTERUSDT", 20);
```

### 3. WebSocket (Tiempo Real)

#### Crear SDK con WebSocket

```typescript
const sdk = new AsterSdk({
    privateKey: "0x...",
    user: "0x...",
    signer: "0x...",
    authMode: "EIP712",

    // Configurar URLs de WebSocket
    spotWsUrl: "wss://sstream.asterdex.com/ws",
    futureWsUrl: "wss://fstream.asterdex.com/ws",

    // Callback para recibir mensajes
    onSpotMessage: (data) => {
        console.log("Mensaje Spot:", data);
    },
    onFutureMessage: (data) => {
        console.log("Mensaje Future:", data);
    },
});
```

#### Usar WebSocket

```typescript
// Suscribirse a actualizaciones de precio
await sdk.spot.ws?.subscribe("ASTERUSDT@ticker");

// Suscribirse a eventos de orden
await sdk.spot.ws?.subscribe("ASTERUSDT@klines_1m");

// Desuscribirse
await sdk.spot.ws?.unsubscribe("ASTERUSDT@ticker");

// Cerrar conexión
await sdk.spot.ws?.close();
```

## 🏗️ Arquitectura

### Estructura de Carpetas

```
asterSDK/
├── AsterSdk.ts           # Clase principal del SDK
├── auth/
│   └── Signer.ts         # Lógica de firma (EIP-712 y HMAC)
├── config/
│   └── ApiConfig.ts      # Configuración de API
├── transport/
│   ├── HttpClient.ts     # Cliente HTTP con autenticación
│   └── WsManager.ts      # Gestor de conexiones WebSocket
├── spot/
│   ├── SpotService.ts    # Servicio principal de Spot
│   ├── MarketService.ts  # Datos de mercado
│   ├── AccountService.ts # Gestión de cuenta
│   └── WsService.ts      # WebSocket para Spot
├── future/
│   ├── FutureService.ts  # Servicio principal de Futures
│   ├── MarketService.ts  # Datos de mercado de futuros
│   ├── AccountService.ts # Gestión de cuenta de futuros
│   └── WsService.ts      # WebSocket para Futures
├── models/
│   ├── spot/
│   │   ├── AccountModels.ts
│   │   └── MarketModels.ts
│   └── future/
│       ├── AccountModels.ts
│       └── MarketModels.ts
└── test/                 # Tests unitarios
```

### Flujo de Funcionamiento

```
1. Usuario crea instancia de AsterSdk con ApiConfig
2. SDK inicializa:
   - Signer (crea wallet para firmar)
   - HttpClient para Spot (base: https://sapi.asterdex.com)
   - HttpClient para Futures (base: https://fapi.asterdex.com)
   - SpotService y FutureService
3. Usuario llama métodos de Market o Account
4. HttpClient intercepta la solicitud:
   - Añade parametros de autenticación
   - Firma la solicitud con Signer
   - Realiza request HTTP
5. Respuesta se retorna al usuario tipada
6. Si WebSocket está configurado:
   - Se conecta automáticamente
   - Emite eventos a través del callback onMessage
```

## 🔐 Seguridad

### Mejores Prácticas

1. **Nunca expongas claves privadas**:
   ```typescript
   // ❌ MALO - No hagas esto
   const privateKey = "0x123..."; // Visible en el código

   // ✅ BIEN - Usa variables de entorno
   const privateKey = Deno.env.get("PRIVATE_KEY");
   ```

2. **Usa secretos seguros**:
   ```typescript
   // ✅ BIEN - Desde archivo .env
   import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";
   const env = await load();
   const sdk = new AsterSdk({
       privateKey: env["PRIVATE_KEY"],
       user: env["USER_ADDRESS"],
       signer: env["SIGNER_ADDRESS"],
       authMode: "EIP712",
   });
   ```

3. **Revoca credenciales comprometidas**:
   - Si expones accidentalmente un API Key, revócalo inmediatamente en los
     settings de tu cuenta
   - Genera nuevos credentials y actualiza tu aplicación

## 🧪 Testing

### Ejecutar Tests

```bash
# Ejecutar todos los tests
deno test

# Ejecutar test específico
deno test --filter "getServerTime"

# Ejecutar tests de Spot
deno test test/spot_service_methods_test.ts

# Ejecutar tests del SDK principal
deno test test/aster_sdk_test.ts
```

### Escribir Tests

```typescript
import {
    assert,
    assertEquals,
} from "https://deno.land/std@0.216.0/testing/asserts.ts";
import { AsterSdk } from "../AsterSdk.ts";

Deno.test("Obtener hora del servidor", async () => {
    const sdk = new AsterSdk({
        privateKey: "0x...",
        user: "0x...",
        signer: "0x...",
        authMode: "EIP712",
    });

    const time = await sdk.spot.market.getServerTime();

    assert(time.serverTime);
    assertEquals(typeof time.serverTime, "number");
});
```

## 📝 Ejemplos Completos

### Ejemplo 1: Obtener Saldo

```typescript
import { AsterSdk } from "./AsterSdk.ts";

const sdk = new AsterSdk({
    privateKey: Deno.env.get("PRIVATE_KEY")!,
    user: Deno.env.get("USER_ADDRESS")!,
    signer: Deno.env.get("SIGNER_ADDRESS")!,
    authMode: "EIP712",
});

const account = await sdk.spot.account.getAccountInfo();
console.log("Saldos:");
for (const balance of account.balances) {
    if (parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0) {
        console.log(
            `  ${balance.asset}: ${balance.free} (disponible), ${balance.locked} (bloqueado)`,
        );
    }
}
```

### Ejemplo 2: Monitorear Cambios de Precio

```typescript
import { AsterSdk } from "./AsterSdk.ts";

const sdk = new AsterSdk({
    privateKey: Deno.env.get("PRIVATE_KEY")!,
    user: Deno.env.get("USER_ADDRESS")!,
    signer: Deno.env.get("SIGNER_ADDRESS")!,
    authMode: "EIP712",
    spotWsUrl: "wss://sstream.asterdex.com/ws",
    onSpotMessage: (data: any) => {
        if (data.e === "24hrTicker") {
            console.log(`${data.s}: ${data.c} (cambio: ${data.P}%)`);
        }
    },
});

// Suscribirse a actualizaciones de 24 horas
await sdk.spot.ws?.subscribe("ASTERUSDT@ticker");

// Mantener activo por 1 hora
await new Promise((resolve) => setTimeout(resolve, 3600000));

await sdk.spot.ws?.close();
```

### Ejemplo 3: Crear y Cancelar Orden

```typescript
import { AsterSdk } from "./AsterSdk.ts";

const sdk = new AsterSdk({
    privateKey: Deno.env.get("PRIVATE_KEY")!,
    user: Deno.env.get("USER_ADDRESS")!,
    signer: Deno.env.get("SIGNER_ADDRESS")!,
    authMode: "EIP712",
});

// Crear orden
console.log("Creando orden...");
const order = await sdk.spot.account.createOrder({
    symbol: "ASTERUSDT",
    side: "BUY",
    quantity: 10,
    price: 1.50,
});
console.log(`Orden creada con ID: ${order.orderId}`);

// Esperar 30 segundos
await new Promise((r) => setTimeout(r, 30000));

// Cancelar orden
console.log("Cancelando orden...");
const cancelled = await sdk.spot.account.cancelOrder(
    "ASTERUSDT",
    order.orderId,
);
console.log("Orden cancelada:", cancelled);
```

## 🐛 Debugging

### Habilitar Logs

```typescript
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
    console.log("Request:", input, init?.body);
    const response = await originalFetch(input, init);
    const text = await response.text();
    console.log("Response:", text);
    return new Response(text);
};
```

### Errores Comunes

| Error                              | Solución                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `privateKey es requerido`          | Asegúrate de pasar `privateKey` cuando `authMode` es "EIP712"               |
| `apiSecret es requerido`           | Asegúrate de pasar `apiSecret` cuando `authMode` es "HMAC"                  |
| Conexión WebSocket rechazada       | Verifica que la URL de WebSocket sea correcta y que el servidor esté activo |
| `signature=` no encontrada en body | Asegúrate de que estés usando un método POST autenticado                    |

## 📚 Referencias

- **Aster DEX**: https://asterdex.com
- **EIP-712**: https://eips.ethereum.org/EIPS/eip-712
- **Deno**: https://deno.land
- **ethers.js**: https://docs.ethers.org

## 📄 Licencia

MIT License

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios grandes, abre un issue primero
para discutir los cambios propuestos.

```bash
# Hacer fork del proyecto
# Crear rama de feature (git checkout -b feature/AmazingFeature)
# Hacer commit (git commit -m 'Add AmazingFeature')
# Push a la rama (git push origin feature/AmazingFeature)
# Abrir un Pull Request
```

## ❓ Soporte

Si tienes preguntas o necesitas ayuda:

- Abre un issue en el repositorio
- Revisa la documentación de Aster DEX
- Consulta los tests para ejemplos de uso
