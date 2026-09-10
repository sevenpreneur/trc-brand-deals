"use server";

import { revalidatePath } from "next/cache";
import { deleteConversation, renameConversation } from "@/apis/knowledge";

/** Server action = endpoint POST publik, jadi input divalidasi di sini, bukan cuma di UI. */
export async function renameConversationAction(
  convId: string,
  title: string
): Promise<{ error: string | null }> {
  const cleanTitle = title.trim().slice(0, 120);
  if (!convId.trim() || !cleanTitle) {
    return { error: "Judul tidak boleh kosong" };
  }

  const error = await renameConversation(convId, cleanTitle);
  if (!error) revalidatePath("/knowledge", "layout");
  return { error };
}

export async function deleteConversationAction(
  convId: string
): Promise<{ error: string | null }> {
  if (!convId.trim()) return { error: "Chat tidak ditemukan" };

  const error = await deleteConversation(convId);
  if (!error) revalidatePath("/knowledge", "layout");
  return { error };
}
