/**
 * Landing Page E2E Tests
 * Tests the unauthenticated landing page experience
 */
import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
    test.beforeEach(async ({ page }) => {
        // Clear any stored auth state
        await page.context().clearCookies();
        await page.goto('/');
    });

    test('should display landing page for unauthenticated users', async ({ page }) => {
        // Should show landing page heading
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        // Should have sign in option
        await expect(page.getByRole('button', { name: /sign in|get started/i })).toBeVisible();
    });

    test('should have all required meta elements', async ({ page }) => {
        // Check title
        await expect(page).toHaveTitle(/Zano/i);

        // Check viewport meta exists
        const viewport = await page.locator('meta[name="viewport"]');
        await expect(viewport).toHaveCount(1);
    });

    test('should be responsive on mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        // Landing page heading should still be visible
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        // Sign in button should be accessible
        await expect(page.getByRole('button', { name: /sign in|get started/i })).toBeVisible();
    });

    test('should load without JavaScript errors', async ({ page }) => {
        const errors: string[] = [];

        page.on('pageerror', (error) => {
            errors.push(error.message);
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Filter out expected errors (e.g., Firebase auth errors when not configured)
        const criticalErrors = errors.filter(e =>
            !e.includes('Firebase') &&
            !e.includes('auth') &&
            !e.includes('network')
        );

        expect(criticalErrors).toHaveLength(0);
    });
});
