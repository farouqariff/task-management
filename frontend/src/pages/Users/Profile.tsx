import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import { useAuth } from "../../context/AuthContext";
import { usersApi } from "../../services/api";

export default function Profile() {
  const { user, token, login } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges =
    firstName !== (user?.first_name ?? "") ||
    lastName !== (user?.last_name ?? "") ||
    email !== (user?.email ?? "") ||
    newPassword !== "" ||
    confirmPassword !== "";

  const handleCancel = () => {
    setFirstName(user?.first_name ?? "");
    setLastName(user?.last_name ?? "");
    setEmail(user?.email ?? "");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const handleSave = async () => {
    setError(null);
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }
    if (!user) return;

    const payload: {
      first_name?: string;
      last_name?: string;
      email?: string;
      password?: string;
    } = {};
    if (firstName !== user.first_name) payload.first_name = firstName;
    if (lastName !== user.last_name) payload.last_name = lastName;
    if (email !== user.email) payload.email = email;
    if (newPassword) payload.password = newPassword;

    setSaving(true);
    const result = await usersApi.update(user.id, payload);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (token && result.data) {
      login(token, {
        ...user,
        first_name: result.data.first_name,
        last_name: result.data.last_name,
        full_name: result.data.full_name,
        email: result.data.email,
      });
    }
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <>
      <PageMeta
        title="Profile | Tally"
        description="Profile settings for your Tally account"
      />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="max-w-2xl mx-auto">
        <ComponentCard title="Personal Information">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="new_password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showNew ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showConfirm ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-error-500">{error}</p>}

            <div className="flex items-center gap-3 justify-end">
              <Button
                size="sm"
                variant="outline"
                disabled={!hasChanges}
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!hasChanges || saving}
                onClick={handleSave}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
