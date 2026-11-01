import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractMpesaLines } from "../utils/extractMpesaLines.js";
import { extractReceiptData } from "../utils/extractReceiptData.js";

const row = (code, description, status, paidIn, withdrawn) =>
  `${code} 2026-10-02 08:15:22 ${description} ${status} ${paidIn} ${withdrawn} 12,300.00`;

describe("M-Pesa statement parser", () => {
  it("reads spending with any receipt code letter", () => {
    const text = [
      row("QAB12CD34X", "Pay Bill Online to KPLC", "Completed", "0.00", "-1,500.00"),
      row("UAC55EF10X", "Customer Transfer to MARY", "Completed", "0.00", "-2,000.50"),
    ].join(" ");

    const rows = extractMpesaLines(text);

    assert.deepEqual(
      rows.map(({ receiptNo, amount, category }) => [receiptNo, amount, category]),
      [
        ["QAB12CD34X", 1500, "Bills"],
        ["UAC55EF10X", 2000.5, "Transfers"],
      ]
    );
  });

  it("skips charges, failed transactions and money received", () => {
    const text = [
      row("UAB12CD35X", "Pay Bill Charge", "Completed", "0.00", "-23.00"),
      row("UAJ33ST76X", "Reversal", "Failed", "0.00", "-700.00"),
      row("UAE88JK32X", "Funds received from JOHN", "Completed", "5,000.00", "0.00"),
    ].join(" ");

    assert.deepEqual(extractMpesaLines(text), []);
  });

  it("returns nothing for unrelated text", () => {
    assert.deepEqual(extractMpesaLines("not a statement"), []);
  });
});

describe("receipt parser", () => {
  it("reads the total, merchant and a day-first date", () => {
    const data = extractReceiptData(
      "NAIVAS SUPERMARKET\nDATE 28/10/2026\nMILK 65.00\nTOTAL KES 350.00\n"
    );

    assert.equal(data.amount, 350);
    assert.equal(data.date, "2026-10-28");
    assert.equal(data.merchant, "NAIVAS SUPERMARKET");
  });
});
