# Aster Trading Bot

Bot de trading automatizado para AsterDEX con integración de Telegram, sistema
de grid trading y gestión de órdenes en tiempo real mediante WebSocket.

## 📋 Resumen

Bot de Telegram construido con `grammy` y Deno que permite ejecutar operaciones
de trading en AsterDEX, incluyendo:

- Sistema de grid trading automatizado
- Órdenes de mercado y límite
- Monitoreo en tiempo real vía WebSocket
- Integración con Supabase para persistencia de datos
- Cálculos precisos de fees y decimales usando BigInt

## 🚀 Características

- **Grid Trading**: Sistema automatizado de trading en grilla con cálculo
  optimizado de niveles
- **Órdenes de Mercado**: Ejecución instantánea de compras y ventas
- **Órdenes Límite**: Colocación de órdenes con precio específico
- **WebSocket**: Escucha de eventos de órdenes completadas en tiempo real
- **Telegram Integration**: Interfaz conversacional para ejecutar comandos
- **Precisión BigInt**: Cálculos exactos usando helpers de BigInt para evitar
  errores de punto flotante

## 📦 Requisitos

- Deno (versión estable recomendada)
- Cuenta en AsterDEX con API credentials
- Bot de Telegram configurado

## ⚙️ Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
BOT_TOKEN=your_telegram_bot_token
CHAT_ID=your_telegram_chat_id
API_WALLET_ADDRESS=your_aster_wallet_address
ASTER_PRIVATE_KEY=your_aster_private_key
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLIC_KEY=your_supabase_public_key
```

## 🛠️ Instalación y Ejecución

### Instalación de dependencias

```bash
deno install
```

### Modo de desarrollo (long polling)

```bash
deno task dev
```

O directamente:

```bash
deno run --unstable-kv --allow-net --allow-env --allow-read --watch --env --allow-import --unstable-cron poll.ts
```

### Modo producción (webhook)

```bash
deno run -A --unstable server.ts
```

### Docker

Construir la imagen:

```bash
docker build -t aster-trading-bot .
```

Ejecutar el contenedor:

```bash
docker run -d \
  -e BOT_TOKEN=your_bot_token \
  -e CHAT_ID=your_chat_id \
  -e API_WALLET_ADDRESS=your_wallet_address \
  -e ASTER_PRIVATE_KEY=your_private_key \
  -e SUPABASE_URL=your_supabase_url \
  -e SUPABASE_PUBLIC_KEY=your_supabase_key \
  -p 8000:8000 \
  aster-trading-bot
```

### Permisos requeridos

- `--allow-net` - Para conexiones HTTP/WebSocket
- `--allow-env` - Para variables de entorno
- `--allow-read` - Para lectura de archivos
- `--unstable-kv` - Para almacenamiento KV de Deno
- `--unstable-cron` - Para tareas programadas

## 📱 Comandos del Bot

- `/start` - Inicia el bot y muestra mensaje de bienvenida
- `/grid <lower> <upper> <steps>` - Inicia el grid trading con parámetros
  específicos
  - `lower`: Precio inferior del rango
  - `upper`: Precio superior del rango
  - `steps`: Número de niveles de la grilla
- `/close` - Cierra la conexión WebSocket
- `/eval` - Comando de evaluación/prueba para estimar rangos de ganancia

## 📁 Estructura del Proyecto

```
.
├── server.ts                          # Servidor webhook para producción
├── poll.ts                            # Modo desarrollo con long polling
├── deno.json                          # Configuración de Deno
├── src/
│   ├── bot.ts                         # Inicialización del bot de Telegram
│   ├── handlers/
│   │   ├── on_command_start.ts        # Handler comando /start
│   │   ├── on_command_trade.ts       # Handler comando /gg (grid trading)
│   │   ├── on_commad_close.ts        # Handler comando /close
│   │   ├── on_commad_eval.ts          # Handler comando /test
│   │   ├── on_order.ts                # Handler genérico de órdenes
│   │   └── on_error_handler.ts        # Manejador global de errores
│   ├── utils/
│   │   ├── const.ts                   # Constantes y configuración
│   │   ├── deps.ts                    # Dependencias
│   │   ├── types.ts                   # Tipos TypeScript
│   │   ├── fun.ts                     # Funciones de parsing
│   │   ├── grid.ts                    # Lógica de grid trading
│   │   └── gridHelpers.ts             # Helpers para cálculos de grid
│   ├── integrations/
│   │   ├── aster.ts                   # SDK de AsterDEX
│   │   ├── grammy.ts                  # Helper de API de Telegram
│   │   ├── supabase.ts                # Integración con Supabase
│   │   └── ws.ts                      # Manejo de WebSocket
│   └── asterSDK/                      # SDK personalizado de Aster
│       ├── AsterSdk.ts
│       ├── models/
│       └── helpers/
└── ARCHITECTURE.md                    # Documentación de arquitectura
```

## 🔧 Funcionalidades Principales

### Grid Trading

El sistema de grid trading implementa:

- Cálculo automático de niveles de precio
- Gestión de balances (ASTER y USDT)
- Órdenes límite en ambos lados del libro
- Monitoreo de ejecución vía WebSocket
- Estimación de rangos de ganancia

### Integración AsterDEX

- **Órdenes Límite**: `placeBuyOrder`, `placeSellOrder`, `placeLimitOrder`
- **Órdenes Mercado**: `placeMarketBuyOrder`, `placeMarketSellOrder`
- **Balance**: `getAsterBalance`, `getUsdtBalance`
- **Precio**: `getAsterPrice`
- **WebSocket**: Escucha de eventos de órdenes completadas

### Precisión en Cálculos

El proyecto utiliza helpers de BigInt para:

- `inferDecimals` - Inferir decimales de precios
- `toApiString` - Formatear números para la API
- `tokenToStable` - Calcular conversiones token→stable

## 📊 Flujo de Operación

1. El usuario envía un comando a Telegram
2. El bot recibe la actualización vía webhook o long polling
3. El handler correspondiente procesa el comando
4. Se ejecuta la lógica de trading (grid, orden individual, etc.)
5. Las operaciones se envían a AsterDEX
6. Los resultados se comunican al usuario via Telegram
7. Los eventos se monitorean vía WebSocket

## 🔐 Seguridad

- Las credenciales se almacenan en variables de entorno
- La clave privada nunca se expone en el código
- Validación de parámetros antes de ejecutar órdenes
- Manejo robusto de errores

## 📝 Notas Importantes

- El proyecto usa AsterDEX, no Hyperliquid (el README anterior estaba
  desactualizado)
- `poll.ts` elimina el webhook y arranca el bot en modo local
- `server.ts` es el modo recomendado para producción con webhook
- Los cálculos usan BigInt para evitar errores de precisión

## 🚧 Próximas Mejoras

- [ ] Validaciones más robustas en el parser de órdenes
- [ ] Pruebas unitarias para funciones críticas
- [ ] Logs estructurados y sistema de monitoreo
- [ ] Manejo de retries para fallos en la API
- [ ] Documentación detallada de cada función

## 📚 Documentación Adicional

- Ver `ARCHITECTURE.md` para la visión detallada de arquitectura
- Ver `src/asterSDK/README.md` para documentación del SDK de Aster

## 📄 Licencia

Este proyecto es de uso privado y educativo.
