import { expect, test, type Page } from "@playwright/test";

const user = {
  id: "user-1",
  name: "Galan Jabal",
  email: "galan@example.com",
  level: "SMA",
  points: 0,
  streak: 0,
};

async function seedSession(page: Page) {
  await page.addInitScript(({ storedUser }) => {
    if (sessionStorage.getItem("test-session-seeded")) return;
    sessionStorage.setItem("test-session-seeded", "true");
    localStorage.setItem("auth-storage", JSON.stringify({
      state: {
        user: storedUser,
      },
      version: 0,
    }));
  }, { storedUser: user });
  await page.context().addCookies([
    {
      name: "sobat_access_token",
      value: "expired-access-token",
      domain: "localhost",
      path: "/api/v1",
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: "sobat_refresh_token",
      value: "refresh-token",
      domain: "localhost",
      path: "/api/v1/auth",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

async function mockDashboardRequests(page: Page, onProfileRequest?: (cookie?: string) => void) {
  await page.route("**/api/v1/user/profile", (route) => {
    onProfileRequest?.(route.request().headers().cookie);
    return route.fulfill({ json: { success: true, data: user } });
  });
  await page.route("**/api/v1/practice/progress", (route) => route.fulfill({
    json: { success: true, data: { count: 0 } },
  }));
  for (const endpoint of ["chat/sessions", "practice/history", "summary/history", "explain/history"]) {
    await page.route(`**/api/v1/${endpoint}`, (route) => route.fulfill({
      json: { success: true, data: [] },
    }));
  }
}

test("login page keeps Google button full width", async ({ page }) => {
  await page.goto("/login");

  const signInButton = page.getByRole("button", { name: "Masuk", exact: true });
  const googleButton = page.getByRole("button", { name: "Login dengan Google" });

  await expect(signInButton).toBeVisible();
  await expect(googleButton).toBeVisible();

  const signInBox = await signInButton.boundingBox();
  const googleBox = await googleButton.boundingBox();
  expect(signInBox).not.toBeNull();
  expect(googleBox).not.toBeNull();
  expect(Math.abs(googleBox!.width - signInBox!.width)).toBeLessThanOrEqual(2);
});

test("email login stores session and opens dashboard", async ({ page }) => {
  let profileCookie = "";
  await mockDashboardRequests(page, (cookie) => {
    profileCookie = cookie || "";
  });
  await page.route("**/api/v1/auth/login", (route) => route.fulfill({
    headers: {
      "Set-Cookie": "sobat_access_token=access-token; Path=/api/v1; HttpOnly; SameSite=Lax",
    },
    json: {
      success: true,
      data: {
        user,
      },
    },
  }));

  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("galan@example.com");
  await page.getByPlaceholder("Password").fill("password123");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect.poll(() => profileCookie).toContain("sobat_access_token=access-token");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("access_token"))).toBeNull();
});

test("email login displays an invalid credential message", async ({ page }) => {
  await page.route("**/api/v1/auth/login", (route) => route.fulfill({
    status: 401,
    json: { success: false, message: "Email atau password salah" },
  }));

  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("galan@example.com");
  await page.getByPlaceholder("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();

  await expect(page.getByText("Email atau password belum sesuai. Coba periksa lagi.")).toBeVisible();
});

test("registration proceeds to email verification", async ({ page }) => {
  await page.route("**/api/v1/auth/register", (route) => route.fulfill({
    status: 201,
    json: {
      success: true,
      data: { user, verification_sent: true, verification_needed: true },
    },
  }));

  await page.goto("/register");
  await page.getByPlaceholder("Nama Lengkap").fill("Galan Jabal");
  await page.getByPlaceholder("Email").fill("galan@example.com");
  await page.getByPlaceholder("Password", { exact: true }).fill("password123");
  await page.getByPlaceholder("Konfirmasi Password").fill("password123");
  await page.getByRole("button", { name: "SMA", exact: true }).click();
  await page.getByRole("button", { name: "Daftar Sekarang" }).click();

  await expect(page).toHaveURL(/\/verify-email\?email=galan%40example\.com&sent=1$/);
  await expect(page.getByRole("heading", { name: "Verifikasi Email" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Kirim lagi dalam/ })).toBeDisabled();
});

test("registration shows an existing email message", async ({ page }) => {
  await page.route("**/api/v1/auth/register", (route) => route.fulfill({
    status: 409,
    json: { success: false, message: "Email sudah terdaftar." },
  }));

  await page.goto("/register");
  await page.getByPlaceholder("Nama Lengkap").fill("Galan Jabal");
  await page.getByPlaceholder("Email").fill("galan@example.com");
  await page.getByPlaceholder("Password", { exact: true }).fill("password123");
  await page.getByPlaceholder("Konfirmasi Password").fill("password123");
  await page.getByRole("button", { name: "Daftar Sekarang" }).click();

  await expect(page.getByText("Email sudah terdaftar.")).toBeVisible();
});

test("verification link activates an email address", async ({ page }) => {
  await page.route("**/api/v1/auth/verify-email", (route) => route.fulfill({
    json: { success: true, data: user },
  }));

  await page.goto("/verify-email?token=valid-token");

  await expect(page.getByRole("heading", { name: "Email Terverifikasi" })).toBeVisible();
  await expect(page.getByText("Kamu sudah bisa login sekarang.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Masuk Sekarang" })).toBeVisible();
});

test("expired verification link shows a recoverable error", async ({ page }) => {
  await page.route("**/api/v1/auth/verify-email", (route) => route.fulfill({
    status: 400,
    json: { success: false, message: "Link verifikasi tidak valid atau sudah kedaluwarsa" },
  }));

  await page.goto("/verify-email?token=expired-token");

  await expect(page.getByRole("heading", { name: "Link Verifikasi Bermasalah" })).toBeVisible();
  await expect(page.getByText("Link verifikasi tidak valid atau sudah kedaluwarsa. Kirim ulang email verifikasi.")).toBeVisible();
});

test("verification email can be resent", async ({ page }) => {
  await page.route("**/api/v1/auth/resend-verification", (route) => route.fulfill({
    json: { success: true, data: { accepted: true } },
  }));

  await page.goto("/verify-email?email=galan%40example.com");
  await page.getByRole("button", { name: "Kirim Ulang Email" }).click();

  await expect(page.getByText("Permintaan berhasil. Jika email terdaftar dan belum aktif, link verifikasi akan dikirim.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Kirim lagi dalam/ })).toBeDisabled();
});

test("protected dashboard redirects visitors to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("expired access token is refreshed for a protected request", async ({ page }) => {
  await seedSession(page);
  let renewedProfileRequests = 0;

  await page.route("**/api/v1/user/profile", async (route) => {
    if (!route.request().headers().cookie?.includes("sobat_access_token=renewed-access-token")) {
      await route.fulfill({ status: 401, json: { success: false, message: "Sesi tidak valid" } });
      return;
    }
    renewedProfileRequests += 1;
    await route.fulfill({ json: { success: true, data: user } });
  });
  await page.route("**/api/v1/auth/refresh", (route) => route.fulfill({
    headers: {
      "Set-Cookie": "sobat_access_token=renewed-access-token; Path=/api/v1; HttpOnly; SameSite=Lax",
    },
    json: { success: true, data: { refreshed: true } },
  }));
  await page.route("**/api/v1/gamification/points", (route) => route.fulfill({
    json: { success: true, data: { points: 12 } },
  }));

  await page.goto("/profile");

  await expect(page.getByRole("heading", { name: "Galan Jabal" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("access_token"))).toBeNull();
  await expect.poll(() => renewedProfileRequests).toBeGreaterThan(0);
});

test("failed refresh clears session and returns to login", async ({ page }) => {
  await seedSession(page);
  await page.route("**/api/v1/user/profile", (route) => route.fulfill({
    status: 401,
    json: { success: false, message: "Sesi tidak valid" },
  }));
  await page.route("**/api/v1/auth/refresh", (route) => route.fulfill({
    status: 401,
    json: { success: false, message: "Sesi telah berakhir" },
  }));
  await page.route("**/api/v1/auth/logout", (route) => route.fulfill({
    json: { success: true, data: { logged_out: true } },
  }));
  await page.route("**/api/v1/gamification/points", (route) => route.fulfill({
    json: { success: true, data: { points: 0 } },
  }));

  await page.goto("/profile");

  await expect(page).toHaveURL(/\/login$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("auth-storage") || "")).not.toContain("Galan Jabal");
});

test("shared explanation loads through its private token", async ({ page }) => {
  await page.route("**/api/v1/public/explain/token-valid", (route) => route.fulfill({
    json: {
      success: true,
      data: {
        question_text: "Berapa hasil 2 + 2?",
        answer: "Hasilnya adalah **4**.",
      },
    },
  }));

  await page.goto("/share/token-valid");

  await expect(page.getByRole("heading", { name: "Penjelasan Sobi" })).toBeVisible();
  await expect(page.getByText("Berapa hasil 2 + 2?")).toBeVisible();
  await expect(page.getByText("Hasilnya adalah")).toBeVisible();
});

test("shared summary loads through its private token", async ({ page }) => {
  await page.route("**/api/v1/public/explain/summary-token", (route) => route.fulfill({
    status: 404,
    json: { success: false, message: "Tidak ditemukan" },
  }));
  await page.route("**/api/v1/public/summary/summary-token", (route) => route.fulfill({
    json: {
      success: true,
      data: { summary: "## Fotosintesis\nTumbuhan membuat makanan dengan bantuan cahaya." },
    },
  }));

  await page.goto("/share/summary-token");

  await expect(page.getByRole("heading", { name: "Rangkuman Sobi" })).toBeVisible();
  await expect(page.getByText("Fotosintesis")).toBeVisible();
  await expect(page.getByText("Tumbuhan membuat makanan dengan bantuan cahaya.")).toBeVisible();
});

test("invalid share token shows not found state", async ({ page }) => {
  await page.route("**/api/v1/public/explain/token-invalid", (route) => route.fulfill({
    status: 404,
    json: { success: false, message: "Tidak ditemukan" },
  }));
  await page.route("**/api/v1/public/summary/token-invalid", (route) => route.fulfill({
    status: 404,
    json: { success: false, message: "Tidak ditemukan" },
  }));

  await page.goto("/share/token-invalid");

  await expect(page.getByText("Konten tidak ditemukan.")).toBeVisible();
});
