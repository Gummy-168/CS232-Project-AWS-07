"use client";

import { AuthProvider, type AuthProviderProps, useAuth } from "react-oidc-context";
import { useEffect } from "react";
import {
  clearCognitoAccessToken,
  setCognitoAccessToken,
} from "../lib/cognito-auth";

function getCognitoConfig(): { config: AuthProviderProps; enabled: boolean } {
  const authority = process.env.NEXT_PUBLIC_COGNITO_AUTHORITY;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;
  const logoutUri = process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI;

  const enabled = Boolean(authority && clientId && redirectUri && logoutUri);
  return {
    enabled,
    config: {
      authority: authority || "https://example.invalid",
      client_id: clientId || "disabled-client-id",
      redirect_uri: redirectUri || "http://localhost:3000",
      post_logout_redirect_uri: logoutUri || "http://localhost:3000",
      response_type: "code",
      scope: "email openid phone",
      automaticSilentRenew: true,
      loadUserInfo: true,
      onSigninCallback: () => {
        window.history.replaceState({}, document.title, window.location.pathname);
      },
    },
  };
}

function CognitoTokenSync({ enabled }: { enabled: boolean }) {
  const auth = useAuth();

  useEffect(() => {
    if (!enabled) {
      clearCognitoAccessToken();
      return;
    }
    const token = auth.user?.access_token || auth.user?.id_token || null;
    setCognitoAccessToken(token);

    if (!auth.isAuthenticated) {
      clearCognitoAccessToken();
    }
  }, [auth.isAuthenticated, auth.user]);

  return null;
}

export function CognitoAuthProvider({ children }: { children: React.ReactNode }) {
  const { config, enabled } = getCognitoConfig();

  return (
    <AuthProvider {...config}>
      <CognitoTokenSync enabled={enabled} />
      {children}
    </AuthProvider>
  );
}
