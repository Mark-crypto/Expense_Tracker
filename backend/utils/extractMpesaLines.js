// A transaction starts with a 10-character receipt code, then its timestamp.
const TRANSACTION_START =
  /\b([A-Z][A-Z0-9]{9})\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/g;

const AMOUNT = /-?\s?[\d,]+\.\d{2}/g;

const categorize = (description) => {
  if (description.includes("Pay Bill")) {
    return { category: "Bills", subcategory: "Pay Bill" };
  }
  if (description.includes("Airtime")) {
    return { category: "Utilities", subcategory: "Airtime" };
  }
  if (description.includes("Buy Bundles")) {
    return { category: "Utilities", subcategory: "Bundles" };
  }
  if (description.includes("Customer Transfer")) {
    return { category: "Transfers", subcategory: "Money Transfer" };
  }
  if (description.includes("Withdrawal")) {
    return { category: "Withdrawals", subcategory: "Withdrawal" };
  }
  return { category: "M-Pesa", subcategory: "Transaction" };
};

export const extractMpesaLines = (text) => {
  const starts = [...text.matchAll(TRANSACTION_START)];
  const extracted = [];

  starts.forEach((match, index) => {
    const [header, receiptNo, date] = match;
    const end = starts[index + 1]?.index ?? text.length;
    const content = text.slice(match.index + header.length, end);

    const completedIndex = content.indexOf("Completed");
    if (completedIndex === -1) return;

    const description = content.slice(0, completedIndex).replace(/\s+/g, " ").trim();
    if (description.includes("Charge")) return;

    // Columns after the status are: paid in, withdrawn, balance.
    const amounts = content.slice(completedIndex).match(AMOUNT) ?? [];
    if (amounts.length < 2) return;

    const withdrawn = parseFloat(amounts[1].replace(/[^\d.]/g, ""));
    if (!withdrawn) return;

    extracted.push({
      amount: withdrawn,
      ...categorize(description),
      date,
      budgeted: false,
      budgetNames: null,
      description: description.substring(0, 100),
      receiptNo,
    });
  });

  return extracted;
};
