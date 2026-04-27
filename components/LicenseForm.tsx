"use client";

import { useState } from "react";
import {
  Building2, Users, Monitor, Cpu,
  CalendarDays, Plus, X, Key, AlertCircle, ShieldCheck
} from "lucide-react";

export type LicenseType = "account-based" | "station-based";

export interface LicenseFormValues {
  company: string;
  licenseType: LicenseType;
  quantity: number;
  hwids?: string[];
  expiry: string;
}

interface Props {
  onGenerate: (values: LicenseFormValues) => Promise<void>;
  onReset?: () => void;
  loading: boolean;
}

const TODAY = new Date().toISOString().split("T")[0];

export default function LicenseForm({ onGenerate, onReset, loading }: Props) {
  const [company, setCompany]         = useState("");
  const [licenseType, setLicenseType] = useState<LicenseType>("account-based");
  const [quantity, setQuantity]       = useState(1);
  const [hwids, setHwids]             = useState<string[]>([""]);
  const [expiry, setExpiry]           = useState("");
  const [touched, setTouched]         = useState<Record<string, boolean>>({});

  const isStation = licenseType === "station-based";

  const companyErr = touched.company && !company.trim() ? "Required" : null;
  const qtyErr     = touched.quantity && !isStation && quantity < 1 ? "Min 1" : null;
  const expiryErr  = touched.expiry
    ? (!expiry ? "Required" : expiry <= TODAY ? "Must be a future date" : null) : null;
  const hwidErrs = hwids.map((h, i) =>
    touched[`h${i}`] && !h.trim() ? "Required" : null
  );

  const isValid =
    !!company.trim() && !!expiry && expiry > TODAY &&
    (!isStation || hwids.every((h) => h.trim())) &&
    (isStation || quantity >= 1);

  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const updateHwid = (i: number, v: string) => {
    setHwids((p) => p.map((h, idx) => (idx === i ? v : h)));
    touch(`h${i}`);
  };
  const addHwid    = () => setHwids((p) => [...p, ""]);
  const removeHwid = (i: number) => setHwids((p) => p.filter((_, idx) => idx !== i));

  const handleType = (t: LicenseType) => {
    setLicenseType(t);
    setHwids([""]);
    setTouched((prev) => {
      const n = { ...prev };
      Object.keys(n).filter((k) => k.startsWith("h")).forEach((k) => delete n[k]);
      return n;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const all: Record<string, boolean> = { company: true, quantity: true, expiry: true };
    if (isStation) hwids.forEach((_, i) => { all[`h${i}`] = true; });
    setTouched(all);
    if (!isValid) return;
    onGenerate({
      company: company.trim(),
      licenseType,
      quantity: isStation ? hwids.length : quantity,
      hwids: isStation ? hwids.map((h) => h.trim()) : undefined,
      expiry,
    });
  };

  const handleReset = () => {
    setCompany(""); setLicenseType("account-based");
    setQuantity(1); setHwids([""]); setExpiry(""); setTouched({});
    onReset?.();
  };

  const tokenCount = isStation ? hwids.length : quantity;

  return (
    <div className="gradient-border animate-fade-in w-full" style={{ padding: "24px 26px" }}>

      {/* ── Card header ──────────────────────────────── */}
      <div className="flex items-center gap-2.5 mb-5">
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          border: "1px solid rgba(99,102,241,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div className="absolute inset-0 bg-indigo-500/5 blur-md pointer-events-none" />
          <ShieldCheck size={18} className="text-white relative z-10" strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">Generate License</p>
          <p className="text-[11px] mt-0.5" style={{ color: "#475569" }}>Ed25519 signed · tamper-proof</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Company */}
        <Field label="Company" icon={<Building2 size={12} />} error={companyErr}>
          <input
            type="text"
            placeholder="Acme Corporation"
            value={company}
            className={`input-base${companyErr ? " has-error" : ""}`}
            style={{ height: 36 }}
            onChange={(e) => { setCompany(e.target.value); touch("company"); }}
          />
        </Field>

        {/* License type */}
        <div>
          <Label icon={<Key size={12} />} text="License Type" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
            {(["account-based", "station-based"] as const).map((v) => {
              const sel = licenseType === v;
              const isAcc = v === "account-based";
              return (
                <button key={v} type="button" onClick={() => handleType(v)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "9px 12px", borderRadius: 10, cursor: "pointer",
                    border: sel ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.06)",
                    background: sel ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.02)",
                    transition: "all 0.15s",
                  }}>
                  <div style={{ color: sel ? "#818cf8" : "#334155", flexShrink: 0 }}>
                    {isAcc ? <Users size={14} strokeWidth={2} /> : <Monitor size={14} strokeWidth={2} />}
                  </div>
                  <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: sel ? "#a5b4fc" : "#64748b", lineHeight: 1 }}>
                      {isAcc ? "Account-based" : "Station-based"}
                    </p>
                    <p style={{ fontSize: 10, color: sel ? "rgba(99,102,241,0.8)" : "#475569", marginTop: 3 }}>
                      {isAcc ? "Per-user seats" : "Per-device nodes"}
                    </p>
                  </div>
                  {sel && (
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#6366f1", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "white" }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Seats — account-based */}
        {!isStation && (
          <Field label="Number of Seats" icon={<Users size={12} />} hint="Each seat = 1 token" error={qtyErr}>
            <input
              type="number" min={1} step={1}
              value={quantity || ""}
              className={`input-base${qtyErr ? " has-error" : ""}`}
              style={{ height: 36 }}
              onChange={(e) => { const v = parseInt(e.target.value, 10); setQuantity(isNaN(v) ? 0 : v); touch("quantity"); }}
            />
          </Field>
        )}

        {/* HWIDs — station-based */}
        {isStation && (
          <div>
            {/* Label row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <Label icon={<Cpu size={12} />} text={`Hardware IDs`} sub={`${hwids.length} node${hwids.length !== 1 ? "s" : ""} · ${hwids.length} token${hwids.length !== 1 ? "s" : ""}`} />
              <button type="button" onClick={addHwid}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                  border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.08)",
                  color: "#818cf8", fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                  lineHeight: 1, whiteSpace: "nowrap",
                }}>
                <Plus size={11} strokeWidth={2.5} /> Add Node
              </button>
            </div>

            {/* HWID rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {hwids.map((h, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    width: 22, height: 34, borderRadius: 7, flexShrink: 0,
                    background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.16)",
                    color: "#6366f1", fontSize: 10, fontWeight: 700, fontFamily: "monospace",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{i + 1}</span>
                  <input
                    type="text"
                    placeholder="AA:BB:CC:DD:EE:FF"
                    value={h}
                    className={`input-base mono${hwidErrs[i] ? " has-error" : ""}`}
                    style={{ height: 34, fontSize: 12 }}
                    onChange={(e) => updateHwid(i, e.target.value)}
                  />
                  {hwids.length > 1 && (
                    <button type="button" onClick={() => removeHwid(i)}
                      style={{
                        width: 28, height: 34, borderRadius: 7, flexShrink: 0, cursor: "pointer",
                        border: "1px solid rgba(239,68,68,0.18)", background: "rgba(239,68,68,0.04)",
                        color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {hwidErrs.some(Boolean) && (
              <p style={{ marginTop: 5, fontSize: 11, color: "#f87171", display: "flex", alignItems: "center", gap: 4 }}>
                <AlertCircle size={11} /> All Hardware IDs are required
              </p>
            )}
          </div>
        )}

        {/* Expiry */}
        <Field label="Expiry Date" icon={<CalendarDays size={12} />} error={expiryErr}>
          <input
            type="date" min={TODAY}
            value={expiry}
            className={`input-base${expiryErr ? " has-error" : ""}`}
            style={{ height: 36 }}
            onChange={(e) => { setExpiry(e.target.value); touch("expiry"); }}
          />
        </Field>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, paddingTop: 2 }}>
          <button type="button" onClick={handleReset}
            style={{
              flexShrink: 0, height: 36, padding: "0 14px", borderRadius: 8, cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
              color: "#64748b", fontSize: 13, fontWeight: 500, fontFamily: "inherit",
            }}>
            Reset
          </button>
          <button type="submit" disabled={loading}
            style={{
              flex: 1, height: 36, borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
              border: "none", fontFamily: "inherit", fontWeight: 600, fontSize: 13, color: "white",
              background: loading ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
              boxShadow: loading ? "none" : "0 4px 16px rgba(99,102,241,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              transition: "all 0.15s",
            }}>
            {loading ? (
              <>
                <svg style={{ animation: "spin 0.8s linear infinite" }} width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Signing…
              </>
            ) : (
              <>
                <Key size={13} strokeWidth={2.5} />
                Generate {tokenCount} Token{tokenCount !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Sub-components ──────────────────────── */

function Label({ icon, text, sub }: { icon: React.ReactNode; text: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ color: "#475569" }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8" }}>{text}</span>
      {sub && <span style={{ fontSize: 11, color: "#475569" }}>· {sub}</span>}
    </div>
  );
}

function Field({ label, icon, hint, error, children }: {
  label: string; icon: React.ReactNode; hint?: string; error?: string | null; children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <Label icon={icon} text={label} />
        {error && (
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#f87171" }}>
            <AlertCircle size={11} /> {error}
          </span>
        )}
      </div>
      {children}
      {hint && !error && <p style={{ marginTop: 4, fontSize: 11, color: "#475569" }}>{hint}</p>}
    </div>
  );
}
