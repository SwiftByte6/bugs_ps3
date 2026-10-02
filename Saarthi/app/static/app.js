// Saarthi - Accessible Job Application Assistant JavaScript
// Extends existing functionality with multi-page onboarding, continuous gesture control,
// audio-first flow, and clean sidebar navigation.

// ============================================================
// GLOBAL STATE
// ============================================================
let currentVoiceRecognition = null;
let currentUtterance = null;
let lastSpokenText = "Welcome to Saarthi, your accessible job application assistant.";
let activeWebcamStream = null;
let pendingApprovalCallback = null;
let gestureControlActive = false;
let gestureAnimationFrame = null;
let lastGestureFrameTime = 0;
const GESTURE_FRAME_INTERVAL = 1000 / 15; // 15 FPS max

// Temporal gesture state machine
const gestureState = {
    state: 'IDLE',  // IDLE | CANDIDATE | CONFIRMED | EXECUTED | COOLDOWN
    candidateGesture: null,
    candidateStartTime: 0,
    lastExecutedTime: 0,
    HOLD_DURATION: 600,    // ms gesture must be held before executing
    COOLDOWN_DURATION: 1800 // ms after execution before next gesture
};

// ============================================================
// SCREEN READER / ARIA LIVE ANNOUNCER
// ============================================================
function announce(message) {
    const el = document.getElementById("screen-reader-announcer");
    if (el) {
        el.textContent = "";
        setTimeout(() => { el.textContent = message; }, 50);
    }
}

// ============================================================
// TEXT-TO-SPEECH
// ============================================================
function readAloud(text) {
    if (!text || !text.trim()) return;
    if (!('speechSynthesis' in window)) {
        console.warn("TTS not supported in this browser.");
        return;
    }
    window.speechSynthesis.cancel();
    lastSpokenText = text;
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => { currentUtterance = null; };
    window.speechSynthesis.speak(utterance);
    announce("Reading aloud: " + text.slice(0, 80));
}

function pauseSpeech() {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        announce("Speech paused.");
    }
}

function resumeOrRepeatSpeech() {
    if ('speechSynthesis' in window) {
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            announce("Speech resumed.");
        } else {
            readAloud(lastSpokenText);
        }
    }
}

function readAloudElement(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        readAloud(el.innerText || el.textContent);
    }
}

function stopAllActions() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    if (currentVoiceRecognition) {
        try { currentVoiceRecognition.stop(); } catch(e){}
        currentVoiceRecognition = null;
    }
    const voiceBtn = document.getElementById("voice-listen-btn");
    if (voiceBtn) voiceBtn.setAttribute("aria-pressed", "false");
    announce("All speech and automated actions stopped.");
}

// ============================================================
// ONBOARDING FLOW — MULTI-PAGE STATE MANAGEMENT
// ============================================================
let currentOnboardingPage = 1;
let selectedAccessibilityNeeds = [];

function goToPage(pageNum) {
    // Hide all onboarding pages
    document.querySelectorAll(".onboarding-page").forEach(p => p.classList.remove("active"));

    // Show target page
    const target = document.getElementById(`onboarding-page-${pageNum}`);
    if (target) {
        target.classList.add("active");
        currentOnboardingPage = pageNum;
        target.scrollTop = 0;
        target.focus?.();
        announce(`Step ${pageNum} of 4.`);
    }

    // Special page setup
    if (pageNum === 2) {
        setupPage2();
    } else if (pageNum === 3) {
        setupPage3();
    } else if (pageNum === 4) {
        setupPage4();
    }
}

function setupPage3() {
    const isBlindOrLowVision = selectedAccessibilityNeeds.some(n =>
        n === "Blind / Low Vision" || n === "Multiple Accessibility Needs"
    );
    if (isBlindOrLowVision) {
        setTimeout(() => {
            readAloud("Step 3: Do you already have a resume? If yes, choose upload resume. If no, choose build profile and I will ask you questions to create it.");
        }, 300);
    }
}

function setupPage2() {
    // Collect selected needs from page 1
    selectedAccessibilityNeeds = [];
    document.querySelectorAll("input[name='ob-need']:checked").forEach(cb => {
        selectedAccessibilityNeeds.push(cb.value);
    });

    const container = document.getElementById("ob2-presets-summary");
    if (!container) return;

    const presetMap = {
        "Blind / Low Vision": {
            icon: "🔊",
            features: ["Text-to-Speech enabled", "High Contrast enabled", "Audio-first flow", "Screen reader optimized"],
            color: "#1e40af"
        },
        "Motor Disability": {
            icon: "✋",
            features: ["Head gesture control enabled", "Hand gesture control enabled", "Keyboard navigation enhanced", "Single-switch scanning"],
            color: "#065f46"
        },
        "Dyslexia": {
            icon: "📖",
            features: ["Dyslexia-friendly font", "Focus mode enabled", "Wider line spacing", "Reduced visual clutter"],
            color: "#6b21a8"
        },
        "Hearing Impairment": {
            icon: "👁️",
            features: ["Visual captions enabled", "Text-first interactions", "No audio requirements", "Visual notifications"],
            color: "#92400e"
        },
        "Speech Impairment": {
            icon: "⌨️",
            features: ["Keyboard-first navigation", "Gesture controls activated", "Click-based confirmations", "STT optional"],
            color: "#0369a1"
        },
        "Multiple Accessibility Needs": {
            icon: "♿",
            features: ["All assistive features enabled", "Full gesture + voice + keyboard", "Maximum accessibility mode"],
            color: "#7f1d1d"
        },
        "Other": {
            icon: "✏️",
            features: ["Custom needs noted", "Contact team for configuration"],
            color: "#374151"
        }
    };

    let html = "";
    if (selectedAccessibilityNeeds.length === 0) {
        html = `<div class="card" style="border-left: 4px solid var(--primary-color);">
            <p>No specific needs selected. Saarthi will use standard interface defaults.</p>
            <p>You can always update preferences in Settings.</p>
        </div>`;
    } else {
        selectedAccessibilityNeeds.forEach(need => {
            const preset = presetMap[need] || { icon: "✓", features: ["Support activated"], color: "#374151" };
            html += `<div class="ob-preset-card" style="border-left-color: ${preset.color};">
                <span class="ob-preset-icon">${preset.icon}</span>
                <div>
                    <strong>${need}</strong>
                    <ul class="ob-feature-list">
                        ${preset.features.map(f => `<li>✓ ${f}</li>`).join('')}
                    </ul>
                </div>
            </div>`;
        });
    }
    container.innerHTML = html;

    // Show TTS preview if Blind/Low Vision selected
    const ttsCard = document.getElementById("ob2-tts-preview-card");
    if (ttsCard) {
        const needsTTS = selectedAccessibilityNeeds.some(n =>
            n === "Blind / Low Vision" || n === "Multiple Accessibility Needs"
        );
        ttsCard.style.display = needsTTS ? "block" : "none";
    }
}

function testTTSPreview() {
    readAloud("Saarthi is now reading aloud. This is your audio-first experience. You can ask me questions, and I will speak my answers.");
    const status = document.getElementById("ob2-tts-preview-status");
    if (status) status.textContent = "✓ TTS is working!";
}

async function applyPresetsAndContinue() {
    // Get selected needs (re-read in case of changes)
    selectedAccessibilityNeeds = [];
    document.querySelectorAll("input[name='ob-need']:checked").forEach(cb => {
        selectedAccessibilityNeeds.push(cb.value);
    });

    const additionalReq = document.getElementById("ob1-additional-req")?.value || "";

    try {
        const res = await fetch("/api/profile/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                declared_needs: selectedAccessibilityNeeds,
                additional_requirements: additionalReq
            })
        });
        const data = await res.json();
        if (data.accessibility) {
            applyAccessibilityProfileToUI(data.accessibility);
        }
        announce("Accessibility preferences applied.");
    } catch(e) {
        console.error("Failed to apply presets:", e);
    }

    goToPage(3);
}

async function setupPage4() {
    // Load profile completeness
    try {
        const res = await fetch("/api/profile/completeness");
        const data = await res.json();
        const c = data.completeness;

        const textEl = document.getElementById("ob4-completeness-text");
        const barEl = document.getElementById("ob4-progress-bar");
        const listEl = document.getElementById("ob4-checklist-items");

        if (textEl) textEl.textContent = c.status_message;
        if (barEl) barEl.style.width = `${c.score}%`;
        if (listEl) {
            let html = "";
            c.checklist.forEach(item => {
                const icon = item.present ? "✓" : "✗";
                const cls = item.present ? "present" : "missing";
                html += `<div class="completeness-item ${cls}"><span>${icon}</span> <span>${item.label}</span></div>`;
            });
            listEl.innerHTML = html;
        }
    } catch(e) {
        console.error("Error loading completeness in page 4:", e);
    }

    // Show active accessibility features
    const featuresEl = document.getElementById("ob4-active-features");
    if (featuresEl && selectedAccessibilityNeeds.length > 0) {
        featuresEl.innerHTML = selectedAccessibilityNeeds.map(n =>
            `<span class="ob-active-badge">✓ ${n}</span>`
        ).join("");
    } else if (featuresEl) {
        featuresEl.textContent = "Standard accessibility features active. Update from Settings anytime.";
    }

    readAloud("You are all set! Click Enter Saarthi to begin your accessible job search experience.");
}

function skipOnboarding() {
    localStorage.setItem('saarthi_onboarding_complete', 'true');
    showMainApp();
}

function launchMainApp() {
    localStorage.setItem('saarthi_onboarding_complete', 'true');
    showMainApp();
}

function showMainApp() {
    const wrapper = document.getElementById("onboarding-wrapper");
    const mainApp = document.getElementById("main-app");

    if (wrapper) wrapper.style.display = "none";
    if (mainApp) {
        mainApp.style.display = "block";
        // Load initial data
        loadTrackerTable();
        loadProfileCompleteness();
        loadInitialProfile();
    }
    announce("Welcome to Saarthi. Use the sidebar to navigate.");
}

function restartOnboarding() {
    localStorage.removeItem('saarthi_onboarding_complete');
    const wrapper = document.getElementById("onboarding-wrapper");
    const mainApp = document.getElementById("main-app");
    if (wrapper) {
        wrapper.style.display = "flex";
        goToPage(1);
    }
    if (mainApp) mainApp.style.display = "none";
}

// ============================================================
// ONBOARDING PAGE 3 — RESUME SETUP
// ============================================================
function selectResumeSetupOption(option) {
    const uploadCard = document.getElementById("ob3-yes-card");
    const buildCard = document.getElementById("ob3-no-card");
    const uploadSection = document.getElementById("ob3-upload-section");
    const buildSection = document.getElementById("ob3-build-section");

    if (option === 'upload') {
        uploadCard?.setAttribute("aria-pressed", "true");
        uploadCard?.classList.add("selected");
        buildCard?.setAttribute("aria-pressed", "false");
        buildCard?.classList.remove("selected");
        uploadSection && (uploadSection.style.display = "block");
        buildSection && (buildSection.style.display = "none");
    } else {
        buildCard?.setAttribute("aria-pressed", "true");
        buildCard?.classList.add("selected");
        uploadCard?.setAttribute("aria-pressed", "false");
        uploadCard?.classList.remove("selected");
        buildSection && (buildSection.style.display = "block");
        uploadSection && (uploadSection.style.display = "none");
    }
    announce(`Selected ${option === 'upload' ? 'resume upload' : 'profile builder'} option.`);
}

async function ob3LoadDemoResume() {
    const out = document.getElementById("ob3-resume-output");
    if (out) out.textContent = "Extracting demo resume with PyMuPDF...";
    try {
        const res = await fetch("/api/resume/demo");
        const data = await res.json();
        if (out) out.textContent = `✓ Resume loaded: ${data.profile?.name || 'Candidate'} — ${data.profile?.skills?.all_skills?.slice(0,3).join(', ') || ''}`;
        announce("Demo resume loaded and extracted.");
    } catch(e) {
        if (out) out.textContent = "Error: " + e.message;
    }
}

async function ob3UploadResume() {
    const input = document.getElementById("ob3-resume-file");
    if (!input?.files?.length) return;
    const formData = new FormData();
    formData.append("file", input.files[0]);
    const out = document.getElementById("ob3-resume-output");
    if (out) out.textContent = "Processing uploaded PDF...";
    try {
        const res = await fetch("/api/resume/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (out) out.textContent = `✓ Resume uploaded: ${data.profile?.name || 'Candidate'}`;
        announce("Resume uploaded and parsed.");
    } catch(e) {
        if (out) out.textContent = "Upload failed: " + e.message;
    }
}

async function ob3SaveBuilderProfile() {
    const payload = {
        name: document.getElementById("ob3-name")?.value || "",
        email: document.getElementById("ob3-email")?.value || "",
        phone: document.getElementById("ob3-phone")?.value || "",
        location: document.getElementById("ob3-location")?.value || "",
        education: [{
            degree: document.getElementById("ob3-degree")?.value || "",
            institution: document.getElementById("ob3-college")?.value || ""
        }],
        skills: {
            technical_skills: (document.getElementById("ob3-skills")?.value || "").split(",").map(s => s.trim()).filter(Boolean)
        },
        roles_interested_in: (document.getElementById("ob3-roles")?.value || "").split(",").map(s => s.trim()).filter(Boolean)
    };
    try {
        await fetch("/api/profile/builder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const msg = document.getElementById("ob3-save-msg");
        if (msg) {
            msg.textContent = "✓ Profile saved!";
            setTimeout(() => { msg.textContent = ""; }, 3000);
        }
        announce("Profile details saved.");
    } catch(e) {
        console.error("Profile save error:", e);
    }
}

// ============================================================
// MAIN APP TAB SWITCHING
// ============================================================
function initTabSwitching() {
    document.querySelectorAll(".nav-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".nav-tab").forEach(t => {
                t.classList.remove("active");
                t.setAttribute("aria-selected", "false");
            });
            document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
            tab.classList.add("active");
            tab.setAttribute("aria-selected", "true");
            const targetId = tab.getAttribute("data-tab");
            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.add("active");
                announce(`Switched to ${tab.textContent.trim()} section`);
            }
        });
    });

    // Sub-tab switching within sections
    document.querySelectorAll(".sub-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            const section = tab.closest(".tab-pane, section");
            section?.querySelectorAll(".sub-tab").forEach(t => {
                t.classList.remove("active");
                t.setAttribute("aria-selected", "false");
            });
            section?.querySelectorAll(".sub-pane").forEach(p => p.classList.remove("active"));
            tab.classList.add("active");
            tab.setAttribute("aria-selected", "true");
            const targetId = tab.getAttribute("data-subtab");
            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.add("active");
                announce(`Switched to ${tab.textContent.trim()} sub-section`);
            }
        });
    });
}

// ============================================================
// QUICK ACCESSIBILITY TOGGLES (header bar)
// ============================================================
function initAccessibilityToggles() {
    const contrastBtn = document.getElementById("toggle-contrast-btn");
    contrastBtn?.addEventListener("click", () => {
        const active = document.body.classList.toggle("high-contrast");
        contrastBtn.setAttribute("aria-pressed", active);
        announce(active ? "High contrast mode enabled" : "High contrast mode disabled");
    });

    const dyslexiaBtn = document.getElementById("toggle-dyslexia-btn");
    dyslexiaBtn?.addEventListener("click", () => {
        const active = document.body.classList.toggle("dyslexia-font");
        dyslexiaBtn.setAttribute("aria-pressed", active);
        announce(active ? "Dyslexia-friendly font enabled" : "Default font restored");
    });

    const largeTextBtn = document.getElementById("toggle-large-text-btn");
    largeTextBtn?.addEventListener("click", () => {
        const active = document.body.classList.toggle("large-text");
        largeTextBtn.setAttribute("aria-pressed", active);
        announce(active ? "Large text enabled" : "Standard text restored");
    });

    document.getElementById("stop-speech-btn")?.addEventListener("click", stopAllActions);

    // Global TTS bar
    document.getElementById("global-tts-play-btn")?.addEventListener("click", () => {
        const activeSection = document.querySelector(".tab-pane.active");
        if (activeSection) readAloud(activeSection.innerText || activeSection.textContent);
    });
    document.getElementById("global-tts-pause-btn")?.addEventListener("click", pauseSpeech);
    document.getElementById("global-tts-stop-btn")?.addEventListener("click", stopAllActions);
    document.getElementById("global-tts-repeat-btn")?.addEventListener("click", resumeOrRepeatSpeech);
}

// ============================================================
// VOICE RECOGNITION (STT)
// ============================================================
function initVoiceControl() {
    const voiceListenBtn = document.getElementById("voice-listen-btn");
    voiceListenBtn?.addEventListener("click", () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech Recognition API is not supported in this browser. Please use Chrome or Edge.");
            return;
        }
        if (currentVoiceRecognition) {
            stopAllActions();
            return;
        }
        const recognition = new SpeechRecognition();
        currentVoiceRecognition = recognition;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
            voiceListenBtn.setAttribute("aria-pressed", "true");
            announce("Listening for voice commands. Say: 'Find jobs', 'Read page', 'Yes', 'No', or 'Stop'.");
        };

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            announce(`Heard: ${transcript}`);
            try {
                // Route through LangGraph Voice Command Assistant graph
                const res = await fetch("/api/voice/command", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        transcript,
                        current_page: document.querySelector(".tab-pane.active")?.id || "tab-jobsearch"
                    })
                });
                const data = await res.json();
                handleVoiceIntent(data.data);
            } catch(e) {
                console.error("Voice command error:", e);
                // Fallback to legacy intent
                try {
                    const res = await fetch("/api/voice/intent", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ transcript })
                    });
                    const data = await res.json();
                    handleVoiceIntent(data.data);
                } catch(err){}
            }
        };

        recognition.onerror = () => stopAllActions();
        recognition.onend = () => {
            voiceListenBtn.setAttribute("aria-pressed", "false");
            currentVoiceRecognition = null;
        };

        recognition.start();
    });
}

function handleVoiceIntent(intentData) {
    if (!intentData) return;
    if (intentData.immediate_stop) { stopAllActions(); return; }

    // If speech announcement provided by LangGraph, speak it
    if (intentData.speech_announcement) {
        readAloud(intentData.speech_announcement);
    }

    const intent = intentData.intent || "";
    const action = intentData.action || "";

    // Action-based routing from LangGraph
    if (action === "STOP_ALL") {
        stopAllActions();
        return;
    }

    if (action === "GUIDANCE_MODE") {
        // Already spoke "Waiting for your command."
        return;
    }

    if (action === "NAVIGATE_TRACKER" || intent === "TRACK_APPLICATIONS") {
        document.getElementById("tab-btn-tracker")?.click();
        loadTrackerTable();
        return;
    }

    if (action === "NAVIGATE_JOBSEARCH" || intent === "SEARCH_JOBS") {
        document.getElementById("tab-btn-jobsearch")?.click();
        setTimeout(() => {
            document.querySelector("[data-subtab='js-search']")?.click();
            const q = intentData.search_query || intentData.transcript?.replace(/^(find|search( for)?)/i, "").trim() || "Data Analyst";
            const inp = document.getElementById("job-search-input");
            if (inp) inp.value = q;
            performJobSearch(q);
        }, 100);
        return;
    }

    if (action === "NAVIGATE" && intentData.target) {
        const btn = document.querySelector(`[data-tab='${intentData.target}']`) || document.getElementById(intentData.target);
        btn?.click();
        return;
    }

    switch (intent) {
        case "NAVIGATE_PROFILE":
            document.getElementById("tab-btn-profile")?.click();
            break;
        case "NAVIGATE_JOBS":
            document.getElementById("tab-btn-jobsearch")?.click();
            break;
        case "NAVIGATE_ASSISTANT":
            document.getElementById("tab-btn-ai-assistant")?.click();
            break;
        case "NAVIGATE_TRACKER":
            document.getElementById("tab-btn-tracker")?.click();
            loadTrackerTable();
            break;
        case "NAVIGATE_INTERVIEW":
            document.getElementById("tab-btn-interview")?.click();
            loadInterviewQuestions();
            break;
        case "NAVIGATE_SETTINGS":
            document.getElementById("tab-btn-settings")?.click();
            break;
        case "APPROVE":
            if (window._aqePendingConfirm) {
                window._aqePendingConfirm(true);
            } else if (document.getElementById("approval-modal")?.style.display !== "none") {
                handleActionApproval(true);
            } else {
                readAloud("Yes approved. How can I assist you next?");
            }
            break;
        case "DENY":
        case "CANCEL":
            if (window._aqePendingConfirm) {
                window._aqePendingConfirm(false);
            } else if (document.getElementById("approval-modal")?.style.display !== "none") {
                handleActionApproval(false);
            } else {
                readAloud("Action cancelled.");
            }
            break;
        case "NEXT_JOB":
            document.getElementById("tab-btn-jobsearch")?.click();
            readAloud("Navigating to next job.");
            break;
        case "PREV_JOB":
            document.getElementById("tab-btn-jobsearch")?.click();
            readAloud("Navigating to previous job.");
            break;
        case "READ_PAGE":
            readAloud(document.querySelector(".tab-pane.active")?.innerText || "Current page content");
            break;
        case "EXPLAIN_JOB":
            document.getElementById("tab-btn-jobsearch")?.click();
            setTimeout(() => {
                document.querySelector("[data-subtab='js-details']")?.click();
                simplifyJob();
            }, 100);
            break;
        case "FILL_SAFE_FIELDS":
            document.getElementById("tab-btn-jobsearch")?.click();
            setTimeout(() => {
                document.querySelector("[data-subtab='js-smart-apply']")?.click();
                mapFormFields();
            }, 100);
            break;
        default:
            if (!intentData.speech_announcement) {
                readAloud(`Command recognized: ${intentData.transcript || intentData.intent}`);
            }
            break;
    }
}


// ============================================================
// ACCESSIBILITY PROFILE APPLYING TO UI
// ============================================================
function applyAccessibilityProfileToUI(pref) {
    if (!pref) return;

    if (pref.high_contrast) document.body.classList.add("high-contrast");
    else document.body.classList.remove("high-contrast");
    document.getElementById("toggle-contrast-btn")?.setAttribute("aria-pressed", String(!!pref.high_contrast));

    if (pref.dyslexia_mode) document.body.classList.add("dyslexia-font");
    else document.body.classList.remove("dyslexia-font");
    document.getElementById("toggle-dyslexia-btn")?.setAttribute("aria-pressed", String(!!pref.dyslexia_mode));

    if (pref.large_text) document.body.classList.add("large-text");
    else document.body.classList.remove("large-text");
    document.getElementById("toggle-large-text-btn")?.setAttribute("aria-pressed", String(!!pref.large_text));

    if (pref.focus_mode) document.body.classList.add("focus-mode");
    else document.body.classList.remove("focus-mode");

    if (pref.reduced_motion) document.body.classList.add("reduced-motion");
    else document.body.classList.remove("reduced-motion");

    // Sync settings checkboxes
    const setMap = {
        "set-voice-assist": pref.voice_navigation,
        "set-tts": pref.text_to_speech,
        "set-stt": pref.speech_to_text,
        "set-head-gestures": pref.head_gestures,
        "set-hand-gestures": pref.hand_gestures,
        "set-keyboard-nav": pref.keyboard_navigation,
        "set-dyslexia": pref.dyslexia_mode,
        "set-captions": pref.captions,
        "set-large-text": pref.large_text,
        "set-high-contrast": pref.high_contrast,
        "set-reduced-motion": pref.reduced_motion,
        "set-focus-mode": pref.focus_mode
    };
    for (const [id, val] of Object.entries(setMap)) {
        const el = document.getElementById(id);
        if (el) el.checked = Boolean(val);
    }
}

// ============================================================
// PROFILE COMPLETENESS
// ============================================================
async function loadProfileCompleteness() {
    try {
        const res = await fetch("/api/profile/completeness");
        const data = await res.json();
        const c = data.completeness;

        // Main app completeness card
        const textEl = document.getElementById("completeness-summary-text");
        const barEl = document.getElementById("completeness-progress-bar");
        const listEl = document.getElementById("completeness-checklist-items");

        if (textEl) textEl.textContent = c.status_message;
        if (barEl) barEl.style.width = `${c.score}%`;
        if (listEl) {
            let html = "";
            c.checklist.forEach(item => {
                const icon = item.present ? "✓" : "✗";
                const cls = item.present ? "present" : "missing";
                html += `<div class="completeness-item ${cls}"><span>${icon}</span> <span>${item.label}</span></div>`;
            });
            listEl.innerHTML = html;
        }
    } catch(e) {
        console.error("Error loading completeness:", e);
    }
}

// ============================================================
// RESUME — PROFILE TAB (in main app)
// ============================================================
function selectResumeOption(opt) {
    if (opt === 'yes') {
        document.getElementById("resume-upload-section").style.display = "block";
        document.getElementById("profile-builder-section").style.display = "none";
        announce("Selected Resume Upload option.");
    } else {
        document.getElementById("resume-upload-section").style.display = "none";
        document.getElementById("profile-builder-section").style.display = "block";
        announce("Selected Step-by-Step Profile Builder option.");
    }
}

async function loadDemoResume() {
    const out = document.getElementById("resume-output");
    out.textContent = "Extracting demo resume with PyMuPDF...";
    try {
        const res = await fetch("/api/resume/demo");
        const data = await res.json();
        out.textContent = JSON.stringify(data.profile, null, 2);
        announce("Sample resume loaded and extracted successfully.");
        loadProfileCompleteness();
    } catch(e) {
        out.textContent = "Error: " + e.message;
    }
}

async function uploadUserResume() {
    const input = document.getElementById("resume-file-input");
    if (!input?.files?.length) return;
    const formData = new FormData();
    formData.append("file", input.files[0]);
    const out = document.getElementById("resume-output");
    out.textContent = "Processing uploaded PDF...";
    try {
        const res = await fetch("/api/resume/upload", { method: "POST", body: formData });
        const data = await res.json();
        out.textContent = JSON.stringify(data.profile, null, 2);
        announce("Resume uploaded and parsed successfully.");
        loadProfileCompleteness();
    } catch(e) {
        out.textContent = "Upload failed: " + e.message;
    }
}

async function saveProfileBuilder() {
    const payload = {
        name: document.getElementById("build-name").value,
        location: document.getElementById("build-location").value,
        email: document.getElementById("build-email").value,
        phone: document.getElementById("build-phone").value,
        education: [{
            degree: document.getElementById("build-degree").value,
            institution: document.getElementById("build-college").value,
            graduation_year: document.getElementById("build-grad-year").value,
            marks_cgpa: document.getElementById("build-cgpa").value
        }],
        roles_interested_in: document.getElementById("build-roles").value.split(",").map(s => s.trim()).filter(Boolean),
        work_mode: document.getElementById("build-work-pref").value,
        skills: {
            technical_skills: document.getElementById("build-tech-skills").value.split(",").map(s => s.trim()).filter(Boolean),
            soft_skills: document.getElementById("build-soft-skills").value.split(",").map(s => s.trim()).filter(Boolean)
        },
        linkedin: document.getElementById("build-linkedin").value,
        github: document.getElementById("build-github").value,
        portfolio: document.getElementById("build-portfolio").value,
        kaggle: document.getElementById("build-kaggle").value
    };

    const res = await fetch("/api/profile/builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    await res.json();
    const msg = document.getElementById("builder-save-msg");
    msg.textContent = "✓ Profile Builder saved!";
    announce("Profile details saved via builder.");
    setTimeout(() => msg.textContent = "", 3000);
    loadProfileCompleteness();
}

// ============================================================
// JOB SEARCH
// ============================================================
async function performJobSearch(customQuery) {
    const query = customQuery || document.getElementById("job-search-input")?.value;
    const resultsContainer = document.getElementById("job-search-results");
    const relatedList = document.getElementById("related-roles-list");

    if (resultsContainer) resultsContainer.textContent = "Searching catalog and identifying related roles...";
    try {
        const res = await fetch("/api/jobs/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        });
        const data = await res.json();
        const r = data.data;

        // Related Roles
        let relHtml = "<div class='card-grid'>";
        r.related_roles.forEach(role => {
            relHtml += `<div class="card mb-2" style="border-left: 4px solid var(--accent-color);">
                <h4>${role.role}</h4>
                <p><strong>Why suggested:</strong> ${role.reason}</p>
                <button class="btn btn-outline mt-1" onclick="document.getElementById('job-search-input').value='${role.role.replace(/'/g, "\\'")}'; performJobSearch('${role.role.replace(/'/g, "\\'")}');">Explore ${role.role} Roles</button>
            </div>`;
        });
        relHtml += "</div>";
        if (relatedList) relatedList.innerHTML = relHtml;

        // Job Results
        let jobsHtml = "<div class='card-grid'>";
        r.jobs.forEach(j => {
            jobsHtml += `<div class="card mb-3">
                <h4>${j.title}</h4>
                <p><strong>${j.company}</strong> &bull; ${j.location} &bull; <span class="badge badge-success">${j.work_mode}</span></p>
                <p><strong>Salary:</strong> ${j.salary || 'Competitive'}</p>
                <p><strong>Skills:</strong> ${j.required_skills.join(', ')}</p>
                <p><strong>♿ Accessibility:</strong> <em>${j.accessibility_info}</em></p>
                <div class="btn-group mt-2">
                    <button class="btn btn-primary" onclick="switchToJobDetails('${j.title.replace(/'/g, "\\'")}')">View &amp; Simplify</button>
                    <button class="btn btn-accent" onclick="startApplyWorkflow('${j.title.replace(/'/g, "\\'")}', '${j.company.replace(/'/g, "\\'")}')">Apply</button>
                    <button class="btn btn-outline" onclick="readAloud('${j.title} at ${j.company}. ${j.accessibility_info}')">🔊 Read</button>
                </div>
            </div>`;
        });
        jobsHtml += "</div>";
        if (resultsContainer) resultsContainer.innerHTML = jobsHtml;
        announce(`Job search complete. Found ${r.jobs.length} jobs.`);
    } catch(e) {
        if (resultsContainer) resultsContainer.textContent = "Search error: " + e.message;
    }
}

function switchToJobDetails(title) {
    // Switch to Job Details sub-tab within Job Search
    document.getElementById("tab-btn-jobsearch")?.click();
    setTimeout(() => {
        document.querySelector("[data-subtab='js-details']")?.click();
        loadDemoJob();
    }, 100);
}

async function loadDemoJob() {
    const res = await fetch("/api/jobs/demo");
    const data = await res.json();
    const inp = document.getElementById("job-input");
    const out = document.getElementById("job-output");
    if (inp) inp.value = data.raw_text;
    if (out) out.textContent = JSON.stringify(data.job_json, null, 2);
    announce("Demo job posting loaded.");
}

async function simplifyJob() {
    const text = document.getElementById("job-input")?.value;
    if (!text?.trim()) { alert("Please load or paste a job description first."); return; }
    const out = document.getElementById("job-output");
    if (out) out.textContent = "Simplifying job description into accessible sections...";
    try {
        const res = await fetch("/api/jobs/simplify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });
        const data = await res.json();
        if (out) out.textContent = data.data.simplified_text;
        announce("Job description simplified.");
    } catch(e) {
        if (out) out.textContent = "Error: " + e.message;
    }
}

async function explainDifficultWord() {
    const term = document.getElementById("explain-word-input")?.value;
    const out = document.getElementById("word-explanation-box");
    if (out) out.textContent = `Explaining '${term}' in plain language...`;
    try {
        const res = await fetch("/api/jobs/explain-term", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ term })
        });
        const data = await res.json();
        if (out) out.innerHTML = `<strong>${data.data.term.toUpperCase()}:</strong> ${data.data.explanation}`;
        announce(`${term}: ${data.data.explanation}`);
    } catch(e) {
        if (out) out.textContent = "Error: " + e.message;
    }
}

async function simplifyComplexQuestion() {
    const question = document.getElementById("complex-question-input")?.value;
    const out = document.getElementById("simplified-question-output");
    if (out) out.textContent = "Simplifying question...";
    try {
        const res = await fetch("/api/jobs/simplify-question", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question })
        });
        const data = await res.json();
        const d = data.data;
        if (out) out.innerHTML = `
            <p><strong>SIMPLIFIED:</strong> ${d.simplified_question}</p>
            <p class="mt-2"><strong>WHAT TO INCLUDE:</strong></p>
            <ul>${d.what_to_include.map(i => `<li>${i}</li>`).join('')}</ul>
            <p><small>Tip: ${d.tip}</small></p>
        `;
        announce(`Simplified: ${d.simplified_question}`);
    } catch(e) {
        if (out) out.textContent = "Error: " + e.message;
    }
}

async function matchJob() {
    const text = document.getElementById("job-input")?.value;
    const out = document.getElementById("matching-output");
    if (out) out.textContent = "Computing semantic match and skill alignment...";
    try {
        const res = await fetch("/api/jobs/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ job_text: text })
        });
        const data = await res.json();
        const m = data.match;
        if (out) out.innerHTML = `
            <h4>Overall Alignment Score: <span class="badge badge-success">${m.overall_match_score}%</span></h4>
            <p class="mt-2">${m.why_this_job_matches}</p>
            <div class="card-grid mt-2">
                <div><h5>✓ Matched Skills:</h5><ul>${m.matched_skills.map(s => `<li>${s}</li>`).join('') || 'None'}</ul></div>
                <div><h5>Missing / Recommended Skills:</h5><ul>${m.missing_skills.map(s => `<li>${s}</li>`).join('') || 'None'}</ul></div>
            </div>
            <p class="mt-2"><small>Non-discrimination guarantee: Candidate accommodations are evaluated independently from job qualification scores.</small></p>
        `;
        announce(`Alignment computed: ${m.overall_match_score} percent.`);
    } catch(e) {
        if (out) out.textContent = "Match error: " + e.message;
    }
}

// ============================================================
// AI ASSISTANT (RAG)
// ============================================================
function setRAGQuery(query) {
    const inp = document.getElementById("rag-query-input");
    if (inp) inp.value = query;
    askRAG();
}

async function askRAG() {
    const query = document.getElementById("rag-query-input")?.value;
    const out = document.getElementById("rag-output");
    if (out) out.textContent = "Retrieving knowledge chunks and querying Qwen3.8 27B...";
    try {
        const res = await fetch("/api/rag/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        });
        const data = await res.json();
        const r = data.data;
        // Clean natural response only — never expose internal sources/filenames to the candidate
        if (out) out.textContent = r.answer;
        announce("RAG answer received.");
    } catch(e) {
        if (out) out.textContent = "RAG Error: " + e.message;
    }
}

// ============================================================
// SMART JOB ASSISTANT CHAT
// ============================================================
async function sendAssistantPreset(presetText) {
    const inp = document.getElementById("assistant-user-input");
    if (inp) inp.value = presetText;
    await sendAssistantQuery();
}

async function sendAssistantQuery() {
    const input = document.getElementById("assistant-user-input");
    const query = input?.value?.trim();
    if (!query) return;

    const stream = document.getElementById("assistant-chat-stream");
    if (stream) stream.innerHTML += `<p class="mt-2"><strong>You:</strong> ${query}</p>`;
    if (input) input.value = "";

    try {
        const res = await fetch("/api/jobs/assistant-query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        });
        const data = await res.json();
        if (stream) {
            stream.innerHTML += `<p class="mt-2" style="color: var(--primary-color);"><strong>Saarthi:</strong> ${data.data.answer}</p>`;
            stream.scrollTop = stream.scrollHeight;
        }
        announce(`Saarthi replied: ${data.data.answer}`);
    } catch(e) {
        if (stream) stream.innerHTML += `<p class="mt-2 text-danger">Error: ${e.message}</p>`;
    }
}

// ============================================================
// SMART APPLY
// ============================================================
let activeDemoHTML = "";

async function loadDemoHTML() {
    const res = await fetch("/api/dom/demo-html");
    const data = await res.json();
    activeDemoHTML = data.html;
    document.getElementById("audit-results").innerHTML = "<div class='alert alert-info'>Demo application HTML loaded. Ready to audit accessibility or map fields.</div>";
    announce("Demo HTML application loaded.");
}

async function auditAccessibility() {
    if (!activeDemoHTML) await loadDemoHTML();
    const res = await fetch("/api/dom/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: activeDemoHTML })
    });
    const data = await res.json();
    const r = data.report;
    let html = `<div class="card">
        <h3>Heuristic Accessibility Audit Results</h3>
        <p class="text-warning"><em>${r.disclaimer}</em></p>
        <p><strong>Total Issues Detected:</strong> ${r.summary.total_issues} | <strong>Passed Checks:</strong> ${r.summary.checks_passed}</p>
        <ul class="mt-2">`;
    r.issues.forEach(i => {
        html += `<li><strong>[${i.severity.toUpperCase()}]</strong> ${i.message} <br><small>Fix: ${i.recommendation}</small></li>`;
    });
    html += `</ul></div>`;
    document.getElementById("audit-results").innerHTML = html;
    announce(`Audit complete: ${r.summary.total_issues} issues found.`);
}

async function mapFormFields() {
    if (!activeDemoHTML) await loadDemoHTML();
    const res = await fetch("/api/dom/map-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: activeDemoHTML })
    });
    const data = await res.json();
    const rev = data.data.review_summary;

    let html = `
        <div class="card mb-3">
            <h4>APPLICATION REVIEW &amp; CANDIDATE CONFIRMATION</h4>
            <p><strong>Candidate:</strong> ${rev.candidate_name} | <strong>Email:</strong> ${rev.email} | <strong>Phone:</strong> ${rev.phone}</p>
            <p><strong>Safe Auto-Populated Fields:</strong> <span class="badge badge-success">${rev.safe_auto_fields}</span> |
               <strong>Ambiguous / Requiring Review:</strong> <span class="badge badge-warning">${rev.ambiguous_review_fields}</span></p>
            <table class="table-custom mt-2">
                <thead><tr><th>Field</th><th>Suggested Value</th><th>Category</th><th>Confirmation Needed</th></tr></thead>
                <tbody>`;
    data.data.mappings.forEach(m => {
        html += `<tr>
            <td><strong>${m.field_name || m.field_id}</strong></td>
            <td><input type="text" class="form-control" value="${m.suggested_value || ''}"></td>
            <td>${m.is_safe ? '<span class="badge badge-success">Safe</span>' : '<span class="badge badge-warning">Ambiguous</span>'}</td>
            <td>${m.requires_confirmation ? '⚠️ Requires User Confirmation' : '✓ Verified'}</td>
        </tr>`;
    });
    html += `</tbody></table>
            <div class="btn-group mt-3">
                <button class="btn btn-outline" onclick="announce('Fields editable in table')">Edit Fields</button>
                <button class="btn btn-danger" onclick="promptActionApproval('cancel')">Cancel Application</button>
                <button class="btn btn-accent" onclick="promptActionApproval('submit')">PROCEED TO CONFIRMATION</button>
            </div>
        </div>`;

    document.getElementById("application-review-area").innerHTML = html;
    announce("Form fields mapped into Application Review table.");
}

function promptActionApproval(actionType) {
    const modal = document.getElementById("approval-modal");
    const promptEl = document.getElementById("approval-modal-prompt");
    if (modal) modal.style.display = "flex";

    if (actionType === 'submit') {
        if (promptEl) promptEl.textContent = "Do you want to submit this application?";
        readAloud("Do you want to submit this application?");
        pendingApprovalCallback = async (confirmed) => {
            if (confirmed) {
                readAloud("Application approved. Proceeding with submission.");
                await submitApplicationSafely();
            } else {
                readAloud("Application rejected. Returning to previous step.");
            }
        };
    } else {
        if (promptEl) promptEl.textContent = "Do you want to cancel this application?";
        readAloud("Do you want to cancel this application?");
        pendingApprovalCallback = (confirmed) => {
            if (confirmed) {
                readAloud("Application cancelled.");
                const area = document.getElementById("application-review-area");
                if (area) area.innerHTML = "<p>Application cancelled.</p>";
            } else {
                readAloud("Continuing application review.");
            }
        };
    }
}

function handleActionApproval(confirmed) {
    closeApprovalModal();
    if (pendingApprovalCallback) {
        pendingApprovalCallback(confirmed);
        pendingApprovalCallback = null;
    }
}

function closeApprovalModal() {
    const modal = document.getElementById("approval-modal");
    if (modal) modal.style.display = "none";
}

async function submitApplicationSafely() {
    const res = await fetch("/api/dom/submit-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            company: "CogniCorp Technologies",
            position: "Junior Data Analyst / ML Associate",
            application_fields: { name: "Test User", email: "test@example.com", phone: "+91 9000000000" },
            user_confirmed: true
        })
    });
    await res.json();
    announce("Application confirmed, successfully submitted and logged in tracker.");
    loadTrackerTable();
}

function startApplyWorkflow(title, company) {
    document.getElementById("tab-btn-jobsearch")?.click();
    setTimeout(() => {
        document.querySelector("[data-subtab='js-smart-apply']")?.click();
        promptActionApproval('submit');
    }, 100);
}

// ============================================================
// APPLICATION TRACKER
// ============================================================
async function loadTrackerTable() {
    const container = document.getElementById("tracker-table-container");
    if (!container) return;
    try {
        const res = await fetch("/api/tracker");
        const data = await res.json();
        let html = `<table class="table-custom">
            <thead><tr><th>ID</th><th>Company</th><th>Position</th><th>Date</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
            <tbody>`;
        data.applications.forEach(a => {
            const statusClass = "status-" + a.status.toLowerCase().replace(/\s+/g, '-');
            html += `<tr>
                <td>${a.id}</td>
                <td><strong>${a.company}</strong></td>
                <td>${a.position}</td>
                <td>${a.date_applied}</td>
                <td><span class="status-badge ${statusClass}">${a.status}</span></td>
                <td><small>${a.notes || ''}</small></td>
                <td>
                    <select onchange="updateAppStatus('${a.id}', this.value)" class="form-control" style="padding:4px; font-size:0.85rem;">
                        <option value="">Update Status...</option>
                        <option value="Saved">Saved</option>
                        <option value="Reviewing">Reviewing</option>
                        <option value="Ready to Apply">Ready to Apply</option>
                        <option value="Waiting for Approval">Waiting for Approval</option>
                        <option value="Applied">Applied</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Withdrawn">Withdrawn</option>
                    </select>
                </td>
            </tr>`;
        });
        html += `</tbody></table>`;
        container.innerHTML = html;
    } catch(e) {
        if (container) container.textContent = "Tracker error: " + e.message;
    }
}

async function updateAppStatus(appId, newStatus) {
    if (!newStatus) return;
    try {
        await fetch(`/api/tracker/${appId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });
        announce(`Application ${appId} updated to ${newStatus}`);
        loadTrackerTable();
    } catch(e) {
        console.error("Status update failed:", e);
    }
}

// ============================================================
// INTERVIEW PREP (Text + Audio + Voice Feedback)
// ============================================================
let currentInterviewQuestions = [];

async function loadInterviewQuestions() {
    const out = document.getElementById("interview-output");
    if (out) out.textContent = "Generating accessible interview questions...";
    try {
        const res = await fetch("/api/interview/questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: "Junior Data Analyst" })
        });
        const data = await res.json();
        currentInterviewQuestions = data.questions || [];
        let html = "<ul class='interview-list'>";
        data.questions.forEach((q, idx) => {
            html += `<li class='card mb-3' id='interview-card-${idx}'>
                <p><strong>[${q.category}]</strong> ${q.question}</p>
                <p><em>Simplified:</em> ${q.simplified}</p>
                <p><small>💡 Hint: ${q.hint}</small></p>
                <div class='btn-group mt-2 mb-2'>
                    <button type='button' class='btn btn-outline btn-sm' onclick='readAloud("${q.question.replace(/"/g, '\\"')}")'>🔊 Read Question</button>
                    <button type='button' class='btn btn-accent btn-sm' id='voice-answer-btn-${idx}' onclick='recordInterviewVoiceAnswer(${idx})'>🎤 Answer with Voice</button>
                </div>
                <div class='form-group mt-2'>
                    <textarea id='interview-answer-input-${idx}' class='form-control' rows='2' placeholder='Type or speak your answer...' aria-label='Your answer to question ${idx+1}'></textarea>
                    <button type='button' class='btn btn-primary btn-sm mt-2' onclick='submitInterviewAnswer(${idx})'>Submit Answer for Feedback</button>
                </div>
                <div id='interview-feedback-${idx}' class='result-box mt-2' style='display:none;'></div>
            </li>`;
        });
        html += "</ul>";
        if (out) out.innerHTML = html;
        announce("Interview questions loaded.");
    } catch(e) {
        if (out) out.textContent = "Error: " + e.message;
    }
}

async function recordInterviewVoiceAnswer(idx) {
    const btn = document.getElementById(`voice-answer-btn-${idx}`);
    const input = document.getElementById(`interview-answer-input-${idx}`);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Please type your answer in the box below, or use Google Chrome / Microsoft Edge for Speech Recognition.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    if (btn) btn.textContent = "🔴 Listening...";
    announce("Listening to your answer. Speak clearly.");

    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        if (input) input.value = transcript;
        if (btn) btn.textContent = "🎤 Answer with Voice";
        announce(`Recorded answer: ${transcript}`);
        await submitInterviewAnswer(idx);
    };

    recognition.onerror = () => {
        if (btn) btn.textContent = "🎤 Answer with Voice";
        announce("Could not hear answer clearly. You can type your answer in the box.");
    };

    recognition.onend = () => {
        if (btn) btn.textContent = "🎤 Answer with Voice";
    };

    recognition.start();
}

async function submitInterviewAnswer(idx) {
    const q = currentInterviewQuestions[idx];
    const input = document.getElementById(`interview-answer-input-${idx}`);
    const feedbackEl = document.getElementById(`interview-feedback-${idx}`);
    const answer = input?.value?.trim();

    if (!answer) {
        readAloud("Please speak or type an answer before requesting feedback.");
        return;
    }

    if (feedbackEl) {
        feedbackEl.style.display = "block";
        feedbackEl.textContent = "Analyzing your response with LangGraph interview coach...";
    }

    try {
        const res = await fetch("/api/interview/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                question: q ? q.question : "Data Analyst question",
                answer: answer
            })
        });
        const data = await res.json();
        const fb = data.data;
        const msg = fb.feedback || "Good response!";
        if (feedbackEl) {
            feedbackEl.innerHTML = `<h4>Evaluation Feedback:</h4><p>${msg.replace(/\n/g, '<br>')}</p><p class='text-success'><strong>${fb.encouragement || ''}</strong></p>`;
        }
        readAloud(msg.slice(0, 150));
        announce("Interview feedback ready.");
    } catch(e) {
        if (feedbackEl) feedbackEl.textContent = "Error: " + e.message;
    }
}

// ============================================================
// CONTEXTUAL JOB SEARCH AI ASSISTANT
// ============================================================
function toggleJobQuickAI() {
    const panel = document.getElementById("job-quick-ai-panel");
    if (!panel) return;
    const isHidden = panel.style.display === "none";
    panel.style.display = isHidden ? "block" : "none";
    if (isHidden) {
        document.getElementById("quick-ai-input")?.focus();
        announce("Contextual Job AI Assistant opened.");
    }
}

async function askQuickJobAI(presetQuery) {
    const inp = document.getElementById("quick-ai-input");
    const out = document.getElementById("quick-ai-output");
    const query = presetQuery || inp?.value?.trim();
    if (!query) return;
    if (inp && !presetQuery) inp.value = query;

    if (out) out.textContent = "Thinking...";
    try {
        const res = await fetch("/api/jobs/assistant-query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: query,
                job_context: {
                    title: "Junior Data Analyst",
                    company: "CogniCorp Technologies",
                    required_skills: ["Python", "SQL", "Power BI", "Data Analytics"],
                    accessibility_info: "Screen reader supported, wheelchair accessible"
                }
            })
        });
        const data = await res.json();
        const answer = data.data?.answer || "No response received.";
        if (out) out.innerHTML = answer.replace(/\n/g, "<br>");
        readAloud(answer);
    } catch(e) {
        if (out) out.textContent = "Error: " + e.message;
    }
}

// ============================================================
// ACCESSIBILITY SETTINGS SAVE
// ============================================================
async function saveAccessibilitySettings() {
    const payload = {
        voice_navigation: document.getElementById("set-voice-assist")?.checked,
        text_to_speech: document.getElementById("set-tts")?.checked,
        speech_to_text: document.getElementById("set-stt")?.checked,
        head_gestures: document.getElementById("set-head-gestures")?.checked,
        hand_gestures: document.getElementById("set-hand-gestures")?.checked,
        keyboard_navigation: document.getElementById("set-keyboard-nav")?.checked,
        dyslexia_mode: document.getElementById("set-dyslexia")?.checked,
        captions: document.getElementById("set-captions")?.checked,
        large_text: document.getElementById("set-large-text")?.checked,
        high_contrast: document.getElementById("set-high-contrast")?.checked,
        reduced_motion: document.getElementById("set-reduced-motion")?.checked,
        focus_mode: document.getElementById("set-focus-mode")?.checked
    };

    const res = await fetch("/api/profile/accessibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    applyAccessibilityProfileToUI(data.accessibility);
    const msg = document.getElementById("settings-save-msg");
    if (msg) {
        msg.textContent = "✓ Settings applied.";
        setTimeout(() => msg.textContent = "", 3000);
    }
    announce("Accessibility settings updated.");
}

// ============================================================
// SYSTEM / VERIFICATION
// ============================================================
async function testConnection() {
    const box = document.getElementById("conn-result");
    if (box) box.textContent = "Connecting to OpenRouter (qwen/qwen3.8-27b:free)...";
    try {
        const res = await fetch("/api/ai/test");
        const data = await res.json();
        if (box) box.textContent = JSON.stringify(data, null, 2);
        announce("OpenRouter test completed.");
    } catch(e) {
        if (box) box.textContent = "Connection error: " + e.message;
    }
}

// ============================================================
// GESTURE CONTROL — CONTINUOUS MEDIAPIPE
// ============================================================

/**
 * Start Gesture Control — opens camera, continuously sends frames to backend.
 * Uses requestAnimationFrame loop with 15 FPS throttle.
 * Temporal state machine: IDLE → CANDIDATE → CONFIRMED → EXECUTED → COOLDOWN → IDLE
 */
async function startGestureControl() {
    const video = document.getElementById("webcam-preview");
    const canvas = document.getElementById("gesture-canvas");
    const startBtn = document.getElementById("start-gesture-btn");
    const stopBtn = document.getElementById("stop-gesture-btn");
    const statusBar = document.getElementById("gesture-status-bar");
    const hudContainer = document.getElementById("gesture-hud-container");
    const visionOutput = document.getElementById("vision-output");

    if (!video || !canvas) {
        console.error("Webcam elements not found.");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, facingMode: "user" }
        });
        activeWebcamStream = stream;
        video.srcObject = stream;
        await new Promise(resolve => { video.onloadedmetadata = resolve; });

        if (startBtn) startBtn.style.display = "none";
        if (stopBtn) stopBtn.style.display = "inline-block";
        if (statusBar) statusBar.style.display = "flex";
        if (hudContainer) hudContainer.style.display = "flex";
        if (visionOutput) visionOutput.style.display = "block";

        gestureControlActive = true;
        gestureState.state = 'IDLE';

        // Start gesture processing loop
        gestureLoop(video, canvas);
        announce("Gesture control started. Camera is active. Use head nods or hand gestures to control Saarthi.");
    } catch(e) {
        if (visionOutput) visionOutput.textContent = "Camera access denied: " + e.message + "\n\nGesture simulation available in Developer Testing Tools below.";
        if (hudContainer) hudContainer.style.display = "flex";
        if (visionOutput) visionOutput.style.display = "block";
        announce("Camera access failed. Using gesture simulation mode.");
    }
}

function stopGestureControl() {
    gestureControlActive = false;
    if (gestureAnimationFrame) {
        cancelAnimationFrame(gestureAnimationFrame);
        gestureAnimationFrame = null;
    }
    if (activeWebcamStream) {
        activeWebcamStream.getTracks().forEach(t => t.stop());
        activeWebcamStream = null;
    }
    const video = document.getElementById("webcam-preview");
    if (video) video.srcObject = null;

    const startBtn = document.getElementById("start-gesture-btn");
    const stopBtn = document.getElementById("stop-gesture-btn");
    const statusBar = document.getElementById("gesture-status-bar");
    if (startBtn) startBtn.style.display = "inline-block";
    if (stopBtn) stopBtn.style.display = "none";
    if (statusBar) statusBar.style.display = "none";

    announce("Gesture control stopped.");
}

async function gestureLoop(video, canvas) {
    if (!gestureControlActive) return;

    const now = performance.now();
    if (now - lastGestureFrameTime >= GESTURE_FRAME_INTERVAL) {
        lastGestureFrameTime = now;

        // Capture frame from video to canvas
        const ctx = canvas.getContext("2d");
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Simulate head pose estimation
        // In production this would use MediaPipe FaceLandmarker
        // For now: send simulated neutral angles; the backend handles detection
        await processGestureFrame();
    }

    gestureAnimationFrame = requestAnimationFrame(() => gestureLoop(video, canvas));
}

// Temporal state machine — runs on each processed gesture
function updateGestureStateMachine(detectedGesture) {
    const now = performance.now();

    // Cooldown check
    if (gestureState.state === 'COOLDOWN') {
        if (now - gestureState.lastExecutedTime >= gestureState.COOLDOWN_DURATION) {
            gestureState.state = 'IDLE';
            gestureState.candidateGesture = null;
        } else {
            return; // Still cooling down
        }
    }

    if (detectedGesture === 'NONE' || !detectedGesture) {
        // Reset candidate if no gesture
        if (gestureState.state === 'CANDIDATE') {
            gestureState.state = 'IDLE';
            gestureState.candidateGesture = null;
        }
        return;
    }

    if (gestureState.state === 'IDLE') {
        gestureState.state = 'CANDIDATE';
        gestureState.candidateGesture = detectedGesture;
        gestureState.candidateStartTime = now;
    } else if (gestureState.state === 'CANDIDATE') {
        if (gestureState.candidateGesture !== detectedGesture) {
            // Different gesture — restart
            gestureState.candidateGesture = detectedGesture;
            gestureState.candidateStartTime = now;
        } else if (now - gestureState.candidateStartTime >= gestureState.HOLD_DURATION) {
            // Held long enough — execute!
            gestureState.state = 'EXECUTED';
            gestureState.lastExecutedTime = now;
            executeGestureFromStateMachine(detectedGesture);
            gestureState.state = 'COOLDOWN';
        }
    }
}

async function executeGestureFromStateMachine(gesture) {
    const hudGesture = document.getElementById("hud-last-gesture");
    const hudRoute = document.getElementById("hud-routed-command");
    const hudAction = document.getElementById("hud-app-action");
    const visionOutput = document.getElementById("vision-output");

    if (hudGesture) hudGesture.textContent = gesture;

    try {
        let endpoint, body;

        // Map detected gesture to backend format
        if (['HEAD_NOD', 'HEAD_SHAKE', 'TURN_LEFT', 'TURN_RIGHT', 'DOUBLE_NOD'].includes(gesture)) {
            endpoint = "/api/vision/head-gesture";
            // Send pre-computed angles for specific gestures
            const angleMap = {
                'HEAD_NOD': { pitch: 18.0, yaw: 0.0, roll: 0.0 },
                'HEAD_SHAKE': { pitch: 0.0, yaw: 22.0, roll: 0.0 },
                'TURN_LEFT': { pitch: 0.0, yaw: -22.0, roll: 0.0 },
                'TURN_RIGHT': { pitch: 0.0, yaw: 22.0, roll: 0.0 },
                'DOUBLE_NOD': { pitch: 18.0, yaw: 0.0, roll: 0.0 }
            };
            body = angleMap[gesture] || { pitch: 0.0, yaw: 0.0, roll: 0.0 };
        } else {
            // Hand gestures via command endpoint
            endpoint = "/api/vision/command";
            const cmdMap = {
                'THUMBS_UP': 'YES',
                'THUMBS_DOWN': 'NO',
                'OPEN_PALM': 'STOP',
                'FIST': 'CONFIRM',
                'ONE_FINGER': 'NEXT',
                'TWO_FINGERS': 'PREVIOUS',
                'WAVE': 'HELP',
                'PINCH': 'SELECT'
            };
            body = { command: cmdMap[gesture] || gesture };
        }

        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        const route = data.command_route;
        if (route) {
            if (hudRoute) hudRoute.textContent = route.command;
            if (hudAction) hudAction.textContent = route.action;
            if (visionOutput) visionOutput.textContent = `Gesture: ${gesture} → Command: ${route.command} → ${route.action}`;

            // Execute application action
            executeRoutedGestureAction(route);
        }
    } catch(e) {
        console.error("Gesture execution error:", e);
    }
}

async function processGestureFrame() {
    // This is called by the gesture loop.
    // In a full MediaPipe implementation, we would use FaceLandmarker here.
    // For now, we monitor for any continuous gesture triggers via the state machine.
    // The state machine only executes when a gesture is explicitly confirmed via
    // testGestureCommand (dev mode) or real MediaPipe landmarks.
    // Real MediaPipe integration would call updateGestureStateMachine(detectedGesture)
    // with the recognized gesture string.
}

// Developer Testing (moved to details section in HTML, kept function here)
async function testGestureCommand(gestureType) {
    const output = document.getElementById("gesture-test-output") ||
                   document.getElementById("vision-output");

    // Use temporal state machine even for testing
    await executeGestureFromStateMachine(gestureType);

    if (output) output.textContent = `Testing gesture: ${gestureType}. Check gesture status bar above.`;
}

function executeRoutedGestureAction(route) {
    const cmd = route.command;

    // Critical separation: OPEN_PALM → STOP_TTS (not CANCEL)
    if (cmd === "STOP") {
        stopAllActions();
        readAloud("Stop reading.");
        return;
    }

    // Context-aware: Audio Question Engine confirmation (highest interactive priority)
    if (window._aqePendingConfirm) {
        if (cmd === "YES" || cmd === "CONFIRM") {
            window._aqePendingConfirm(true);
            return;
        } else if (cmd === "NO" || cmd === "CANCEL") {
            window._aqePendingConfirm(false);
            return;
        }
        return; // Ignore navigation gestures during audio question confirmation
    }

    // Context-aware: during approval modal, only YES/NO/STOP
    const approvalModal = document.getElementById("approval-modal");
    if (approvalModal?.style.display !== "none") {
        if (cmd === "YES" || cmd === "CONFIRM") {
            handleActionApproval(true);
            return;
        } else if (cmd === "NO" || cmd === "CANCEL") {
            handleActionApproval(false);
            return;
        }
        // Other gestures ignored during approval
        return;
    }

    // Navigation commands
    switch (cmd) {
        case "NEXT":
            document.getElementById("tab-btn-jobsearch")?.click();
            readAloud("Next item.");
            break;
        case "PREVIOUS":
            document.getElementById("tab-btn-jobsearch")?.click();
            readAloud("Previous item.");
            break;
        case "HELP":
            document.getElementById("tab-btn-ai-assistant")?.click();
            readAloud("Opening AI Assistant.");
            break;
        case "CANCEL":
            readAloud("Action cancelled.");
            break;
        default:
            if (route.speech_announcement) {
                readAloud(route.speech_announcement);
            }
            break;
    }
}

// ============================================================
// FULL AUTOMATED DEMO RUNNER
// ============================================================
async function runAutomatedDemo() {
    const log = document.getElementById("demo-log");
    if (log) log.textContent = "🚀 Starting Complete Saarthi Hackathon Workflow Demo...\n";

    function step(msg) {
        if (log) {
            log.textContent += `✓ ${msg}\n`;
            log.scrollTop = log.scrollHeight;
        }
    }

    try {
        step("Step 1: Checking backend health & Qwen model (qwen/qwen3.8-27b:free)...");
        const h = await (await fetch("/api/health")).json();
        step(`Backend Healthy: Model=${h.model}`);

        step("Step 2: Performing declared accessibility onboarding (Low Vision + Dyslexia + Motor)...");
        const onb = await (await fetch("/api/profile/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                declared_needs: ["Low vision", "Dyslexia", "Motor disability"],
                additional_requirements: "High contrast and head gesture navigation preferred."
            })
        })).json();
        step(`Onboarding Adaptations: TTS=${onb.accessibility.text_to_speech}, Dyslexia=${onb.accessibility.dyslexia_mode}, HeadGestures=${onb.accessibility.head_gestures}`);
        applyAccessibilityProfileToUI(onb.accessibility);

        step("Step 3: Extracting candidate resume via PyMuPDF...");
        const res = await (await fetch("/api/resume/demo")).json();
        step(`Extracted Candidate: ${res.profile.name} (Skills: ${res.profile.skills.all_skills.slice(0, 4).join(', ')})`);

        step("Step 4: Evaluating profile completeness checklist...");
        const comp = await (await fetch("/api/profile/completeness")).json();
        step(`Completeness Score: ${comp.completeness.score}% (${comp.completeness.completed_count}/${comp.completeness.total_count} items verified)`);

        step("Step 5: Job Search Agent querying: 'Find remote data analyst internships'...");
        const search = await (await fetch("/api/jobs/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: "Find remote data analyst internships" })
        })).json();
        step(`Job Search Found: ${search.data.total_found} postings.`);
        step(`Related Role Suggested: ${search.data.related_roles[0].role} (${search.data.related_roles[0].reason.slice(0, 70)}...)`);

        step("Step 6: Running SentenceTransformer semantic matching & skills overlap...");
        const match = await (await fetch("/api/jobs/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        })).json();
        step(`Match Score: ${match.match.overall_match_score}% (Matched: ${match.match.matched_skills.slice(0, 3).join(', ')})`);

        step("Step 7: Simplifying job description into plain language sections...");
        const simp = await (await fetch("/api/jobs/simplify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: "Looking for Data Analyst to build ETL pipelines and Power BI dashboards..." })
        })).json();
        step(`JD Simplification: Headers=[${simp.data.headers_present.join(', ')}]`);

        step("Step 8: Explaining jargon word 'stakeholder'...");
        const exp = await (await fetch("/api/jobs/explain-term", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ term: "stakeholder" })
        })).json();
        step(`Plain Meaning: ${exp.data.explanation.slice(0, 80)}...`);

        step("Step 9: Testing Decoupled MediaPipe Command (HEAD NOD → YES → APPROVE)...");
        const headCmd = await (await fetch("/api/vision/head-gesture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pitch: 16.5, yaw: 0.0, roll: 0.0 })
        })).json();
        step(`Gesture: ${headCmd.gesture?.gesture} → Command: ${headCmd.command_route?.command} → Action: ${headCmd.command_route?.action}`);

        step("Step 10: Testing OPEN PALM → STOP TTS (Separate from Cancel)...");
        const stopCmd = await (await fetch("/api/vision/command", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: "STOP" })
        })).json();
        step(`STOP Command Mapped: ${stopCmd.command_route.command} → ${stopCmd.command_route.action}`);

        step("Step 11: Submitting application with explicit candidate confirmation (user_confirmed: true)...");
        const sub = await (await fetch("/api/dom/submit-application", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                company: "CogniCorp Technologies",
                position: "Junior Data Analyst / ML Associate",
                application_fields: { name: "Test User", email: "test@example.com" },
                user_confirmed: true
            })
        })).json();
        step(`Application Confirmed & Recorded: ID ${sub.application.id}, Status: ${sub.application.status}`);

        step("🎉 FULL SAARTHI END-TO-END DEMO COMPLETED SUCCESSFULLY!");
        announce("End to end demo completed successfully.");
        loadTrackerTable();
        loadProfileCompleteness();
    } catch(e) {
        if (log) log.textContent += `❌ Error during demo: ${e.message}\n`;
    }
}

// ============================================================
// INITIAL PROFILE LOAD
// ============================================================
async function loadInitialProfile() {
    try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (data.accessibility) {
            applyAccessibilityProfileToUI(data.accessibility);
        }
    } catch(e) {
        console.error("Initial profile load error:", e);
    }
}

// ============================================================
// AUDIO-FIRST QUESTION ENGINE
// For Blind / Low Vision users: reads questions via TTS,
// captures answers via STT, confirms with voice/gesture.
// ============================================================
class AudioQuestionEngine {
    constructor() {
        this.questions = [];
        this.currentIndex = 0;
        this.answers = {};
        this.active = false;
        this.onComplete = null;
        this.pendingAnswerText = "";
    }

    async start(questions, onComplete) {
        this.questions = questions;
        this.currentIndex = 0;
        this.answers = {};
        this.active = true;
        this.onComplete = onComplete;
        this._showUI();
        await this._askCurrentQuestion();
    }

    stop() {
        this.active = false;
        window._aqePendingConfirm = null;
        stopAllActions();
        const ui = document.getElementById("aqe-container");
        if (ui) ui.style.display = "none";
    }

    _showUI() {
        let c = document.getElementById("aqe-container");
        if (!c) {
            c = document.createElement("div");
            c.id = "aqe-container";
            c.className = "aqe-container";
            c.setAttribute("role", "region");
            c.setAttribute("aria-label", "Audio question interface");
            c.innerHTML = `
                <div class="aqe-card">
                    <div class="aqe-progress-bar"><div class="aqe-progress-fill" id="aqe-progress"></div></div>
                    <p class="aqe-question-num" id="aqe-question-num">Question 1</p>
                    <h3 class="aqe-question-text" id="aqe-question-text" aria-live="polite">Loading...</h3>
                    <div class="aqe-controls">
                        <input type="text" id="aqe-answer-input" class="form-control" placeholder="Type or speak your answer" aria-label="Your answer">
                        <div class="btn-group mt-2">
                            <button type="button" class="btn btn-outline btn-sm" onclick="audioQE.speakCurrentQuestion()">🔊 Re-read</button>
                            <button type="button" class="btn btn-accent btn-sm" id="aqe-speak-btn" onclick="audioQE.listenForAnswer()">🎤 Speak</button>
                            <button type="button" class="btn btn-primary btn-sm" onclick="audioQE.submitTextAnswer()">Submit →</button>
                            <button type="button" class="btn btn-outline btn-sm" onclick="audioQE.skipQuestion()">Skip</button>
                            <button type="button" class="btn btn-danger btn-sm" onclick="audioQE.stop()">Stop</button>
                        </div>
                    </div>
                    <div id="aqe-status" class="aqe-status" aria-live="polite"></div>
                    <div id="aqe-confirmation" class="aqe-confirmation" style="display:none;" role="alert">
                        <p id="aqe-confirm-text" class="aqe-confirm-q"></p>
                        <div class="btn-group mt-2">
                            <button type="button" class="btn btn-accent" onclick="audioQE.confirmAnswer(true)">✓ YES / Nod / 👍</button>
                            <button type="button" class="btn btn-outline" onclick="audioQE.confirmAnswer(false)">✗ NO / Shake / 👎</button>
                        </div>
                    </div>
                </div>
            `;
            const target = document.getElementById("ob3-build-section") || document.body;
            target.insertBefore(c, target.firstChild);
        }
        c.style.display = "block";
    }

    async _askCurrentQuestion() {
        if (!this.active) return;
        if (this.currentIndex >= this.questions.length) { this._finish(); return; }

        const q = this.questions[this.currentIndex];
        const total = this.questions.length;

        const numEl = document.getElementById("aqe-question-num");
        const textEl = document.getElementById("aqe-question-text");
        const inputEl = document.getElementById("aqe-answer-input");
        const statusEl = document.getElementById("aqe-status");
        const confirmEl = document.getElementById("aqe-confirmation");
        const progressEl = document.getElementById("aqe-progress");

        if (numEl) numEl.textContent = `Question ${this.currentIndex + 1} of ${total}`;
        if (textEl) textEl.textContent = q.text;
        if (inputEl) { inputEl.value = ""; inputEl.placeholder = q.placeholder || "Type or speak your answer"; }
        if (statusEl) statusEl.textContent = "";
        if (confirmEl) confirmEl.style.display = "none";
        if (progressEl) progressEl.style.width = `${(this.currentIndex / total) * 100}%`;

        await this._speakAndWait(`Question ${this.currentIndex + 1}. ${q.tts || q.text}`);
    }

    async speakCurrentQuestion() {
        const q = this.questions[this.currentIndex];
        if (q) await this._speakAndWait(q.tts || q.text);
    }

    async _speakAndWait(text) {
        return new Promise(resolve => {
            if (!("speechSynthesis" in window)) { resolve(); return; }
            window.speechSynthesis.cancel();
            const utt = new SpeechSynthesisUtterance(text);
            utt.rate = 0.95;
            utt.onend = resolve;
            utt.onerror = resolve;
            window.speechSynthesis.speak(utt);
        });
    }

    listenForAnswer() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            const st = document.getElementById("aqe-status");
            if (st) st.textContent = "Speech recognition not available. Please type your answer.";
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.continuous = false;

        const btn = document.getElementById("aqe-speak-btn");
        const st = document.getElementById("aqe-status");
        if (btn) btn.textContent = "🔴 Listening...";
        if (st) st.textContent = "Listening... speak now.";
        announce("Listening. Speak your answer.");

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript.trim();
            const inputEl = document.getElementById("aqe-answer-input");
            if (inputEl) inputEl.value = transcript;
            if (btn) btn.textContent = "🎤 Speak";
            if (st) st.textContent = `Heard: "${transcript}"`;
            this.pendingAnswerText = transcript;
            await this._speakAndWait(`I heard: ${transcript}. Is that correct?`);
            this._showConfirmation(transcript);
        };
        recognition.onerror = () => {
            if (btn) btn.textContent = "🎤 Speak";
            if (st) st.textContent = "Could not hear. Please try again or type.";
        };
        recognition.onend = () => { if (btn) btn.textContent = "🎤 Speak"; };
        recognition.start();
    }

    submitTextAnswer() {
        const inputEl = document.getElementById("aqe-answer-input");
        const answer = inputEl?.value?.trim();
        if (!answer) { readAloud("Please provide an answer or skip this question."); return; }
        this.pendingAnswerText = answer;
        this._showConfirmation(answer);
        this._speakAndWait(`Your answer is: ${answer}. Is that correct?`);
    }

    _showConfirmation(answerText) {
        const confirmEl = document.getElementById("aqe-confirmation");
        const confirmText = document.getElementById("aqe-confirm-text");
        if (confirmEl) confirmEl.style.display = "block";
        if (confirmText) confirmText.textContent = `"${answerText}" — Is this correct? (Say Yes / Nod / Thumbs Up)`;
        window._aqePendingConfirm = (confirmed) => this.confirmAnswer(confirmed);
    }

    async confirmAnswer(confirmed) {
        window._aqePendingConfirm = null;
        const confirmEl = document.getElementById("aqe-confirmation");
        if (confirmEl) confirmEl.style.display = "none";

        if (confirmed) {
            const q = this.questions[this.currentIndex];
            this.answers[q.field] = this.pendingAnswerText;
            await this._speakAndWait("Confirmed.");
            const st = document.getElementById("aqe-status");
            if (st) st.textContent = `Saved: ${this.pendingAnswerText}`;
            this.currentIndex++;
            setTimeout(() => this._askCurrentQuestion(), 500);
        } else {
            await this._speakAndWait("No problem. Please answer again.");
            const inputEl = document.getElementById("aqe-answer-input");
            if (inputEl) { inputEl.value = ""; inputEl.focus(); }
            const st = document.getElementById("aqe-status");
            if (st) st.textContent = "Please provide your answer again.";
        }
    }

    async skipQuestion() {
        await this._speakAndWait("Skipping this question.");
        this.currentIndex++;
        this._askCurrentQuestion();
    }

    async _finish() {
        this.active = false;
        await this._speakAndWait("All questions answered. Saving your profile.");
        const ui = document.getElementById("aqe-container");
        if (ui) ui.style.display = "none";
        try {
            await fetch("/api/profile/builder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(this._buildPayload())
            });
            readAloud("Profile saved. Moving to the next step.");
        } catch(e) { console.error("AQE profile save error:", e); }
        if (this.onComplete) this.onComplete(this.answers);
    }

    _buildPayload() {
        const a = this.answers;
        return {
            name: a.name || "",
            email: a.email || "",
            phone: a.phone || "",
            location: a.location || "",
            education: [{ degree: a.degree || "", institution: a.college || "", graduation_year: a.grad_year || "", marks_cgpa: a.cgpa || "" }],
            roles_interested_in: (a.roles || "").split(",").map(s => s.trim()).filter(Boolean),
            work_mode: a.work_mode || "Hybrid",
            skills: {
                technical_skills: (a.technical_skills || "").split(",").map(s => s.trim()).filter(Boolean),
                soft_skills: (a.soft_skills || "").split(",").map(s => s.trim()).filter(Boolean)
            },
            linkedin: a.linkedin || "", github: a.github || "", portfolio: a.portfolio || ""
        };
    }
}

// Global instance
const audioQE = new AudioQuestionEngine();

/** Profile questions for audio-first onboarding */
const PROFILE_QUESTIONS = [
    { field: "name",            text: "What is your full name?",                          tts: "Please tell me your full name.",                                                   placeholder: "e.g. Priya Sharma" },
    { field: "email",           text: "What is your email address?",                      tts: "What is your email address?",                                                      placeholder: "candidate@example.com" },
    { field: "phone",           text: "What is your phone number?",                       tts: "What is your phone number?",                                                       placeholder: "+91 9000000000" },
    { field: "location",        text: "Where are you located?",                           tts: "What city or region are you based in?",                                            placeholder: "City, State" },
    { field: "degree",          text: "What is your highest qualification?",              tts: "What is your highest educational qualification? For example, Bachelor of Technology.", placeholder: "e.g. B.Tech Computer Engineering" },
    { field: "college",         text: "Which college or university did you attend?",      tts: "Which college or university did you attend?",                                      placeholder: "e.g. PICT Pune" },
    { field: "technical_skills",text: "What are your technical skills?",                  tts: "Please list your technical skills separated by commas. For example: Python, SQL, Power BI.", placeholder: "Python, SQL, Power BI" },
    { field: "roles",           text: "What job roles are you interested in?",            tts: "What job roles are you interested in? For example: Data Analyst, Business Analyst.", placeholder: "Data Analyst, Business Analyst" },
    { field: "work_mode",       text: "Do you prefer Remote, Hybrid, or Onsite?",         tts: "Do you prefer Remote, Hybrid, or Onsite work?",                                   placeholder: "Remote / Hybrid / Onsite" },
    { field: "linkedin",        text: "What is your LinkedIn URL? (say skip if none)",    tts: "What is your LinkedIn profile URL? Say skip if you do not have one.",              placeholder: "linkedin.com/in/username" },
    { field: "github",          text: "What is your GitHub URL? (say skip if none)",      tts: "What is your GitHub profile URL? Say skip if you do not have one.",                placeholder: "github.com/username" }
];

/** Start audio-first profile building on page 3 for Blind/Low Vision users */
function startAudioFirstProfileBuilding() {
    selectResumeSetupOption("build");
    readAloud("I will now ask you questions to build your profile. You can speak or type each answer. Say skip to skip any question.");
    setTimeout(() => {
        audioQE.start(PROFILE_QUESTIONS, () => setTimeout(() => goToPage(4), 1500));
    }, 2500);
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    // Initialize all event listeners
    initTabSwitching();
    initAccessibilityToggles();
    initVoiceControl();

    // Check if onboarding was already completed
    const onboardingDone = localStorage.getItem('saarthi_onboarding_complete');
    if (onboardingDone === 'true') {
        // Skip onboarding, show main app directly
        const wrapper = document.getElementById("onboarding-wrapper");
        if (wrapper) wrapper.style.display = "none";
        showMainApp();
    } else {
        // Show onboarding
        const wrapper = document.getElementById("onboarding-wrapper");
        if (wrapper) {
            wrapper.style.display = "flex";
            goToPage(1);
        }

        // Read onboarding question aloud after a short delay
        setTimeout(() => {
            readAloud("Welcome to Saarthi. How can Saarthi make your experience easier? Select all that apply and press Continue.");
        }, 500);
    }

    // Keyboard: ob-need-card and ob-choice-card keyboard support
    document.querySelectorAll(".ob-need-card, .ob-choice-card").forEach(card => {
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                const checkbox = card.querySelector("input[type='checkbox']");
                const radio = card.querySelector("input[type='radio']");
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    card.classList.toggle("selected", checkbox.checked);
                }
                if (radio) {
                    radio.checked = true;
                    document.querySelectorAll(".ob-mode-card").forEach(c => c.classList.remove("selected"));
                    card.classList.add("selected");
                }
                e.preventDefault();
            }
        });
        card.addEventListener("click", () => {
            const checkbox = card.querySelector("input[type='checkbox']");
            if (checkbox) {
                card.classList.toggle("selected", checkbox.checked);
            }
            const radio = card.querySelector("input[type='radio']");
            if (radio) {
                document.querySelectorAll(".ob-mode-card").forEach(c => c.classList.remove("selected"));
                if (radio.checked) card.classList.add("selected");
            }
        });
    });
});
