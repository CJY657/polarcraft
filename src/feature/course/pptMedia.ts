const pdfSidecarAvailabilityCache = new Map<string, boolean>();

export function getPptPdfFallbackUrl(url: string) {
  if (!/\.(pptx?|ppt)(?=(?:[?#].*)?$)/i.test(url)) {
    return null;
  }

  return url.replace(/\.(pptx?|ppt)(?=(?:[?#].*)?$)/i, ".pdf");
}

export async function hasPdfSidecar(url: string) {
  const cachedResult = pdfSidecarAvailabilityCache.get(url);
  if (cachedResult != null) {
    return cachedResult;
  }

  const classifyPdfResponse = (response: Response) => {
    const contentType = response.headers.get("content-type")?.toLowerCase() || "";

    if (contentType.includes("application/pdf")) {
      return true;
    }

    if (contentType.startsWith("text/html")) {
      return false;
    }

    if (contentType.startsWith("text/")) {
      return false;
    }

    return null;
  };

  const hasPdfSignature = async (response: Response) => {
    try {
      const buffer = await response.arrayBuffer();
      const signature = new Uint8Array(buffer.slice(0, 5));
      return String.fromCharCode(...signature) === "%PDF-";
    } catch {
      return false;
    }
  };

  const remember = (value: boolean) => {
    pdfSidecarAvailabilityCache.set(url, value);
    return value;
  };

  try {
    const headResponse = await fetch(url, { method: "HEAD" });
    const headClassification = classifyPdfResponse(headResponse);

    if (headResponse.ok && headClassification === true) {
      return remember(true);
    }

    if (headResponse.ok && headClassification === false) {
      return remember(false);
    }

    if (headResponse.status !== 405 && headResponse.status !== 501) {
      return remember(false);
    }
  } catch {
    // Some hosts block HEAD; retry with GET below.
  }

  try {
    const getResponse = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Range: "bytes=0-4",
      },
    });

    if (!getResponse.ok) {
      return remember(false);
    }

    const getClassification = classifyPdfResponse(getResponse);
    if (getClassification !== null) {
      return remember(getClassification);
    }

    return remember(await hasPdfSignature(getResponse));
  } catch {
    return remember(false);
  }
}
