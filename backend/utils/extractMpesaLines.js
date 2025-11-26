const mpesaCategoryMap = {
  PayBill: "Bills",
  Till: "Shopping",
  Fuliza: "Debt",
  Pochi: "Income",
  ATM: "Withdrawals",
};

export const extractMpesaLines = (text) => {
  const lines = text.split("\n").map((l) => l.trim());

  const extracted = [];

  for (let line of lines) {
    // Skip non-transaction lines
    if (!line.match(/\d{4}-\d{2}-\d{2}/)) continue;

    /**
     * Example matched line:
     * 2024-12-01 14:20 PayBill PAYBILL 123456 Ksh350.00
     */

    const match = line.match(
      /^(\d{4}-\d{2}-\d{2})\s+\d{2}:\d{2}.*?(PayBill|Till|Fuliza|Pochi|ATM).*?(Ksh\s?[\d,]+\.\d{2})/
    );

    if (!match) continue;

    const [_, date, type, rawAmount] = match;

    const amount = Number(rawAmount.replace(/Ksh|,/g, "").trim());

    const category = mpesaCategoryMap[type] || "M-Pesa";

    extracted.push({
      amount,
      category,
      date,
      subcategory: type,
      budgeted: false,
      budgetNames: null,
    });
  }

  return extracted;
};
