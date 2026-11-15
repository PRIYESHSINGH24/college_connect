import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ResumeEditor } from "@/components/resume/resume-editor";
import type { ResumeContent } from "@/types/app";
type Props={params:Promise<{id:string}>};
export default async function EditResumePage({params}:Props){const {id}=await params;const {supabase}=await requireUser();const {data,error}=await supabase.from("resumes").select("id,title,template,content").eq("id",id).maybeSingle();if(error||!data)notFound();return <div><PageHeader eyebrow="CAREER STUDIO" title="Edit resume" description="Update your content, choose a template, and export your PDF."/><ResumeEditor resumeId={data.id} initial={{title:data.title,template:data.template as "ats"|"modern"|"compact",content:data.content as ResumeContent&Record<string,unknown>}}/></div>}
