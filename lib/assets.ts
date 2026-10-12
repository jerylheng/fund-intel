import type { SupabaseClient } from "@supabase/supabase-js";

const openingItems = [
  { field: "cash_savings", item_type: "asset", category: "cash", description: "Cash savings — opening balance" },
  { field: "investments", item_type: "asset", category: "investments", description: "Investments — opening balance" },
  { field: "cpf_oa", item_type: "asset", category: "cpf_oa", description: "CPF Ordinary Account — opening balance" },
  { field: "cpf_sa_ma_ra", item_type: "asset", category: "cpf_sa_ma_ra", description: "CPF SA / MA / RA — opening balance" },
  { field: "property_value", item_type: "asset", category: "property", description: "Property — opening value" },
  { field: "outstanding_loans", item_type: "liability", category: "other_liability", description: "Outstanding loans — opening balance" },
] as const;

/** Import the profile's summary balances as ledger opening entries once, before any detailed entry is added. */
export async function ensureOpeningBalances(supabase: SupabaseClient, adviserId: string, clientId: string) {
  const { data: client, error } = await supabase.from("clients")
    .select("cash_savings,investments,cpf_oa,cpf_sa_ma_ra,property_value,outstanding_loans,asset_ledger_initialized")
    .eq("id", clientId).eq("adviser_id", adviserId).maybeSingle();
  if (error || !client) throw new Error("Client not found.");
  const { count, error: countError } = await supabase.from("client_assets_liabilities")
    .select("id", { count: "exact", head: true }).eq("client_id", clientId).eq("adviser_id", adviserId);
  if (countError) throw new Error("Could not verify the asset ledger.");
  if (!client.asset_ledger_initialized && (count ?? 0) === 0) {
    const rows = openingItems.flatMap(item => {
      const value = Number(client[item.field] ?? 0);
      return value > 0 ? [{ adviser_id: adviserId, client_id: clientId, item_type: item.item_type, category: item.category, description: item.description, current_value: value }] : [];
    });
    if (rows.length) {
      const { error: insertError } = await supabase.from("client_assets_liabilities").insert(rows);
      if (insertError) throw new Error("Could not import the opening balances.");
    }
    const { error: updateError } = await supabase.from("clients").update({ asset_ledger_initialized: true }).eq("id", clientId).eq("adviser_id", adviserId);
    if (updateError) throw new Error("Could not initialize the asset ledger.");
  }
}

export async function recalculateClientSummary(supabase: SupabaseClient, adviserId: string, clientId: string) {
  const { data: rows, error } = await supabase.from("client_assets_liabilities")
    .select("item_type,category,current_value").eq("client_id", clientId).eq("adviser_id", adviserId);
  if (error) throw new Error("Could not recalculate client balances.");
  const summary = { cash_savings: 0, investments: 0, cpf_oa: 0, cpf_sa_ma_ra: 0, property_value: 0, outstanding_loans: 0, asset_ledger_initialized: true };
  for (const row of rows ?? []) {
    const value = Number(row.current_value ?? 0);
    if (row.item_type === "liability") summary.outstanding_loans += value;
    else if (row.category === "cash") summary.cash_savings += value;
    else if (row.category === "investments") summary.investments += value;
    else if (row.category === "cpf_oa") summary.cpf_oa += value;
    else if (row.category === "cpf_sa_ma_ra") summary.cpf_sa_ma_ra += value;
    else if (row.category === "property") summary.property_value += value;
  }
  const { error: updateError } = await supabase.from("clients").update(summary).eq("id", clientId).eq("adviser_id", adviserId);
  if (updateError) throw new Error("Could not update client summary balances.");
  return summary;
}
