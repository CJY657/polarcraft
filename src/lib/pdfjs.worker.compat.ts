import "@/lib/promise.with-resolvers.polyfill";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

type URLWithParseStatics = typeof URL & {
  parse?: (input: string | URL, base?: string | URL) => URL | null;
  canParse?: (input: string | URL, base?: string | URL) => boolean;
};

const WorkerURL = URL as URLWithParseStatics;

if (typeof WorkerURL.parse !== "function") {
  Object.defineProperty(WorkerURL, "parse", {
    configurable: true,
    value: (input: string | URL, base?: string | URL) => {
      try {
        return base === undefined ? new URL(input) : new URL(input, base);
      } catch {
        return null;
      }
    },
    writable: true,
  });
}

if (typeof WorkerURL.canParse !== "function") {
  Object.defineProperty(WorkerURL, "canParse", {
    configurable: true,
    value: (input: string | URL, base?: string | URL) => {
      try {
        if (base === undefined) {
          new URL(input);
        } else {
          new URL(input, base);
        }
        return true;
      } catch {
        return false;
      }
    },
    writable: true,
  });
}

void import(/* @vite-ignore */ pdfjsWorkerUrl);
