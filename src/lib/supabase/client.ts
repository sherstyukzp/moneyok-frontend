import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL і NEXT_PUBLIC_SUPABASE_ANON_KEY не налаштовані. Скопіюйте .env.example у .env.local та вкажіть ключі (`supabase status` у moneyok-server)."
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}

export const supabase = createClient();