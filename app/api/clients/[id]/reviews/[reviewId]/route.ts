import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordAudit } from "@/lib/audit";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedActions=new Set(["Confirm dependants and essential monthly expenses","Review existing policies and employer benefits","Discuss emergency savings and debt obligations","Estimate income replacement and critical illness needs","Review nominations, will and legacy intentions"]);
export async function PATCH(request:Request,context:{params:Promise<{id:string;reviewId:string}>}) {
 const supabase=await createSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id,reviewId}=await context.params;if(!uuid.test(id)||!uuid.test(reviewId))return NextResponse.json({error:"Invalid id."},{status:400});
 let body:Record<string,unknown>;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid JSON body."},{status:400});}
 const patch:Record<string,unknown>={};
 if(body.agreed_actions!==undefined){if(!Array.isArray(body.agreed_actions))return NextResponse.json({error:"Invalid checklist."},{status:400});patch.agreed_actions=body.agreed_actions.filter((x):x is string=>typeof x==="string"&&allowedActions.has(x));}
 if(body.next_review_date!==undefined){if(body.next_review_date!==null&&(typeof body.next_review_date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(body.next_review_date)))return NextResponse.json({error:"Invalid next review date."},{status:400});patch.next_review_date=body.next_review_date;}
 if(body.meeting_notes!==undefined){if(typeof body.meeting_notes!=="string")return NextResponse.json({error:"Invalid meeting notes."},{status:400});patch.meeting_notes=body.meeting_notes.slice(0,8000);}
 if(Object.keys(patch).length===0)return NextResponse.json({error:"No valid fields provided."},{status:400});
 const {data,error}=await supabase.from("client_reviews").update(patch).eq("id",reviewId).eq("client_id",id).eq("adviser_id",user.id).select("id,review_date,next_review_date,agreed_actions,meeting_notes,created_at,updated_at").maybeSingle();
 if(error)return NextResponse.json({error:"Could not update review checklist."},{status:500});if(!data)return NextResponse.json({error:"Review not found."},{status:404});
 await recordAudit(supabase,user.id,"review","review",reviewId,id,Object.keys(patch));
 return NextResponse.json({review:{...data,agreed_actions:Array.isArray(data.agreed_actions)?data.agreed_actions.filter((x):x is string=>typeof x==="string"&&allowedActions.has(x)):[]}});
}
