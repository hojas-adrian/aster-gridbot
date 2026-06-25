export const MIN_USDT_PER_ORDER = 5;
export const ASTER_DECIMALS = 4;
export const DEFAULT_FEE = 0.005 / 100; // 0.005% expresado en valor decimal (0.00005)

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const roundDown = (value: number, decimals = ASTER_DECIMALS): number => {
  const factor = 10 ** decimals;
  return Math.floor(value * factor) / factor;
};

const roundUp = (value: number, decimals = ASTER_DECIMALS): number => {
  const factor = 10 ** decimals;
  return Math.ceil(value * factor) / factor;
};

// Trunca hacia abajo estrictamente para evitar colocar órdenes sin saldo real
export const usdtToQuantity = (usdt: number, price: number): number => {
  if (!price || price <= 0) return 0;
  return roundDown(usdt / price, ASTER_DECIMALS);
};

export const quantityToUsdt = (quantity: number, price: number): number => {
  return roundDown(quantity * price, ASTER_DECIMALS); // Truncar para ser conservador con los límites
};

export const calcGridLevels = (
  lower: number,
  upper: number,
  steps: number,
): number[] => {
  if (steps <= 0) return [];
  const stepSize = (upper - lower) / steps;
  const levels: number[] = [];
  for (let i = 0; i <= steps; i++) {
    levels.push(roundDown(lower + i * stepSize, 8));
  }
  return levels;
};

export const calcMinAdjacentPct = (levels: number[]): number => {
  if (!levels || levels.length < 2) return 0;
  let min = Infinity;
  for (let i = 0; i < levels.length - 1; i++) {
    const pct = (levels[i + 1] - levels[i]) / levels[i];
    if (pct < min) min = pct;
  }
  return min === Infinity ? 0 : min;
};

export const calcAsterPerOrder = (
  balanceAster: number,
  steps: number,
  decimals = ASTER_DECIMALS,
): number => {
  if (steps <= 0) return 0;
  return roundDown(balanceAster / steps, decimals);
};

export const splitBuySellLevels = (
  levels: number[],
  currentPrice: number,
): { buyLevels: number[]; sellLevels: number[] } => {
  const buyLevels = levels.filter((level) => level < currentPrice);
  const sellLevels = levels.filter((level) => level >= currentPrice);
  return { buyLevels, sellLevels };
};

export const calcUsdtRequired = (
  asterPerOrder: number,
  buyLevels: number[],
): number => {
  if (!buyLevels.length || asterPerOrder <= 0) return 0;
  const priceSum = buyLevels.reduce((sum, price) => sum + price, 0);
  return roundDown(asterPerOrder * priceSum, 8);
};

export const calcAsterToSell = (
  usdtRequired: number,
  marketPrice: number,
  fee = DEFAULT_FEE,
  slippageBuffer = 0.005,
  decimals = ASTER_DECIMALS,
): number => {
  if (!marketPrice || marketPrice <= 0 || usdtRequired <= 0) return 0;
  const effectivePrice = marketPrice * (1 - fee);
  const required = usdtRequired / effectivePrice;
  const buffered = required * (1 + slippageBuffer);
  return roundUp(buffered, decimals); // Redondear hacia arriba asegura que el USDT no falte
};

export const calcMaxStepsByBalance = (
  balanceAster: number,
  lower: number,
  fee = DEFAULT_FEE,
  minUsdt = MIN_USDT_PER_ORDER,
): number => {
  if (lower <= 0) return 0;
  const effectiveLower = lower * (1 - fee);
  return Math.floor((balanceAster * effectiveLower) / minUsdt);
};

export const calculateMaxGridSteps = (
  lower: number,
  upper: number,
  balanceAster: number,
  fee = DEFAULT_FEE,
  minUsdt = MIN_USDT_PER_ORDER,
): {
  maxByBalance: number;
  maxByProfit: number;
  recommended: number;
} => {
  return checkMaxSteps(lower, upper, balanceAster, fee, minUsdt);
};

export const estimateGridProfitRange = (
  lower: number,
  upper: number,
  steps: number,
  fee = DEFAULT_FEE,
): {
  levels: number[];
  levelStep: number;
  minNetProfitPct: number;
  maxNetProfitPct: number;
  adjacentGains: Array<{
    buyPrice: number;
    sellPrice: number;
    grossPct: number;
    netPct: number;
  }>;
} => {
  const levels = calcGridLevels(lower, upper, steps);
  const levelStep = levels.length >= 2
    ? roundDown(levels[1] - levels[0], 8)
    : 0;
  const adjacentGains = [];

  for (let i = 0; i < levels.length - 1; i++) {
    const buyPrice = levels[i];
    const sellPrice = levels[i + 1];
    const grossPct = (sellPrice - buyPrice) / buyPrice;
    // Fórmula geométrica exacta del rendimiento neto
    const netPct = (1 + grossPct) * Math.pow(1 - fee, 2) - 1;

    adjacentGains.push({
      buyPrice,
      sellPrice,
      grossPct: roundDown(grossPct * 100, 4),
      netPct: roundDown(netPct * 100, 4),
    });
  }

  const netValues = adjacentGains.map((item) => item.netPct);
  const minNetProfitPct = Math.min(...netValues);
  const maxNetProfitPct = Math.max(...netValues);

  return {
    levels,
    levelStep,
    minNetProfitPct,
    maxNetProfitPct,
    adjacentGains,
  };
};

export const checkMaxSteps = (
  lower: number,
  upper: number,
  balanceAster: number,
  fee = DEFAULT_FEE,
  minUsdt = MIN_USDT_PER_ORDER,
  buffer = 0.001,
): {
  maxByBalance: number;
  maxByProfit: number;
  recommended: number;
} => {
  const maxByBalance = Math.max(
    1,
    calcMaxStepsByBalance(balanceAster, lower, fee, minUsdt),
  );

  // Despeje directo basado en el peor escenario (upper) para optimizar CPU
  const targetMinPct = 2 * fee + buffer;
  const analyticalMaxProfit = Math.floor(
    (upper - lower) / (upper * targetMinPct),
  );
  const maxByProfit = Math.max(1, analyticalMaxProfit);

  const recommended = Math.min(maxByBalance, maxByProfit);

  return { maxByBalance, maxByProfit, recommended };
};

export default {
  MIN_USDT_PER_ORDER,
  ASTER_DECIMALS,
  DEFAULT_FEE,
  usdtToQuantity,
  quantityToUsdt,
  calcGridLevels,
  calcMinAdjacentPct,
  calcAsterPerOrder,
  splitBuySellLevels,
  calcUsdtRequired,
  calcAsterToSell,
  calcMaxStepsByBalance,
  calculateMaxGridSteps,
  estimateGridProfitRange,
  checkMaxSteps,
};
