import { expect, test, type Page } from "@playwright/test";

const user = {
  id: "user-1",
  name: "Galan Jabal",
  email: "galan@example.com",
  level: "SMA",
  points: 15,
  streak: 2,
};

const quotas = [
  { feature: "chat", used: 1, limit: 10, remaining: 9 },
  { feature: "explain", used: 0, limit: 5, remaining: 5 },
  { feature: "summary", used: 1, limit: 3, remaining: 2 },
  { feature: "practice", used: 0, limit: 5, remaining: 5 },
  { feature: "schedule", used: 0, limit: 3, remaining: 3 },
];

async function seedSession(page: Page) {
  await page.addInitScript(({ storedUser }) => {
    localStorage.setItem("auth-storage", JSON.stringify({
      state: {
        user: storedUser,
      },
      version: 0,
    }));
  }, { storedUser: user });
}

async function mockAppShell(page: Page) {
  await page.route("**/api/v1/user/profile", (route) => route.fulfill({
    json: { success: true, data: user },
  }));
  await page.route("**/api/v1/gamification/points", (route) => route.fulfill({
    json: { success: true, data: { points: user.points } },
  }));
  await page.route("**/api/v1/ai/usage", (route) => route.fulfill({
    json: { success: true, data: { date: "2026-06-02", quotas } },
  }));
}

async function mockDashboardData(page: Page) {
  await page.route("**/api/v1/practice/progress", (route) => route.fulfill({
    json: { success: true, data: { count: 2 } },
  }));
  await page.route("**/api/v1/chat/sessions", (route) => route.fulfill({
    json: {
      success: true,
      data: [
        {
          id: "chat-1",
          title: "Inflasi",
          last_message: "Inflasi adalah **kenaikan harga** barang dan jasa secara umum.",
          updated_at: "2026-06-01T08:00:00.000Z",
        },
      ],
    },
  }));
  await page.route("**/api/v1/practice/history", (route) => route.fulfill({
    json: { success: true, data: [] },
  }));
  await page.route("**/api/v1/summary/history", (route) => route.fulfill({
    json: { success: true, data: [] },
  }));
  await page.route("**/api/v1/explain/history", (route) => route.fulfill({
    json: { success: true, data: [] },
  }));
}

test("landing page presents core learning features", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Belajar Bareng Sobi" })).toBeVisible();
  await expect(page.getByText("Foto soal, tanya materi, buat rangkuman, latihan soal, dan susun jadwal belajar dalam satu tempat.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Mulai Belajar/ })).toBeVisible();
  await expect(page.getByText("Jelasin Soal", { exact: true })).toBeVisible();
  await expect(page.getByText("Tanya Sobi", { exact: true })).toBeVisible();
  await expect(page.getByText("Latihan Soal", { exact: true })).toBeVisible();
  await expect(page.getByText("Rangkuman", { exact: true })).toBeVisible();
  await expect(page.getByText("Jadwal Belajar", { exact: true })).toBeVisible();
  await expect(page.getByText("Cocok untuk semua jenjang")).toBeVisible();
});

test("dashboard quota card opens detail modal without leaving dashboard", async ({ page }) => {
  await seedSession(page);
  await mockAppShell(page);
  await mockDashboardData(page);

  await page.goto("/dashboard");

  await expect(page.getByText("Kuota AI", { exact: true })).toBeVisible();
  await expect(page.getByText("Sisa 24/26 hari ini")).toBeVisible();
  await page.getByRole("button", { name: /Kuota AI/ }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Sisa Hari Ini" })).toBeVisible();
  await expect(page.getByText("Chat Sobi")).toBeVisible();
  await expect(page.getByText("9/10")).toBeVisible();
  await page.getByRole("button", { name: "Tutup detail kuota AI" }).click();
  await expect(page.getByRole("heading", { name: "Sisa Hari Ini" })).toBeHidden();
});

test("profile reuses the ai quota detail modal", async ({ page }) => {
  await seedSession(page);
  await mockAppShell(page);

  await page.goto("/profile");

  await expect(page.getByRole("heading", { name: "Galan Jabal" })).toBeVisible();
  await expect(page.getByText("Sisa 24/26")).toBeVisible();
  await page.getByRole("button", { name: /Kuota AI/ }).click();

  await expect(page.getByRole("heading", { name: "Sisa Hari Ini" })).toBeVisible();
  await expect(page.getByText("Rangkum Sobi")).toBeVisible();
  await expect(page.getByText("2/3")).toBeVisible();
});

test("chat history preview strips markdown formatting", async ({ page }) => {
  await seedSession(page);
  await mockAppShell(page);
  await page.route("**/api/v1/chat/sessions", (route) => route.fulfill({
    json: {
      success: true,
      data: [
        {
          id: "chat-1",
          title: "hai",
          last_message: "Inflasi adalah **kenaikan harga** barang dan jasa secara umum.",
          updated_at: "2026-06-01T08:00:00.000Z",
        },
      ],
    },
  }));

  await page.goto("/chat");

  await expect(page.getByText("Inflasi adalah kenaikan harga barang dan jasa secara umum.")).toBeVisible();
  await expect(page.getByText("**kenaikan harga**")).toHaveCount(0);
});

test("feature pages render mocked histories and quota badges", async ({ page }) => {
  await seedSession(page);
  await mockAppShell(page);
  await page.route("**/api/v1/explain/history", (route) => route.fulfill({
    json: {
      success: true,
      data: [{ id: "explain-1", question_text: "Jelaskan **pecahan campuran**", status: "completed", created_at: "2026-06-01T08:00:00.000Z" }],
    },
  }));
  await page.route("**/api/v1/summary/history", (route) => route.fulfill({
    json: {
      success: true,
      data: [{ id: "summary-1", title: "", summary: "## Fotosintesis\nTumbuhan membuat makanan.", status: "completed", created_at: "2026-06-01T08:00:00.000Z" }],
    },
  }));
  await page.route("**/api/v1/schedule", (route) => route.fulfill({
    json: {
      success: true,
      data: [{ id: "schedule-1", exam_date: "2026-06-10", schedule: [{ date: "2026-06-03" }] }],
    },
  }));

  await page.goto("/explain");
  await expect(page.getByText("Jelaskan pecahan campuran")).toBeVisible();
  await expect(page.getByText("**pecahan campuran**")).toHaveCount(0);
  await expect(page.getByText("Sisa hari ini 5/5")).toBeVisible();

  await page.goto("/summary");
  await expect(page.getByText("Fotosintesis")).toBeVisible();
  await expect(page.getByText("Sisa hari ini 2/3")).toBeVisible();

  await page.goto("/schedule");
  await expect(page.getByText("Ujian 10 Juni 2026")).toBeVisible();
  await expect(page.getByText("Sisa hari ini 3/3")).toBeVisible();

  await page.goto("/practice");
  await expect(page.getByRole("heading", { name: "Latihan Soal" })).toBeVisible();
  await expect(page.getByText("Sisa hari ini 5/5")).toBeVisible();
});
