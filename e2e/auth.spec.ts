import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
    const testPassword = "TestPassword123!";

    test("should show landing page", async ({ page }) => {
        await page.goto("/");
        await expect(page.locator("text=ReachMasked")).toBeVisible();
        await expect(page.locator("text=Contact without")).toBeVisible();
    });

    test("should navigate to login page from header", async ({ page }) => {
        await page.goto("/");
        await page.click('a[href="/login"]');
        await expect(page).toHaveURL("/login");
    });

    test("should register new user", async ({ page }) => {
        const testEmail = `test-${Date.now()}@reachmasked.com`;
        await page.goto("/register");

        await page.fill('input[name="email"]', testEmail);
        await page.fill('input[name="password"]', testPassword);
        await page.fill('input[name="confirmPassword"]', testPassword);

        await page.click('button[type="submit"]');

        // Should redirect to dashboard after successful registration
        await expect(page).toHaveURL("/dashboard", { timeout: 10000 });
    });

    test("should protect dashboard from unauthenticated access", async ({ page }) => {
        await page.goto("/dashboard");
        // Should redirect to login
        await expect(page).toHaveURL("/login", { timeout: 5000 });
    });
});
