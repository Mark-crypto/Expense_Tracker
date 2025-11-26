export const extractReceiptData = (text) => {
  const lines = text.split("\n").filter((line) => line.trim());

  let amount = null;
  let date = null;
  let description = "";
  let merchant = "";

  // Common patterns for receipt data
  const amountPatterns = [
    /total\s*:?\s*[kes\s]*([0-9,]+\.?[0-9]*)/i,
    /amount\s*:?\s*[kes\s]*([0-9,]+\.?[0-9]*)/i,
    /([0-9,]+\.?[0-9]*)\s*(?:kes|shillings?)/i,
    /total\s+[kes\s]*([0-9,]+\.?[0-9]*)/i,
  ];

  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
    /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{2,4})/i,
  ];

  // Extract amount
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      amount = parseFloat(match[1].replace(/,/g, ""));
      break;
    }
  }

  // Extract date
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      date = match[1];
      break;
    }
  }

  // Extract merchant (usually first few lines)
  if (lines.length > 0) {
    merchant = lines[0].trim();
  }

  // Extract description (look for item lines)
  const itemLines = lines.filter(
    (line) =>
      line.match(/[a-z]/i) &&
      !line.match(/total|amount|change|balance|receipt|date|time/i) &&
      line.length > 3
  );

  if (itemLines.length > 0) {
    description = itemLines.slice(0, 2).join(", "); // Take first 2 items
  } else {
    description = "Receipt Purchase";
  }

  // Format date to YYYY-MM-DD if found
  if (date) {
    try {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        date = parsedDate.toISOString().split("T")[0];
      }
    } catch (e) {
      date = new Date().toISOString().split("T")[0];
    }
  } else {
    date = new Date().toISOString().split("T")[0];
  }

  // If amount not found, try to find any number that looks like a price
  if (!amount) {
    const priceMatch = text.match(/([0-9]+\.[0-9]{2})/);
    if (priceMatch) {
      amount = parseFloat(priceMatch[1]);
    }
  }

  return {
    amount: amount || 0,
    date: date,
    description: description.substring(0, 100), // Limit length
    merchant: merchant.substring(0, 50), // Limit length
  };
};
