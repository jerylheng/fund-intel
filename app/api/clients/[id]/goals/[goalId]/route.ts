import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function PATCH(request:Request,context:{params:Promise<{id:string;goalId:string}>}) {
 const supabase=await createSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id,goalId}=await context.params;if(!uuid.test(id)||!uuid.test(goalId))return NextResponse.json({error:"Invalid id."},{status:400});
 let body:Record<string,unknown>;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid JSON body."},{status:400});}
 const allowed=["title","goal_type","target_amount","current_amount","target_date","priority","status","notes"];
 const patch:Record<string,unknown>={};for(const key of allowed)if(Object.prototype.hasOwnProperty.call(body,key))patch[key]=body[key];
 if(typeof patch.title==="string"){patch.title=patch.title.trim().slice(0,120);if(!patch.title)return NextResponse.json({error:"Goal name cannot be empty."},{status:400});}
 for(const key of ["target_amount","current_amount"]){if(patch[key]!==undefined){const n=Number(patch[key]);if(!Number.isFinite(n)||n<0||n>999999999999)return NextResponse.json({error:"Enter valid goal amounts."},{status:400});patch[key]=n;}}
 const allowedTypes=new Set(["retirement","property","education","protection","legacy","investment","other"]);
 const allowedPriorities=new Set(["low","medium","high"]);const allowedStatuses=new Set(["not_started","in_progress","on_track","at_risk","completed"]);
 if(patch.goal_type!==undefined&&!allowedTypes.has(String(patch.goal_type)))return NextResponse.json({error:"Invalid goal type."},{status:400});
 if(patch.priority!==undefined&&!allowedPriorities.has(String(patch.priority)))return NextResponse.json({error:"Invalid priority."},{status:400});
 if(patch.status!==undefined&&!allowedStatuses.has(String(patch.status)))return NextResponse.json({error:"Invalid goal status."},{status:400});
 if(Object.keys(patch).length===0)return NextResponse.json({error:"No valid fields provided."},{status:400});
 const {data,error}=await supabase.from("client_goals").update(patch).eq("id",goalId).eq("client_id",id).eq("adviser_id",user.id).select("id").maybeSingle();
 if(error)return NextResponse.json({error:"Could not update goal."},{status:500});if(!data)return NextResponse.json({error:"Goal not found."},{status:404});return NextResponse.json({ok:true});
}
export async function DELETE(_request:Request,context:{params:Promise<{id:string;goalId:string}>}) {
 const supabase=await createSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id,goalId}=await context.params;if(!uuid.test(id)||!uuid.test(goalId))return NextResponse.json({error:"Invalid id."},{status:400});
 const {data,error}=await supabase.from("client_goals").delete().eq("id",goalId).eq("client_id",id).eq("adviser_id",user.id).select("id").maybeSingle();
 if(error)return NextResponse.json({error:"Could not delete goal."},{status:500});if(!data)return NextResponse.json({error:"Goal not found."},{status:404});return NextResponse.json({ok:true});
}
