import { createClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/validators";
type Ctx={params:Promise<{id:string}>};
export async function POST(_request:Request,{params}:Ctx){const {id}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return jsonError("Authentication required.",401);const {error}=await supabase.from("saved_opportunities").upsert({user_id:user.id,opportunity_id:id},{onConflict:"user_id,opportunity_id",ignoreDuplicates:true});if(error)return jsonError(error.message,400);return Response.json({ok:true},{status:201});}
