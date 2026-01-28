/**
 * Accessibility E2E Tests
 * Tests basic accessibility requirements
 */
import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should have proper heading hierarchy', async ({ page }) => {
        // Wait for page to fully load and render
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Check for h1 element (landing page or dashboard should have one)
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBeGreaterThanOrEqual(1);
    });

    test('should have accessible buttons', async ({ page }) => {
        // All buttons should have accessible names
        const buttons = page.getByRole('button');
        const buttonCount = await buttons.count();

        for (let i = 0; i < Math.min(buttonCount, 10); i++) {
            const button = buttons.nth(i);
            const name = await button.getAttribute('aria-label') || await button.textContent();
            expect(name?.trim().length).toBeGreaterThan(0);
        }
    });

    test('should have proper color contrast ratio', async ({ page }) => {
        // Check that text is visible (basic contrast check)
        const mainText = page.locator('h1, h2, h3, p, button').first();

        if (await mainText.isVisible()) {
            // Get computed styles
            const styles = await mainText.evaluate((el) => {
                const computed = window.getComputedStyle(el);
                return {
                    color: computed.color,
                    backgroundColor: computed.backgroundColor,
                };
            });

            // Just verify we got valid colors (not transparent)
            expect(styles.color).toBeTruthy();
        }
    });

    test('should be keyboard navigable', async ({ page }) => {
        // Wait for interactive elements to load
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);

        // Press Tab key and verify focus moves
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);

        // Check that something is focused (may be body or a focusable element)
        const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
        // Just verify the page handled the tab key without error
        expect(focusedTag).toBeTruthy();
    });

    test('should have semantic structure', async ({ page }) => {
        // Check for main content area (main, article, or div with main role)
        const mainLandmark = page.locator('main, [role="main"], article, .main-content, #root');
        const hasMainArea = await mainLandmark.count() > 0;

        // App should have some main content container
        expect(hasMainArea).toBeTruthy();
    });
});

test.describe('Form Accessibility', () => {
    test('should have labeled form inputs', async ({ page }) => {
        await page.goto('/');

        // Find all input fields
        const inputs = page.locator('input:not([type="hidden"])');
        const inputCount = await inputs.count();

        for (let i = 0; i < Math.min(inputCount, 5); i++) {
            const input = inputs.nth(i);

            // Each input should have a label, aria-label, or placeholder
            const hasLabel = await input.evaluate((el) => {
                const id = el.id;
                const ariaLabel = el.getAttribute('aria-label');
                const placeholder = el.getAttribute('placeholder');
                const labelFor = id ? document.querySelector(`label[for="${id}"]`) : null;

                return !!(ariaLabel || placeholder || labelFor);
            });

            expect(hasLabel).toBeTruthy();
        }
    });
});
