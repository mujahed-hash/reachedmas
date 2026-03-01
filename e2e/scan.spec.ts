import { test, expect } from "@playwright/test";

test.describe("Scan Page", () => {
    test("should show tag not found for invalid code", async ({ page }) => {
        await page.goto("/t/INVALID123");
        await expect(page.locator("text=Tag Not Found")).toBeVisible();
        await expect(page.locator("text=invalid or has been deactivated")).toBeVisible();
    });

    test("should show verified vehicle for valid tag", async ({ page }) => {
        // First, create a user and vehicle to get a valid tag code
        const testEmail = `scan-${Date.now()}@reachmasked.com`;
        const testPassword = "TestPassword123!";

        // Register
        await page.goto("/register");
        await page.fill('input[name="email"]', testEmail);
        await page.fill('input[name="password"]', testPassword);
        await page.fill('input[name="confirmPassword"]', testPassword);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

        // Add vehicle
        await page.click('button:has-text("Add Vehicle")');
        await page.fill('input[name="model"]', "Ford F-150");
        await page.fill('input[name="color"]', "Black");
        await page.click('form button:has-text("Add Vehicle")');
        await expect(page.locator("text=Black Ford F-150")).toBeVisible({ timeout: 5000 });

        // Get the tag code from the vehicle card
        const tagCodeElement = await page.locator("text=Tag:").first();
        const tagText = await tagCodeElement.textContent();
        const tagCode = tagText?.replace("Tag: ", "").trim();

        expect(tagCode).toBeTruthy();

        // Visit the scan page
        await page.goto(`/t/${tagCode}`);

        // Should show verified vehicle
        await expect(page.locator("text=Verified ReachMasked Vehicle")).toBeVisible();
        await expect(page.locator("text=Black Ford F-150")).toBeVisible();
    });

    test("should show contact action buttons", async ({ page }) => {
        // Create user and vehicle
        const testEmail = `contact-${Date.now()}@reachmasked.com`;
        const testPassword = "TestPassword123!";

        await page.goto("/register");
        await page.fill('input[name="email"]', testEmail);
        await page.fill('input[name="password"]', testPassword);
        await page.fill('input[name="confirmPassword"]', testPassword);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL("/dashboard", { timeout: 10000 });

        await page.click('button:has-text("Add Vehicle")');
        await page.fill('input[name="model"]', "Chevrolet Malibu");
        await page.fill('input[name="color"]', "White");
        await page.click('form button:has-text("Add Vehicle")');
        await expect(page.locator("text=White Chevrolet Malibu")).toBeVisible({ timeout: 5000 });

        const tagCodeElement = await page.locator("text=Tag:").first();
        const tagText = await tagCodeElement.textContent();
        const tagCode = tagText?.replace("Tag: ", "").trim();

        await page.goto(`/t/${tagCode}`);

        // Check contact action buttons (match actual UI labels)
        await expect(page.locator("text=Blocking Driveway")).toBeVisible();
        await expect(page.locator("text=Parking Meter")).toBeVisible();
        await expect(page.locator("text=Lights On")).toBeVisible();
        await expect(page.locator("text=Emergency")).toBeVisible();
    });
});
