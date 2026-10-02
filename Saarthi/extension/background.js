// Saarthi Background Service Worker (Manifest V3)
// Relays messages between Chrome tabs and local FastAPI backend at http://127.0.0.1:8000

const BACKEND_BASE = "http://127.0.0.1:8000";

chrome.runtime.onInstalled.addListener(() => {
    console.log("Saarthi Accessible Job Assistant Extension Installed.");
});

// Helper to communicate with FastAPI server
async function callBackend(endpoint, method = "GET", body = null) {
    const options = {
        method,
        headers: { "Content-Type": "application/json" }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const res = await fetch(`${BACKEND_BASE}${endpoint}`, options);
    return await res.json();
}
