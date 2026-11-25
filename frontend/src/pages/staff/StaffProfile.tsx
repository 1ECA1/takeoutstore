
import { useEffect, useState, type FormEvent } from "react";
import {
  User,
  Mail,
  ShieldCheck,
  LockKeyhole,
  Save,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { changeMyPassword } from "../../services/authService";

const StaffProfile = () => {
  const { user, updateProfile, logout } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
  }, [user?.name, user?.email]);

  const permissions = user?.permissions || [];

  const permissionLabels: Record<string, string> = {
    "orders.view": "View orders",
    "orders.update_status": "Update order status",
    "products.view": "View products",
    "products.create": "Create products",
    "products.update": "Update products",
    "products.delete": "Delete products",
    "products.upload_images": "Upload product images",
    "inventory.view": "View inventory",
    "inventory.adjust": "Adjust inventory",
    "inventory.logs.view": "View inventory logs",
    "inventory.analytics.view": "View inventory analytics",
    "customers.view": "View customers",
    "customers.purchase_history.view": "View purchase history",
    "customers.insights.view": "View customer insights",
    "customers.activity.view": "View customer activity",
    "customers.segments.view": "View customer segments",
    "suppliers.view": "View suppliers",
    "suppliers.create": "Create suppliers",
    "suppliers.update": "Update suppliers",
    "suppliers.delete": "Delete suppliers",
    "suppliers.analytics.view": "View supplier analytics",
  };

  const handleProfileUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setProfileMessage("");
    setProfileError("");

    if (!name.trim() || !email.trim()) {
      setProfileError("Name and email are required.");
      return;
    }

    try {
      setProfileLoading(true);

      await updateProfile({
        name: name.trim(),
        email: email.trim(),
      });

      setProfileMessage("Your profile was updated successfully.");
    } catch (error: any) {
      setProfileError(
        error.response?.data?.message || "Failed to update your profile."
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

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
        error.response?.data?.message || "Failed to change your password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1D1C]">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-[#6E7572]">
          Manage your personal information, account security and responsibilities.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-[#E4E6E5] bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-[#E6F0EA] p-3 text-[#1B3C2B]">
              <User size={22} />
            </div>
            <div>
              <h2 className="font-bold text-[#1A1D1C]">
                Personal Information
              </h2>
              <p className="text-xs text-[#6E7572]">
                Update your account details
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1A1D1C]">
                Full name
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-[#E4E6E5] px-3">
                <User size={17} className="text-[#6E7572]" />
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={100}
                  required
                  className="w-full py-3 text-sm outline-none"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1A1D1C]">
                Email address
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-[#E4E6E5] px-3">
                <Mail size={17} className="text-[#6E7572]" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={254}
                  required
                  className="w-full py-3 text-sm outline-none"
                  placeholder="Your email address"
                />
              </div>
            </div>

            <div className="rounded-xl bg-[#F6F7F6] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6E7572]">Account role</span>
                <span className="font-semibold capitalize text-[#1B3C2B]">
                  {user?.role || "Staff"}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-[#6E7572]">Account status</span>
                <span className="font-semibold capitalize text-[#1B3C2B]">
                  {user?.status || "Unknown"}
                </span>
              </div>
            </div>

            {profileMessage && (
              <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {profileMessage}
              </p>
            )}

            {profileError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {profileError}
              </p>
            )}

            <button
              type="submit"
              disabled={profileLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B3C2B] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2B513C] disabled:opacity-60"
            >
              <Save size={17} />
              {profileLoading ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-[#E4E6E5] bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-[#E6F0EA] p-3 text-[#1B3C2B]">
              <LockKeyhole size={22} />
            </div>
            <div>
              <h2 className="font-bold text-[#1A1D1C]">
                Account Security
              </h2>
              <p className="text-xs text-[#6E7572]">
                Change your account password
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordUpdate} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1A1D1C]">
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-[#E4E6E5] px-4 py-3 text-sm outline-none focus:border-[#3D6A52]"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1A1D1C]">
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                maxLength={72}
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-[#E4E6E5] px-4 py-3 text-sm outline-none focus:border-[#3D6A52]"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#1A1D1C]">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                maxLength={72}
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-[#E4E6E5] px-4 py-3 text-sm outline-none focus:border-[#3D6A52]"
                placeholder="Confirm new password"
              />
            </div>

            {passwordMessage && (
              <div className="space-y-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                <p>{passwordMessage}</p>
                <button
                  type="button"
                  onClick={logout}
                  className="font-semibold underline"
                >
                  Sign out and log in again
                </button>
              </div>
            )}

            {passwordError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {passwordError}
              </p>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1B3C2B] px-4 py-3 text-sm font-semibold text-[#1B3C2B] transition hover:bg-[#E6F0EA] disabled:opacity-60"
            >
              <KeyRound size={17} />
              {passwordLoading ? "Changing password..." : "Change Password"}
            </button>
          </form>
        </section>
      </div>

      <section className="rounded-2xl border border-[#E4E6E5] bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-[#E6F0EA] p-3 text-[#1B3C2B]">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="font-bold text-[#1A1D1C]">
              My Assigned Responsibilities
            </h2>
            <p className="text-xs text-[#6E7572]">
              These permissions are assigned and managed by your administrator.
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-[#6E7572]">
            Assigned permissions
          </span>
          <span className="rounded-full bg-[#E6F0EA] px-3 py-1 text-sm font-bold text-[#1B3C2B]">
            {permissions.length}
          </span>
        </div>

        {permissions.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {permissions.map((permission) => (
              <div
                key={permission}
                className="flex items-center gap-2 rounded-xl border border-[#E4E6E5] bg-[#F8F9F8] p-3"
              >
                <ShieldCheck
                  size={17}
                  className="shrink-0 text-[#3D6A52]"
                />
                <span className="text-sm text-[#1A1D1C]">
                  {permissionLabels[permission] || permission}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-[#F6F7F6] p-5 text-center text-sm text-[#6E7572]">
            No responsibilities have been assigned to your account yet.
            Please contact your administrator.
          </p>
        )}
      </section>
    </div>
  );
};

export default StaffProfile;
