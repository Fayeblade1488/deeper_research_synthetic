October052025 latest UPTODATE

Key changes include:
- Hardening the backend project creation endpoint to prevent errors from malformed requests.
- Enhancing the frontend `App.jsx` component with functional state setters to prevent stale state, improved error handling for fetch requests, and a UI error banner to make failures visible.
- Adding a `data-testid` to the project heading in `Workspace.jsx` to provide a stable selector for tests.
- Replacing the previous verification script with a new, more deterministic Playwright script that waits for network responses and uses the stable `data-testid`.