import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function GET(_request:Request,context:{params:Promise<{id:string}>}) {
 const supabase=await createSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id}=await context.params;if(!uuid.test(id))return NextResponse.json({error:"Invalid client id."},{status:400});
 const {data,error}=await supabase.from("client_planning_scenarios").select("id,name,starting_investable_assets,monthly_contribution,retirement_age,target_monthly_income,expected_annual_return_pct,inflation_pct,notes,created_at,updated_at").eq("client_id",id).eq("adviser_id",user.id).order("created_at",{ascending:false});
 if(error)return NextResponse.json({error:"Could not load saved scenarios."},{status:500});return NextResponse.json({scenarios:data??[]});
}
export async function POST(request:Request,context:{params:Promise<{id:string}>}) {
 const supabase=await createSupabaseServerClient();if(!supabase)return NextResponse.json({error:"Database is not configured."},{status:503});
 const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Authentication required."},{status:401});
 const {id}=await context.params;if(!uuid.test(id))return NextResponse.json({error:"Invalid client id."},{status:400});
 let body:Record<string,unknown>;try{body=await request.json();}catch{return NextResponse.json({error:"Invalid JSON body."},{status:400});}
 const name=typeof body.name==="string"?body.name.trim().slice(0,100):"";
 if(name.length<2)return NextResponse.json({error:"Give this scenario a name."},{status:400});
 const numericFields=["starting_investable_assets","monthly_contribution","target_monthly_income"] as const;
 const numbers:Record<string,number>={};
 for(const key of numericFields){const n=Number(body[key]??0);if(!Number.isFinite(n)||n<0||n>999999999999)return NextResponse.json({error:"Enter valid non-negative financial amounts."},{status:400});numbers[key]=n;}
 const retirement_age=Number(body.retirement_age),expected_annual_return_pct=Number(body.expected_annual_return_pct),inflation_pct=Number(body.inflation_pct);
 if(!Number.isInteger(retirement_age)||retirement_age<40||retirement_age>100)return NextResponse.json({error:"Retirement age must be from 40 to 100."},{status:400});
 if(!Number.isFinite(expected_annual_return_pct)||expected_annual_return_pct<0||expected_annual_return_pct>15)return NextResponse.json({error:"Expected annual return must be from 0% to 15%."},{status:400});
 if(!Number.isFinite(inflation_pct)||inflation_pct<0||inflation_pct>10)return NextResponse.json({error:"Inflation assumption must be from 0% to 10%."},{status:400});
 const notes=typeof body.notes==="string"?body.notes.slice(0,4000):null;
 const {data,error}=await supabase.from("client_planning_scenarios").insert({adviser_id:user.id,client_id:id,name,starting_investable_assets:numbers.starting_investable_assets,monthly_contribution:numbers.monthly_contribution,retirement_age,target_monthly_income:numbers.target_monthly_income,expected_annual_return_pct,inflation_pct,notes}).select("id,name,starting_investable_assets,monthly_contribution,retirement_age,target_monthly_income,expected_annual_return_pct,inflation_pct,notes,created_at,updated_at").single();
 if(error||!data)return NextResponse.json({error:"Could not save the scenario. Confirm the database migration is applied."},{status:500});
 return NextResponse.json({scenario:data},{status:201});
}
