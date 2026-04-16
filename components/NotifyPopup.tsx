"use client";

import { useState } from "react";
import { X, Bell, CheckCircle2 } from "lucide-react";

function validateFields(form: { name: string; email: string; whatsapp: string }) {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = "Preencha seu nome.";
  const email = form.email.trim().toLowerCase();
  if (!email || !/.+@.+\..+/.test(email)) errors.email = "E-mail inválido.";
  const digits = form.whatsapp.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) errors.whatsapp = "WhatsApp inválido.";
  return errors;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function NotifyPopup({ isOpen, onClose }: Props) {
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const update = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setFieldErrors((p) => {
      if (!p[field]) return p;
      const next = { ...p };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    const errors = validateFields(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setGeneralError(data.errors?.[0] || data.error || "Erro ao enviar.");
        return;
      }

      setSubmitted(true);
    } catch {
      setGeneralError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setGeneralError("");
    setFieldErrors({});
    setForm({ name: "", email: "", whatsapp: "" });
    onClose();
  };

  if (!isOpen) return null;

  const inputCls = (field: string) =>
    `w-full px-4 py-4 rounded-xl bg-[#0a0a0a] border text-white placeholder:text-[#555] text-[15px] focus:outline-none focus:border-editify-accent/50 transition-colors ${
      fieldErrors[field] ? "border-red-500" : "border-[#333]"
    }`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-md bg-editify-surface rounded-2xl border border-editify-hairline overflow-hidden"
          style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 text-editify-muted hover:text-white transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8">
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="font-[family-name:var(--font-display)] text-2xl text-white uppercase mb-2">
                  Cadastro realizado!
                </h3>
                <p className="text-editify-muted">
                  Você será notificado quando o treinamento lançar.
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-5">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-editify-accent/15 mb-4">
                    <Bell className="w-7 h-7 text-editify-accent" />
                  </div>
                  <h3 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl text-white uppercase">
                    Seja notificado no lançamento
                  </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Seu nome"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      className={inputCls("name")}
                    />
                    {fieldErrors.name && (
                      <p className="text-red-400 text-xs mt-1">{fieldErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Seu melhor e-mail"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className={inputCls("email")}
                    />
                    {fieldErrors.email && (
                      <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="WhatsApp (com DDD)"
                      value={form.whatsapp}
                      onChange={(e) => update("whatsapp", e.target.value)}
                      className={inputCls("whatsapp")}
                    />
                    {fieldErrors.whatsapp && (
                      <p className="text-red-400 text-xs mt-1">{fieldErrors.whatsapp}</p>
                    )}
                  </div>

                  {generalError && (
                    <p className="text-red-400 text-xs text-center">{generalError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-editify-accent text-white font-bold uppercase tracking-wider text-sm hover:brightness-110 transition-all mt-1 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    style={{ boxShadow: "0 8px 24px rgba(227,6,19,0.4)" }}
                  >
                    {loading ? "Enviando..." : "Quero ser notificado"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
