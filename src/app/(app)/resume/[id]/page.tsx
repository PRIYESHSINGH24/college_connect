import { redirect } from "next/navigation";
type Props={params:Promise<{id:string}>};
export default async function ResumeRoot({params}:Props){const {id}=await params;redirect(`/resume/${id}/edit`);}
