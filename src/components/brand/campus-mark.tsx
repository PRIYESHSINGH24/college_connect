import { Users } from "lucide-react";
import type { SVGProps } from "react";

/**
 * CampusLoop mark using the Users icon (ISC licensed,
 * hand-designed) so it is a real icon asset rather than generated artwork.
 */
export function CampusMark({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return <Users className={className} strokeWidth={1.9} {...props} />;
}

export function CampusWordmark({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
      <span className={`grid size-10 shrink-0 place-items-center rounded-[13px] ${inverse ? "bg-[#C7F36B] text-[#20231F]" : "bg-[#20231F] text-[#C7F36B]"}`}>
        <CampusMark className="size-[26px]" />
      </span>
      {!compact && (
        <span className={`font-black tracking-[-.055em] ${inverse ? "text-white" : "text-[#20231F]"}`}>
          campus<span className={inverse ? "text-[#C7F36B]" : "text-[#5555D9]"}>loop</span>
        </span>
      )}
    </span>
  );
}
