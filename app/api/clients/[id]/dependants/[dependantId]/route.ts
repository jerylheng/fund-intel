import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validDate=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(new Date(value+"T00:00:00Z").getTime())&&new Date(value+"T00:00:00Z").toISOString().slice(0,10)===value;
export async function PATCH(request:Request,context:{params:Promise<{id:string;dependantId:string}>}) {
 const supabase=await createSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id,dependantId}=await context.params;if(!uuid.test(id)||!uuid.test(dependantId))return NextResponse.json({error:"Invalid id."},{status:400});
 let body:Record<string,unknown>;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid JSON body."},{status:400});}
 const patch:Record<string,unknown>={};
 if(body.full_name!==undefined){if(typeof body.full_name!=="string"||body.full_name.trim().length<2)return NextResponse.json({error:"Enter a valid name."},{status:400});patch.full_name=body.full_name.trim().slice(0,120);}
 if(body.relationship!==undefined){if(typeof body.relationship!=="string"||body.relationship.trim().length<2)return NextResponse.json({error:"Enter a valid relationship."},{status:400});patch.relationship=body.relationship.trim().slice(0,60);}
 if(body.date_of_birth!==undefined){if(body.date_of_birth!==null&&(typeof body.date_of_birth!=="string"||!validDate(body.date_of_birth)||body.date_of_birth>new Date().toISOString().slice(0,10)))return NextResponse.json({error:"Enter a valid date of birth in the past."},{status:400});patch.date_of_birth=body.date_of_birth;}
 if(body.financially_dependent!==undefined){if(typeof body.financially_dependent!=="boolean")return NextResponse.json({error:"Invalid dependant flag."},{status:400});patch.financially_dependent=body.financially_dependent;}
 if(body.notes!==undefined){if(typeof body.notes!=="string")return NextResponse.json({error:"Invalid notes."},{status:400});patch.notes=body.notes.slice(0,4000);}
 if(Object.keys(patch).length===0)return NextResponse.json({error:"No valid fields provided."},{status:400});
 const {data,error}=await supabase.from("client_dependants").update(patch).eq("id",dependantId).eq("client_id",id).eq("adviser_id",user.id).select("id").maybeSingle();
 if(error)return NextResponse.json({error:"Could not update dependant."},{status:500});if(!data)return NextResponse.json({error:"Dependant not found."},{status:404});return NextResponse.json({ok:true});
}
export async function DELETE(_request:Request,context:{params:Promise<{id:string;dependantId:string}>}) {
 const supabase=await createSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id,dependantId}=await context.params;if(!uuid.test(id)||!uuid.test(dependantId))return NextResponse.json({error:"Invalid id."},{status:400});
 const {data,error}=await supabase.from("client_dependants").delete().eq("id",dependantId).eq("client_id",id).eq("adviser_id",user.id).select("id").maybeSingle();
 if(error)return NextResponse.json({error:"Could not delete dependant."},{status:500});if(!data)return NextResponse.json({error:"Dependant not found."},{status:404});
 const {count}=await supabase.from("client_dependants").select("id",{count:"exact",head:true}).eq("client_id",id).eq("adviser_id",user.id);
 if(typeof count==="number")await supabase.from("clients").update({dependants_count:count}).eq("id",id).eq("adviser_id",user.id);
 return NextResponse.json({ok:true});
}
