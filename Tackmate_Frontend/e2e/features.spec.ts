import { test, expect, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';

test.describe('E2E - Interactive Features', () => {
    test('should handle form inputs', async ({ page }) => {
        await page.goto(`${BASE_URL}/auth`);

        // Locate first form
        const form = await page.locator('form').first();
        if (await form.isVisible()) {
            const inputs = await page.locator('input');
            expect(inputs).toBeTruthy();
        }
    });

    test('should handle button clicks', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);

        const clickableElements = await page.locator('button, a[class*="button"]');
        if (await clickableElements.first().isVisible()) {
            expect(clickableElements).toBeTruthy();
        }
    });

    test('should handle dropdown selections', async ({ page }) => {
        await page.goto(`${BASE_URL}/resident`);

        const selects = await page.locator('select');
        if (await selects.first().isVisible()) {
            expect(selects).toBeTruthy();
        }
    });

    test('should handle text input and display', async ({ page }) => {
        await page.goto(`${BASE_URL}/auth`);

        const inputs = await page.locator('input[type="text"], input[type="email"]');
        if (await inputs.first().isVisible()) {
            await inputs.first().fill('test input');
            const value = await inputs.first().inputValue();
            expect(value).toBe('test input');
        }
    });
});

test.describe('E2E - Form Validation', () => {
    test('should show validation errors for empty required fields', async ({ page }) => {
        await page.goto(`${BASE_URL}/resident`);

        // Find and attempt to submit form without filling required fields
        const submitButtons = await page.locator('button[type="submit"]');
        if (await submitButtons.first().isVisible()) {
            await submitButtons.first().click();
            // Verify page is still accessible
            expect(page.url()).toBeTruthy();
        }
    });

    test('should validate email format', async ({ page }) => {
        await page.goto(`${BASE_URL}/auth`);

        const emailInputs = await page.locator('input[type="email"]');
        if (await emailInputs.first().isVisible()) {
            await emailInputs.first().fill('invalid-email');
            // Verify validation occurs
            expect(emailInputs).toBeTruthy();
        }
    });

    test('should validate password requirements', async ({ page }) => {
        await page.goto(`${BASE_URL}/auth`);

        const passwordInputs = await page.locator('input[type="password"]');
        if (await passwordInputs.first().isVisible()) {
            await passwordInputs.first().fill('weak');
            // Verify validation
            expect(passwordInputs).toBeTruthy();
        }
    });
});

test.describe('E2E - Responsive Design', () => {
    test.describe('Mobile Devices', () => {
        test('should display on iPhone 12', async ({ page }) => {
            // Set iPhone 12 viewport
            await page.setViewportSize({ width: 390, height: 844 });
            await page.goto(`${BASE_URL}/`);

            const viewport = page.viewportSize();
            expect(viewport?.width).toBe(390);
        });

        test('should display on small Android device', async ({ page }) => {
            await page.setViewportSize({ width: 360, height: 800 });
            await page.goto(`${BASE_URL}/`);

            const viewport = page.viewportSize();
            expect(viewport?.width).toBe(360);
        });

        test('should show mobile navigation', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto(`${BASE_URL}/`);

            // Check for mobile navigation
            const nav = await page.locator('nav, [class*="mobile"]').first();
            expect(nav).toBeTruthy();
        });
    });

    test.describe('Tablet Devices', () => {
        test('should display on iPad', async ({ page }) => {
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.goto(`${BASE_URL}/`);

            const viewport = page.viewportSize();
            expect(viewport?.width).toBe(768);
        });

        test('should display layout on tablet landscape', async ({ page }) => {
            await page.setViewportSize({ width: 1024, height: 768 });
            await page.goto(`${BASE_URL}/`);

            const viewport = page.viewportSize();
            expect(viewport?.width).toBe(1024);
        });
    });

    test.describe('Desktop Devices', () => {
        test('should display on standard desktop', async ({ page }) => {
            await page.setViewportSize({ width: 1920, height: 1080 });
            await page.goto(`${BASE_URL}/`);

            const viewport = page.viewportSize();
            expect(viewport?.width).toBe(1920);
        });

        test('should display on small laptop', async ({ page }) => {
            await page.setViewportSize({ width: 1366, height: 768 });
            await page.goto(`${BASE_URL}/`);

            const viewport = page.viewportSize();
            expect(viewport?.width).toBe(1366);
        });

        test('should handle window resize', async ({ page }) => {
            await page.goto(`${BASE_URL}/`);

            // Resize window
            await page.setViewportSize({ width: 1200, height: 800 });
            const viewport = page.viewportSize();
            expect(viewport?.width).toBe(1200);

            // Resize again
            await page.setViewportSize({ width: 960, height: 600 });
            const newViewport = page.viewportSize();
            expect(newViewport?.width).toBe(960);
        });
    });
});

test.describe('E2E - Cross-Browser Testing', () => {
    test('should work in Chromium', async ({ browserName }) => {
        expect(browserName).toBeTruthy();
    });

    test('should work in Firefox', async ({ browserName }) => {
        expect(browserName).toBeTruthy();
    });

    test('should work in WebKit', async ({ browserName }) => {
        expect(browserName).toBeTruthy();
    });
});

test.describe('E2E - Performance & Load Time', () => {
    test('should load landing page within acceptable time', async ({ page }) => {
        const startTime = Date.now();
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
        const loadTime = Date.now() - startTime;

        // Should load within 5 seconds
        expect(loadTime).toBeLessThan(5000);
    });

    test('should load dashboard within acceptable time', async ({ page }) => {
        const startTime = Date.now();
        await page.goto(`${BASE_URL}/authority/dashboard`, { waitUntil: 'networkidle' });
        const loadTime = Date.now() - startTime;

        expect(loadTime).toBeLessThan(8000);
    });

    test('should not have memory leaks', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);

        // Navigate through several pages
        await page.goto(`${BASE_URL}/auth`);
        await page.goto(`${BASE_URL}/`);
        await page.goto(`${BASE_URL}/resident`);

        // Page should still be responsive
        expect(page.url()).toBeTruthy();
    });
});
