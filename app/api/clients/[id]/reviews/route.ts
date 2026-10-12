import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordAudit } from "@/lib/audit";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedActions=new Set(["Confirm dependants and essential monthly expenses","Review existing policies and employer benefits","Discuss emergency savings and debt obligations","Estimate income replacement and critical illness needs","Review nominations, will and legacy intentions"]);
function cleanActions(value:unknown){return Array.isArray(value)?value.filter((x):x is string=>typeof x==="string"&&allowedActions.has(x)):[];}
export async function GET(_request:Request,context:{params:Promise<{id:string}>}) {
 const supabase=await createSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id}=await context.params;if(!uuid.test(id))return NextResponse.json({error:"Invalid client id."},{status:400});
 const {data,error}=await supabase.from("client_reviews").select("id,review_date,next_review_date,agreed_actions,meeting_notes,created_at,updated_at").eq("client_id",id).eq("adviser_id",user.id).order("review_date",{ascending:false}).limit(1).maybeSingle();
 if(error)return NextResponse.json({error:"Could not load review checklist."},{status:500});
 return NextResponse.json({review:data?{...data,agreed_actions:cleanActions(data.agreed_actions)}:null});
}
export async function POST(request:Request,context:{params:Promise<{id:string}>}) {
 const supabase=await createSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id}=await context.params;if(!uuid.test(id))return NextResponse.json({error:"Invalid client id."},{status:400});
 let body:Record<string,unknown>;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid JSON body."},{status:400});}
 const actions=cleanActions(body.agreed_actions);
 const {data,error}=await supabase.from("client_reviews").insert({adviser_id:user.id,client_id:id,agreed_actions:actions}).select("id,review_date,next_review_date,agreed_actions,meeting_notes,created_at,updated_at").single();
 if(error||!data)return NextResponse.json({error:"Could not save review checklist."},{status:500});
 await recordAudit(supabase,user.id,"review","review",data.id,id,["agreed_actions"]);
 return NextResponse.json({review:{...data,agreed_actions:cleanActions(data.agreed_actions)}},{status:201});
}
