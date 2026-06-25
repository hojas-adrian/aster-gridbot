# Arquitectura - Aster Trading Bot

## Visión general

Aster Trading Bot es una aplicación en Deno que expone un webhook de Telegram y
ejecuta operaciones de trading automatizadas en AsterDEX, incluyendo sistema de
grid trading y monitoreo en tiempo real vía WebSocket.

## Componentes actuales

### Servidor y Bot

- `server.ts`
  - Servidor Deno que recibe peticiones Telegram en el endpoint `/BOT_TOKEN`.
  - Usa `webhookCallback(bot, "std/http")` para pasar las actualizaciones a
    `grammy`.
- `poll.ts`
  - Arranca el bot en modo local con `bot.start()` tras eliminar el webhook.
  - Útil para pruebas locales sin webhook.
- `src/bot.ts`
  - Inicializa el bot con `Bot(botToken)`.
  - Registra comandos: `/start`, `/grid` (grid trading), `/close`, `/eval`.
  - Configura rate limiting con `limit()`.

### Handlers

- `src/handlers/on_command_start.ts`
  - Muestra mensaje de bienvenida con formato de comandos.
- `src/handlers/on_command_trade.ts`
  - Handler para comando `/grid` que inicia el grid trading.
  - Recibe parámetros: lower, upper, steps.
- `src/handlers/on_command_close.ts`
  - Cierra la conexión WebSocket.
- `src/handlers/on_command_eval.ts`
  - Handler para comando `/eval` de evaluación.
- `src/handlers/on_order.ts`
  - Handler genérico para procesar mensajes de órdenes.
- `src/handlers/on_error_handler.ts`
  - Manejador global de errores de grammy.

### Utilidades

- `src/utils/const.ts`
  - Define constantes y variables de entorno.
  - Valida presencia de credenciales requeridas.
- `src/utils/deps.ts`
  - Centraliza dependencias de grammy.
- `src/utils/types.ts`
  - Define tipos: `OrderData`, `OrderSide`, `StringConstant`.
- `src/utils/fun.ts`
  - Función `parseData` para convertir texto en `OrderData`.
  - Limpieza de símbolos y números.
- `src/utils/grid.ts`
  - Lógica principal de grid trading.
  - Funciones: `estimateProfitRange`, `startGrid`.
- `src/utils/gridHelpers.ts`
  - Helpers matemáticos para cálculos de grid.
  - Funciones: `calcGridLevels`, `calculateMaxGridSteps`,
    `estimateGridProfitRange`.

### Integraciones

- `src/integrations/aster.ts`
  - SDK de AsterDEX para operaciones de trading.
  - Funciones: `placeBuyOrder`, `placeSellOrder`, `placeMarketBuyOrder`,
    `placeMarketSellOrder`.
  - Gestión de balances: `getAsterBalance`, `getUsdtBalance`, `getAsterPrice`.
  - WebSocket: `abrirWebSocket`, `escucharOrdenesFilled`.
- `src/integrations/grammy.ts`
  - Helper para enviar mensajes directos vía Telegram API.
- `src/integrations/supabase.ts`
  - Integración con Supabase para persistencia de datos.
  - Funciones: `getSingleOrder`, `replaceSingleOrder`.
- `src/integrations/ws.ts`
  - Manejo de conexiones WebSocket.
  - Funciones: `escucharOrdenesFilled`, `cerrarWebSocket`.

### SDK Aster

- `src/asterSDK/`
  - SDK personalizado para AsterDEX.
  - Contiene modelos, helpers y lógica de conexión.

## Flujo de interacción

### Grid Trading

1. Usuario envía comando `/grid <lower> <upper> <steps>` a Telegram.
2. Bot recibe actualización vía webhook o long polling.
3. Handler `on_command_trade.ts` procesa parámetros.
4. `startGrid` calcula niveles de precio y coloca órdenes límite.
5. Órdenes se envían a AsterDEX vía `aster.ts`.
6. WebSocket escucha eventos de órdenes completadas.
7. Resultados se comunican al usuario vía Telegram.

### Órdenes Individuales

1. Usuario envía mensaje con formato de orden.
2. Handler `on_order.ts` parsea el mensaje.
3. `parseData` convierte texto en `OrderData`.
4. Se ejecuta función correspondiente (buy/sell) en `aster.ts`.
5. Resultado se responde al usuario en Telegram.

## Notas importantes

- El proyecto usa AsterDEX, no Hyperliquid.
- Los cálculos de precios y cantidades usan BigInt para precisión.
- `poll.ts` no es polling clásico: arranca el bot en modo local.
- `server.ts` es el modo recomendado para producción con webhook.
- El sistema de grid trading calcula niveles automáticamente según balance y
  fees.

## Recomendaciones

- Añadir validaciones más robustas en el parser de órdenes.
- Incluir pruebas unitarias para `parseData`, `startGrid` y los handlers.
- Centralizar la configuración de entorno y permisos.
- Añadir logs estructurados y manejo de retries para fallos en la API de
  AsterDEX.
- Implementar sistema de alertas para eventos críticos del WebSocket.
