import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError } from "@/lib/validators";
export async function DELETE(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return jsonError("Authentication required.",401);const admin=createAdminClient();const {error}=await admin.from("github_connections").delete().eq("user_id",user.id);if(error)return jsonError(error.message,400);await supabase.from("profiles").update({github_username:null}).eq("id",user.id);return Response.json({ok:true});}
