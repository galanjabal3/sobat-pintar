export function getApiErrorMessage(error: unknown, fallback: string): string {
  const apiError = error as {
    message?: unknown;
    response?: {
      data?: {
        error?: unknown;
        message?: unknown;
      };
    };
  };
  const responseData = apiError.response?.data;
  const candidates = [responseData?.error, responseData?.message, apiError.message].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0
  );
  const displayMessage =
    typeof responseData?.message === "string" && responseData.message.trim().length > 0
      ? responseData.message
      : candidates.find((message) => message.trim().length > 0);

  const combinedMessage = candidates.join(" ").toLowerCase();

  if (combinedMessage.includes("email already registered")) {
    return "Email ini sudah terdaftar. Coba masuk atau gunakan email lain.";
  }

  if (
    combinedMessage.includes("invalid email or password") ||
    combinedMessage.includes("email atau password salah")
  ) {
    return "Email atau password belum sesuai. Coba periksa lagi.";
  }

  if (combinedMessage.includes("network error")) {
    return "Tidak bisa terhubung ke server. Coba lagi sebentar.";
  }

  return displayMessage || fallback;
}
