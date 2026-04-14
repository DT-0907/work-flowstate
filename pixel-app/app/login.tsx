import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { supabase } from "@/lib/supabase";
import { colors, fontSize, spacing } from "@/lib/theme";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

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
    <View style={styles.container}>
      {/* Hero text */}
      <View style={styles.hero}>
        <Text style={styles.heroText}>Work</Text>
        <Text style={styles.subtitle}>Building your workflow</Text>
      </View>

      {/* Bottom section */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.googleButton, loading && styles.googleButtonDisabled]}
          onPress={handleGoogleLogin}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleText}>
            {loading ? "Signing in..." : "Continue with Google"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.tagline}>
          WORKFLOW, ORGANIZATION, RESULTS, KNOWLEDGE
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "space-between",
    paddingHorizontal: spacing.xxl,
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  googleButtonDisabled: {
    opacity: 0.5,
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
