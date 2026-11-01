import { CalendarCheck, Receipt, ShieldWarning } from "@phosphor-icons/react";
import { Logo } from "./AppLayout";

const highlights = [
  { icon: Receipt, text: "Bring in spending from M-Pesa statements and receipts" },
  { icon: ShieldWarning, text: "Get alerted the moment a budget is exceeded" },
  { icon: CalendarCheck, text: "See where your month is heading before it ends" },
];

const AuthLayout = ({ title, description, children, wide = false }) => (
  <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
    <aside className="hidden flex-col justify-between bg-[#17122e] p-12 text-white lg:flex">
      <Logo />
      <div>
        <h2 className="max-w-md text-3xl leading-tight font-semibold tracking-tight">
          Know where your money goes, and what's left.
        </h2>
        <ul className="mt-8 space-y-4">
          {highlights.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-white/75">
              <Icon className="size-4 shrink-0 text-[#a593ff]" aria-hidden />
              {text}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-white/50">Built for Kenyan money. All amounts in KES.</p>
    </aside>

    <main className="flex items-center justify-center px-5 py-10">
      <div className={wide ? "w-full max-w-lg" : "w-full max-w-sm"}>
        <Logo className="mb-8 lg:hidden" />
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        )}
        <div className="mt-7">{children}</div>
      </div>
    </main>
  </div>
);

export default AuthLayout;
