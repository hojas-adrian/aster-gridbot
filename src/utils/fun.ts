import type { OrderData, OrderSide } from "../utils/types.ts";

export const parseData = (orderText: string): OrderData => {
  const textLines = orderText.split("\n");
  const amounts = textLines[5].split(" ");

  const cleanSymbol = (symbol: string): string => {
    return symbol.replace("USDT", "");
  };

  const cleanToNumber = (text: string): string => {
    return text
      .replace(/[a-zA-Z]/g, "")
      .replace(/,/g, "")
      .trim();
  };

  const getOrderSide = (actionText: string): OrderSide => {
    switch (actionText.toLowerCase()) {
      case "cerrar corto":
        return "closeSell";
      case "abrir corto":
        return "openSell";
      case "cerrar largo":
        return "closeBuy";
      case "abrir largo":
        return "openBuy";
      default:
        return "invalid";
    }
  };

  return {
    symbol: cleanSymbol(textLines[0]),
    side: getOrderSide(textLines[1]),
    price: cleanToNumber(amounts[0]),
    size: cleanToNumber(amounts[1]),
  };
};
