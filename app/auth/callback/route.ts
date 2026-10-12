import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if (!url || !key) return NextResponse.redirect(new URL("/setup", request.url));
 const code = request.nextUrl.searchParams.get("code");
 if (!code) return NextResponse.redirect(new URL("/login?error=confirmation", request.url));
 let response = NextResponse.redirect(new URL("/", request.url));
 const supabase = createServerClient(url,key,{cookies:{getAll:()=>request.cookies.getAll(),setAll(cookiesToSet){cookiesToSet.forEach(({name,value,options})=>{request.cookies.set(name,value);response.cookies.set(name,value,options);});}}});
 const {error} = await supabase.auth.exchangeCodeForSession(code);
 if (error) response = NextResponse.redirect(new URL("/login?error=confirmation",request.url));
 return response;
}
