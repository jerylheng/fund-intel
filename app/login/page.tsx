"use client";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import "./login.css";

export default function LoginPage() {
 const [mode,setMode] = useState<"signin"|"signup">("signin");
 const [email,setEmail] = useState("");
 const [password,setPassword] = useState("");
 const [name,setName] = useState("");
 const [busy,setBusy] = useState(false);
 const [error,setError] = useState("");
 const [success,setSuccess] = useState("");
 async function submit(e:FormEvent) {
  e.preventDefault(); setBusy(true); setError(""); setSuccess("");
  const supabase = createSupabaseBrowserClient();
  if (!supabase) { setError("Secure sign-in is not configured yet. Please complete the database setup first."); setBusy(false); return; }
  if (mode === "signup") {
   const {data,error} = await supabase.auth.signUp({email:email.trim(),password,options:{data:{full_name:name.trim()},emailRedirectTo:window.location.origin+"/auth/callback"}});
   if (error) setError(error.message);
   else if (data.session) window.location.assign("/");
   else setSuccess("Account created. Check your email to confirm the address, then sign in.");
  } else {
   const {error} = await supabase.auth.signInWithPassword({email:email.trim(),password});
   if (error) setError("Sign-in failed. Check your email and password, then try again.");
   else { const next = new URLSearchParams(window.location.search).get("next"); window.location.assign(next && next.startsWith("/") && !next.startsWith("//") ? next : "/"); }
  }
  setBusy(false);
 }
 return <main className="loginShell"><section className="loginCard"><div className="loginBrand"><span className="loginMark">F</span><div><b>Finwise</b><small>ADVISER WORKSPACE</small></div></div><h1>{mode==="signin"?"Welcome back":"Create your adviser account"}</h1><p className="loginLead">{mode==="signin"?"Sign in to securely access your financial planning workspace.":"Create an account to manage your own client planning records."}</p><form onSubmit={submit}>{mode==="signup"&&<label className="loginField">Full name<input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} required minLength={2} maxLength={100}/></label>}<label className="loginField">Work email<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required maxLength={254}/></label><label className="loginField">Password<input type="password" autoComplete={mode==="signin"?"current-password":"new-password"} value={password} onChange={e=>setPassword(e.target.value)} required minLength={10} maxLength={128}/></label>{error&&<p className="loginError" role="alert">{error}</p>}{success&&<p className="loginSuccess" role="status">{success}</p>}<button className="loginSubmit" disabled={busy}>{busy?"Please wait…":mode==="signin"?"Sign in securely":"Create account"}</button></form><button className="loginSwitch" onClick={()=>{setMode(mode==="signin"?"signup":"signin");setError("");setSuccess("");}}>{mode==="signin"?"New to Finwise? Create an account":"Already have an account? Sign in"}</button><p className="loginPrivacy">Client information is private financial data. Use a unique password, enable email confirmation, and never share account credentials.</p></section></main>;
}
