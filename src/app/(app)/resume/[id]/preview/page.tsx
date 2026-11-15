import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ResumeDownload, ResumePreview } from "@/components/resume/resume-pdf";
import type { ResumeContent } from "@/types/app";
type Props={params:Promise<{id:string}>};
export default async function ResumePreviewPage({params}:Props){const {id}=await params;const {supabase}=await requireUser();const {data,error}=await supabase.from("resumes").select("id,title,template,content").eq("id",id).maybeSingle();if(error||!data)notFound();return <div><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">PDF PREVIEW</p><h1 className="mt-1 text-2xl font-black">{data.title}</h1></div><div className="flex gap-2"><Link href={`/resume/${id}/edit`} className="btn-secondary">Edit</Link><ResumeDownload content={data.content as ResumeContent&Record<string,unknown>} title={data.title} template={data.template}/></div></div><ResumePreview content={data.content as ResumeContent&Record<string,unknown>} title={data.title}/></div>}
