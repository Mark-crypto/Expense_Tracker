import { Link, useNavigate } from "react-router-dom";
import { Compass } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const QUESTIONS = [
  {
    q: "How is Safe to spend worked out?",
    a: "We take the money in your spendable accounts, then subtract bills due before your next pay day, money kept for savings goals, and your safety buffer. What's left is divided by the days until you're paid. If your income has no set date, it's spread over 30 days.",
    link: ["/dashboard", "See yours on the Dashboard"],
  },
  {
    q: "How do I get my M-Pesa statement?",
    a: "Request a full statement in the M-PESA app. Safaricom emails you a PDF, and the password to open it comes by SMS. Upload the PDF here and type the password when we ask.",
    link: ["/import", "Import a statement"],
  },
  {
    q: "Is my money or login safe?",
    a: "We never connect to M-Pesa or your bank, never ask for their logins, and can't move money. Everything here comes from statements, messages and amounts you add yourself.",
  },
  {
    q: "Why is my balance different from M-Pesa?",
    a: "Balances only change when you add spending, import a statement or update them yourself. Tap Update balance on the account and enter what M-Pesa shows, or import a newer statement.",
    link: ["/accounts", "Go to Accounts"],
  },
  {
    q: "What's the difference between a payment and a transfer?",
    a: "A payment is money that leaves you, like rent or shopping. A transfer moves money between your own accounts, like M-Pesa to your bank, so it isn't counted as spending. When we can't tell, we ask on the Accounts page.",
    link: ["/accounts", "Go to Accounts"],
  },
  {
    q: "How do budget alerts work?",
    a: "You can be warned as you get close to a limit, when you're spending too fast, and when you go over. Each alert comes once per budget and month. Emails are held between 9pm and 7am. Choose how many you get under Alerts on the Budgets page.",
    link: ["/budget?alerts=1", "Change alert settings"],
  },
  {
    q: "Can I add a payment from an SMS?",
    a: "Yes. Open Add expense, tap Paste SMS and paste the M-Pesa message. We fill in the amount, who you paid and the date. If you import a statement later, the same payment isn't added twice.",
  },
  {
    q: "How do I delete my data?",
    a: "Open Privacy & security. Download my data gives you a copy first. Delete statement data removes your imported M-Pesa transactions, and Delete account removes everything for good.",
    link: ["/security", "Go to Privacy & security"],
  },
];

const Help = () => {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl">Help</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Answers to the questions people ask most.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate("/dashboard?tour=1")}
        >
          <Compass /> Take the tour again
        </Button>
      </header>
      <Card className="divide-y divide-border">
        {QUESTIONS.map(({ q, a, link }) => (
          <details key={q} className="group px-4 py-3 sm:px-5">
            <summary className="cursor-pointer list-none text-sm font-medium marker:hidden group-open:text-primary">
              {q}
            </summary>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              {a}
            </p>
            {link && (
              <Link
                to={link[0]}
                className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
              >
                {link[1]}
              </Link>
            )}
          </details>
        ))}
      </Card>
    </div>
  );
};

export default Help;
