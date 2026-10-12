import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordAudit } from "@/lib/audit";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const types = new Set(["retirement","property","education","protection","legacy","investment","other"]);
const priorities = new Set(["low","medium","high"]);
const statuses = new Set(["not_started","in_progress","on_track","at_risk","completed"]);
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
 const supabase=await createSupabaseServerClient(); if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser(); if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id}=await context.params; if(!uuid.test(id))return NextResponse.json({error:"Invalid client id."},{status:400});
 const {data,error}=await supabase.from("client_goals").select("id,title,goal_type,target_amount,current_amount,target_date,priority,status,notes,created_at,updated_at").eq("client_id",id).eq("adviser_id",user.id).order("target_date",{ascending:true,nullsFirst:false});
 if(error)return NextResponse.json({error:"Could not load goals."},{status:500});
 return NextResponse.json({goals:data??[]});
}
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
 const supabase=await createSupabaseServerClient(); if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser(); if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id}=await context.params; if(!uuid.test(id))return NextResponse.json({error:"Invalid client id."},{status:400});
 let body:Record<string,unknown>;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid JSON body."},{status:400});}
 const title=typeof body.title==="string"?body.title.trim().slice(0,120):"";
 const goal_type=String(body.goal_type??"");
 const target_amount=Number(body.target_amount??0),current_amount=Number(body.current_amount??0);
 const priority=String(body.priority??"medium"),status=String(body.status??"in_progress");
 if(title.length<2)return NextResponse.json({error:"Enter a goal name."},{status:400});
 if(!types.has(goal_type)||!priorities.has(priority)||!statuses.has(status))return NextResponse.json({error:"Choose valid goal settings."},{status:400});
 if(!Number.isFinite(target_amount)||target_amount<0||target_amount>999999999999||!Number.isFinite(current_amount)||current_amount<0||current_amount>999999999999)return NextResponse.json({error:"Enter valid goal amounts."},{status:400});
 const target_date=typeof body.target_date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(body.target_date)?body.target_date:null;
 const notes=typeof body.notes==="string"?body.notes.slice(0,4000):null;
 const {data,error}=await supabase.from("client_goals").insert({adviser_id:user.id,client_id:id,title,goal_type,target_amount,current_amount,target_date,priority,status,notes}).select("id,title,goal_type,target_amount,current_amount,target_date,priority,status,notes,created_at,updated_at").single();
 if(error||!data)return NextResponse.json({error:"Could not save the goal. Confirm the client exists and the database migration is applied."},{status:500});
 await recordAudit(supabase,user.id,"create","goal",data.id,id,["title","goal_type","target_amount","current_amount","target_date","priority","status","notes"]);
 return NextResponse.json({goal:data},{status:201});
}
