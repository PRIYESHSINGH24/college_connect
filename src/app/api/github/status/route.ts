import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError } from "@/lib/validators";
export async function GET(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return jsonError("Authentication required.",401);if(!process.env.SUPABASE_SERVICE_ROLE_KEY)return Response.json({connected:false,status:"not_configured"});const admin=createAdminClient();const {data,error}=await admin.from("github_connections").select("github_username,sync_status,last_synced_at,last_error,connected_at").eq("user_id",user.id).maybeSingle();if(error)return jsonError(error.message,400);return Response.json({connected:!!data,connection:data});}
