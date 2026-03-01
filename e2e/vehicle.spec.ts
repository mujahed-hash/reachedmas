import { test, expect } from "@playwright/test";

test.describe("Vehicle Management", () => {
    const testPassword = "TestPassword123!";

    test.beforeEach(async ({ page }) => {
        const testEmail = `vehicle-${Date.now()}@reachmasked.com`;
        // Register and login
        await page.goto("/register");
        await page.fill('input[name="email"]', testEmail);
        await page.fill('input[name="password"]', testPassword);
        await page.fill('input[name="confirmPassword"]', testPassword);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL("/dashboard", { timeout: 10000 });
    });

    test("should show empty state when no vehicles", async ({ page }) => {
        await expect(page.locator("text=No vehicles yet")).toBeVisible();
        await expect(page.locator("text=0 Vehicles")).toBeVisible();
    });

    test("should open add vehicle dialog", async ({ page }) => {
        await page.click('button:has-text("Add Vehicle")');
        await expect(page.locator("text=Add New Vehicle")).toBeVisible();
        await expect(page.locator('input[name="model"]')).toBeVisible();
    });

    test("should add a new vehicle", async ({ page }) => {
        await page.click('button:has-text("Add Vehicle")');

        await page.fill('input[name="model"]', "Honda Civic");
        await page.fill('input[name="color"]', "Blue");
        await page.fill('input[name="licensePlate"]', "TEST456");

        // Submit the form using form button selector
        await page.click('form button:has-text("Add Vehicle")');

        // Wait for dialog to close and vehicle to appear
        await expect(page.locator("text=Blue Honda Civic")).toBeVisible({ timeout: 5000 });
        await expect(page.locator("text=1 Vehicles")).toBeVisible();
    });

    test("should navigate to QR code page", async ({ page }) => {
        // First add a vehicle
        await page.click('button:has-text("Add Vehicle")');
        await page.fill('input[name="model"]', "Tesla Model S");
        await page.fill('input[name="color"]', "Red");
        await page.click('form button:has-text("Add Vehicle")');
        await expect(page.locator("text=Red Tesla Model S")).toBeVisible({ timeout: 5000 });

        // Click QR code button
        await page.click('button:has-text("QR Code")');

        // Should be on tag details page
        await expect(page.locator("text=Red Tesla Model S")).toBeVisible();
        await expect(page.locator("text=Download QR Code")).toBeVisible();
        await expect(page.locator("text=NFC Setup Instructions")).toBeVisible();
    });
});
