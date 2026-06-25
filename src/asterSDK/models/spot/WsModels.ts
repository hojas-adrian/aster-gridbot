// --- Branded Types (Tipos Semánticos) ---
// Usamos el patrón de "brand" para que TypeScript los trate como tipos únicos
type OrderId = number & { readonly __brand: "OrderId" };
type TransactionId = number & { readonly __brand: "TransactionId" };
type Asset = string & { readonly __brand: "Asset" };
type Price = string & { readonly __brand: "Price" };
type Quantity = string & { readonly __brand: "Quantity" };
type Timestamp = number & { readonly __brand: "Timestamp" };
type ClientOrderId = string & { readonly __brand: "ClientOrderId" };

// --- Enums para mayor claridad ---
export enum OrderStatus {
  NEW = "NEW",
  PARTIALLY_FILLED = "PARTIALLY_FILLED",
  FILLED = "FILLED",
  CANCELED = "CANCELED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export enum Side {
  BUY = "BUY",
  SELL = "SELL",
}

// --- Payload Descriptivo ---
export interface OrderUpdatePayload {
  e: "executionReport";
  E: Timestamp; // Tiempo del evento en el servidor
  s: string; // Símbolo de trading (ej: "ADA25SLP25")
  c: ClientOrderId; // ID asignado por el cliente a la orden
  S: Side; // Lado (BUY/SELL)
  o: "LIMIT" | "MARKET"; // Tipo original de la orden
  f: "GTC" | "IOC" | "FOK";

  q: Quantity; // Cantidad total solicitada
  p: Price; // Precio original de la orden
  ap: Price; // Precio promedio de ejecución al momento
  P: Price; // Stop price (si aplica)

  x: "NEW" | "CANCELED" | "REJECTED" | "TRADE" | "EXPIRED";
  X: OrderStatus; // Estado actual post-ejecución
  i: OrderId; // ID único de la orden en el exchange

  l: Quantity; // Cantidad ejecutada en esta transacción específica
  z: Quantity; // Cantidad total acumulada ejecutada
  L: Price; // Precio ejecutado en esta transacción

  n: string; // Monto de la comisión aplicada
  N: Asset; // Asset en el que se cobró la comisión

  T: Timestamp; // Tiempo de la transacción (match)
  t: TransactionId; // ID único de la transacción (trade ID)
  m: boolean; // ¿Es el usuario el maker de esta transacción?

  ot: "LIMIT" | "MARKET"; // Tipo de orden original
  O: Timestamp; // Tiempo de creación de la orden
  Z: Quantity; // Cantidad acumulada total (quote asset)
  Y: Price; // Last quote asset transacted (precio * qty)
  Q: Quantity; // Cantidad total (quote asset) solicitada
}
