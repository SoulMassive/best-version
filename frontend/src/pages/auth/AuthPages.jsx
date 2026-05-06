import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../../api/client";
import { Footer } from "../../components/layout/Footer";
import { BrandLogo } from "../../components/ui/BrandLogo";
import { Button, Card, Field, LoadingState } from "../../components/ui/UI";
import { useAuth } from "../../context/AuthContext";

const AUTH_BACKGROUND =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80";

function getGoogleStartUrl() {
  const base = import.meta.env.VITE_API_URL || "/api";
  return `${base.replace(/\/$/, "")}/auth/google/start`;
}

function GoogleGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M21.8 12.23c0-.76-.07-1.49-.2-2.2H12v4.16h5.49a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.05-4.39 3.05-7.6Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.75 0 5.05-.91 6.74-2.47l-3.3-2.56c-.92.62-2.1.99-3.44.99-2.65 0-4.9-1.79-5.7-4.19H2.89v2.65A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.3 13.77A6 6 0 0 1 6 12c0-.62.1-1.22.3-1.77V7.58H2.89A10 10 0 0 0 2 12c0 1.61.38 3.14 1.05 4.42l3.25-2.65Z"
        fill="#FBBC04"
      />
      <path
        d="M12 5.96c1.49 0 2.82.51 3.87 1.5l2.9-2.9C17.05 2.95 14.75 2 12 2A10 10 0 0 0 2.89 7.58l3.4 2.65c.8-2.4 3.05-4.27 5.7-4.27Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GoogleAuthButton({ enabled, loading, onClick, helperText, noteClassName = "" }) {
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="auth-google-btn"
        disabled={!enabled || loading}
        onClick={enabled ? onClick : undefined}
        title={!enabled ? helperText : "Continue with Google"}
      >
        <GoogleGlyph />
        {loading ? "Connecting to Google..." : "Continue with Google"}
      </Button>
      {!enabled && helperText ? <p className={`auth-google-note ${noteClassName}`.trim()}>{helperText}</p> : null}
    </>
  );
}

function PasswordField({ label, value, onChange }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className="field auth-password-field">
      <span>{label}</span>
      <div className="auth-password-wrap">
        <input 
          type={showPassword ? "text" : "password"} 
          value={value} 
          onChange={onChange} 
          autoComplete="current-password"
        />
        <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((current) => !current)}>
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
    </label>
  );
}

function useAuthOptions() {
  const [googleConfig, setGoogleConfig] = useState({
    loading: true,
    enabled: false,
    message: "Checking Google sign-in availability...",
  });

  useEffect(() => {
    let active = true;

    api
      .get("/auth/options")
      .then((response) => {
        if (!active) return;
        const google = response.data?.data?.google || {};
        setGoogleConfig({
          loading: false,
          enabled: Boolean(google.enabled),
          message: google.message || "Google sign-in is not configured right now.",
        });
      })
      .catch(() => {
        if (!active) return;
        setGoogleConfig({
          loading: false,
          enabled: false,
          message: "Google sign-in is unavailable right now. Please use email and password.",
        });
      });

    return () => {
      active = false;
    };
  }, []);

  return googleConfig;
}

function AuthLayout({ title, subtitle, children, cardClassName = "", showcaseStyle = undefined }) {
  return (
    <div className="auth-page" style={{ "--auth-bg": `url(${AUTH_BACKGROUND})` }}>
      <div className="auth-showcase" style={showcaseStyle}>
        <div className="auth-brand-row">
          <BrandLogo />
        </div>
        <span className="eyebrow">Youth growth platform</span>
        <h1>Build skills, projects, and career proof in one place.</h1>
        <p>
          Designed for students, freelancers, early professionals, mentors, startups, and recruiters who care about
          visible growth.
        </p>
        <div className="auth-copy-card">
          <strong>Project-first growth</strong>
          <span>Assess. Build. Earn. Repeat.</span>
        </div>
      </div>
      <div className="auth-panel">
        <Card className={`auth-card ${cardClassName}`.trim()}>
          <div className="auth-card-copy">
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          {children}
        </Card>
        <Footer variant="auth" />
      </div>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleConfig = useAuthOptions();
  const googleEnabled = useMemo(() => googleConfig.enabled && !googleConfig.loading, [googleConfig.enabled, googleConfig.loading]);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to login");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    setGoogleLoading(true);
    window.location.href = getGoogleStartUrl();
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue building your best version.">
      <form className="stack" onSubmit={handleSubmit}>
        <Field label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <PasswordField label="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Button disabled={loading || googleLoading} type="submit">
          {loading ? "Signing in..." : "Log in"}
        </Button>
        <Link to="/">
          <Button type="button" variant="ghost">
            Back to main page
          </Button>
        </Link>
        <GoogleAuthButton
          enabled={googleEnabled && !loading}
          loading={googleLoading}
          onClick={handleGoogleLogin}
          helperText={googleConfig.loading ? "Checking Google sign-in availability..." : googleConfig.message}
        />
        <div className="auth-links">
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/signup">Create account</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const { isAuthenticated, register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleConfig = useAuthOptions();
  const googleEnabled = useMemo(() => googleConfig.enabled && !googleConfig.loading, [googleConfig.enabled, googleConfig.loading]);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create account");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    setGoogleLoading(true);
    window.location.href = getGoogleStartUrl();
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start with a free profile and personalize your growth path."
      cardClassName="signup-card"
      showcaseStyle={{
        justifyContent: "flex-start",
        alignSelf: "stretch",
        paddingTop: "5rem",
        textAlign: "left",
      }}
    >
      <form className="signup-form" onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gap: "1rem",
          }}
        >
          <Field label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <PasswordField label="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <label className="field">
            <span>Primary role</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="student">Student</option>
              <option value="graduate">Graduate</option>
              <option value="freelancer">Freelancer</option>
              <option value="professional">Professional</option>
            </select>
          </label>
        </div>

        <div
          style={{
            display: "grid",
            gap: "0.9rem",
            marginTop: "1.1rem",
          }}
        >
          <Button disabled={loading || googleLoading} type="submit">
            {loading ? "Creating account..." : "Create account"}
          </Button>
          <GoogleAuthButton
            enabled={googleEnabled && !loading}
            loading={googleLoading}
            onClick={handleGoogleLogin}
            helperText={googleConfig.loading ? "Checking Google sign-in..." : googleConfig.message}
            noteClassName="signup-google-note"
          />
        </div>

        <p
          className="auth-note signup-note"
          style={{
            marginTop: "0.9rem",
          }}
        >
          Choose the path that gets you building fastest.
        </p>

        <div
          style={{
            display: "grid",
            gap: "0.9rem",
            marginTop: "1rem",
            paddingTop: "1rem",
            borderTop: "1px solid rgba(19, 33, 23, 0.08)",
          }}
        >
          <div className="signup-secondary-actions" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
            <Link to="/">
              <Button type="button" variant="ghost" className="signup-back-btn">
                Back to main page
              </Button>
            </Link>
          </div>
          <div className="auth-links">
            <Link to="/forgot-password">Forgot password?</Link>
            <Link to="/login">Log in</Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({
    message: "",
    resetUrl: "",
    resetLinkEnabled: false,
    emailDeliveryConfigured: false,
  });

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", { email });
      const data = response.data?.data || {};
      setResult({
        message: response.data?.message || "",
        resetUrl: data.resetUrl || "",
        resetLinkEnabled: Boolean(data.resetLinkEnabled),
        emailDeliveryConfigured: Boolean(data.emailDeliveryConfigured),
      });
      toast.success(response.data?.message || "Password reset request created");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create a reset link right now.");
      setResult({
        message: "",
        resetUrl: "",
        resetLinkEnabled: false,
        emailDeliveryConfigured: false,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Reset password" subtitle="Enter your email and we'll help you continue to a secure password reset.">
      <form className="stack" onSubmit={handleSubmit}>
        <Field label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" disabled={loading}>
          {loading ? "Preparing reset link..." : "Generate reset token"}
        </Button>
        <Link to="/login">Back to login</Link>
        {result.message ? (
          <Card className="inline-note">
            <strong>{result.emailDeliveryConfigured ? "Check your email" : "Reset link ready"}</strong>
            <p>{result.message}</p>
            {result.resetLinkEnabled && result.resetUrl ? (
              <>
                <code>{result.resetUrl}</code>
                <a href={result.resetUrl}>Continue to reset password</a>
              </>
            ) : null}
          </Card>
        ) : null}
      </form>
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get("token") || "");
  const [password, setPassword] = useState("Password123");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      await api.post("/auth/reset-password", { token, password });
      toast.success("Password reset");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset token is invalid or expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create a new password" subtitle="Choose a fresh password and complete your reset securely.">
      <form className="stack" onSubmit={handleSubmit}>
        <Field label="Token" value={token} onChange={(e) => setToken(e.target.value)} />
        <Field label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" disabled={loading}>
          {loading ? "Resetting password..." : "Reset password"}
        </Button>
      </form>
    </AuthLayout>
  );
}

export function GoogleAuthCallbackPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loginWithToken } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      toast.error(error);
      navigate("/login", { replace: true });
      return;
    }

    if (!token) {
      toast.error("Google sign-in did not return a valid session.");
      navigate("/login", { replace: true });
      return;
    }

    loginWithToken(token)
      .then(() => {
        window.history.replaceState(null, "", "/auth/google/callback");
        navigate("/dashboard", { replace: true });
      })
      .catch((loginError) => {
        toast.error(loginError.response?.data?.message || "Unable to complete Google sign-in.");
        navigate("/login", { replace: true });
      });
  }, [isAuthenticated, loginWithToken, navigate]);

  return <LoadingState label="Completing Google sign-in..." />;
}
