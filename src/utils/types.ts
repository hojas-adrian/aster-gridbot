export type StringConstant = {
  [key: string]: string;
};

export type OrderSide = "openBuy" | "openSell" | "closeBuy" | "closeSell" | "invalid";

export type OrderData = {
  symbol: string;
  side: OrderSide;
  price: string;
  size: string;
};
