import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-600 mb-4">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3 w-3 text-zinc-700" />}
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-zinc-400 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-zinc-400 font-medium" : ""}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
