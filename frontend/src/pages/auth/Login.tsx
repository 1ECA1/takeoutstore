
import { useRef, useState, type FormEvent, type PointerEvent } from "react";
import axios from "axios";
import {
  ShoppingBag,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Package,
  ShoppingCart,
  Monitor,
  Box,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const cardRef = useRef<HTMLDivElement>(null);

  const successMessage = location.state?.message as string | undefined;
  const requestedDestination = location.state?.from as string | undefined;

  const safeDestination =
    requestedDestination?.startsWith("/") &&
    !requestedDestination.startsWith("//")
      ? requestedDestination
      : "/customer";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [cardRotation, setCardRotation] = useState({
    x: 0,
    y: 0,
  });

  const [mousePosition, setMousePosition] = useState({
    x: 50,
    y: 50,
  });

  const handleCardPointerMove = (
    event: PointerEvent<HTMLDivElement>,
  ) => {
    if (event.pointerType !== "mouse") return;

    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = ((x - centerX) / centerX) * 3;
    const rotateX = ((centerY - y) / centerY) * 3;

    setCardRotation({
      x: rotateX,
      y: rotateY,
    });

    setMousePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleCardPointerLeave = () => {
    setCardRotation({ x: 0, y: 0 });
    setMousePosition({ x: 50, y: 50 });
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login({ email, password });

      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (user.role === "staff") {
        navigate("/staff", { replace: true });
      } else {
        navigate(safeDestination, { replace: true });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Login failed. Please try again.",
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#E8F1EA] via-[#F4F8F4] to-[#F8F5EB] px-4 py-8 sm:px-6 lg:py-12">

      {/* Background decorations */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#1B3C2B]/10 blur-3xl motion-safe:animate-pulse" />

      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full bg-[#D8B56D]/15 blur-3xl motion-safe:animate-pulse" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-forest/5" />

      {/* Floating icons */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <ShoppingBag className="absolute left-[5%] top-[17%] h-7 w-7 text-brand-sage/40 motion-safe:animate-bounce" />

        <Package className="absolute right-[8%] top-[20%] h-8 w-8 text-brand-sage/40 motion-safe:animate-pulse" />

        <ShoppingCart className="absolute bottom-[18%] left-[10%] h-7 w-7 text-[#C49A45]/50 motion-safe:animate-bounce" />

        <Monitor className="absolute bottom-[15%] right-[9%] h-8 w-8 text-brand-sage/40 motion-safe:animate-pulse" />

        <Box className="absolute left-[27%] top-[65%] h-6 w-6 text-[#C49A45]/40 motion-safe:animate-pulse" />

        <Sparkles className="absolute right-[28%] top-[70%] h-6 w-6 text-brand-sage/40 motion-safe:animate-bounce" />

        <div className="absolute left-[20%] top-[38%] h-2 w-2 rounded-full bg-brand-sage/40 motion-safe:animate-ping" />

        <div className="absolute bottom-[32%] right-[23%] h-2 w-2 rounded-full bg-[#C49A45]/50 motion-safe:animate-ping" />
      </div>

      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#1B3C2B 1px, transparent 1px), linear-gradient(90deg, #1B3C2B 1px, transparent 1px)",
          backgroundSize: "45px 45px",
        }}
      />

      {/* Main layout */}
      <div className="relative z-10 mx-auto w-full max-w-6xl">

        {/* Brand heading */}
        <div className="mb-7 flex flex-col items-center text-center motion-safe:animate-[fadeInDown_0.7s_ease-out]">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-forest text-white shadow-lg shadow-brand-forest/20">
            <ShoppingBag size={27} />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-sage">
            Enterprise Digital Store
          </p>
        </div>

        {/* Unified desktop card */}
        <div className="grid items-stretch grid-cols-1 overflow-hidden rounded-3xl border border-white/80 bg-white/70 shadow-[0_25px_80px_rgba(27,60,43,0.13)] backdrop-blur-2xl lg:grid-cols-2">

          {/* LEFT PANEL - LOGIN FORM */}
          <section className="relative z-20 order-1 min-w-0 bg-white/80 [perspective:1200px]">

            <div
              ref={cardRef}
              onPointerMove={handleCardPointerMove}
              onPointerLeave={handleCardPointerLeave}
              className="relative h-full overflow-hidden bg-white/80 p-6 transition-transform duration-200 ease-out sm:p-9 lg:p-10"
              style={{
                transform: `perspective(1200px) rotateX(${cardRotation.x}deg) rotateY(${cardRotation.y}deg)`,
                backgroundImage: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(61,106,82,0.10), transparent 45%)`,
              }}
            >
              {/* Top accent */}
              <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-brand-forest via-brand-sage to-[#D5AD5D]" />

              {/* Decorative glow */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-mint/60 blur-3xl" />

              <div className="relative">

                {/* Form heading */}
                <div className="mb-7">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-sage/15 bg-brand-mint/60 px-3 py-1.5 text-xs font-semibold text-brand-forest">
                    <Sparkles size={13} />
                    Welcome back
                  </div>

                  <h1 className="text-3xl font-extrabold tracking-tight text-brand-text sm:text-4xl">
                    Sign in to your account
                  </h1>

                  <p className="mt-3 text-sm leading-6 text-brand-muted">
                    Access your Enterprise E-commerce account and continue shopping.
                  </p>
                </div>

                {/* Success message */}
                {successMessage && (
                  <div className="mb-5 rounded-xl border border-brand-sage/20 bg-brand-mint/70 p-4 text-sm text-brand-sage motion-safe:animate-[fadeInUp_0.4s_ease-out]">
                    {successMessage}
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm text-brand-warning motion-safe:animate-[fadeInUp_0.4s_ease-out]">
                    {error}
                  </div>
                )}

                {/* Login form */}
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold text-brand-text"
                    >
                      Email Address
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Enter your email"
                      autoComplete="email"
                      required
                      className="w-full rounded-xl border border-brand-border bg-white/80 px-4 py-3.5 text-sm text-brand-text outline-none transition duration-300 placeholder:text-gray-400 hover:border-brand-sage/70 focus:border-brand-forest focus:bg-white focus:ring-4 focus:ring-brand-mint/70"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-semibold text-brand-text"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                        className="w-full rounded-xl border border-brand-border bg-white/80 px-4 py-3.5 pr-12 text-sm text-brand-text outline-none transition duration-300 placeholder:text-gray-400 hover:border-brand-sage/70 focus:border-brand-forest focus:bg-white focus:ring-4 focus:ring-brand-mint/70"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-brand-muted transition hover:bg-brand-mint hover:text-brand-forest"
                      >
                        {showPassword ? (
                          <EyeOff size={19} />
                        ) : (
                          <Eye size={19} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-forest px-4 py-4 text-sm font-bold text-white shadow-lg shadow-brand-forest/15 transition duration-300 hover:-translate-y-1 hover:bg-brand-sage hover:shadow-xl hover:shadow-brand-forest/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                    <span className="relative">
                      {loading ? "Signing in..." : "Sign In"}
                    </span>

                    {!loading && (
                      <ArrowRight
                        size={17}
                        className="relative transition-transform duration-300 group-hover:translate-x-1"
                      />
                    )}
                  </button>
                </form>

                {/* Registration */}
                <div className="mt-7 border-t border-brand-border/70 pt-6 text-center">
                  <p className="text-sm text-brand-muted">
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      state={{ from: requestedDestination }}
                      className="font-bold text-brand-forest transition hover:text-brand-sage hover:underline"
                    >
                      Create Account
                    </Link>
                  </p>
                </div>

                {/* Security footer */}
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-brand-muted">
                  <ShieldCheck size={15} className="text-brand-sage" />
                  Secure account authentication
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT PANEL - IMAGE (DESKTOP ONLY) */}
          <section className="group relative hidden min-h-[700px] overflow-hidden bg-brand-forest lg:block">

            {/* Image */}
            <div className="absolute inset-[5%] overflow-hidden rounded-2xl">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=90"
                alt="Modern retail shopping store interior"
                loading="eager"
                className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
              />

              {/* Image overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#10291D]/95 via-[#10291D]/25 to-transparent" />
            </div>

            {/* Image content */}
            <div className="absolute inset-x-[9%] bottom-[10%] z-10 text-white motion-safe:animate-[fadeInUp_0.9s_ease-out]">

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
                <Sparkles size={14} />
                Your shopping experience starts here
              </div>

              <h2 className="max-w-lg text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Everything you need.
                <span className="block text-[#E7C47D]">
                  All in one place.
                </span>
              </h2>

              <p className="mt-4 max-w-md text-sm leading-7 text-white/80 sm:text-base">
                Discover quality products, enjoy a seamless shopping experience, and manage your orders with confidence.
              </p>

              <div className="mt-7 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-xs font-medium text-white/90">
                  <CheckCircle2 size={17} className="text-[#E7C47D]" />
                  Easy shopping
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-white/90">
                  <CheckCircle2 size={17} className="text-[#E7C47D]" />
                  Secure checkout
                </div>
              </div>
            </div>

            {/* Floating decorative element */}
            <div className="absolute right-[9%] top-[9%] flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-white shadow-xl backdrop-blur-lg transition duration-500 group-hover:rotate-12 group-hover:scale-110">
              <ShoppingBag size={23} />
            </div>
          </section>
        </div>

        {/* Copyright */}
        <p className="mt-7 text-center text-xs font-medium tracking-wide text-brand-muted/80">
          © {new Date().getFullYear()} Enterprise E-commerce. All rights reserved.
        </p>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-18px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}
      </style>
    </main>
  );
};

export default Login;
