import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureOpeningBalances, recalculateClientSummary } from "@/lib/assets";
import { recordAudit } from "@/lib/audit";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const assetCategories=new Set(["cash","investments","cpf_oa","cpf_sa_ma_ra","property"]);
const liabilityCategories=new Set(["home_loan","personal_loan","credit_card","other_liability"]);
const validDate=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(new Date(value+"T00:00:00Z").getTime())&&new Date(value+"T00:00:00Z").toISOString().slice(0,10)===value;
export async function GET(_request:Request,context:{params:Promise<{id:string}>}) {
 const supabase=await createSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id}=await context.params;if(!uuid.test(id))return NextResponse.json({error:"Invalid client id."},{status:400});
 const {data,error}=await supabase.from("client_assets_liabilities").select("id,item_type,category,description,current_value,interest_rate,monthly_payment,maturity_date,notes,created_at,updated_at").eq("client_id",id).eq("adviser_id",user.id).order("item_type",{ascending:true}).order("created_at",{ascending:true});
 if(error)return NextResponse.json({error:"Could not load the asset ledger."},{status:500});
 const {data:client, error:clientError}=await supabase.from("clients").select("cash_savings,investments,cpf_oa,cpf_sa_ma_ra,property_value,outstanding_loans,asset_ledger_initialized").eq("id",id).eq("adviser_id",user.id).maybeSingle();
 if(clientError||!client)return NextResponse.json({error:"Client not found."},{status:404});
 return NextResponse.json({assets:data??[],summary:{cash:Number(client.cash_savings),investments:Number(client.investments),cpfOa:Number(client.cpf_oa),cpfSaMaRa:Number(client.cpf_sa_ma_ra),cpf:Number(client.cpf_oa)+Number(client.cpf_sa_ma_ra),property:Number(client.property_value),loans:Number(client.outstanding_loans)},initialized:client.asset_ledger_initialized});
}
export async function POST(request:Request,context:{params:Promise<{id:string}>}) {
 const supabase=await createSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id}=await context.params;if(!uuid.test(id))return NextResponse.json({error:"Invalid client id."},{status:400});
 let body:Record<string,unknown>;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid JSON body."},{status:400});}
 const item_type=String(body.item_type??""),category=String(body.category??"");
 const description=typeof body.description==="string"?body.description.trim().slice(0,160):"";
 const current_value=Number(body.current_value??0),monthly_payment=Number(body.monthly_payment??0);
 const interest_rate=body.interest_rate===null||body.interest_rate===""||body.interest_rate===undefined?null:Number(body.interest_rate);
 const maturity_date=typeof body.maturity_date==="string"&&body.maturity_date.trim()?body.maturity_date.trim():null;
 const notes=typeof body.notes==="string"?body.notes.slice(0,4000):null;
 if(item_type!=="asset"&&item_type!=="liability")return NextResponse.json({error:"Choose asset or liability."},{status:400});
 if(item_type==="asset"?!assetCategories.has(category):!liabilityCategories.has(category))return NextResponse.json({error:"Choose a category that matches the item type."},{status:400});
 if(description.length<2)return NextResponse.json({error:"Enter a description."},{status:400});
 if(!Number.isFinite(current_value)||current_value<0||current_value>999999999999||!Number.isFinite(monthly_payment)||monthly_payment<0||monthly_payment>999999999999)return NextResponse.json({error:"Enter valid non-negative amounts."},{status:400});
 if(interest_rate!==null&&(!Number.isFinite(interest_rate)||interest_rate<0||interest_rate>100))return NextResponse.json({error:"Interest rate must be from 0% to 100%."},{status:400});
 if(maturity_date&&(!validDate(maturity_date)))return NextResponse.json({error:"Enter a valid maturity date."},{status:400});
 try{await ensureOpeningBalances(supabase,user.id,id);}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Could not initialize the ledger."},{status:400});}
 const {data,error}=await supabase.from("client_assets_liabilities").insert({adviser_id:user.id,client_id:id,item_type,category,description,current_value,interest_rate,monthly_payment,maturity_date,notes}).select("id,item_type,category,description,current_value,interest_rate,monthly_payment,maturity_date,notes,created_at,updated_at").single();
 if(error||!data)return NextResponse.json({error:"Could not save the ledger item."},{status:500});
 await recordAudit(supabase,user.id,"create","asset",data.id,id,["item_type","category","description","current_value","interest_rate","monthly_payment","maturity_date","notes"]);
 try{const summary=await recalculateClientSummary(supabase,user.id,id);return NextResponse.json({asset:data,summary:{cash:summary.cash_savings,investments:summary.investments,cpfOa:summary.cpf_oa,cpfSaMaRa:summary.cpf_sa_ma_ra,cpf:summary.cpf_oa+summary.cpf_sa_ma_ra,property:summary.property_value,loans:summary.outstanding_loans}},{status:201});}catch{return NextResponse.json({error:"Ledger item saved, but summary reconciliation failed. Refresh and retry reconciliation."},{status:500});}
}
