import { createClient } from "../utils/deps.ts";
import { supabasePublicKey, supabaseUrl } from "../utils/const.ts";

export const supabase = createClient(supabaseUrl, supabasePublicKey);

export interface Order {
  id?: number;
  created_at?: string;
  price: number;
  side: string;
}

/**
 * 1. Traer el único elemento de la tabla
 */
export async function getSingleOrder(): Promise<Order | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .limit(1)
    .maybeSingle(); // Devuelve el objeto o null si la tabla está vacía

  if (error) {
    console.error("Error al obtener la orden:", error.message);
    return null;
  }

  return data;
}

/**
 * 2. Sustituir el único elemento de la tabla
 * Si la tabla está vacía, lo inserta. Si ya existe, lo sobrescribe.
 */
export async function replaceSingleOrder(
  newData: Omit<Order, "id" | "created_at">,
): Promise<Order | null> {
  // 1. Buscamos si ya existe el único registro para obtener su ID
  const currentOrder = await getSingleOrder();

  if (currentOrder && currentOrder.id) {
    // Si existe, lo actualizamos usando su ID
    const { data, error } = await supabase
      .from("orders")
      .update(newData)
      .eq("id", currentOrder.id)
      .select()
      .single();

    if (error) console.error("Error al actualizar la orden:", error.message);
    return data;
  } else {
    // Si la tabla está vacía, insertamos el primer y único registro
    const { data, error } = await supabase
      .from("orders")
      .insert(newData)
      .select()
      .single();

    if (error) {
      console.error("Error al insertar la orden inicial:", error.message);
    }
    return data;
  }
}
