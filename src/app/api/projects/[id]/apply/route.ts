import { createClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/validators";
import { z } from "zod";
type Ctx={params:Promise<{id:string}>};
export async function POST(request:Request,{params}:Ctx){const {id}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return jsonError("Authentication required.",401);const body=z.object({message:z.string().trim().min(10).max(2000)}).safeParse(await request.json().catch(()=>null));if(!body.success)return jsonError("Application message must be 10–2,000 characters.");const {data,error}=await supabase.rpc("apply_to_project",{p_project_id:id,p_message:body.data.message});if(error)return jsonError(error.message,400);return Response.json({id:data},{status:201});}
