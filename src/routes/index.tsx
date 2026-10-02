import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Trophy, Newspaper, Users, ShieldCheck, Sparkles, Mail, Lock, Eye, EyeClosed, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Minha Liga — Modo Carreira interativo" },
      { name: "description", content: "Assuma um clube, controle todos os resultados, gerencie o mercado e viva uma carreira de futebol narrativa." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/carreiras" });
    }
  }, [loading, user, navigate]);

  return (
    <main className="min-h-screen">
      <section className="container mx-auto grid gap-10 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div className="flex flex-col justify-center gap-6">
          <div className="flex items-baseline whitespace-nowrap">
            <span className="text-5xl font-black tracking-[-0.045em] text-foreground md:text-6xl">Mister</span>
            <span className="text-5xl font-black tracking-[-0.045em] text-primary md:text-6xl">Lab</span>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Modo carreira interativo
          </div>
          <h1 className="text-5xl font-black leading-tight tracking-tight md:text-6xl">
            Você dirige o clube.<br />
            <span className="bg-gradient-gold bg-clip-text text-transparent">A liga reage.</span>
          </h1>
          <p className="max-w-lg text-lg text-muted-foreground">
            Inspirado em Minha Liga do eFootball. Escolha um clube, escale seu time, registre cada resultado, negocie no mercado e responda à imprensa. Nada é simulado — cada decisão é sua.
          </p>
          <ul className="grid gap-3 text-sm md:grid-cols-2">
            <Feature icon={<Trophy className="h-4 w-4" />} label="Controle total dos resultados" />
            <Feature icon={<Users className="h-4 w-4" />} label="Elencos atualizados 2025/26" />
            <Feature icon={<ShieldCheck className="h-4 w-4" />} label="Mercado com 6 grandes clubes" />
            <Feature icon={<Newspaper className="h-4 w-4" />} label="Imprensa, torcida e diretoria" />
          </ul>
        </div>

        <div className="flex items-center justify-center">
          <AuthCard />
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2 backdrop-blur">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">{icon}</span>
      <span className="font-medium text-foreground">{label}</span>
    </li>
  );
}

function AuthCard() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<"email" | "code">("email");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    });
  };

  const handleMouseLeave = () => setMouse({ x: 0, y: 0 });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Bem-vindo, técnico!");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { manager_name: name || email.split("@")[0] },
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Conta criada. Já pode entrar.");
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setResetStep("code");
    toast.success("Enviamos um código de recuperação para seu e-mail.");
  };

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setBusy(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: resetCode,
      type: "recovery",
    });

    if (verifyError) {
      setBusy(false);
      toast.error("Código inválido ou expirado.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    toast.success("Senha alterada com sucesso!");
    setForgotPassword(false);
    setResetStep("email");
    setResetCode("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google");
    setBusy(false);
    if (result.error) toast.error(result.error.message);
  };

  const inputClass = (id: string) =>
    `h-11 w-full rounded-xl border bg-white/[0.045] pl-10 pr-10 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/25 ${
      focusedInput === id
        ? "border-emerald-300/40 bg-white/[0.08] shadow-[0_0_24px_rgba(74,222,128,0.08)]"
        : "border-white/[0.08] hover:border-white/[0.14]"
    }`;

  const iconClass = (id: string) =>
    `absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
      focusedInput === id ? "text-emerald-300" : "text-white/30"
    }`;

  return (
    <div
      className="relative w-full max-w-[430px] [perspective:1200px]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="pointer-events-none absolute -inset-12 rounded-[3rem] bg-emerald-400/10 blur-3xl" />
      <div
        className="relative overflow-hidden rounded-[28px] border border-white/[0.12] bg-[#07120f]/85 shadow-[0_30px_100px_rgba(0,0,0,0.55),0_0_70px_rgba(74,222,128,0.08)] backdrop-blur-2xl transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${-mouse.y * 4}deg) rotateY(${mouse.x * 5}deg)`,
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(74,222,128,0.13),transparent_42%)]" />
        <div className="pointer-events-none absolute -left-24 top-20 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-48 w-48 rounded-full bg-lime-300/[0.06] blur-3xl" />

        <div className="relative p-6 sm:p-8">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.055] text-2xl font-black text-white shadow-[0_0_35px_rgba(74,222,128,0.12)]">
              M
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {forgotPassword ? "Recuperar acesso" : tab === "login" ? "Bem-vindo de volta" : "Crie sua carreira"}
            </h2>
            <p className="mt-1.5 text-sm text-white/40">
              {forgotPassword
                ? "Recupere sua conta do Master League."
                : tab === "login"
                  ? "Entre para continuar sua jornada."
                  : "Monte seu clube e comece a temporada."}
            </p>
          </div>

          {forgotPassword ? (
            <div className="space-y-4">
              {resetStep === "email" ? (
                <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                  <Field
                    id="reset-email"
                    label="E-mail"
                    type="email"
                    value={email}
                    placeholder="treinador@clube.com"
                    icon={<Mail className={iconClass("reset-email")} />}
                    className={inputClass("reset-email")}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedInput("reset-email")}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <GlowButton disabled={busy}>{busy ? "Enviando..." : "Enviar código"}</GlowButton>
                </form>
              ) : (
                <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
                  <Field
                    id="reset-code"
                    label="Código de recuperação"
                    inputMode="numeric"
                    maxLength={8}
                    minLength={6}
                    required
                    value={resetCode}
                    placeholder="123456"
                    icon={<ShieldCheck className={iconClass("reset-code")} />}
                    className={inputClass("reset-code")}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    onFocus={() => setFocusedInput("reset-code")}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <Field
                    id="new-password"
                    label="Nova senha"
                    type={showNewPassword ? "text" : "password"}
                    minLength={6}
                    required
                    value={newPassword}
                    icon={<Lock className={iconClass("new-password")} />}
                    className={inputClass("new-password")}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onFocus={() => setFocusedInput("new-password")}
                    onBlur={() => setFocusedInput(null)}
                    end={<PasswordToggle show={showNewPassword} onClick={() => setShowNewPassword(!showNewPassword)} />}
                  />
                  <Field
                    id="confirm-new-password"
                    label="Confirmar nova senha"
                    type={showConfirmPassword ? "text" : "password"}
                    minLength={6}
                    required
                    value={confirmNewPassword}
                    icon={<Lock className={iconClass("confirm-new-password")} />}
                    className={inputClass("confirm-new-password")}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    onFocus={() => setFocusedInput("confirm-new-password")}
                    onBlur={() => setFocusedInput(null)}
                    end={<PasswordToggle show={showConfirmPassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)} />}
                  />
                  <GlowButton disabled={busy}>{busy ? "Alterando..." : "Alterar senha"}</GlowButton>
                </form>
              )}

              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setForgotPassword(false);
                  setResetStep("email");
                  setResetCode("");
                }}
                className="w-full text-center text-xs font-medium text-white/45 transition hover:text-white"
              >
                Voltar para entrar
              </button>
            </div>
          ) : (
            <>
              <div className="mb-5 grid grid-cols-2 rounded-xl border border-white/[0.08] bg-white/[0.025] p-1">
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className={`rounded-lg py-2 text-xs font-semibold transition ${
                    tab === "login" ? "bg-white/[0.09] text-white shadow-sm" : "text-white/35 hover:text-white/70"
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setTab("signup")}
                  className={`rounded-lg py-2 text-xs font-semibold transition ${
                    tab === "signup" ? "bg-white/[0.09] text-white shadow-sm" : "text-white/35 hover:text-white/70"
                  }`}
                >
                  Criar conta
                </button>
              </div>

              {tab === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <Field
                    id="login-email"
                    label="E-mail"
                    type="email"
                    required
                    value={email}
                    placeholder="treinador@clube.com"
                    icon={<Mail className={iconClass("login-email")} />}
                    className={inputClass("login-email")}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedInput("login-email")}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <Field
                    id="login-pass"
                    label="Senha"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    icon={<Lock className={iconClass("login-pass")} />}
                    className={inputClass("login-pass")}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedInput("login-pass")}
                    onBlur={() => setFocusedInput(null)}
                    end={<PasswordToggle show={showPassword} onClick={() => setShowPassword(!showPassword)} />}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPassword(true);
                        setResetStep("email");
                      }}
                      className="text-xs text-white/35 transition hover:text-emerald-300"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <GlowButton disabled={busy}>{busy ? "Entrando..." : "Entrar"}</GlowButton>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <Field
                    id="su-name"
                    label="Nome do técnico"
                    value={name}
                    placeholder="José Mourinho"
                    icon={<Users className={iconClass("su-name")} />}
                    className={inputClass("su-name")}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedInput("su-name")}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <Field
                    id="su-email"
                    label="E-mail"
                    type="email"
                    required
                    value={email}
                    icon={<Mail className={iconClass("su-email")} />}
                    className={inputClass("su-email")}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedInput("su-email")}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <Field
                    id="su-pass"
                    label="Senha"
                    type={showPassword ? "text" : "password"}
                    minLength={6}
                    required
                    value={password}
                    icon={<Lock className={iconClass("su-pass")} />}
                    className={inputClass("su-pass")}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedInput("su-pass")}
                    onBlur={() => setFocusedInput(null)}
                    end={<PasswordToggle show={showPassword} onClick={() => setShowPassword(!showPassword)} />}
                  />
                  <GlowButton disabled={busy}>{busy ? "Criando..." : "Criar conta"}</GlowButton>
                </form>
              )}

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.07]" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/20">ou</span>
                <div className="h-px flex-1 bg-white/[0.07]" />
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={handleGoogle}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.035] text-sm font-medium text-white/75 transition hover:border-white/[0.18] hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-900">G</span>
                Continuar com Google
              </button>

              <p className="mt-5 text-center text-[11px] leading-relaxed text-white/25">
                Ao continuar, você inicia sua própria carreira no Master League.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  icon,
  end,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  icon: React.ReactNode;
  end?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="ml-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-white/35">
        {label}
      </label>
      <div className="relative">
        {icon}
        <input id={id} {...props} className={className} />
        {end}
      </div>
    </div>
  );
}

function PasswordToggle({ show, onClick }: { show: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 transition hover:text-white/70"
      aria-label={show ? "Ocultar senha" : "Mostrar senha"}
    >
      {show ? <EyeClosed className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

function GlowButton({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-emerald-400 text-sm font-bold text-[#06100d] shadow-[0_0_28px_rgba(74,222,128,0.18)] transition hover:bg-emerald-300 hover:shadow-[0_0_38px_rgba(74,222,128,0.28)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />
      <span className="relative">{children}</span>
      {!disabled && <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />}
    </button>
  );
}
