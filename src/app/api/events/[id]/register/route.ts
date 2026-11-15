import { createClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/validators";
type Ctx={params:Promise<{id:string}>};
export async function POST(_request:Request,{params}:Ctx){const {id}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return jsonError("Authentication required.",401);const {error}=await supabase.rpc("register_for_event",{p_event_id:id});if(error)return jsonError(error.message,400);return Response.json({ok:true},{status:201});}
