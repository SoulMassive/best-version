import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, fetcher } from "../../api/client";
import { Button, Card, Field, LoadingState, SectionHeader } from "../../components/ui/UI";
import { useAuth } from "../../context/AuthContext";

export function SettingsPage() {
  const { auth, logout } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetcher("/profile/settings"),
  });

  const [prefs, setPrefs] = useState(null);
  const [notifPrefs, setNotifPrefs] = useState(null);
  const [pitch, setPitch] = useState("");
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [deleteEmail, setDeleteEmail] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (data) {
      setPrefs(data.preferences || {});
      setNotifPrefs(data.notificationPreferences || {});
      setPitch(data.reusablePitch || "");
    }
  }, [data]);

  const settingsMutation = useMutation({
    mutationFn: (payload) => api.patch("/profile/settings", payload),
    onSuccess: () => { toast.success("Settings saved"); queryClient.invalidateQueries({ queryKey: ["settings"] }); },
    onError: () => toast.error("Failed to save settings"),
  });

  const passwordMutation = useMutation({
    mutationFn: (payload) => api.put("/profile/password", payload),
    onSuccess: () => { toast.success("Password updated"); setPasswords({ current: "", next: "", confirm: "" }); },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to update password"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete("/profile/account", { data: { email: deleteEmail } }),
    onSuccess: () => { toast.success("Account deleted"); logout(); },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to delete account"),
  });

  if (isLoading || !prefs) return <LoadingState label="Loading settings..." />;

  function handlePasswordSubmit(e) {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) { toast.error("New passwords do not match"); return; }
    if (passwords.next.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    passwordMutation.mutate({ currentPassword: passwords.current, newPassword: passwords.next });
  }

  return (
    <div className="stack-xl">
      {/* Notification Preferences */}
      <Card>
        <SectionHeader eyebrow="Notifications" title="How we keep you informed" />
        <div className="stack">
          {[
            ["emailOnMentorshipRequest", "Email when a mentorship request is accepted"],
            ["emailOnJobMatch", "Email when a new job matches your skills"],
            ["communityDigest", "Weekly community digest"],
          ].map(([key, label]) => (
            <label className="toggle-row" key={key}>
              <span>{label}</span>
              <input
                type="checkbox"
                checked={notifPrefs?.[key] ?? true}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, [key]: e.target.checked })}
              />
            </label>
          ))}
        </div>
        <Button style={{ marginTop: "1rem" }} onClick={() => settingsMutation.mutate({ notificationPreferences: notifPrefs })}>
          Save Notification Preferences
        </Button>
      </Card>

      {/* Preferences */}
      <Card>
        <SectionHeader eyebrow="Preferences" title="Theme and visibility" />
        <div className="stack">
          {[
            ["emailNotifications", "Email notifications"],
            ["pushNotifications", "Push notifications"],
            ["weeklyDigest", "Weekly digest"],
            ["openToWork", "Open to work"],
          ].map(([key, label]) => (
            <label className="toggle-row" key={key}>
              <span>{label}</span>
              <input
                type="checkbox"
                checked={prefs?.[key] ?? true}
                onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
              />
            </label>
          ))}
          <label className="field">
            <span>Theme</span>
            <select value={prefs?.theme || "system"} onChange={(e) => setPrefs({ ...prefs, theme: e.target.value })}>
              <option value="system">System</option>
              <option value="light">Light</option>
            </select>
          </label>
          <Button onClick={() => settingsMutation.mutate({ preferences: prefs })}>Save Preferences</Button>
        </div>
      </Card>

      {/* Reusable Pitch */}
      <Card>
        <SectionHeader eyebrow="Career" title="Your reusable pitch" description="Pre-fill job applications with this pitch." />
        <Field label="Reusable Pitch" value={pitch} onChange={(e) => setPitch(e.target.value)} textarea />
        <Button style={{ marginTop: "0.75rem" }} onClick={() => settingsMutation.mutate({ reusablePitch: pitch })}>Save Pitch</Button>
      </Card>

      {/* Password */}
      <Card>
        <SectionHeader eyebrow="Security" title="Change password" />
        <form className="stack" onSubmit={handlePasswordSubmit}>
          <Field label="Current Password" type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
          <Field label="New Password" type="password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} />
          <Field label="Confirm New Password" type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
          <Button type="submit" disabled={passwordMutation.isPending}>
            {passwordMutation.isPending ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </Card>

      {/* Danger Zone */}
      <Card style={{ border: "1.5px solid var(--danger)" }}>
        <SectionHeader eyebrow="Danger Zone" title="Delete Account" description="This permanently deletes your profile, posts, applications, and all data. This cannot be undone." />
        {!showDeleteConfirm ? (
          <Button variant="ghost" onClick={() => setShowDeleteConfirm(true)} style={{ color: "var(--danger)", marginTop: "0.75rem" }}>
            Delete my account
          </Button>
        ) : (
          <div className="stack" style={{ marginTop: "0.75rem" }}>
            <p>Type your email <strong>{auth.user?.email}</strong> to confirm:</p>
            <Field label="Confirm email" value={deleteEmail} onChange={(e) => setDeleteEmail(e.target.value)} />
            <div className="row-actions">
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button
                variant="primary"
                style={{ background: "var(--danger)" }}
                disabled={deleteEmail !== auth.user?.email || deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? "Deleting..." : "Permanently Delete"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
