import { expect, test } from "@playwright/test";

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

test.describe("real backend authentication", () => {
  test.skip(!email || !password, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD in .env.local.");

  test("@integration active test account can log in and fetch its profile", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(email!);
    await page.getByPlaceholder("Password").fill(password!);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();

    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/profile");
    await expect(page.getByText(email!, { exact: true })).toBeVisible();
  });
});
