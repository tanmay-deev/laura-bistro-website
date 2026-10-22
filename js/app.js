// ==============================================================================
// L'AURA BISTRO & BAR - MAIN FRONTEND APPLICATION
// ==============================================================================

import { getSupabaseClient, isSupabaseConfigured } from "./supabase.js";

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initMenuFilters();
  initScrollAnimations();
  initDateConstraints();
  initReservationForm();
  updateFooterYear();
});

// ==============================================================================
// 1. MOBILE NAVIGATION
// ==============================================================================
function initNavigation() {
  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu");

  if (!menuToggle || !navMenu) return;

  menuToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.textContent = isOpen ? "✕" : "☰";
  });

  // Close drawer on link click
  navMenu.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.textContent = "☰";
    });
  });
}

// ==============================================================================
// 2. MENU CATEGORY FILTERS
// ==============================================================================
function initMenuFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const dishCards = document.querySelectorAll(".dish-card");

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const category = btn.getAttribute("data-category");

      dishCards.forEach((card) => {
        if (category === "all" || card.getAttribute("data-category") === category) {
          card.style.display = "flex";
          setTimeout(() => {
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";
          }, 30);
        } else {
          card.style.opacity = "0";
          card.style.transform = "translateY(10px)";
          setTimeout(() => {
            card.style.display = "none";
          }, 200);
        }
      });
    });
  });
}

// ==============================================================================
// 3. SCROLL REVEAL ANIMATIONS
// ==============================================================================
function initScrollAnimations() {
  const revealElements = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealElements.forEach((el) => observer.observe(el));
  } else {
    // Fallback for older browsers
    revealElements.forEach((el) => el.classList.add("visible"));
  }
}

// ==============================================================================
// 4. DATE CONSTRAINTS (NO PAST DATES)
// ==============================================================================
function initDateConstraints() {
  const dateInput = document.getElementById("bookingDate");
  if (!dateInput) return;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  dateInput.min = `${yyyy}-${mm}-${dd}`;
  dateInput.value = `${yyyy}-${mm}-${dd}`;
}

// ==============================================================================
// 5. TOAST NOTIFICATIONS
// ==============================================================================
export function showToast(title, message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const icon = type === "success" ? "✓" : "⚠";

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <strong>${title}</strong>
      <p>${message}</p>
    </div>
  `;

  container.appendChild(toast);

  // Trigger entrance transition
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  // Auto remove after 5.5 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 5500);
}

// ==============================================================================
// 6. RESERVATION FORM HANDLING & SUPABASE INTEGRATION
// ==============================================================================
function initReservationForm() {
  const form = document.getElementById("reservationForm");
  const submitBtn = document.getElementById("submitBookingBtn");

  if (!form || !submitBtn) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Anti-spam honeypot verification
    const honeypot = form.elements["website_url"]?.value;
    if (honeypot && honeypot.trim() !== "") {
      console.warn("Spam submission blocked via honeypot.");
      return;
    }

    // 2. Client-side validation
    if (!form.checkValidity()) {
      showToast(
        "Missing Details",
        "Please fill in all required fields marked with an asterisk (*).",
        "error"
      );
      return;
    }

    // Extract form data
    const formData = new FormData(form);
    const reservationData = {
      customer_name: formData.get("customer_name")?.toString().trim(),
      customer_phone: formData.get("customer_phone")?.toString().trim(),
      customer_email: formData.get("customer_email")?.toString().trim() || null,
      booking_date: formData.get("booking_date"),
      booking_time: formData.get("booking_time"),
      guests: parseInt(formData.get("guests")?.toString() || "2", 10),
      occasion: formData.get("occasion")?.toString(),
      special_requests: formData.get("special_requests")?.toString().trim() || null,
      status: "pending",
    };

    // Update button to loading state
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Reserving your table...</span> <span style="display:inline-block; animation: spin 1s infinite linear">⟳</span>`;

    try {
      if (!isSupabaseConfigured()) {
        // If Supabase keys are still placeholder, inform user gracefully & save locally
        console.warn("Supabase not fully configured. Storing in local demo storage.");
        
        saveLocalDemoReservation(reservationData);

        showToast(
          "Table Reserved (Demo Mode)",
          `Welcome, ${reservationData.customer_name}! Your booking for ${reservationData.guests} guests on ${reservationData.booking_date} at ${reservationData.booking_time} has been registered. (Connect Supabase in js/supabase.js for live sync).`,
          "success"
        );
        form.reset();
        initDateConstraints();
        return;
      }

      // Initialize real Supabase client
      const supabase = await getSupabaseClient();

      // Insert reservation into Supabase `reservations` table
      const { data, error } = await supabase
        .from("reservations")
        .insert([reservationData])
        .select();

      if (error) {
        throw error;
      }

      // Success feedback
      showToast(
        "Reservation Confirmed!",
        `Thank you, ${reservationData.customer_name}. We have reserved your table for ${reservationData.guests} guests on ${reservationData.booking_date} at ${reservationData.booking_time}. Our concierge will be expecting you!`,
        "success"
      );

      form.reset();
      initDateConstraints();
    } catch (err) {
      console.error("Supabase booking error:", err);
      showToast(
        "Reservation Error",
        err.message || "Failed to submit reservation. Please check your Supabase credentials or table configuration.",
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}

// Fallback helper for preview before Supabase keys are pasted
function saveLocalDemoReservation(record) {
  try {
    const list = JSON.parse(localStorage.getItem("laura_demo_reservations") || "[]");
    list.unshift({ ...record, id: "demo-" + Date.now(), created_at: new Date().toISOString() });
    localStorage.setItem("laura_demo_reservations", JSON.stringify(list));
  } catch (e) {
    console.error("Local storage error:", e);
  }
}

// ==============================================================================
// 7. FOOTER YEAR
// ==============================================================================
function updateFooterYear() {
  const yearEl = document.getElementById("currentYear");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }
}
