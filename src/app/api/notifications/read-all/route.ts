import { createClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/validators";
export async function POST(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return jsonError("Authentication required.",401);const {error}=await supabase.from("notifications").update({is_read:true}).eq("recipient_id",user.id).eq("is_read",false);if(error)return jsonError(error.message,400);return Response.json({ok:true});}
