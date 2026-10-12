import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recalculateClientSummary } from "@/lib/assets";
import { recordAudit } from "@/lib/audit";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const assetCategories=new Set(["cash","investments","cpf_oa","cpf_sa_ma_ra","property"]);
const liabilityCategories=new Set(["home_loan","personal_loan","credit_card","other_liability"]);
const validDate=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(new Date(value+"T00:00:00Z").getTime())&&new Date(value+"T00:00:00Z").toISOString().slice(0,10)===value;
export async function PATCH(request:Request,context:{params:Promise<{id:string;assetId:string}>}) {
 const supabase=await createSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id,assetId}=await context.params;if(!uuid.test(id)||!uuid.test(assetId))return NextResponse.json({error:"Invalid id."},{status:400});
 let body:Record<string,unknown>;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid JSON body."},{status:400});}
 const {data:existing,error:existingError}=await supabase.from("client_assets_liabilities").select("item_type,category").eq("id",assetId).eq("client_id",id).eq("adviser_id",user.id).maybeSingle();
 if(existingError||!existing)return NextResponse.json({error:"Ledger item not found."},{status:404});
 const patch:Record<string,unknown>={};
 for(const key of ["item_type","category","description","current_value","interest_rate","monthly_payment","maturity_date","notes"])if(Object.prototype.hasOwnProperty.call(body,key))patch[key]=body[key];
 if(patch.item_type!==undefined&&patch.item_type!=="asset"&&patch.item_type!=="liability")return NextResponse.json({error:"Choose asset or liability."},{status:400});

 if(patch.description!==undefined){if(typeof patch.description!=="string"||patch.description.trim().length<2)return NextResponse.json({error:"Enter a valid description."},{status:400});patch.description=patch.description.trim().slice(0,160);}
 for(const key of ["current_value","monthly_payment"]){if(patch[key]!==undefined){const n=Number(patch[key]);if(!Number.isFinite(n)||n<0||n>999999999999)return NextResponse.json({error:"Enter valid non-negative amounts."},{status:400});patch[key]=n;}}
 if(patch.interest_rate!==undefined&&patch.interest_rate!==null&&patch.interest_rate!==""){const n=Number(patch.interest_rate);if(!Number.isFinite(n)||n<0||n>100)return NextResponse.json({error:"Interest rate must be from 0% to 100%."},{status:400});patch.interest_rate=n;}
 if(patch.maturity_date!==undefined&&patch.maturity_date!==null&&patch.maturity_date!==""&&(typeof patch.maturity_date!=="string"||!validDate(patch.maturity_date)))return NextResponse.json({error:"Enter a valid maturity date."},{status:400});
 const nextType=String(patch.item_type??existing.item_type),nextCategory=String(patch.category??existing.category);
 if(nextType!=="asset"&&nextType!=="liability")return NextResponse.json({error:"Choose asset or liability."},{status:400});
 if(nextType==="asset"?!assetCategories.has(nextCategory):!liabilityCategories.has(nextCategory))return NextResponse.json({error:"Choose a category that matches the item type."},{status:400});
 if(Object.keys(patch).length===0)return NextResponse.json({error:"No valid fields provided."},{status:400});
 const {data,error}=await supabase.from("client_assets_liabilities").update(patch).eq("id",assetId).eq("client_id",id).eq("adviser_id",user.id).select("id,item_type,category,description,current_value,interest_rate,monthly_payment,maturity_date,notes,created_at,updated_at").maybeSingle();
 if(error)return NextResponse.json({error:"Could not update ledger item."},{status:500});if(!data)return NextResponse.json({error:"Ledger item not found."},{status:404});
 await recordAudit(supabase,user.id,"update","asset",assetId,id,Object.keys(patch));
 try{const summary=await recalculateClientSummary(supabase,user.id,id);return NextResponse.json({asset:data,summary:{cash:summary.cash_savings,investments:summary.investments,cpfOa:summary.cpf_oa,cpfSaMaRa:summary.cpf_sa_ma_ra,cpf:summary.cpf_oa+summary.cpf_sa_ma_ra,property:summary.property_value,loans:summary.outstanding_loans}});}catch{return NextResponse.json({error:"Item updated, but summary reconciliation failed."},{status:500});}
}
export async function DELETE(_request:Request,context:{params:Promise<{id:string;assetId:string}>}) {
 const supabase=await createSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id,assetId}=await context.params;if(!uuid.test(id)||!uuid.test(assetId))return NextResponse.json({error:"Invalid id."},{status:400});
 const {data,error}=await supabase.from("client_assets_liabilities").delete().eq("id",assetId).eq("client_id",id).eq("adviser_id",user.id).select("id").maybeSingle();
 if(error)return NextResponse.json({error:"Could not delete ledger item."},{status:500});if(!data)return NextResponse.json({error:"Ledger item not found."},{status:404});
 await recordAudit(supabase,user.id,"delete","asset",assetId,id,[]);
 try{const summary=await recalculateClientSummary(supabase,user.id,id);return NextResponse.json({ok:true,summary:{cash:summary.cash_savings,investments:summary.investments,cpfOa:summary.cpf_oa,cpfSaMaRa:summary.cpf_sa_ma_ra,cpf:summary.cpf_oa+summary.cpf_sa_ma_ra,property:summary.property_value,loans:summary.outstanding_loans}});}catch{return NextResponse.json({error:"Item deleted, but summary reconciliation failed."},{status:500});}
}
