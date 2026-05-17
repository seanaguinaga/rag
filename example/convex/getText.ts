import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { assert } from "convex-helpers";
import { Id } from "./_generated/dataModel";
import { StorageActionWriter } from "convex/server";
import { GOOGLE_EXTRACTION_MODEL_ID } from "./rag/config";

const extractionModel = google(GOOGLE_EXTRACTION_MODEL_ID);

function getContentType(mimeType: string) {
  const lowerMimeType = mimeType.toLowerCase();

  if (
    ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)
  ) {
    return "image";
  }
  if (mimeType.startsWith("audio/")) {
    return "audio";
  }
  if (lowerMimeType.includes("pdf")) {
    return "pdf";
  }
  if (lowerMimeType.includes("text")) {
    return "text";
  }
  return "unsupported";
}

async function extractTextFromImage(url: string) {
  const imageResult = await generateText({
    model: extractionModel,
    system:
      "You turn images into text. If it is a photo of a entry, transcribe it. If it is not a entry, describe it.",
    messages: [
      {
        role: "user",
        content: [{ type: "image", image: new URL(url) }],
      },
    ],
  });
  return imageResult.text;
}

async function transcribeAudio(url: string, mimeType: string) {
  const audioResult = await generateText({
    model: extractionModel,
    system:
      "You turn audio into text. Transcribe the audio without adding commentary.",
    messages: [
      {
        role: "user",
        content: [{ type: "file", data: new URL(url), mediaType: mimeType }],
      },
    ],
  });
  return audioResult.text;
}

async function extractTextFromPdf({
  url,
  mimeType,
  filename,
}: {
  url: string;
  mimeType: string;
  filename: string;
}) {
  const pdfResult = await generateText({
    model: extractionModel,
    system: "You transform PDF files into text.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "file",
            data: new URL(url),
            mediaType: mimeType,
            filename,
          },
          {
            type: "text",
            text: "Extract the text from the PDF and print it without explaining that you'll do so.",
          },
        ],
      },
    ],
  });
  return pdfResult.text;
}

async function convertTextToMarkdown(text: string) {
  const result = await generateText({
    model: extractionModel,
    system: "You transform content into markdown.",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: text },
          {
            type: "text",
            text: "Extract the text and print it in a markdown format without explaining that you'll do so.",
          },
        ],
      },
    ],
  });
  return result.text;
}

async function extractTextFromTextFile({
  ctx,
  storageId,
  bytes,
  mimeType,
}: {
  ctx: { storage: StorageActionWriter };
  storageId: Id<"_storage">;
  bytes?: ArrayBuffer;
  mimeType: string;
}) {
  const arrayBuffer =
    bytes || (await (await ctx.storage.get(storageId))!.arrayBuffer());
  const text = new TextDecoder().decode(arrayBuffer);
  if (mimeType.toLowerCase() !== "text/plain") {
    return await convertTextToMarkdown(text);
  }
  return text;
}

export async function getText(
  ctx: { storage: StorageActionWriter },
  {
    storageId,
    filename,
    bytes,
    mimeType,
  }: {
    storageId: Id<"_storage">;
    filename: string;
    bytes?: ArrayBuffer;
    mimeType: string;
  },
) {
  const url = await ctx.storage.getUrl(storageId);
  assert(url);

  switch (getContentType(mimeType)) {
    case "image":
      return await extractTextFromImage(url);
    case "audio":
      return await transcribeAudio(url, mimeType);
    case "pdf":
      return await extractTextFromPdf({ url, mimeType, filename });
    case "text":
      return await extractTextFromTextFile({ ctx, storageId, bytes, mimeType });
    default: {
      throw new Error(`Unsupported mime type: ${mimeType}`);
    }
  }
}
