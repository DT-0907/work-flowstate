import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { supabase } from "@/lib/supabase";
import { signInWithUsername } from "@/lib/api";
import { colors, fontSize, spacing, borderRadius } from "@/lib/theme";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const handleCredentialLogin = async () => {
    if (!username.trim() || !password) return;
    setSigningIn(true);
    setError("");
    const { error } = await signInWithUsername(username, password);
    if (error) setError(error);
    setSigningIn(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const redirectUrl = AuthSession.makeRedirectUri({ scheme: "flowstate" });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error("No auth URL returned");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === "success") {
        const url = new URL(result.url);
        // Handle fragment-based tokens (Supabase implicit flow)
        const params = new URLSearchParams(url.hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        } else {
          // Handle code-based flow
          const code = url.searchParams.get("code");
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
          }
        }
      }
    } catch (err: any) {
      Alert.alert("Login Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero text */}
        <View style={styles.hero}>
          <Text style={styles.heroText}>Work</Text>
          <Text style={styles.subtitle}>Building your workflow</Text>
        </View>

        {/* Bottom section */}
        <View style={styles.bottom}>
          {showCredentials && (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  setError("");
                }}
                placeholder="username"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError("");
                }}
                placeholder="password"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                secureTextEntry
                returnKeyType="go"
                onSubmitEditing={handleCredentialLogin}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (signingIn || !username.trim() || !password) && styles.buttonDisabled,
                ]}
                onPress={handleCredentialLogin}
                disabled={signingIn || !username.trim() || !password}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryButtonText}>
                  {signingIn ? "Signing in..." : "Sign In"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>
              {loading ? "Signing in..." : "Continue with Google"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setShowCredentials((v) => !v);
              setError("");
            }}
            activeOpacity={0.6}
          >
            <Text style={styles.toggleText}>
              {showCredentials ? "Hide username sign in" : "Sign in with username"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.tagline}>
            WORKFLOW, ORGANIZATION, RESULTS, KNOWLEDGE
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.xxl,
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxxl,
  },
  heroText: {
    fontSize: 80,
    fontWeight: "200",
    color: colors.text,
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: fontSize.xl,
    fontWeight: "200",
    color: "rgba(255,255,255,0.7)",
    marginTop: spacing.md,
    letterSpacing: 1,
  },
  bottom: {
    paddingBottom: 48,
    alignItems: "center",
    gap: spacing.lg,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.text,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  form: {
    width: "100%",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    color: colors.text,
    fontSize: fontSize.md,
  },
  error: {
    color: colors.red,
    fontSize: fontSize.xs,
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.text,
  },
  primaryButtonText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.bg,
    letterSpacing: 0.5,
  },
  toggleText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  googleIcon: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
  },
  googleText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: colors.text,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 9,
    fontWeight: "300",
    color: colors.text,
    letterSpacing: 3,
  },
});
