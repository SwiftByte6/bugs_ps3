// Saarthi Content Script - Injected into active job portals
// Extracts DOM elements and passes them to background / popup without storing credentials.

function isTestJobPortal() {
    const url = window.location.href;
    return url.includes("localhost:3000/test-jobs") || url.includes("127.0.0.1:3000/test-jobs");
}

function scrapeJobCards() {
    const jobs = [];
    const currentUrl = window.location.href;
    const nowIso = new Date().toISOString();

    // Case 1: Job Listing Page (cards with .job-card)
    const cards = document.querySelectorAll(".job-card");
    if (cards.length > 0) {
        cards.forEach((card, index) => {
            const jobId = card.getAttribute("data-job-id") || `job-${String(index + 1).padStart(3, "0")}`;
            const titleEl = card.querySelector(".job-title");
            const companyEl = card.querySelector(".company");
            const locationEl = card.querySelector(".location");
            const empTypeEl = card.querySelector(".employment-type");
            const expEl = card.querySelector(".experience");
            const descEl = card.querySelector(".description");
            const linkEl = card.querySelector(".job-link");
            const skillEls = card.querySelectorAll(".skills .skill");

            const skills = Array.from(skillEls).map(s => s.innerText.trim()).filter(Boolean);

            let jobUrl = linkEl ? linkEl.getAttribute("href") : "";
            if (jobUrl && !jobUrl.startsWith("http")) {
                jobUrl = new URL(jobUrl, window.location.origin).href;
            }
            if (!jobUrl) {
                jobUrl = `${window.location.origin}/test-jobs/${jobId}`;
            }

            jobs.push({
                job_id: jobId,
                title: titleEl ? titleEl.innerText.trim() : "Unknown Title",
                company: companyEl ? companyEl.innerText.trim() : "Unknown Company",
                location: locationEl ? locationEl.innerText.replace("📍", "").trim() : "",
                employment_type: empTypeEl ? empTypeEl.innerText.replace("💼", "").trim() : "",
                experience: expEl ? expEl.innerText.replace("⏳", "").trim() : "",
                skills: skills,
                description: descEl ? descEl.innerText.trim() : "",
                job_url: jobUrl,
                source: "test_job_portal",
                scraped_at: nowIso
            });
        });
        return {
            page_type: "listing",
            page_url: currentUrl,
            source: "test_job_portal",
            count: jobs.length,
            jobs: jobs
        };
    }

    // Case 2: Individual Job Detail Page (.job-detail-card or /test-jobs/job-XXX)
    const detailCard = document.querySelector(".job-detail-card");
    if (detailCard || currentUrl.match(/\/test-jobs\/[^\/]+$/)) {
        const root = detailCard || document;
        const jobIdAttr = detailCard ? detailCard.getAttribute("data-job-id") : null;
        const urlMatch = currentUrl.match(/\/test-jobs\/([^\/\?#]+)/);
        const jobId = jobIdAttr || (urlMatch ? urlMatch[1] : "job-detail");

        const titleEl = root.querySelector(".job-title") || root.querySelector("h1");
        const companyEl = root.querySelector(".company");
        const locationEl = root.querySelector(".location");
        const empTypeEl = root.querySelector(".employment-type");
        const expEl = root.querySelector(".experience");
        const descEl = root.querySelector(".description");
        const skillEls = root.querySelectorAll(".skills .skill");

        const skills = Array.from(skillEls).map(s => s.innerText.trim()).filter(Boolean);

        const singleJob = {
            job_id: jobId,
            title: titleEl ? titleEl.innerText.trim() : "Unknown Title",
            company: companyEl ? companyEl.innerText.trim() : "Unknown Company",
            location: locationEl ? locationEl.innerText.replace("📍", "").trim() : "",
            employment_type: empTypeEl ? empTypeEl.innerText.replace("💼", "").trim() : "",
            experience: expEl ? expEl.innerText.replace("⏳", "").trim() : "",
            skills: skills,
            description: descEl ? descEl.innerText.trim() : "",
            job_url: currentUrl,
            source: "test_job_portal",
            scraped_at: nowIso
        };

        return {
            page_type: "detail",
            page_url: currentUrl,
            source: "test_job_portal",
            count: 1,
            jobs: [singleJob]
        };
    }

    return {
        page_type: "unknown",
        page_url: currentUrl,
        source: "unknown",
        count: 0,
        jobs: []
    };
}

function extractPageDOM() {
    const inputs = [];
    const fields = document.querySelectorAll("input, select, textarea");

    fields.forEach((field) => {
        let labelText = "";
        if (field.id) {
            const labelEl = document.querySelector(`label[for="${field.id}"]`);
            if (labelEl) labelText = labelEl.innerText.trim();
        }
        if (!labelText && field.closest("label")) {
            labelText = field.closest("label").innerText.trim();
        }
        if (!labelText) {
            labelText = field.getAttribute("aria-label") || field.getAttribute("placeholder") || "";
        }

        inputs.push({
            tag: field.tagName.toLowerCase(),
            type: field.getAttribute("type") || field.tagName.toLowerCase(),
            id: field.id || "",
            name: field.getAttribute("name") || "",
            placeholder: field.getAttribute("placeholder") || "",
            required: field.hasAttribute("required") || field.getAttribute("aria-required") === "true",
            aria_label: field.getAttribute("aria-label"),
            label: labelText,
            value: field.value || ""
        });
    });

    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).map(h => ({
        level: parseInt(h.tagName[1]),
        text: h.innerText.trim()
    }));

    const buttons = Array.from(document.querySelectorAll("button, input[type='submit'], input[type='button']")).map(b => ({
        text: b.innerText || b.value || "",
        aria_label: b.getAttribute("aria-label")
    }));

    return {
        url: window.location.href,
        title: document.title,
        inputs: inputs,
        headings: headings,
        buttons: buttons,
        raw_html: document.body.innerHTML
    };
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "DETECT_PORTAL") {
        const detected = isTestJobPortal();
        const scrapeResult = detected ? scrapeJobCards() : { count: 0, jobs: [] };
        sendResponse({
            status: "success",
            detected: detected,
            portal_name: detected ? "Test Job Portal" : "Other Page",
            page_type: scrapeResult.page_type,
            jobs_count: scrapeResult.count,
            page_url: window.location.href
        });
    } else if (request.action === "SCRAPE_JOBS") {
        const scrapeResult = scrapeJobCards();
        sendResponse({
            status: "success",
            data: scrapeResult
        });
    } else if (request.action === "EXTRACT_DOM") {
        const domData = extractPageDOM();
        sendResponse({ status: "success", data: domData });
    } else if (request.action === "FILL_FIELDS") {
        const mappings = request.mappings || [];
        let filledCount = 0;

        mappings.forEach(m => {
            const isSafe = m.is_safe === true || m.safe === true;
            const val = m.suggested_value || m.value;

            // STRICT SAFETY ENFORCEMENT: Only populate if marked safe by backend
            if (isSafe && val) {
                let el = null;
                if (m.field_id) el = document.getElementById(m.field_id);
                if (!el && m.field_name) el = document.querySelector(`[name="${m.field_name}"]`);
                if (!el && m.label) {
                    const allInputs = Array.from(document.querySelectorAll("input, textarea, select"));
                    el = allInputs.find(i => {
                        const lbl = i.getAttribute("aria-label") || i.placeholder || "";
                        return lbl.toLowerCase().includes(m.label.toLowerCase());
                    });
                }

                if (el) {
                    el.value = val;
                    el.style.border = "2px solid #40189D";
                    el.style.backgroundColor = "#F1EBFF";
                    el.dispatchEvent(new Event("input", { bubbles: true }));
                    el.dispatchEvent(new Event("change", { bubbles: true }));
                    filledCount++;
                }
            }
        });
        sendResponse({ status: "success", filled_count: filledCount });
    }
    return true;
});

