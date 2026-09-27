"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ActionState = { error: string | null };
const EGYPT_PHONE_REGEX = /^01[0125][0-9]{8}$/;

export async function signUp(_prevState:ActionState,formData:FormData):Promise<ActionState>{
  const email=String(formData.get("email")??"").trim(),password=String(formData.get("password")??""),fullName=String(formData.get("full_name")??"").trim(),phone=String(formData.get("phone")??"").trim(),role=String(formData.get("role")??"athlete");
  if(!email||!password||!fullName)return{error:"من فضلك املأ كل البيانات المطلوبة"};
  if(password.length<6)return{error:"كلمة المرور لازم تكون 6 أحرف على الأقل"};
  if(!EGYPT_PHONE_REGEX.test(phone))return{error:"رقم الهاتف غير صحيح (مثال: 01012345678)"};
  if(role!=="athlete"&&role!=="coach")return{error:"نوع الحساب غير صالح"};
  const s=await createClient();const{data,error}=await s.auth.signUp({email,password,options:{data:{full_name:fullName,phone,role}}});if(error)return{error:error.message};
  if(role==="coach"&&data.user){const{error:e}=await(s.from("coaches") as any).insert({id:data.user.id});if(e)return{error:"تم إنشاء الحساب لكن تعذر إنشاء ملف المدرب."};}
  revalidatePath("/","layout");
  if(!data.session)return{error:"تم إنشاء الحساب. راجع بريدك الإلكتروني لتأكيد الحساب ثم سجّل الدخول."};
  redirect(role==="coach"?"/coach/dashboard":"/dashboard");
}

export async function login(_prevState:ActionState,formData:FormData):Promise<ActionState>{
  const email=String(formData.get("email")??"").trim(),password=String(formData.get("password")??"");
  if(!email||!password)return{error:"اكتب البريد الإلكتروني وكلمة المرور"};
  const s=await createClient();const{error}=await s.auth.signInWithPassword({email,password});if(error)return{error:"بيانات الدخول غير صحيحة"};
  const{data:{user}}=await s.auth.getUser();if(!user)return{error:"تعذر قراءة جلسة الدخول"};
  const{data:profile}=await s.from("profiles").select("role").eq("id",user.id).maybeSingle();
  revalidatePath("/","layout");
  if(profile?.role==="admin")redirect("/admin");
  if(profile?.role==="coach")redirect("/coach/dashboard");
  redirect("/dashboard");
}

export async function logout(){const s=await createClient();await s.auth.signOut();revalidatePath("/","layout");redirect("/auth/login");}
