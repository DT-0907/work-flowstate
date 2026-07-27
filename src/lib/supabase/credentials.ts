import { createClient } from "./client";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;
const USERNAME_RULE = "Username must be 3-24 characters: letters, numbers, or underscores.";

export function validateUsername(username: string): string | null {
  return USERNAME_RE.test(username.trim()) ? null : USERNAME_RULE;
}

export function validatePassword(password: string): string | null {
  return password.length >= 8 ? null : "Password must be at least 8 characters.";
}

export async function fetchUsername(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  return data?.username ?? null;
}

export async function setUsername(username: string): Promise<{ error: string | null }> {
  const invalid = validateUsername(username);
  if (invalid) return { error: invalid };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // Upsert rather than update so a missing profile row still gets a username.
  const { error } = await supabase
    .from("profiles")
    .upsert(
      { id: user.id, email: user.email ?? null, username: username.trim() },
      { onConflict: "id" }
    );

  if (error) {
    if (error.code === "23505") return { error: "That username is already taken." };
    if (error.code === "23514") return { error: USERNAME_RULE };
    return { error: error.message };
  }
  return { error: null };
}

export async function hasPassword(): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("current_user_has_password");
  // Fail closed: if we cannot tell, assume a password exists and ask for it,
  // rather than letting a session holder silently overwrite one.
  if (error) return true;
  return data === true;
}

export async function setPassword(
  password: string,
  currentPassword?: string
): Promise<{ error: string | null }> {
  const invalid = validatePassword(password);
  if (invalid) return { error: invalid };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // Changing an existing password requires proving you know it, so a stolen
  // session cannot be converted into permanent access. First-time set on a
  // Google-only account has no password to confirm.
  if (await hasPassword()) {
    if (!currentPassword) {
      return { error: "Enter your current password to change it." };
    }
    if (!user.email) return { error: "Account has no email address." };

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (reauthError) return { error: "Current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  return { error: error?.message ?? null };
}

export async function signInWithUsername(
  username: string,
  password: string
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { data: email, error: lookupError } = await supabase.rpc("email_for_username", {
    p_username: username.trim(),
  });

  if (lookupError) return { error: lookupError.message };
  // Unknown username and wrong password give the same message, so neither can be probed.
  if (!email) return { error: "Incorrect username or password." };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error ? "Incorrect username or password." : null };
}
