import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Navegação da página" className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mb-6">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" aria-hidden="true" />}
            
            {isLast ? (
              <span className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs" aria-current="page">
                {item.label}
              </span>
            ) : (
              <button
                onClick={item.onClick}
                className={`truncate max-w-[150px] sm:max-w-[200px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 rounded-sm ${
                  item.onClick ? "hover:text-sky-600 hover:underline" : "cursor-default"
                }`}
              >
                {item.label}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}
