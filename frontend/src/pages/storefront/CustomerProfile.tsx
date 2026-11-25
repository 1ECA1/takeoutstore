
import { useEffect, useState, type FormEvent } from "react";
import {
  UserRound,
  Mail,
  ShieldCheck,
  LockKeyhole,
  Save,
  KeyRound,
  LogOut,
  CircleCheck,
  ShoppingBag,
  Settings,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { changeMyPassword } from "../../services/authService";

const CustomerProfile = () => {
  const { user, updateProfile, logout } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
  }, [user]);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileMessage("");
    setProfileError("");

    if (!name.trim() || !email.trim()) {
      setProfileError("Please provide your name and email address.");
      return;
    }

    try {
      setProfileLoading(true);
      await updateProfile({ name: name.trim(), email: email.trim() });
      setProfileMessage("Your profile was updated successfully.");
    } catch (error: any) {
      setProfileError(
        error?.response?.data?.message || "Unable to update your profile."
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("The new passwords do not match.");
      return;
    }

    try {
      setPasswordLoading(true);
      const message = await changeMyPassword({
        currentPassword,
        newPassword,
      });

      setPasswordMessage(message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setPasswordError(
        error?.response?.data?.message || "Unable to change your password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const inputClass =
    "w-full bg-transparent px-3 py-3.5 text-sm text-brand-text outline-none placeholder:text-brand-muted";

  const fieldClass =
    "flex items-center rounded-xl border border-brand-border bg-brand-gray/40 px-3 transition focus-within:border-brand-sage focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-mint";

  return (
    <main className="min-h-screen bg-[#F5F7F5] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1400px]">
        {/* Page heading */}
        <div className="mb-9 flex flex-col justify-between gap-4 border-b border-brand-border pb-7 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-sage">
              <Settings size={15} />
              Account Settings
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-brand-forest lg:text-4xl">
              My Profile
            </h1>
            <p className="mt-2 text-sm text-brand-muted">
              Manage your personal information and keep your account secure.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-brand-sage">
            <CircleCheck size={17} />
            <span>Account active</span>
          </div>
        </div>

        <div className="grid gap-7 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[350px_minmax(0,1fr)]">
          {/* Left profile panel */}
          <aside className="h-fit overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm">
            <div className="h-28 bg-gradient-to-r from-brand-forest to-brand-sage" />

            <div className="px-6 pb-7">
              <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-brand-mint text-brand-forest shadow-sm">
                <UserRound size={42} strokeWidth={1.6} />
              </div>

              <h2 className="mt-5 break-words text-xl font-bold text-brand-forest">
                {user?.name || "Customer"}
              </h2>
              <p className="mt-1 break-all text-sm text-brand-muted">
                {user?.email}
              </p>

              <div className="mt-6 flex items-center gap-2 rounded-xl bg-brand-mint/70 px-4 py-3 text-sm font-medium text-brand-forest">
                <CircleCheck size={17} />
                Your account is {user?.status || "active"}
              </div>

              <div className="mt-7 space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                    Account type
                  </p>
                  <p className="mt-1.5 font-semibold capitalize text-brand-forest">
                    {user?.role || "Customer"}
                  </p>
                </div>

                <div className="border-t border-brand-border pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                    Account email
                  </p>
                  <p className="mt-1.5 break-all text-sm font-medium text-brand-forest">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-brand-border pt-6">
                <div className="mb-4 flex items-center gap-3 text-sm text-brand-muted">
                  <ShoppingBag size={18} />
                  <span>Manage your shopping account</span>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-brand-warning transition hover:border-red-300 hover:bg-red-50"
                >
                  <LogOut size={17} />
                  Sign Out
                </button>
              </div>
            </div>
          </aside>

          {/* Right account settings */}
          <div className="space-y-7">
            {/* Personal information */}
            <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-7 lg:p-8">
              <div className="mb-7 flex items-center gap-4 border-b border-brand-border pb-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-mint text-brand-forest">
                  <UserRound size={23} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brand-forest">
                    Personal Information
                  </h2>
                  <p className="mt-1 text-sm text-brand-muted">
                    Keep your account details up to date.
                  </p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit}>
                <div className="grid gap-5 xl:grid-cols-2">
                  <div>
                    <label
                      htmlFor="customer-name"
                      className="mb-2 block text-sm font-semibold text-brand-text"
                    >
                      Full name
                    </label>
                    <div className={fieldClass}>
                      <UserRound size={18} className="shrink-0 text-brand-muted" />
                      <input
                        id="customer-name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Enter your full name"
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="customer-email"
                      className="mb-2 block text-sm font-semibold text-brand-text"
                    >
                      Email address
                    </label>
                    <div className={fieldClass}>
                      <Mail size={18} className="shrink-0 text-brand-muted" />
                      <input
                        id="customer-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Enter your email address"
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>
                </div>

                {profileMessage && (
                  <p className="mt-5 rounded-xl bg-brand-mint p-3 text-sm text-brand-forest">
                    {profileMessage}
                  </p>
                )}

                {profileError && (
                  <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {profileError}
                  </p>
                )}

                <div className="mt-7 flex justify-end border-t border-brand-border pt-6">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-sage disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    <Save size={17} />
                    {profileLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </section>

            {/* Account security */}
            <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-7 lg:p-8">
              <div className="mb-7 flex items-center gap-4 border-b border-brand-border pb-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-mint text-brand-forest">
                  <ShieldCheck size={23} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brand-forest">
                    Account Security
                  </h2>
                  <p className="mt-1 text-sm text-brand-muted">
                    Protect your account by updating your password.
                  </p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit}>
                <div className="grid gap-5 xl:grid-cols-2">
                  <div className="xl:col-span-2">
                    <label
                      htmlFor="current-password"
                      className="mb-2 block text-sm font-semibold text-brand-text"
                    >
                      Current password
                    </label>
                    <div className={fieldClass}>
                      <LockKeyhole size={18} className="shrink-0 text-brand-muted" />
                      <input
                        id="current-password"
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        placeholder="Enter your current password"
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="new-password"
                      className="mb-2 block text-sm font-semibold text-brand-text"
                    >
                      New password
                    </label>
                    <div className={fieldClass}>
                      <KeyRound size={18} className="shrink-0 text-brand-muted" />
                      <input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="At least 8 characters"
                        className={inputClass}
                        minLength={8}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="mb-2 block text-sm font-semibold text-brand-text"
                    >
                      Confirm new password
                    </label>
                    <div className={fieldClass}>
                      <KeyRound size={18} className="shrink-0 text-brand-muted" />
                      <input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Confirm your new password"
                        className={inputClass}
                        minLength={8}
                        required
                      />
                    </div>
                  </div>
                </div>

                {passwordMessage && (
                  <div className="mt-5 rounded-xl bg-brand-mint p-4 text-sm text-brand-forest">
                    {passwordMessage}
                    <p className="mt-1">
                      Please sign out and sign in again using your new password.
                    </p>
                  </div>
                )}

                {passwordError && (
                  <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {passwordError}
                  </p>
                )}

                <div className="mt-7 flex justify-end border-t border-brand-border pt-6">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-sage disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    <LockKeyhole size={17} />
                    {passwordLoading ? "Changing..." : "Update Password"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CustomerProfile;
