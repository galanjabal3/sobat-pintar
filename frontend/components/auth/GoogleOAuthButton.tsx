"use client";

import { useGoogleLogin } from "@react-oauth/google";

interface GoogleOAuthButtonProps {
  label: string;
  isLoading: boolean;
  disabled?: boolean;
  onCode: (code: string) => void;
  onError: () => void;
}

export function GoogleOAuthButton({
  label,
  isLoading,
  disabled = false,
  onCode,
  onError,
}: GoogleOAuthButtonProps) {
  const openGoogleLogin = useGoogleLogin({
    flow: "auth-code",
    scope: "openid email profile",
    onSuccess: (response) => onCode(response.code),
    onError,
    onNonOAuthError: onError,
  });

  return (
    <button
      type="button"
      onClick={() => openGoogleLogin()}
      disabled={disabled || isLoading}
      className="relative flex min-h-[56px] w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 text-base font-bold text-neutral-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
      ) : (
        <>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="absolute left-5 h-6 w-6"
          >
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z" />
            <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.4 7.4 0 0 1-11-3.9h-4v3.1A12 12 0 0 0 12 24Z" />
            <path fill="#FBBC05" d="M5.1 14.2A7.2 7.2 0 0 1 4.7 12c0-.8.1-1.5.4-2.2V6.7h-4A12 12 0 0 0 0 12c0 1.9.4 3.7 1.2 5.3l3.9-3.1Z" />
            <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8L20.1 3A12 12 0 0 0 1.2 6.7l3.9 3.1a7.2 7.2 0 0 1 6.9-5Z" />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
