import { Link } from "react-router-dom";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

/*
 * items: [{ label, to }] from the top down; the last one is the current page and has no link.
 * On phones only the step back shows, as "‹ Parent", to save space.
 */
export const Breadcrumbs = ({ items }) => {
  const parent = items.at(-2);
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      {parent && (
        <Link to={parent.to} state={parent.state} className="inline-flex items-center gap-1 font-medium text-primary hover:underline sm:hidden">
          <CaretLeft className="size-3.5" aria-hidden /> {parent.label}
        </Link>
      )}
      <ol className="hidden flex-wrap items-center gap-1 text-muted-foreground sm:flex">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <CaretRight className="size-3" aria-hidden />}
              {last ? (
                <span aria-current="page" className="font-medium text-foreground">
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} state={item.state} className="hover:text-foreground hover:underline">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// A page that sits under another one: breadcrumbs, an optional heading, then its content.
export const SubPage = ({ crumbs, title, description, children, className = "max-w-2xl" }) => (
  <div className={`space-y-4 ${className}`}>
    <Breadcrumbs items={crumbs} />
    {title && (
      <header>
        <h1 className="text-xl sm:text-2xl">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </header>
    )}
    {children}
  </div>
);
