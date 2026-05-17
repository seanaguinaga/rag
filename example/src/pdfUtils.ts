import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export interface PdfExtractionResult {
  text: string;
  pages: number;
  title?: string;
  author?: string;
  subject?: string;
}

export async function extractTextFromPdf(
  file: File,
): Promise<PdfExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const numPages = pdf.numPages;

    const pageTexts = await Promise.all(
      Array.from({ length: numPages }, async (_, index) => {
      const pageNum = index + 1;
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine text items with proper spacing and line breaks
      return textContent.items
        .reduce<string[]>((parts, item) => {
          if ("str" in item) {
            // Check if this text item is followed by a line break
            parts.push(item.str + (item.hasEOL ? "\n" : ""));
          }
          return parts;
        }, [])
        .join(" ")
        .replace(/\s+\n/g, "\n"); // Clean up spaces before newlines
      // .replace(/\n\s+/g, "\n"); // Clean up spaces after newlines
    }),
    );

    // Get metadata
    const metadata = await pdf.getMetadata();
    const info = metadata.info as any;

    return {
      text: pageTexts.join("\n\n").trim(),
      pages: numPages,
      title: info?.Title,
      author: info?.Author,
      subject: info?.Subject,
    };
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error(
      "Failed to extract text from PDF. The file may be corrupted or password-protected.",
    );
  }
}

export function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}
