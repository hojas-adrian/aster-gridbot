// Helpers para manejo numérico y conversiones entre tokens y moneda estable.
// Redondeos: siempre se truncan hacia abajo (floor) cuando se reducen decimales.

export function inferDecimals(value: string | number): number {
    const s = String(value);
    const parts = s.split("e");
    const plain = parts[0];
    const p = plain.split(".");
    return p[1] ? p[1].length : 0;
}

function pow10Bigint(n: number): bigint {
    return 10n ** BigInt(n);
}

export function decimalStringToScaledInt(
    value: string | number,
    decimals: number,
): bigint {
    const s = String(value).trim();
    if (s === "" || s === ".") return 0n;

    const negative = s.startsWith("-");
    const abs = negative ? s.slice(1) : s;
    const parts = abs.split(".");
    const intPart = parts[0] || "0";
    const fracPart = (parts[1] || "").replace(/[^0-9]/g, "");

    const fracTrunc = fracPart.slice(0, decimals).padEnd(decimals, "0");

    const scaled = BigInt(intPart || "0") * pow10Bigint(decimals) +
        (fracTrunc ? BigInt(fracTrunc) : 0n);
    return negative ? -scaled : scaled;
}

export function scaledIntToDecimalString(
    value: bigint,
    decimals: number,
): string {
    const negative = value < 0n;
    const abs = negative ? -value : value;
    const scale = pow10Bigint(decimals);
    const intPart = abs / scale;
    const frac = abs % scale;
    const fracStr = frac.toString().padStart(decimals, "0");
    if (decimals === 0) return (negative ? "-" : "") + intPart.toString();
    return (negative ? "-" : "") + `${intPart.toString()}.${fracStr}`;
}

export function toApiString(value: string | number, decimals: number): string {
    const scaled = decimalStringToScaledInt(value, decimals);
    return scaledIntToDecimalString(scaled, decimals);
}

export function toApiIntegerString(
    value: string | number,
    decimals: number,
): string {
    return decimalStringToScaledInt(value, decimals).toString();
}

/**
 * Convierte una cantidad de token a su equivalente en moneda estable.
 * - `tokenAmount`: cantidad de token (string|number)
 * - `tokenDecimals`: decimales del token
 * - `price`: precio token->estable (string|number)
 * - `priceDecimals`: decimales del precio (si no coincide con la cadena, usar `inferDecimals`)
 * - `stableDecimals`: decimales deseados para la moneda estable
 * Devuelve string con exactamente `stableDecimals` decimales y truncado hacia abajo.
 */
export function tokenToStable(
    tokenAmount: string | number,
    tokenDecimals: number,
    price: string | number,
    priceDecimals: number,
    stableDecimals: number,
): string {
    const A = decimalStringToScaledInt(tokenAmount, tokenDecimals); // A * 10^tokenDecimals
    const P = decimalStringToScaledInt(price, priceDecimals); // P * 10^priceDecimals

    const numerator = A * P * pow10Bigint(stableDecimals);
    const denom = pow10Bigint(tokenDecimals + priceDecimals);
    const stableScaled = numerator / denom; // floor automaticamente por BigInt

    return scaledIntToDecimalString(stableScaled, stableDecimals);
}

/**
 * Convierte una cantidad en moneda estable a su equivalente en token.
 * - `stableAmount`: cantidad estable (string|number)
 * - `stableDecimals`: decimales de la moneda estable
 * - `price`: precio token->estable (string|number)
 * - `priceDecimals`: decimales del precio
 * - `tokenDecimals`: decimales deseados para el token
 * Devuelve string con exactamente `tokenDecimals` decimales y truncado hacia abajo.
 */
export function stableToToken(
    stableAmount: string | number,
    stableDecimals: number,
    price: string | number,
    priceDecimals: number,
    tokenDecimals: number,
): string {
    const B = decimalStringToScaledInt(stableAmount, stableDecimals); // B * 10^stableDecimals
    const P = decimalStringToScaledInt(price, priceDecimals); // P * 10^priceDecimals

    if (P === 0n) throw new Error("Precio es 0, no se puede convertir");

    const numerator = B * pow10Bigint(tokenDecimals + priceDecimals);
    const denom = pow10Bigint(stableDecimals) * P;
    const tokenScaled = numerator / denom; // floor

    return scaledIntToDecimalString(tokenScaled, tokenDecimals);
}

// Sugerencias de otros helpers útiles para este SDK:
// - Formateadores de cantidades para mostrar en UI (sin truncar, con redondeo configurable).
// - Validadores de filtros de `exchangeInfo` (tickSize/stepSize) para normalizar órdenes.
// - Conversores entre unidades internas (entero) y externas (string) para órdenes y firmas.
