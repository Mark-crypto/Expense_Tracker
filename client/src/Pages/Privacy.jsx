import { Link } from "react-router-dom";
import { Logo } from "@/components/layout/AppLayout";

// DRAFT for a lawyer to check before launch. Fill in every [bracketed] detail first,
// then remove the notice at the top. See docs/odpc-checklist.md.
const SECTIONS = [
  {
    title: "Who we are",
    body: [
      "Expense Tracker is run by [legal name of the business or person], [physical address], Kenya. We decide how your data is used, which makes us the data controller under Kenya's Data Protection Act, 2019.",
      "Questions about your data go to [privacy contact email].",
    ],
  },
  {
    title: "What we collect",
    list: [
      "Account details: your name, email, occupation, age and money goal. Your password and PIN are stored only in a scrambled form we can't read back.",
      "Your M-Pesa statements: we read the PDF to pull out your transactions, then discard the file and its password. We keep each transaction's date, receipt number, amount, type, who it was with, and your balance. Phone numbers keep only their last 3 digits, for example 07•• ••• 678.",
      "Messages you paste: when you paste an M-Pesa SMS, we keep the payment it describes, not the message.",
      "Receipt photos: we read them to fill in an expense, then discard the image.",
      "What you add yourself: expenses, account balances, money in, moves between accounts, budgets, bills and savings goals.",
      "Sign-in records: which devices are signed in, and failed sign-in and PIN attempts, so we can stop someone guessing.",
    ],
  },
  {
    title: "Why we use it",
    list: [
      "To show you where your money goes, what's safe to spend, your budgets, bills and goals.",
      "To send the emails you've turned on, such as budget alerts and bill reminders, and security emails, such as when your password or PIN changes.",
      "To keep your account safe.",
    ],
    after:
      "We use your data because you've agreed to it when signing up and because we need it to provide the service you asked for. We never sell your data, show you adverts, or use it to decide whether you get credit.",
  },
  {
    title: "Who else sees it",
    list: [
      "[Hosting provider], which runs our servers in [country].",
      "Google, which delivers our emails.",
    ],
    after:
      "They may only use your data to provide their service to us. We'd share data with authorities only when Kenyan law requires it. If your data is stored outside Kenya, we use the safeguards the Data Protection Act requires.",
  },
  {
    title: "Cookies",
    body: [
      "We use cookies only to keep you signed in and to remember when you've entered your PIN. There are no advertising or tracking cookies. If you turn on Hide balances, that choice is saved in your browser.",
    ],
  },
  {
    title: "How long we keep it",
    body: [
      "We keep your data while you have an account. You can delete your imported statement data at any time. When you delete your account, everything is removed from our live database straight away; backups are cleared within [number] days.",
    ],
  },
  {
    title: "Your rights",
    list: [
      "To know what we hold and why: this policy.",
      "To get a copy: Privacy & security, then Download my data, gives you everything in one Excel file.",
      "To correct it: edit it in the app, or ask us.",
      "To delete it: delete your statement data or your whole account in Privacy & security.",
      "To object to how we use it, or withdraw your consent: email us, or delete your account.",
    ],
    after:
      "If you're unhappy with how we handle your data, you can complain to the Office of the Data Protection Commissioner at www.odpc.go.ke.",
  },
  {
    title: "Keeping it safe",
    body: [
      "Connections to the app are encrypted. Passwords and PINs are scrambled so they can't be read. Accounts lock after repeated wrong passwords or PINs, and we email you about sign-in and PIN changes. If a breach puts your data at risk, we'll tell you and the Data Protection Commissioner as the law requires.",
    ],
  },
  {
    title: "Children",
    body: ["Expense Tracker is for people aged 18 and over."],
  },
  {
    title: "Changes",
    body: ["If we change this policy in a way that matters, we'll tell you in the app or by email before it applies."],
  },
];

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
      <Link to="/dashboard" aria-label="Expense Tracker home">
        <Logo />
      </Link>
    </header>
    <main className="mx-auto max-w-3xl space-y-6 px-4 pb-16">
      <p role="note" className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
        Draft for legal review. Details in [brackets] are filled in before launch.
      </p>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Privacy policy</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated [date]. Written in plain English; if anything is unclear, ask us.</p>
      </div>
      {SECTIONS.map(({ title, body, list, after }) => (
        <section key={title} className="max-w-prose space-y-2 text-sm leading-relaxed">
          <h2 className="text-base font-semibold">{title}</h2>
          {body?.map((text) => (
            <p key={text}>{text}</p>
          ))}
          {list && (
            <ul className="list-disc space-y-1.5 pl-5">
              {list.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          )}
          {after && <p>{after}</p>}
        </section>
      ))}
    </main>
  </div>
);

export default Privacy;
