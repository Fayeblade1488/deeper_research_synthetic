from playwright.sync_api import sync_playwright, expect

def test_create_project():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Log browser errors to the test output
        page.on("console", lambda m: print(f"BROWSER CONSOLE: {m.type} - {m.text}"))
        page.on("pageerror", lambda e: print(f"BROWSER PAGEERROR: {e.message}"))

        page.goto("http://localhost:5173", wait_until="domcontentloaded")

        # Start creation
        page.get_by_role("button", name="New Project").click()
        page.get_by_label("Project Name").fill("Verification Project")
        page.get_by_label("Framework Type").select_option("PROJECT_DEEPDIVE")

        # Click "Create Project" and assert network success
        with page.expect_response(lambda r: r.url.endswith("/api/projects") and r.request.method == "POST" and r.ok):
            page.get_by_role("button", name="Create Project").click()

        # Ensure modal is gone
        page.wait_for_selector(".modal-overlay", state="detached", timeout=10000)

        # Deterministic assertion
        expect(page.get_by_test_id("project-heading")).to_have_text("Verification Project", timeout=15000)
        
        # Take a screenshot for visual confirmation
        page.screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

if __name__ == "__main__":
    test_create_project()