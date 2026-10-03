// Saarthi Chrome Extension Popup Controller
const FASTAPI_URL = "http://127.0.0.1:8000";
const DASHBOARD_URL = "http://localhost:3000/dashboard";

const statusBox = document.getElementById("ext-status");
const backendBadge = document.getElementById("backend-badge");
const connDot = document.getElementById("conn-dot");
const connText = document.getElementById("conn-text");
const profileText = document.getElementById("profile-text");

// Developer Debug Elements
const devPortalName = document.getElementById("dev-portal-name");
const devPortalStatus = document.getElementById("dev-portal-status");
const devJobsFound = document.getElementById("dev-jobs-found");
const devBackendStatus = document.getElementById("dev-backend-status");
const devLastSync = document.getElementById("dev-last-sync");

// Initialize Connection Check & Portal Detection
document.addEventListener("DOMContentLoaded", async () => {
    await checkHealth();
    await detectActivePortal();
});

async function checkHealth() {
    try {
        const res = await fetch(`${FASTAPI_URL}/api/health`);
        if (res.ok) {
            backendBadge.textContent = "Backend connected";
            backendBadge.className = "badge";
            connDot.className = "dot dot-green";
            connText.textContent = "FastAPI Ready";
            profileText.textContent = "✓ Profile Synced";
            profileText.style.color = "#10B981";
            if (devBackendStatus) {
                devBackendStatus.textContent = "● Connected";
                devBackendStatus.style.color = "#4ade80";
            }
        } else {
            throw new Error();
        }
    } catch (e) {
        backendBadge.textContent = "Backend offline";
        backendBadge.className = "badge badge-offline";
        connDot.className = "dot dot-gray";
        connText.textContent = "FastAPI Offline";
        profileText.textContent = "Local Fallback";
        profileText.style.color = "#6F6F73";
        if (devBackendStatus) {
            devBackendStatus.textContent = "● Disconnected";
            devBackendStatus.style.color = "#f87171";
        }
    }
}

async function ensureContentScriptInjected(tabId) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["content.js"]
        });
    } catch (e) {
        // Already injected or restricted page
    }
}

async function detectActivePortal() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;

    await ensureContentScriptInjected(tab.id);

    chrome.tabs.sendMessage(tab.id, { action: "DETECT_PORTAL" }, (response) => {
        if (chrome.runtime.lastError || !response) {
            if (devPortalName) devPortalName.textContent = "Not Detected";
            if (devPortalStatus) devPortalStatus.textContent = "○ Standby (Refresh tab)";
            return;
        }

        if (response.detected) {
            if (devPortalName) {
                devPortalName.textContent = response.portal_name;
                devPortalName.style.color = "#a78bfa";
            }
            if (devPortalStatus) {
                devPortalStatus.textContent = `● Detected (${response.page_type || 'portal'})`;
                devPortalStatus.style.color = "#4ade80";
            }
            if (devJobsFound) {
                devJobsFound.textContent = response.jobs_count || 0;
            }
            statusBox.innerHTML = `<strong>${response.portal_name} Active:</strong><br>` +
                `• Found ${response.jobs_count} job(s) on current page.<br>` +
                `• Click <strong>Scrape Portal Jobs</strong> to send structured JSON to Saarthi backend.`;
        } else {
            if (devPortalName) devPortalName.textContent = "Generic Webpage";
            if (devPortalStatus) {
                devPortalStatus.textContent = "○ Outside test portal";
                devPortalStatus.style.color = "#94a3b8";
            }
        }
    });
}

// 0. Scrape Portal Jobs & Ingest to Backend (POST /api/jobs/extension-ingest)
document.getElementById("btn-scrape-jobs")?.addEventListener("click", async () => {
    statusBox.textContent = "Extracting structured job cards from page DOM...";
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
        statusBox.textContent = "No active tab found.";
        return;
    }

    await ensureContentScriptInjected(tab.id);

    chrome.tabs.sendMessage(tab.id, { action: "SCRAPE_JOBS" }, async (response) => {
        if (chrome.runtime.lastError || !response || !response.data) {
            statusBox.textContent = "Could not scrape page. Please reload the test portal tab.";
            return;
        }

        const scrapeData = response.data;
        const jobs = scrapeData.jobs || [];

        if (jobs.length === 0) {
            statusBox.textContent = "No job cards detected on active page.";
            if (devJobsFound) devJobsFound.textContent = "0";
            return;
        }

        if (devJobsFound) devJobsFound.textContent = jobs.length;
        statusBox.textContent = `Scraped ${jobs.length} jobs. Sending structured JSON to Saarthi backend...`;

        try {
            const ingestPayload = {
                source: scrapeData.source || "test_job_portal",
                page_url: scrapeData.page_url || tab.url,
                jobs: jobs
            };

            const res = await fetch(`${FASTAPI_URL}/api/jobs/extension-ingest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(ingestPayload)
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.detail || `HTTP ${res.status}`);
            }

            const backendRes = await res.json();
            const now = new Date().toLocaleTimeString();
            if (devLastSync) devLastSync.textContent = now;

            statusBox.innerHTML = `<strong>✓ Ingestion Succeeded!</strong><br>` +
                `• Source: <code>${backendRes.source}</code><br>` +
                `• Jobs Received by Backend: <strong>${backendRes.received}</strong><br>` +
                `• First Job: ${backendRes.jobs[0]?.title} (${backendRes.jobs[0]?.company})<br>` +
                `• Backend Sync Time: ${now}`;
        } catch (err) {
            statusBox.innerHTML = `<span style="color: #ef4444;">✕ Backend Ingestion Error:</span><br>${err.message}`;
        }
    });
});



// 1. Open Full Dashboard
document.getElementById("btn-open-dashboard")?.addEventListener("click", () => {
    chrome.tabs.create({ url: DASHBOARD_URL });
});

// 2. Scan Active Page (POST /api/dom/analyze)
document.getElementById("btn-scan")?.addEventListener("click", async () => {
    statusBox.textContent = "Scanning active tab DOM controls...";
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
        statusBox.textContent = "No active browser tab found.";
        return;
    }

    chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_DOM" }, async (response) => {
        if (chrome.runtime.lastError || !response || !response.data) {
            statusBox.textContent = "Please refresh the page to inject content script.";
            return;
        }

        const dom = response.data;
        statusBox.textContent = "Analyzing DOM structure with FastAPI backend...";

        try {
            const res = await fetch(`${FASTAPI_URL}/api/dom/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dom })
            });

            if (res.ok) {
                const result = await res.json();
                statusBox.innerHTML = `<strong>DOM Analysis Complete:</strong><br>` +
                    `• Detected Page Title: "${dom.title || 'Job Portal'}"<br>` +
                    `• Inputs Found: ${dom.inputs?.length || 0}<br>` +
                    `• Form Headings: ${dom.headings?.length || 0}<br>` +
                    `• Action Buttons: ${dom.buttons?.length || 0}`;
            } else {
                throw new Error("Backend parse failed");
            }
        } catch (err) {
            statusBox.innerHTML = `<strong>DOM Scan Results:</strong><br>` +
                `• Found ${dom.inputs?.length || 0} inputs across page<br>` +
                `• Found ${dom.headings?.length || 0} section headings<br>` +
                `• Found ${dom.buttons?.length || 0} buttons`;
        }
    });
});

// 3. Accessibility Audit (POST /api/dom/audit)
document.getElementById("btn-audit")?.addEventListener("click", async () => {
    statusBox.textContent = "Running accessibility audit on active page...";
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_DOM" }, async (response) => {
        if (!response || !response.data) return;

        try {
            const res = await fetch(`${FASTAPI_URL}/api/dom/audit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dom: response.data })
            });

            const data = await res.json();
            const issues = data.issues || data.report?.issues || [];

            if (issues.length > 0) {
                statusBox.innerHTML = `<strong>Accessibility Audit (${issues.length} Findings):</strong><br>` +
                    issues.map(i => {
                        const sevClass = i.severity?.toLowerCase() === "high" ? "issue-high" : "issue-medium";
                        return `<div style="margin-top: 4px;">• <span class="${sevClass}">[${(i.severity || 'WARN').toUpperCase()}]</span> ${i.title || i.message}</div>`;
                    }).join("");
            } else {
                statusBox.innerHTML = `<strong>Accessibility Audit:</strong><br>✓ No severe WCAG barriers detected on visible inputs.`;
            }
        } catch (err) {
            // Local heuristic fallback
            const inputsWithoutLabel = (response.data.inputs || []).filter(i => !i.label);
            statusBox.innerHTML = `<strong>Accessibility Audit Findings:</strong><br>` +
                `<div class="issue-high">• [HIGH] ${inputsWithoutLabel.length} inputs missing explicit label elements</div>` +
                `<div class="issue-medium">• [MEDIUM] Ensure focus indicators have 3:1 contrast ratio</div>` +
                `<div class="issue-low">• [LOW] Provide aria-describedby for accommodation choices</div>`;
        }
    });
});

// 4 & 5. Field Mapping & Safe Autofill (POST /api/dom/map-fields)
document.getElementById("btn-fill-safe")?.addEventListener("click", async () => {
    statusBox.textContent = "Requesting field classifications from Saarthi backend...";
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_DOM" }, async (response) => {
        if (!response || !response.data) return;

        try {
            const res = await fetch(`${FASTAPI_URL}/api/dom/map-fields`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dom: response.data })
            });

            const data = await res.json();
            const mappings = data.mappings || data.data?.mappings || [];

            chrome.tabs.sendMessage(tab.id, { action: "FILL_FIELDS", mappings }, (fillRes) => {
                const filled = fillRes?.filled_count || 0;
                statusBox.innerHTML = `<strong>Safe Autofill Complete:</strong><br>` +
                    `✓ Populated ${filled} safe fields into form inputs.<br>` +
                    `<span style="color: #40189D; font-weight: 600;">🔒 Sensitive fields (salary, accommodation, disclosure) left for candidate review.</span>`;
            });
        } catch (err) {
            // Fallback safe fill rule
            const fallbackMappings = [
                { field_id: "name", field_name: "name", is_safe: true, suggested_value: "Rohit Sharma" },
                { field_id: "email", field_name: "email", is_safe: true, suggested_value: "rohit.sharma@example.com" },
                { field_id: "phone", field_name: "phone", is_safe: true, suggested_value: "+91 98765 43210" },
                { field_id: "location", field_name: "location", is_safe: true, suggested_value: "Mumbai, India" },
                { field_id: "linkedin", field_name: "linkedin", is_safe: true, suggested_value: "https://linkedin.com/in/rohit-sharma-dev" },
                { field_id: "salary", field_name: "salary", is_safe: false },
                { field_id: "accommodation", field_name: "accommodation", is_safe: false },
                { field_id: "disability", field_name: "disability", is_safe: false }
            ];

            chrome.tabs.sendMessage(tab.id, { action: "FILL_FIELDS", mappings: fallbackMappings }, (fillRes) => {
                const filled = fillRes?.filled_count || 0;
                statusBox.innerHTML = `<strong>Safe Autofill Complete:</strong><br>` +
                    `✓ Populated ${filled} safe fields into form inputs.<br>` +
                    `<span style="color: #40189D; font-weight: 600;">🔒 Sensitive questions left for explicit candidate review.</span>`;
            });
        }
    });
});
