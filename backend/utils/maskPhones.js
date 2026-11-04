// Keeps only the last 3 digits of Kenyan mobile numbers: 0712345678, 254712345678 and
// statements' own part-hidden 254712***678 all become 07•• ••• 678. The same number
// always masks the same way, so payments to one person still group together.
const PHONE = /(?:\+?254|\b0)([17])[\d*]{5}(\d{3})\b/g;

export const maskPhones = (text) => (text == null ? text : String(text).replace(PHONE, "0$1•• ••• $2"));
