import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractMpesaLines } from "../utils/extractMpesaLines.js";
import { extractReceiptData } from "../utils/extractReceiptData.js";

const row = (code, description, status, paidIn, withdrawn) =>
  `${code} 2026-10-02 08:15:22 ${description} ${status} ${paidIn} ${withdrawn} 12,300.00`;

describe("M-Pesa statement parser", () => {
  it("reads spending with any receipt code letter", () => {
    const text = [
      row("QAB12CD34X", "Pay Bill Online to 888880 - KPLC PREPAID Acc. 544", "Completed", "0.00", "-1,500.00"),
      row("UAC55EF10X", "Customer Transfer to 0712***678 - MARY ATIENO", "Completed", "0.00", "-2,000.50"),
    ].join(" ");

    const rows = extractMpesaLines(text);

    assert.deepEqual(
      rows.map(({ receiptNo, withdrawn, kind, counterparty, category }) => [
        receiptNo,
        withdrawn,
        kind,
        counterparty,
        category,
      ]),
      [
        ["QAB12CD34X", 1500, "paybill", "KPLC PREPAID", "utilities"],
        ["UAC55EF10X", 2000.5, "send", "MARY ATIENO", "miscellaneous"],
      ]
    );
  });

  it("keeps fees and money received, but not as spending", () => {
    const text = [
      row("UAB12CD34X", "Pay Bill Online to 888880 - KPLC", "Completed", "0.00", "-1,500.00"),
      row("UAB12CD34X", "Pay Bill Charge", "Completed", "0.00", "-23.00"),
      row("UAE88JK32X", "Funds received from 0722***111 - JOHN", "Completed", "5,000.00", "0.00"),
    ].join(" ");

    const rows = extractMpesaLines(text);

    assert.deepEqual(
      rows.map(({ kind, isSpend }) => [kind, isSpend]),
      [
        ["paybill", true],
        ["fee", false],
        ["received", false],
      ]
    );
  });

  it("skips failed transactions", () => {
    const text = row("UAJ33ST76X", "Reversal", "Failed", "0.00", "-700.00");
    assert.deepEqual(extractMpesaLines(text), []);
  });

  it("recognises Fuliza and supermarket payments", () => {
    const text = [
      row("UAG11NP54X", "OD Loan Repayment to 232323 - M-PESA Overdraw", "Completed", "0.00", "-1,210.00"),
      row("UAD77GH21X", "Merchant Payment to 512345 - NAIVAS WESTLANDS", "Completed", "0.00", "-3,450.50"),
    ].join(" ");

    assert.deepEqual(
      extractMpesaLines(text).map(({ kind, category }) => [kind, category]),
      [
        ["fuliza", "debt"],
        ["till", "food"],
      ]
    );
  });

  it("tolerates a blank amount column", () => {
    const text =
      "UAB12CD34X 2026-10-02 08:15:22 Pay Bill Online Completed -1,500.00 12,300.00";
    const [parsed] = extractMpesaLines(text);
    assert.equal(parsed.withdrawn, 1500);
    assert.equal(parsed.paidIn, 0);
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
