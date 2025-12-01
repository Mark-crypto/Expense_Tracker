export const extractReceiptData = (text) => {
  const lines = text.split("\n").filter((line) => line.trim());

  let amount = null;
  let date = null;
  let description = "";
  let merchant = "";
  let category = "Expenses";
  let subcategory = "Healthcare";

  console.log("Processing text lines:", lines.length);

  // Extract merchant (usually first few lines)
  if (lines.length > 0) {
    // Look for company name in first 3 lines
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i].trim();
      if (
        line &&
        line.length > 5 &&
        !line.match(/cash|sale|receipt|date|time/i)
      ) {
        merchant = line;
        break;
      }
    }
  }

  // Extract amount - look for TOTAL pattern
  const totalPatterns = [
    /TOTAL\s*[\s:]*K?E?S?\s*([0-9,]+\.?[0-9]*)/i,
    /total\s*[\s:]*K?E?S?\s*([0-9,]+\.?[0-9]*)/i,
    /amount\s*[\s:]*K?E?S?\s*([0-9,]+\.?[0-9]*)/i,
    /TOTAL\s+([0-9,]+\.?[0-9]*)/i,
    /([0-9,]+\.?[0-9]*)\s*(?:KES|shillings?)/i,
  ];

  for (const pattern of totalPatterns) {
    const match = text.match(pattern);
    if (match) {
      amount = parseFloat(match[1].replace(/,/g, ""));
      console.log("Found amount with pattern:", pattern, amount);
      break;
    }
  }

  // If amount not found with TOTAL, look for the largest number (common in receipts)
  if (!amount) {
    const allNumbers = text.match(/([0-9]+[.,][0-9]{2})/g) || [];
    const numbers = allNumbers.map((num) => parseFloat(num.replace(/,/g, "")));
    if (numbers.length > 0) {
      amount = Math.max(...numbers); // Assume largest number is total
      console.log("Using largest number as amount:", amount);
    }
  }

  // Extract date
  const datePatterns = [
    /DATE\s*(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})/i,
    /DATE\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})/i,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      date = match[1];
      console.log("Found date with pattern:", pattern, date);
      break;
    }
  }

  // Extract description - look for item names
  const itemKeywords = [
    "RUBBER",
    "GLOVES",
    "HEAVY",
    "DUTY",
    "Item",
    "LOCATION",
  ];
  for (const line of lines) {
    if (
      itemKeywords.some((keyword) => line.toUpperCase().includes(keyword)) &&
      line.length > 3
    ) {
      description = line.trim();
      break;
    }
  }

  // If no specific item found, use merchant + generic description
  if (!description || description.length < 3) {
    description = merchant ? `Purchase from ${merchant}` : "Receipt Purchase";
  }

  // Auto-categorize based on merchant or description
  if (
    merchant.toLowerCase().includes("healthcare") ||
    merchant.toLowerCase().includes("veterinary")
  ) {
    category = "Expenses";
    subcategory = "Healthcare";
  }

  // Format date
  if (date) {
    try {
      // Handle "6 Nov 25" format
      if (
        date.match(
          /\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4}/i
        )
      ) {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate.toISOString().split("T")[0];
        }
      }
    } catch (e) {
      console.log("Date parsing error:", e);
      date = new Date().toISOString().split("T")[0];
    }
  } else {
    date = new Date().toISOString().split("T")[0];
  }

  // Final validation
  if (!amount || amount <= 0) {
    console.log("Invalid amount extracted, setting to 0");
    amount = 0;
  }

  console.log("Final extracted data:", {
    amount,
    date,
    description,
    merchant,
    category,
    subcategory,
  });

  return {
    amount: amount || 0,
    date: date,
    description: description.substring(0, 100),
    merchant: merchant.substring(0, 50),
    category,
    subcategory,
    confidence: amount > 0 ? "high" : "low",
  };
};
