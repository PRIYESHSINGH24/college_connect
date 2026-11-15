import { createClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/validators";
import { z } from "zod";
type Ctx={params:Promise<{id:string}>};
export async function PATCH(request:Request,{params}:Ctx){const {id}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return jsonError("Authentication required.",401);const parsed=z.object({decision:z.enum(["accepted","rejected"])}).safeParse(await request.json().catch(()=>null));if(!parsed.success)return jsonError("Choose accept or reject.");const rpcName=parsed.data.decision==="accepted"?"accept_project_application":"reject_project_application";const {error}=await supabase.rpc(rpcName,{p_application_id:id});if(error)return jsonError(error.message,400);return Response.json({ok:true});}
