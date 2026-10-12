import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordAudit } from "@/lib/audit";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const types=new Set(["hospitalisation","life","critical_illness","disability_income","personal_accident","long_term_care","investment_linked","savings","other"]);
const statuses=new Set(["active","pending","lapsed","surrendered"]);
export async function GET(_request:Request,context:{params:Promise<{id:string}>}) {
 const supabase=await createSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id}=await context.params;if(!uuid.test(id))return NextResponse.json({error:"Invalid client id."},{status:400});
 const {data,error}=await supabase.from("client_policies").select("id,insurer,policy_name,policy_type,policy_number_last4,sum_assured,annual_premium,start_date,review_date,status,notes,created_at,updated_at").eq("client_id",id).eq("adviser_id",user.id).order("review_date",{ascending:true,nullsFirst:false});
 if(error)return NextResponse.json({error:"Could not load policies."},{status:500});return NextResponse.json({policies:data??[]});
}
export async function POST(request:Request,context:{params:Promise<{id:string}>}) {
 const supabase=await createSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id}=await context.params;if(!uuid.test(id))return NextResponse.json({error:"Invalid client id."},{status:400});
 let body:Record<string,unknown>;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid JSON body."},{status:400});}
 const policy_name=typeof body.policy_name==="string"?body.policy_name.trim().slice(0,160):"";
 const policy_type=String(body.policy_type??"other"),status=String(body.status??"active");
 const sum_assured=Number(body.sum_assured??0),annual_premium=Number(body.annual_premium??0);
 if(policy_name.length<2)return NextResponse.json({error:"Enter a policy name."},{status:400});
 if(!types.has(policy_type)||!statuses.has(status))return NextResponse.json({error:"Choose a valid policy type and status."},{status:400});
 if(!Number.isFinite(sum_assured)||sum_assured<0||sum_assured>999999999999||!Number.isFinite(annual_premium)||annual_premium<0||annual_premium>999999999999)return NextResponse.json({error:"Enter valid policy amounts."},{status:400});
 const date=(v:unknown)=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v:null;
 const insurer=typeof body.insurer==="string"?body.insurer.trim().slice(0,120):null;
 const policy_number_last4=typeof body.policy_number_last4==="string"?body.policy_number_last4.replace(/\D/g,"").slice(-4):null;
 const notes=typeof body.notes==="string"?body.notes.slice(0,4000):null;
 const {data,error}=await supabase.from("client_policies").insert({adviser_id:user.id,client_id:id,insurer,policy_name,policy_type,policy_number_last4,sum_assured,annual_premium,start_date:date(body.start_date),review_date:date(body.review_date),status,notes}).select("id,insurer,policy_name,policy_type,policy_number_last4,sum_assured,annual_premium,start_date,review_date,status,notes,created_at,updated_at").single();
 if(error||!data)return NextResponse.json({error:"Could not save policy. Confirm the client exists and the database migration is applied."},{status:500});await recordAudit(supabase,user.id,"create","policy",data.id,id,["insurer","policy_name","policy_type","policy_number_last4","sum_assured","annual_premium","start_date","review_date","status","notes"]);return NextResponse.json({policy:data},{status:201});
}
