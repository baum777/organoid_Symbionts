import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  children,
}: SectionHeadingProps) {
  return (
    <div className={cn(align === "center" ? "mx-auto text-center" : "", "max-w-4xl", className)}>
      <p className="section-label">{eyebrow}</p>
      <h2 className="section-title mt-3">{title}</h2>
      <p className="section-copy mt-4">{description}</p>
      {children}
    </div>
  );
}
