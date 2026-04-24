"use client";

import { useState } from "react";
import Header from "@/components/Header";
import LicenseForm, { LicenseFormValues } from "@/components/LicenseForm";
import TokenDisplay from "@/components/TokenDisplay";

import { licenseService } from "@/services/licenseService";

export interface LicenseMeta {
  company: string;
  licenseType: "account-based" | "station-based";
  /** account-based only */
  hwid?: string | null;
  /** station-based only */
  hwids?: string[];
  expiry: string;
  issuedAt: string;
}

export default function HomePage() {
  const [tokens, setTokens] = useState<string[]>([]);
  const [meta, setMeta]     = useState<LicenseMeta | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (formData: any) => {
    setLoading(true);
    setError(null);
    setTokens([]);
    setMeta(null);

    try {
      // Use the new centralized service
      const data = await licenseService.generate(formData);
      setTokens(data.tokens);
      setMeta(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTokens([]);
    setMeta(null);
    setError(null);
  };

  return (

    <div className="relative min-h-screen grid-bg overflow-hidden" style={{ backgroundColor: "#080810" }}>
      {/* Glow orbs */}
      <div className="orb" style={{ width: 600, height: 600, top: -250, left: -150, backgroundColor: "#4338ca", opacity: 0.12 }} />
      <div className="orb" style={{ width: 500, height: 500, bottom: -200, right: -120, backgroundColor: "#6d28d9", opacity: 0.1 }} />
      <div className="orb" style={{ width: 300, height: 300, top: "40%", left: "50%", backgroundColor: "#3730a3", opacity: 0.06 }} />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 container mx-auto px-5 py-10 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <LicenseForm onGenerate={handleGenerate} onReset={handleReset} loading={loading} />
            <TokenDisplay tokens={tokens} meta={meta} error={error} />
          </div>
        </main>

        <footer className="text-center py-5 text-[11px]" style={{ color: "#1e293b", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
          Generate License Agent &mdash; License Management System &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </div>

  );
}
