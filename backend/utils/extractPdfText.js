import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export const extractPdfText = async (buffer, password) => {
  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    password: password || undefined,
    verbosity: 0,
  });

  try {
    const pdf = await loadingTask.promise;
    let text = "";

    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(" ") + "\n";
    }

    return text;
  } finally {
    await loadingTask.destroy();
  }
};
