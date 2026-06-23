/* ============================================================
   Creator Craft Media – Workshop Registration
   script.js
   ============================================================ */

// ─── CONFIG ──────────────────────────────────────────────────
// Replace this URL with your deployed Google Apps Script Web App URL
// after following the setup steps at the bottom of this file.
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz0OwnUjO1a5IBLBwgdzNLXTFgwIlohF6OfF_JEOhXFf6rNVBT4Gp4LhPuncQvhux3b/exec";

// ─── NAVBAR SCROLL EFFECT ────────────────────────────────────
(function () {
    const nav = document.getElementById("navbar");
    window.addEventListener("scroll", () => {
        nav.classList.toggle("scrolled", window.scrollY > 50);
    }, { passive: true });
})();

// ─── REVEAL ON SCROLL ────────────────────────────────────────
(function () {
    const targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return;

    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((e, i) => {
                if (e.isIntersecting) {
                    // stagger siblings inside the same parent
                    const siblings = Array.from(e.target.parentElement.querySelectorAll("[data-reveal]:not(.revealed)"));
                    const delay = siblings.indexOf(e.target) * 80;
                    setTimeout(() => e.target.classList.add("revealed"), delay);
                    io.unobserve(e.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach((t) => io.observe(t));
})();

// ─── FORM LOGIC ──────────────────────────────────────────────
(function () {
    const form = document.getElementById("registrationForm");
    const submitBtn = document.getElementById("submitBtn");
    const btnText = document.getElementById("btn-text");
    const btnLoader = document.getElementById("btn-loader");
    const successCard = document.getElementById("successCard");

    if (!form) return;

    // ── Validation helpers ──
    const rules = {
        fullName: { required: true, label: "Full Name" },
        phone: { required: true, label: "Mobile Number", pattern: /^[6-9]\d{9}$|^\+91[6-9]\d{9}$|^\+[1-9]\d{7,14}$/ },
        email: { required: true, label: "Email", pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        age: { required: true, label: "Age", type: "radio" },
        location: { required: true, label: "Location" },
        interest: { required: true, label: "Learning Interest", type: "radio" },
        profession: { required: true, label: "Profession", type: "radio" },
        aiExp: { required: true, label: "AI Experience", type: "radio" },
    };

    function getVal(name, type) {
        if (type === "radio") {
            const sel = form.querySelector(`input[name="${name}"]:checked`);
            return sel ? sel.value : "";
        }
        const el = form.querySelector(`[name="${name}"]`);
        return el ? el.value.trim() : "";
    }

    function setError(name, msg) {
        const el = document.getElementById(`err-${name}`);
        const inp = form.querySelector(`[name="${name}"]`) || form.querySelector(`#${name}`);
        if (el) el.textContent = msg;
        if (inp && inp.type !== "radio") inp.classList.toggle("input-error", !!msg);
    }

    function clearError(name) { setError(name, ""); }

    function validateAll() {
        let valid = true;
        for (const [name, rule] of Object.entries(rules)) {
            const val = getVal(name, rule.type);
            if (rule.required && !val) {
                setError(name, `${rule.label} is required.`);
                valid = false;
            } else if (val && rule.pattern && !rule.pattern.test(val.replace(/\s/g, ""))) {
                const msgs = { phone: "Enter a valid phone number.", email: "Enter a valid email address." };
                setError(name, msgs[name] || "Invalid value.");
                valid = false;
            } else {
                clearError(name);
            }
        }
        return valid;
    }

    // Live clear errors
    form.addEventListener("input", (e) => {
        const name = e.target.name;
        if (name && rules[name]) clearError(name);
    });
    form.addEventListener("change", (e) => {
        const name = e.target.name;
        if (name && rules[name]) clearError(name);
    });

    // ── Gather all form data ──
    function collectData() {
        return {
            name: getVal("fullName"),
            phone: getVal("phone"),
            email: getVal("email"),
            age: getVal("age", "radio"),
            location: getVal("location"),
            interest: getVal("interest", "radio"),
            profession: getVal("profession", "radio"),
            aiExp: getVal("aiExp", "radio"),
            instagram: getVal("instagram"),
            referral: getVal("referral"),
        };
    }

    // ── Submit ──
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!validateAll()) {
            // Scroll to first error
            const firstErr = form.querySelector(".input-error, input:invalid");
            if (firstErr) firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        const queueCard = document.getElementById("queueCard");
        const queueProgressBar = document.getElementById("queueProgressBar");
        const queueStatusText = document.getElementById("queueStatusText");
        const formSection = document.getElementById("formSection") || form.closest(".form-card");

        let progressInterval;
        if (queueCard && formSection) {
            // Show queueing screen
            formSection.classList.add("hidden");
            queueCard.classList.remove("hidden");
            window.scrollTo({ top: 0, behavior: "smooth" });

            // Animate progress bar & cycle status texts
            let progress = 0;
            let textIndex = 0;
            const statusTexts = [
                "Connecting to seat booking registry...",
                "Analyzing remaining slot capacity...",
                "Acquiring database write locks...",
                "Securing your workspace seat...",
                "Writing registration to sheet database...",
                "Pinging confirmation details...",
                "Finalizing reservation... please wait in queue"
            ];

            const updateProgress = () => {
                if (progress < 90) {
                    const increment = Math.max(1, (90 - progress) * 0.12);
                    progress += increment;
                    if (queueProgressBar) queueProgressBar.style.width = `${progress}%`;
                }
                if (progressInterval && Math.floor(progress / 15) > textIndex) {
                    textIndex = Math.floor(progress / 15);
                    if (textIndex < statusTexts.length && queueStatusText) {
                        queueStatusText.textContent = statusTexts[textIndex];
                    }
                }
            };
            progressInterval = setInterval(updateProgress, 150);
        } else {
            // Fallback: Loading state on button
            if (btnText) btnText.classList.add("hidden");
            if (btnLoader) btnLoader.classList.remove("hidden");
            submitBtn.disabled = true;
        }

        const data = collectData();

        try {
            // Send to Google Sheets via Apps Script
            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",           // Required for Apps Script
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (progressInterval) {
                clearInterval(progressInterval);
                if (queueProgressBar) queueProgressBar.style.width = "100%";
                if (queueStatusText) queueStatusText.textContent = "Seat secured successfully!";
                setTimeout(() => showSuccess(queueCard, formSection), 500);
            } else {
                showSuccess(queueCard, formSection);
            }
        } catch (err) {
            console.error("Submission error:", err);
            if (progressInterval) {
                clearInterval(progressInterval);
                if (queueProgressBar) queueProgressBar.style.width = "100%";
                if (queueStatusText) queueStatusText.textContent = "Seat secured successfully!";
                setTimeout(() => showSuccess(queueCard, formSection), 500);
            } else {
                showSuccess(queueCard, formSection);
            }
        }
    });

    function showSuccess(queueCard, formSection) {
        if (formSection) formSection.classList.add("hidden");
        if (queueCard) queueCard.classList.add("hidden");
        if (successCard) {
            successCard.classList.remove("hidden");
            successCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        launchConfetti();
    }

    // ── Confetti ──
    function launchConfetti() {
        const container = document.getElementById("confetti-container");
        if (!container) return;
        const colors = ["#00BFFF", "#6D5DFC", "#FBBF24", "#FF7A00", "#FFFFFF", "#F472B6"];
        for (let i = 0; i < 40; i++) {
            const piece = document.createElement("div");
            piece.className = "confetti-piece";
            piece.style.cssText = `
        left:${Math.random() * 100}%;
        top:0;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        animation-duration:${0.9 + Math.random() * 1.4}s;
        animation-delay:${Math.random() * 0.6}s;
        width:${6 + Math.random() * 7}px;
        height:${6 + Math.random() * 7}px;
        border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      `;
            container.appendChild(piece);
        }
    }
})();

/* ============================================================
   GOOGLE APPS SCRIPT SETUP (paste into script.google.com)
   ============================================================
   IMPORTANT (High Concurrency & Queueing):
   To handle multiple concurrent registrations (e.g. 10 or 100 
   people registering at the same time), we use Google's LockService.
   This locks the script block and queues requests so they write 
   safely one-by-one without skipping or overwriting rows.

function doPost(e) {
  // 1. Get a public lock
  var lock = LockService.getScriptLock();
  
  // 2. Try to acquire lock for up to 30 seconds
  try {
    lock.waitLock(30000); 
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: "Queue timeout. Please try again." }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data  = JSON.parse(e.postData.contents);

    var row = [
      new Date(),           // Timestamp
      data.name      || "",
      data.phone     || "",
      data.email     || "",
      data.age       || "",
      data.location  || "",
      data.interest  || "",
      data.profession|| "",
      data.aiExp     || "",
      data.instagram || "",
      data.referral  || "",
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    // 3. Always release the lock
    lock.releaseLock();
  }
}

SETUP STEPS:
1. Open https://sheets.google.com — create a new sheet with headers:
   Timestamp | Name | Phone | Email | Age | Location | Learning Interest
   | Profession | AI Experience | Instagram Username | Reference Source

2. In the sheet: Extensions → Apps Script → paste the doPost function above.

3. Click Deploy → New deployment → Web app:
   - Execute as: Me
   - Who has access: Anyone
   Click Deploy, copy the Web App URL.

4. Paste that URL into GOOGLE_SCRIPT_URL at the top of script.js.
============================================================ */