import { useRef, useState } from "react";
import { useConvex } from "convex/react";
import {
  AlertCircle,
  CheckCircle2,
  FilePlus2,
  FileText,
  Globe2,
  Info,
  Loader2,
  Upload,
  User,
  X,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import {
  extractTextFromPdf,
  isPdfFile,
  type PdfExtractionResult,
} from "../pdfUtils";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { Switch } from "./ui/switch";

interface UploadSectionProps {
  onFileUploaded?: () => void;
}

function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    error.data &&
    typeof error.data === "object" &&
    "message" in error.data &&
    typeof error.data.message === "string"
  ) {
    return error.data.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function getUploadErrorMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }
  return "Upload failed.";
}

async function assertUploadSucceeded(response: Response) {
  if (response.ok) {
    return;
  }
  try {
    throw new Error(getUploadErrorMessage(await response.json()));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Upload failed with status ${response.status}.`);
    }
    throw error;
  }
}

export function UploadSection({ onFileUploaded }: UploadSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmPdfFallbackOpen, setConfirmPdfFallbackOpen] = useState(false);
  const [pdfExtraction, setPdfExtraction] = useState<{
    isExtracting: boolean;
    result: PdfExtractionResult | null;
    error: string | null;
  }>({
    isExtracting: false,
    result: null,
    error: null,
  });
  const [uploadForm, setUploadForm] = useState({
    globalNamespace: false,
    category: "",
    filename: "",
  });

  const convex = useConvex();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setUploadError(null);
    setSelectedFile(file);
    setUploadForm((prev) => ({ ...prev, filename: file.name }));
    setPdfExtraction({
      isExtracting: false,
      result: null,
      error: null,
    });

    if (!isPdfFile(file)) {
      return;
    }

    setPdfExtraction((prev) => ({ ...prev, isExtracting: true }));

    try {
      const extractionResult = await extractTextFromPdf(file);
      setPdfExtraction({
        isExtracting: false,
        result: extractionResult,
        error: null,
      });

      if (extractionResult.title && !uploadForm.filename) {
        setUploadForm((prev) => ({
          ...prev,
          filename: extractionResult.title || file.name,
        }));
      }
    } catch (error) {
      console.error("PDF extraction failed:", error);
      setPdfExtraction({
        isExtracting: false,
        result: null,
        error:
          error instanceof Error ? error.message : "Failed to extract PDF text",
      });
    }
  };

  const handleFileClear = () => {
    setSelectedFile(null);
    setUploadError(null);
    setUploadForm((prev) => ({ ...prev, filename: "" }));
    setPdfExtraction({
      isExtracting: false,
      result: null,
      error: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadSelectedFile = async ({
    allowPdfFallback = false,
  }: {
    allowPdfFallback?: boolean;
  } = {}) => {
    if (!selectedFile) {
      return;
    }

    if (isPdfFile(selectedFile) && pdfExtraction.error && !allowPdfFallback) {
      setConfirmPdfFallbackOpen(true);
      return;
    }

    setUploadError(null);
    setIsAdding(true);
    try {
      const pdfResult = pdfExtraction.result;
      const shouldUseExtractedText =
        isPdfFile(selectedFile) && pdfResult && !pdfExtraction.error;

      const filename = uploadForm.filename || selectedFile.name;
      const blob = shouldUseExtractedText
        ? new Blob([new TextEncoder().encode(pdfResult.text)], {
            type: "text/plain",
          })
        : selectedFile;

      if (selectedFile.size > 512 * 1024) {
        const response = await fetch(
          `${import.meta.env.VITE_CONVEX_SITE_URL}/upload`,
          {
            method: "POST",
            headers: {
              "x-filename": filename,
              "x-category": uploadForm.category,
              ...(blob.type && { "Content-Type": blob.type }),
              ...(uploadForm.globalNamespace && {
                "x-global-namespace": "true",
              }),
            },
            body: blob,
          },
        );
        await assertUploadSucceeded(response);
      } else {
        await convex.action(api.rag.indexing.addFile, {
          bytes: await blob.arrayBuffer(),
          filename,
          mimeType: blob.type || "text/plain",
          category: uploadForm.category,
          globalNamespace: uploadForm.globalNamespace,
        });
      }

      setUploadForm((prev) => ({
        ...prev,
        filename: "",
      }));
      setSelectedFile(null);
      setPdfExtraction({
        isExtracting: false,
        result: null,
        error: null,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onFileUploaded?.();
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadError(`Upload failed. ${getErrorMessage(error)}`);
    } finally {
      setIsAdding(false);
    }
  };

  const uploadDisabled = isAdding || !selectedFile || pdfExtraction.isExtracting;
  const selectedFileIsPdf = selectedFile ? isPdfFile(selectedFile) : false;

  return (
    <Card className="overflow-visible">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FilePlus2 className="size-4" />
          Add document
        </CardTitle>
        <CardDescription>
          Upload a document into user or shared knowledge.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Upload needs attention</AlertTitle>
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Category
            </span>
            <Input
              id="upload-category"
              value={uploadForm.category}
              onChange={(event) =>
                setUploadForm((prev) => ({
                  ...prev,
                  category: event.target.value,
                }))
              }
              placeholder="Optional category"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Filename
            </span>
            <Input
              id="upload-filename"
              value={uploadForm.filename}
              onChange={(event) =>
                setUploadForm((prev) => ({
                  ...prev,
                  filename: event.target.value,
                }))
              }
              placeholder="Defaults to selected file"
            />
          </label>

          <div className="flex items-center justify-between gap-3 border p-3 md:min-w-48">
            <div className="flex items-center gap-2">
              {uploadForm.globalNamespace ? (
                <Globe2 className="size-4 text-foreground" />
              ) : (
                <User className="size-4 text-foreground" />
              )}
              <span className="text-sm font-medium">
                {uploadForm.globalNamespace ? "Shared" : "User"}
              </span>
            </div>
            <Switch
              checked={uploadForm.globalNamespace}
              onCheckedChange={(globalNamespace) =>
                setUploadForm((prev) => ({ ...prev, globalNamespace }))
              }
              aria-label="Store document in shared knowledge"
            />
          </div>
        </div>

        <div
          className={[
            "relative border border-dashed p-5 transition-colors",
            isDragging ? "border-foreground bg-muted/60" : "border-border",
            isAdding ? "opacity-60" : "",
          ].join(" ")}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) {
              void handleFileSelect(file);
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            id="file-upload"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleFileSelect(file);
              }
            }}
            disabled={isAdding}
            className={
              selectedFile ? "hidden" : "absolute inset-0 size-full opacity-0"
            }
            aria-label="Choose document to upload"
          />

          {!selectedFile ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <div className="flex size-12 items-center justify-center border bg-muted">
                <Upload className="size-5" />
              </div>
              <div>
                <p className="font-medium">Drop a file here or browse</p>
                <p className="text-sm text-muted-foreground">
                  PDFs are converted to text before indexing when possible.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center border bg-muted">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">
                        {selectedFile.name}
                      </p>
                      {selectedFileIsPdf && <Badge>PDF</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedFile.type || "Unknown type"} ·{" "}
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>

                {selectedFileIsPdf && (
                  <PdfExtractionStatus extraction={pdfExtraction} />
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleFileClear}
                disabled={isAdding || pdfExtraction.isExtracting}
                aria-label="Remove selected file"
              >
                <X />
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleFileClear}
            disabled={!selectedFile || isAdding}
          >
            Clear
          </Button>
          <Button
            type="button"
            onClick={() => void uploadSelectedFile()}
            disabled={uploadDisabled}
          >
            {isAdding || pdfExtraction.isExtracting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <FilePlus2 />
            )}
            {isAdding
              ? "Adding"
              : pdfExtraction.isExtracting
                ? "Reading PDF"
                : selectedFileIsPdf && pdfExtraction.result
                  ? "Add extracted text"
                  : "Add document"}
          </Button>
        </div>

        <AlertDialog
          open={confirmPdfFallbackOpen}
          onOpenChange={setConfirmPdfFallbackOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Upload original PDF?</AlertDialogTitle>
              <AlertDialogDescription>
                Text extraction failed: {pdfExtraction.error} Uploading the
                original file may make less text available for search.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  void uploadSelectedFile({ allowPdfFallback: true })
                }
              >
                Upload PDF
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function PdfExtractionStatus({
  extraction,
}: {
  extraction: {
    isExtracting: boolean;
    result: PdfExtractionResult | null;
    error: string | null;
  };
}) {
  if (extraction.isExtracting) {
    return (
      <div className="space-y-2 border p-3">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Reading PDF text
        </div>
        <Progress value={60} />
      </div>
    );
  }

  if (extraction.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>PDF text extraction failed</AlertTitle>
        <AlertDescription>{extraction.error}</AlertDescription>
      </Alert>
    );
  }

  if (!extraction.result) {
    return null;
  }

  return (
    <Alert>
      <CheckCircle2 className="size-4" />
      <AlertTitle>PDF text extracted</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-3">
        <span>
          {extraction.result.pages} pages ·{" "}
          {extraction.result.text.length.toLocaleString()} characters
        </span>
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="link" size="xs" className="h-auto">
              <Info />
              Details
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>PDF extraction details</DialogTitle>
              <DialogDescription>
                The extracted text will be uploaded as plain text for indexing.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 text-sm">
              <DetailRow label="Pages" value={String(extraction.result.pages)} />
              <DetailRow
                label="Characters"
                value={extraction.result.text.length.toLocaleString()}
              />
              {extraction.result.title && (
                <DetailRow label="Title" value={extraction.result.title} />
              )}
              {extraction.result.author && (
                <DetailRow label="Author" value={extraction.result.author} />
              )}
              {extraction.result.subject && (
                <DetailRow label="Subject" value={extraction.result.subject} />
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AlertDescription>
    </Alert>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 border-b pb-2 last:border-b-0 last:pb-0">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 break-words">{value}</span>
    </div>
  );
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
