import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Rocket } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/WorkspaceContext";

export default function Login() {
  const { login, isAuthenticated, currentUser } = useAuth();

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={`/${currentUser.role}`} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setError("Enter both your email address and password.");
      return;
    }

    setError("");
    setLoading(true);

    const result = await login(email, password);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    navigate(`/${result.user.role}`, {
      replace: true,
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:grid sm:place-items-center">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 lg:grid-cols-[1.05fr_.95fr]">
        {/* LEFT SIDE */}
        <section className="hidden bg-violet-700 p-10 text-white lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
              <Rocket size={21} />
            </span>

            <div>
              <h1 className="font-bold">TaskFlow</h1>
              <p className="text-xs text-violet-200">Project management</p>
            </div>
          </div>

          <div className="my-auto">
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-violet-200">
              One workspace
            </p>

            <h2 className="mt-4 text-4xl font-bold leading-tight">
              Plan better.
              <br />
              Deliver together.
            </h2>

            <p className="mt-5 max-w-sm text-violet-100">
              Bring projects, people, tasks, and deadlines into one focused
              workspace.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-violet-100">
            Sign in with your APMS account to access your workspace.
          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className="p-6 sm:p-10">
          {/* Mobile Logo */}
          <div className="lg:hidden">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-white">
                <Rocket size={21} />
              </span>

              <div>
                <h1 className="font-bold text-slate-900">TaskFlow</h1>

                <p className="text-xs text-slate-500">Project management</p>
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="mt-8 lg:mt-0">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>

            <p className="mt-1 text-sm text-slate-500">
              Sign in to continue to your workspace.
            </p>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={submit} className="mt-7 space-y-4">
            {/* Email */}
            <label className="block text-sm font-medium text-slate-700">
              Email address
              <input
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                type="email"
                placeholder="you@taskflow.com"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </label>

            {/* Password */}
            <label className="block text-sm font-medium text-slate-700">
              Password
              <div className="relative mt-1.5">
                <input
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  type={visible ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-11 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />

                <button
                  type="button"
                  aria-label="Show password"
                  onClick={() => setVisible(!visible)}
                  className="absolute right-3 top-2.5 text-slate-400"
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {/* Error */}
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700"
              >
                {error}
              </p>
            )}

            {/* Sign In */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LockKeyhole size={17} />

              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* APMS INFO */}
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            <p className="font-medium text-slate-700">APMS Login</p>

            <p className="mt-1">
              Use the account created by your Manager or HR.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
