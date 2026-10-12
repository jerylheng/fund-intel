import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordAudit } from "@/lib/audit";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function DELETE(_request:Request,context:{params:Promise<{id:string;policyId:string}>}) {
 const supabase=await createSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id,policyId}=await context.params;if(!uuid.test(id)||!uuid.test(policyId))return NextResponse.json({error:"Invalid id."},{status:400});
 const {data,error}=await supabase.from("client_policies").delete().eq("id",policyId).eq("client_id",id).eq("adviser_id",user.id).select("id").maybeSingle();
 if(error)return NextResponse.json({error:"Could not delete policy."},{status:500});if(!data)return NextResponse.json({error:"Policy not found."},{status:404});await recordAudit(supabase,user.id,"delete","policy",policyId,id,[]);return NextResponse.json({ok:true});
}
