// Popup interaction logic
const BACKEND_URL = "http://127.0.0.1:8000";

const statusBox = document.getElementById("ext-status");

document.getElementById("btn-open-dashboard")?.addEventListener("click", () => {
    chrome.tabs.create({ url: BACKEND_URL });
});

document.getElementById("btn-scan")?.addEventListener("click", async () => {
    statusBox.textContent = "Scanning active tab DOM...";
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
        statusBox.textContent = "No active tab found.";
        return;
    }

    chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_DOM" }, async (response) => {
        if (chrome.runtime.lastError || !response) {
            statusBox.textContent = "Please refresh the page and ensure content script is injected.";
            return;
        }
        const dom = response.data;
        statusBox.textContent = `Found ${dom.inputs.length} inputs, ${dom.headings.length} headings, ${dom.buttons.length} buttons on page.`;
    });
});

document.getElementById("btn-audit")?.addEventListener("click", async () => {
    statusBox.textContent = "Running heuristic accessibility audit on page...";
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_DOM" }, async (response) => {
        if (!response || !response.data) return;
        const res = await fetch(`${BACKEND_URL}/api/dom/audit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ html: response.data.raw_html })
        });
        const data = await res.json();
        const r = data.report;
        statusBox.innerHTML = `<strong>Issues Found: ${r.summary.total_issues}</strong><br>` +
            r.issues.map(i => `• [${i.severity.toUpperCase()}] ${i.message}`).join("<br>");
    });
});

document.getElementById("btn-fill-safe")?.addEventListener("click", async () => {
    statusBox.textContent = "Retrieving safe mappings from backend...";
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_DOM" }, async (response) => {
        if (!response || !response.data) return;
        const res = await fetch(`${BACKEND_URL}/api/dom/map-fields`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inputs: response.data.inputs })
        });
        const data = await res.json();
        const mappings = data.data.mappings;

        chrome.tabs.sendMessage(tab.id, { action: "FILL_FIELDS", mappings }, (fillRes) => {
            statusBox.textContent = `Populated ${fillRes?.filled_count || 0} safe fields into form inputs. Ambiguous fields left for user review.`;
        });
    });
});
