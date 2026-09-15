"use server";

import { revalidatePath } from "next/cache";
import { deleteConversation, renameConversation } from "@/apis/knowledge";
import { getSession } from "@/apis/session";

/** Endpoint POST publik: input dan sesi divalidasi di sini, bukan cuma di UI. */
async function assertSession() {
  const { user } = await getSession();
  return user ? null : "Sesi berakhir. Silakan masuk lagi.";
}

export async function renameConversationAction(
  convId: string,
  title: string
): Promise<{ error: string | null }> {
  const denied = await assertSession();
  if (denied) return { error: denied };

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
  const denied = await assertSession();
  if (denied) return { error: denied };

  if (!convId.trim()) return { error: "Chat tidak ditemukan" };

  const error = await deleteConversation(convId);
  if (!error) revalidatePath("/knowledge", "layout");
  return { error };
}
