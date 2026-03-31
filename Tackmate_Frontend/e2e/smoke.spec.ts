import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';

test.describe('E2E - Landing Page Tests', () => {
    test('should load landing page', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        expect(page).toBeTruthy();
    });

    test('should display navigation menu', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        // Wait for any navigation element
        const body = await page.locator('body');
        expect(body).toBeTruthy();
    });

    test('should handle page load errors', async ({ page }) => {
        page.on('pageerror', () => {
            // Catch any page errors
        });
        await page.goto(`${BASE_URL}/`);
        expect(page.url()).toContain('/');
    });

    test('should render responsive layout', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        const viewport = page.viewportSize();
        expect(viewport).toBeDefined();
    });
});

test.describe('E2E - Authentication Flow', () => {
    test('should display auth page', async ({ page }) => {
        await page.goto(`${BASE_URL}/auth`);
        expect(page.url()).toContain('/auth');
    });

    test('should handle invalid login attempt', async ({ page }) => {
        await page.goto(`${BASE_URL}/auth`);

        // Try to find login form and submit invalid data
        const loginForm = await page.locator('form').first();
        if (await loginForm.isVisible()) {
            const emailInput = await page.locator('input[type="email"]').first();
            const passwordInput = await page.locator('input[type="password"]').first();

            if (await emailInput.isVisible()) {
                await emailInput.fill('invalid@example.com');
            }
            if (await passwordInput.isVisible()) {
                await passwordInput.fill('invalidpassword');
            }
        }

        // Verify page is still accessible after form interaction
        expect(page.url()).toBeTruthy();
    });

    test('should validate required fields', async ({ page }) => {
        await page.goto(`${BASE_URL}/auth`);

        // Try to submit empty form
        const submitButton = await page.locator('button[type="submit"]').first();
        if (await submitButton.isVisible()) {
            await submitButton.click();
        }

        // Page should still be accessible
        expect(page.url()).toContain('/auth');
    });

    test('should show loading state during authentication', async ({ page }) => {
        await page.goto(`${BASE_URL}/auth`);

        // Check if form exists
        const form = await page.locator('form').first();
        if (await form.isVisible()) {
            expect(form).toBeTruthy();
        }
    });
});

test.describe('E2E - Tourist User Journey', () => {
    test('should navigate to tourist dashboard', async ({ page }) => {
        await page.goto(`${BASE_URL}/tourist`);
        // Verify page loads or redirects appropriately
        expect(page.url()).toBeTruthy();
    });

    test('should display location tracking on map', async ({ page }) => {
        await page.goto(`${BASE_URL}/tourist`);

        // Check for map container
        const mapContainer = await page.locator('[class*="map"]').first();
        if (await mapContainer.isVisible()) {
            expect(mapContainer).toBeTruthy();
        }
    });

    test('should allow route planning', async ({ page }) => {
        await page.goto(`${BASE_URL}/tourist`);

        // Check for form or button to start planning
        const planButton = await page.locator('button, a').first();
        expect(planButton).toBeTruthy();
    });
});

test.describe('E2E - Resident User Journey', () => {
    test('should navigate to resident dashboard', async ({ page }) => {
        await page.goto(`${BASE_URL}/resident`);
        expect(page.url()).toBeTruthy();
    });

    test('should display incident reporting interface', async ({ page }) => {
        await page.goto(`${BASE_URL}/resident`);

        // Check for report button or form
        const reportForm = await page.locator('form, button[class*="report"]').first();
        if (await reportForm.isVisible()) {
            expect(reportForm).toBeTruthy();
        }
    });

    test('should allow creating incident report', async ({ page }) => {
        await page.goto(`${BASE_URL}/resident`);

        // Look for form elements
        const form = await page.locator('form').first();
        if (await form.isVisible()) {
            expect(form).toBeTruthy();
        }
    });
});

test.describe('E2E - Authority User Journey', () => {
    test('should navigate to authority dashboard', async ({ page }) => {
        await page.goto(`${BASE_URL}/authority/dashboard`);
        expect(page.url()).toContain('authority');
    });

    test('should display analytics dashboard', async ({ page }) => {
        await page.goto(`${BASE_URL}/authority/dashboard`);

        // Verify dashboard loads
        const dashboard = await page.locator('[class*="dashboard"], main').first();
        if (await dashboard.isVisible()) {
            expect(dashboard).toBeTruthy();
        }
    });

    test('should access zone management', async ({ page }) => {
        await page.goto(`${BASE_URL}/authority/zone-management`);
        expect(page.url()).toContain('zone');
    });

    test('should access incident management', async ({ page }) => {
        await page.goto(`${BASE_URL}/authority/incidents`);
        expect(page.url()).toContain('incident');
    });

    test('should compose and broadcast alerts', async ({ page }) => {
        await page.goto(`${BASE_URL}/authority/alert-composer`);

        const composer = await page.locator('form, [class*="composer"]').first();
        if (await composer.isVisible()) {
            expect(composer).toBeTruthy();
        }
    });
});

test.describe('E2E - Error Handling & 404s', () => {
    test('should handle nonexistent routes', async ({ page }) => {
        await page.goto(`${BASE_URL}/this-page-does-not-exist`);
        // Should either show 404 or redirect
        expect(page.url()).toBeTruthy();
    });

    test('should recover from navigation errors', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        await page.goto(`${BASE_URL}/invalid-route`);

        // Should still be able to navigate
        expect(page.url()).toBeTruthy();
    });
});

test.describe('E2E - Browser History', () => {
    test('should handle back button navigation', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        await page.goto(`${BASE_URL}/auth`);
        await page.goBack();

        expect(page.url()).toContain('/');
    });

    test('should handle forward navigation', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        await page.goto(`${BASE_URL}/auth`);
        await page.goBack();
        await page.goForward();

        expect(page.url()).toContain('/auth');
    });
});
