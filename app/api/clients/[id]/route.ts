import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordAudit } from "@/lib/audit";

const fields = ["full_name","preferred_name","email","phone","date_of_birth","residency_status","occupation","marital_status","dependants_count","annual_income","monthly_expenses","cash_savings","investments","cpf_oa","cpf_sa_ma_ra","property_value","outstanding_loans","monthly_investment","target_retirement_age","target_retirement_income","review_status","review_due_date","notes"] as const;
const allowedStatus = new Set(["new","on_track","review_needed","action_needed"]);
const isValidIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value+"T00:00:00Z").getTime()) && new Date(value+"T00:00:00Z").toISOString().slice(0,10) === value;
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Invalid client id." }, { status: 400 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const patch: Record<string, unknown> = {};
  for (const key of fields) if (Object.prototype.hasOwnProperty.call(body, key)) patch[key] = body[key];
  if (typeof patch.full_name === "string") patch.full_name = patch.full_name.trim().slice(0, 120);
  if (patch.email !== undefined && typeof patch.email === "string") patch.email = patch.email.trim().slice(0, 254) || null;
  if (patch.phone !== undefined && typeof patch.phone === "string") patch.phone = patch.phone.trim().slice(0, 40) || null;
  if (patch.date_of_birth !== undefined && patch.date_of_birth !== null && (typeof patch.date_of_birth !== "string" || !isValidIsoDate(patch.date_of_birth) || patch.date_of_birth > new Date().toISOString().slice(0,10))) return NextResponse.json({ error: "Use a valid date of birth in the past." }, { status: 400 });
  for (const key of ["annual_income","monthly_expenses","cash_savings","investments","cpf_oa","cpf_sa_ma_ra","property_value","outstanding_loans","monthly_investment","target_retirement_income"] as const) {
    if (patch[key] !== undefined) {
      const n = Number(patch[key]);
      if (!Number.isFinite(n) || n < 0 || n > 999999999999) return NextResponse.json({ error: "Enter valid non-negative financial amounts." }, { status: 400 });
      patch[key] = n;
    }
  }
  if (patch.dependants_count !== undefined) {
    const n = Number(patch.dependants_count);
    if (!Number.isInteger(n) || n < 0 || n > 30) return NextResponse.json({ error: "Dependants must be a whole number from 0 to 30." }, { status: 400 });
    patch.dependants_count = n;
  }
  if (patch.target_retirement_age !== undefined) {
    const n = Number(patch.target_retirement_age);
    if (!Number.isInteger(n) || n < 40 || n > 100) return NextResponse.json({ error: "Retirement age must be from 40 to 100." }, { status: 400 });
    patch.target_retirement_age = n;
  }
  if (patch.full_name === "") return NextResponse.json({ error: "Client name cannot be empty." }, { status: 400 });
  if (patch.review_status !== undefined && !allowedStatus.has(String(patch.review_status))) return NextResponse.json({ error: "Invalid review status." }, { status: 400 });
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "No valid fields provided." }, { status: 400 });
  const { data, error } = await supabase.from("clients").update(patch).eq("id", id).eq("adviser_id", user.id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Could not update the client record." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Client not found." }, { status: 404 });
  await recordAudit(supabase,user.id,"update","client",id,id,Object.keys(patch));
  return NextResponse.json({ ok: true });
}
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Invalid client id." }, { status: 400 });
  const { data, error } = await supabase.from("clients").delete().eq("id", id).eq("adviser_id", user.id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Could not delete the client record." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Client not found." }, { status: 404 });
  await recordAudit(supabase,user.id,"delete","client",id,null,[]);
  return NextResponse.json({ ok: true });
}
