/** 
 * License Service — Centralized API calls for the frontend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
const PROXY_BASE = process.env.NEXT_PUBLIC_PROXY_BASE || "/api";

export interface GenerateParams {
  company: string;
  licenseType: string;
  quantity: number;
  expiry: string;
  hwids?: string[];
}

export const licenseService = {
  /**
   * Generate new license tokens
   */
  generate: async (params: GenerateParams) => {
    const res = await fetch(`${PROXY_BASE}/license/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to generate tokens");
    }

    return res.json();
  },

  /**
   * Export tokens as an encrypted .aglic bundle
   */
  exportBundle: async (tokens: string[], meta: any) => {
    const res = await fetch(`${API_BASE}/api/license/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokens, meta }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Export failed");
    }

    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    
    // Extract filename (with UTF-8 support)
    let filename = "license-bundle.aglic";
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match) {
      filename = decodeURIComponent(utf8Match[1]);
    } else {
      const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
      if (asciiMatch) filename = asciiMatch[1];
    }

    // Trigger native browser download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);

    return true;
  }
};
