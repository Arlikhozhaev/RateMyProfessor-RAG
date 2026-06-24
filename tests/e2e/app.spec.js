import { expect, test } from "@playwright/test";

test("home page loads at the top without auto-scroll", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Find the professor who fits your next step.")).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test("chat returns a keyword-backed response without API keys", async ({ page }) => {
  await page.goto("/");

  await page.getByPlaceholder(/Ask about professors/).fill("software engineering");
  await page.getByRole("button", { name: "Send" }).click();

  const chatLog = page.getByRole("log", { name: "Chat messages" });
  await expect(chatLog).toContainText(/software|engineering|Nguyen|professor/i, {
    timeout: 30_000,
  });
});

test("professor profile page renders from slug", async ({ page }) => {
  await page.goto("/professor/dr-emily-carter");

  await expect(page.getByRole("heading", { name: "Dr. Emily Carter" })).toBeVisible();
  await expect(page.getByText("Introduction to Computer Science")).toBeVisible();
  await expect(page.getByRole("link", { name: /Ask AI about this professor/i })).toBeVisible();
});

test("unknown professor slug shows not found state", async ({ page }) => {
  await page.goto("/professor/does-not-exist");
  await expect(page.getByText("Professor not found")).toBeVisible();
});
