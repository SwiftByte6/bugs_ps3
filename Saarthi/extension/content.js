// Saarthi Content Script - Injected into active job portals
// Extracts DOM elements and passes them to background / popup without storing credentials.

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
    if (request.action === "EXTRACT_DOM") {
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
