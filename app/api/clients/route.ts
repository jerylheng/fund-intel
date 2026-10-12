import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordAudit } from "@/lib/audit";

const numberOrZero = (value: unknown) => {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const statusMap: Record<string,string> = { new: "New", on_track: "On track", review_needed: "Review needed", action_needed: "Action needed" };

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data, error } = await supabase.from("clients").select("id,full_name,email,phone,date_of_birth,residency_status,marital_status,dependants_count,occupation,annual_income,monthly_expenses,cash_savings,investments,cpf_oa,cpf_sa_ma_ra,property_value,outstanding_loans,monthly_investment,target_retirement_age,target_retirement_income,review_status,review_due_date").eq("adviser_id", user.id).order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Could not load client records." }, { status: 500 });
  return NextResponse.json({ clients: (data ?? []).map(c => ({
    id: c.id, name: c.full_name, email: c.email || "", phone: c.phone || "", dateOfBirth: c.date_of_birth || "", residencyStatus: c.residency_status || "", maritalStatus: c.marital_status || "", dependantsCount: Number(c.dependants_count) || 0, role: c.occupation || "Client", age: c.date_of_birth ? Math.max(0, new Date().getFullYear() - new Date(c.date_of_birth).getFullYear() - (new Date().toISOString().slice(5,10) < c.date_of_birth.slice(5,10) ? 1 : 0)) : null,
    income: Number(c.annual_income) / 12, expenses: Number(c.monthly_expenses),
    cash: Number(c.cash_savings), investments: Number(c.investments),
    cpf: Number(c.cpf_oa) + Number(c.cpf_sa_ma_ra), property: Number(c.property_value),
    loans: Number(c.outstanding_loans), monthlyInvest: Number(c.monthly_investment),
    retirementAge: c.target_retirement_age, retirementTarget: Number(c.target_retirement_income),
    status: statusMap[c.review_status] ?? "New", reviewDueDate: c.review_due_date
  })) });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const full_name = typeof body.full_name === "string" ? body.full_name.trim().slice(0, 120) : "";
  if (full_name.length < 2) return NextResponse.json({ error: "Enter the client's full name (at least 2 characters)." }, { status: 400 });
  const email = typeof body.email === "string" && body.email.trim() ? body.email.trim().slice(0, 254) : null;
  const occupation = typeof body.occupation === "string" ? body.occupation.trim().slice(0, 120) : null;
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : null;
  const date_of_birth = typeof body.date_of_birth === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date_of_birth) ? body.date_of_birth : null;
  const residency_status = typeof body.residency_status === "string" ? body.residency_status.slice(0, 60) : null;
  const marital_status = typeof body.marital_status === "string" ? body.marital_status.slice(0, 30) : null;
  const dependants_count = Math.min(30, Math.max(0, Math.round(numberOrZero(body.dependants_count))));
  const payload = {
    adviser_id: user.id, full_name, email, phone, date_of_birth, residency_status, marital_status, dependants_count, occupation,
    annual_income: numberOrZero(body.annual_income),
    monthly_expenses: numberOrZero(body.monthly_expenses),
    cash_savings: numberOrZero(body.cash_savings),
    investments: numberOrZero(body.investments),
    cpf_oa: numberOrZero(body.cpf_oa),
    cpf_sa_ma_ra: numberOrZero(body.cpf_sa_ma_ra),
    property_value: numberOrZero(body.property_value),
    outstanding_loans: numberOrZero(body.outstanding_loans),
    monthly_investment: numberOrZero(body.monthly_investment),
    target_retirement_age: Math.min(100, Math.max(40, Math.round(numberOrZero(body.target_retirement_age) || 65))),
    target_retirement_income: numberOrZero(body.target_retirement_income),
    review_status: "new"
  };
  const { data, error } = await supabase.from("clients").insert(payload).select("id,full_name,email,phone,date_of_birth,residency_status,marital_status,dependants_count,occupation,annual_income,monthly_expenses,cash_savings,investments,cpf_oa,cpf_sa_ma_ra,property_value,outstanding_loans,monthly_investment,target_retirement_age,target_retirement_income,review_status,review_due_date").single();
  if (error || !data) return NextResponse.json({ error: "Could not save the client record." }, { status: 500 });
  await recordAudit(supabase,user.id,"create","client",data.id,data.id,Object.keys(payload).filter(k=>k!=="adviser_id"));
  return NextResponse.json({ client: {
    id: data.id, name: data.full_name, email: data.email || "", phone: data.phone || "", dateOfBirth: data.date_of_birth || "", residencyStatus: data.residency_status || "", maritalStatus: data.marital_status || "", dependantsCount: Number(data.dependants_count) || 0, role: data.occupation || "Client", age: data.date_of_birth ? Math.max(0, new Date().getFullYear() - new Date(data.date_of_birth).getFullYear() - (new Date().toISOString().slice(5,10) < data.date_of_birth.slice(5,10) ? 1 : 0)) : null,
    income: Number(data.annual_income) / 12, expenses: Number(data.monthly_expenses),
    cash: Number(data.cash_savings), investments: Number(data.investments),
    cpf: Number(data.cpf_oa) + Number(data.cpf_sa_ma_ra), property: Number(data.property_value),
    loans: Number(data.outstanding_loans), monthlyInvest: Number(data.monthly_investment),
    retirementAge: data.target_retirement_age, retirementTarget: Number(data.target_retirement_income),
    status: statusMap[data.review_status] ?? "New", reviewDueDate: data.review_due_date
  } }, { status: 201 });
}
