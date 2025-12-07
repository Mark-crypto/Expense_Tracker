export const extractMpesaLines = (text) => {
  console.log("=== STARTING M-PESA EXTRACTION ===");
  // Try to find receipt numbers (they start with Q and have 10 chars)
  const receiptMatches = text.match(/Q[A-Z0-9]{9,}/g);

  if (receiptMatches) {
    console.log("Sample receipts:", receiptMatches.slice(0, 5));
  }

  // Try to find dates in format 2022-01-31
  const dateMatches = text.match(/\d{4}-\d{2}-\d{2}/g);

  // Try to find amounts
  const amountMatches = text.match(/-?\s?[\d,]+\.\d{2}/g);

  if (amountMatches) {
    console.log("Sample amounts:", amountMatches.slice(0, 10));
  }

  // Now let's try to extract transactions manually
  console.log("\n=== MANUAL EXTRACTION ATTEMPT ===");
  const extracted = [];

  // Split the text into lines based on receipt numbers
  const lines = text.split(/(Q[A-Z0-9]{9,})/).filter((l) => l.trim());

  // Process each segment that starts with a receipt number
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^Q[A-Z0-9]{9,}$/)) {
      const receiptNo = lines[i];
      const content = lines[i + 1] || "";

      console.log(`\nProcessing receipt: ${receiptNo}`);

      // Try to extract date, time, description, amounts
      const dateMatch = content.match(
        /(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/
      );
      if (dateMatch) {
        const [_, date, time] = dateMatch;

        // Find "Completed" and the amounts after it
        const completedIndex = content.indexOf("Completed");
        if (completedIndex !== -1) {
          const afterCompleted = content.substring(completedIndex + 9);
          const amounts = afterCompleted.match(/(-?\s?[\d,]+\.\d{2})/g);

          if (amounts && amounts.length >= 2) {
            const paidIn = amounts[0];
            const withdrawn = amounts[1];
            const balance = amounts[2] || "0.00";

            // Get description (between time and "Completed")
            const timeEndIndex = content.indexOf(time) + time.length;
            const description = content
              .substring(timeEndIndex, completedIndex)
              .trim();

            // Skip charge transactions
            if (!description.includes("Charge")) {
              const withdrawnAmount = parseFloat(
                withdrawn.replace(/[^\d.]/g, "")
              );

              if (withdrawnAmount > 0) {
                // Determine category
                let category = "M-Pesa";
                let subcategory = "Transaction";

                if (description.includes("Pay Bill")) {
                  category = "Bills";
                  subcategory = "Pay Bill";
                } else if (
                  description.includes("Airtime") ||
                  description.includes("Buy Bundles")
                ) {
                  category = "Utilities";
                  subcategory = description.includes("Airtime")
                    ? "Airtime"
                    : "Bundles";
                } else if (description.includes("Customer Transfer")) {
                  category = "Transfers";
                  subcategory = "Money Transfer";
                } else if (description.includes("Withdrawal")) {
                  category = "Withdrawals";
                  subcategory = "Withdrawal";
                }
                extracted.push({
                  amount: withdrawnAmount,
                  category,
                  date,
                  subcategory,
                  budgeted: false,
                  budgetNames: null,
                  description: description.substring(0, 100),
                  receiptNo,
                });
              }
            }
          }
        }
      }
    }
  }

  console.log("\n=== EXTRACTION COMPLETE ===");

  return extracted;
};
