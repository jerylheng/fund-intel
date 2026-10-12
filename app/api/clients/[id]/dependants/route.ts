import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validDate=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(new Date(value+"T00:00:00Z").getTime())&&new Date(value+"T00:00:00Z").toISOString().slice(0,10)===value;
export async function GET(_request:Request,context:{params:Promise<{id:string}>}) {
 const supabase=await createSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id}=await context.params;if(!uuid.test(id))return NextResponse.json({error:"Invalid client id."},{status:400});
 const {data,error}=await supabase.from("client_dependants").select("id,full_name,relationship,date_of_birth,financially_dependent,notes,created_at,updated_at").eq("client_id",id).eq("adviser_id",user.id).order("created_at",{ascending:true});
 if(error)return NextResponse.json({error:"Could not load household members."},{status:500});return NextResponse.json({dependants:data??[]});
}
export async function POST(request:Request,context:{params:Promise<{id:string}>}) {
 const supabase=await createSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id}=await context.params;if(!uuid.test(id))return NextResponse.json({error:"Invalid client id."},{status:400});
 let body:Record<string,unknown>;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid JSON body."},{status:400});}
 const full_name=typeof body.full_name==="string"?body.full_name.trim().slice(0,120):"";
 const relationship=typeof body.relationship==="string"?body.relationship.trim().slice(0,60):"";
 const date_of_birth=typeof body.date_of_birth==="string"&&body.date_of_birth.trim()?body.date_of_birth.trim():null;
 const financially_dependent=body.financially_dependent!==false;
 const notes=typeof body.notes==="string"?body.notes.slice(0,4000):null;
 if(full_name.length<2||relationship.length<2)return NextResponse.json({error:"Enter the dependant's name and relationship."},{status:400});
 if(date_of_birth&&(!validDate(date_of_birth)||date_of_birth>new Date().toISOString().slice(0,10)))return NextResponse.json({error:"Enter a valid date of birth in the past."},{status:400});
 const {data,error}=await supabase.from("client_dependants").insert({adviser_id:user.id,client_id:id,full_name,relationship,date_of_birth,financially_dependent,notes}).select("id,full_name,relationship,date_of_birth,financially_dependent,notes,created_at,updated_at").single();
 if(error||!data)return NextResponse.json({error:"Could not save household member. Confirm the client exists and the database migration is applied."},{status:500});
 const {count}=await supabase.from("client_dependants").select("id",{count:"exact",head:true}).eq("client_id",id).eq("adviser_id",user.id);
 if(typeof count==="number")await supabase.from("clients").update({dependants_count:count}).eq("id",id).eq("adviser_id",user.id);
 return NextResponse.json({dependant:data},{status:201});
}
