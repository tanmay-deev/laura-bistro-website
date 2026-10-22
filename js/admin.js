// ==============================================================================
// L'AURA BISTRO - STAFF DASHBOARD & SUPABASE AUTH LOGIC
// ==============================================================================

import { getSupabaseClient, isSupabaseConfigured } from "./supabase.js";

let allReservations = [];
let currentFilter = "all";
let searchQuery = "";
let isSignUpMode = false;
let supabaseClient = null;
let hasLoadedReservations = false;
let isLoading = false;

document.addEventListener("DOMContentLoaded", async () => {
  initAuthToggle();
  initAuthForm();
  initSignOut();
  initTableControls();

  await checkAuthState();
});

// ==============================================================================
// 1. AUTH STATE CHECK
// ==============================================================================
async function checkAuthState() {
  if (!isSupabaseConfigured()) {
    console.info("Supabase is in demo mode.");
    const demoUser = localStorage.getItem("laura_demo_session");
    if (demoUser) {
      showDashboardView(JSON.parse(demoUser));
    } else {
      showAuthView();
    }
    return;
  }

  try {
    // Single shared client
    supabaseClient = await getSupabaseClient();

    // Listen to auth state updates
    supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log("Supabase Auth Event:", event);
      if (session?.user) {
        showDashboardView(session.user);
      } else {
        showAuthView();
      }
    });

    // Initial session check
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) {
      showDashboardView(session.user);
    } else {
      showAuthView();
    }
  } catch (err) {
    console.error("Auth check failed:", err);
    showAuthView();
  }
}

// Toggle between Login & Signup UI
function initAuthToggle() {
  const toggleBtn = document.getElementById("authToggleBtn");
  const authTitle = document.getElementById("authTitle");
  const authSubtitle = document.getElementById("authSubtitle");
  const authSubmitBtn = document.getElementById("authSubmitBtn");
  const authTogglePrompt = document.getElementById("authTogglePrompt");

  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    isSignUpMode = !isSignUpMode;
    if (isSignUpMode) {
      authTitle.textContent = "Create Staff Account";
      authSubtitle.textContent = "Sign up with your restaurant staff email to manage reservations.";
      authSubmitBtn.textContent = "Register Staff Account";
      authTogglePrompt.textContent = "Already have an account?";
      toggleBtn.textContent = "Sign in here";
    } else {
      authTitle.textContent = "Staff Sign In";
      authSubtitle.textContent = "Enter your Supabase staff credentials to access the table reservations console.";
      authSubmitBtn.textContent = "Sign In";
      authTogglePrompt.textContent = "Need a new staff account?";
      toggleBtn.textContent = "Create an account";
    }
  });
}

// ==============================================================================
// 2. SIGN IN / SIGN UP FORM
// ==============================================================================
function initAuthForm() {
  const form = document.getElementById("authForm");
  const submitBtn = document.getElementById("authSubmitBtn");

  if (!form || !submitBtn) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;

    if (!email || !password) return;

    submitBtn.disabled = true;
    submitBtn.textContent = isSignUpMode ? "Registering..." : "Signing In...";

    try {
      if (!isSupabaseConfigured()) {
        const mockUser = { email, id: "demo-user-123" };
        localStorage.setItem("laura_demo_session", JSON.stringify(mockUser));
        showToast("Demo Mode", `Logged in as ${email}.`, "success");
        showDashboardView(mockUser);
        return;
      }

      const client = supabaseClient || await getSupabaseClient();

      if (isSignUpMode) {
        const { data, error } = await client.auth.signUp({ email, password });
        if (error) throw error;

        showToast(
          "Staff Account Created!",
          data.session ? "You are now logged in." : "Account created. Please sign in.",
          "success"
        );
        if (data.session?.user) {
          showDashboardView(data.session.user);
        }
      } else {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;

        showToast("Welcome Back", "Signed in successfully.", "success");
        showDashboardView(data.user);
      }
    } catch (err) {
      console.error("Auth error:", err);
      showToast("Authentication Failed", err.message || "Invalid email or password.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isSignUpMode ? "Register Staff Account" : "Sign In";
    }
  });
}

// ==============================================================================
// 3. SIGN OUT
// ==============================================================================
function initSignOut() {
  const signOutBtn = document.getElementById("signOutBtn");
  if (!signOutBtn) return;

  signOutBtn.addEventListener("click", async () => {
    try {
      if (isSupabaseConfigured() && supabaseClient) {
        await supabaseClient.auth.signOut();
      } else {
        localStorage.removeItem("laura_demo_session");
      }
      showToast("Signed Out", "You have been logged out of the staff console.", "success");
      showAuthView();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  });
}

function showAuthView() {
  hasLoadedReservations = false;
  document.getElementById("authView").style.display = "flex";
  document.getElementById("dashboardView").style.display = "none";
  document.getElementById("loggedInUserControls").style.display = "none";
}

function showDashboardView(user) {
  document.getElementById("authView").style.display = "none";
  document.getElementById("dashboardView").style.display = "block";
  document.getElementById("loggedInUserControls").style.display = "flex";
  document.getElementById("userEmailBadge").textContent = user.email || "Staff Member";

  // Prevent multiple executions / flickering
  if (!hasLoadedReservations) {
    hasLoadedReservations = true;
    loadReservations();
  }
}

// ==============================================================================
// 4. FETCH RESERVATIONS & METRICS
// ==============================================================================
async function loadReservations() {
  if (isLoading) return;
  isLoading = true;

  const tableBody = document.getElementById("reservationsTableBody");
  tableBody.innerHTML = `
    <tr>
      <td colspan="7" class="empty-state">
        <div class="empty-state-icon">⟳</div>
        <p>Loading table bookings...</p>
      </td>
    </tr>
  `;

  try {
    if (!isSupabaseConfigured()) {
      allReservations = JSON.parse(localStorage.getItem("laura_demo_reservations") || "[]");
    } else {
      const client = supabaseClient || await getSupabaseClient();
      const { data, error } = await client
        .from("reservations")
        .select("*")
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true });

      if (error) throw error;
      allReservations = data || [];
    }

    updateMetrics(allReservations);
    renderTable();
  } catch (err) {
    console.error("Failed to load reservations:", err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state" style="color: var(--status-cancelled);">
          <div class="empty-state-icon">⚠️</div>
          <p>Failed to load reservations: ${err.message}</p>
        </td>
      </tr>
    `;
  } finally {
    isLoading = false;
  }
}

function updateMetrics(list) {
  const todayStr = new Date().toISOString().split("T")[0];

  const total = list.length;
  const todayCount = list.filter(r => r.booking_date === todayStr).length;
  const pendingCount = list.filter(r => r.status === "pending").length;
  const confirmedCount = list.filter(r => r.status === "confirmed").length;

  document.getElementById("metricTotal").textContent = total;
  document.getElementById("metricToday").textContent = todayCount;
  document.getElementById("metricPending").textContent = pendingCount;
  document.getElementById("metricConfirmed").textContent = confirmedCount;
}

// ==============================================================================
// 5. RENDER TABLE & ACTIONS
// ==============================================================================
function renderTable() {
  const tableBody = document.getElementById("reservationsTableBody");

  const filtered = allReservations.filter(res => {
    const matchesFilter = currentFilter === "all" || res.status === currentFilter;
    const nameMatch = res.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = res.customer_phone?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && (nameMatch || phoneMatch);
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-state-icon">🍽️</div>
          <p>No reservations found matching your criteria.</p>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(item => {
    return `
      <tr data-id="${item.id}">
        <td>
          <span class="cust-name">${escapeHtml(item.customer_name)}</span>
          <span class="cust-phone">${escapeHtml(item.customer_phone)} ${item.customer_email ? `• ${escapeHtml(item.customer_email)}` : ''}</span>
        </td>
        <td>
          <strong>${item.booking_date}</strong><br>
          <span style="color: var(--accent-gold); font-size: 0.85rem;">${item.booking_time}</span>
        </td>
        <td>
          <strong>${item.guests}</strong> ${item.guests === 1 ? 'Guest' : 'Guests'}
        </td>
        <td>
          <span style="font-size: 0.85rem;">${escapeHtml(item.occasion || 'Dining')}</span>
        </td>
        <td style="max-width: 200px;">
          <span style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(item.special_requests || 'None')}</span>
        </td>
        <td>
          <span class="badge badge-${item.status || 'pending'}">${item.status || 'pending'}</span>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <select class="status-change-select" data-id="${item.id}">
              <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="confirmed" ${item.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
            <button class="btn-delete-row" data-id="${item.id}" title="Delete Reservation">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  attachRowEventListeners();
}

function attachRowEventListeners() {
  document.querySelectorAll(".status-change-select").forEach(select => {
    select.addEventListener("change", async (e) => {
      const id = e.target.getAttribute("data-id");
      const newStatus = e.target.value;
      await updateReservationStatus(id, newStatus);
    });
  });

  document.querySelectorAll(".btn-delete-row").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = btn.getAttribute("data-id");
      if (confirm("Are you sure you want to remove this reservation?")) {
        await deleteReservation(id);
      }
    });
  });
}

async function updateReservationStatus(id, newStatus) {
  try {
    if (!isSupabaseConfigured()) {
      allReservations = allReservations.map(r => r.id === id ? { ...r, status: newStatus } : r);
      updateMetrics(allReservations);
      renderTable();
      showToast("Updated", `Reservation marked as ${newStatus}.`, "success");
      return;
    }

    const client = supabaseClient || await getSupabaseClient();
    const { error } = await client
      .from("reservations")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) throw error;

    showToast("Status Updated", `Reservation marked as ${newStatus}.`, "success");
    await loadReservations();
  } catch (err) {
    console.error("Update error:", err);
    showToast("Update Failed", err.message, "error");
  }
}

async function deleteReservation(id) {
  try {
    if (!isSupabaseConfigured()) {
      allReservations = allReservations.filter(r => r.id !== id);
      updateMetrics(allReservations);
      renderTable();
      showToast("Deleted", "Reservation removed.", "success");
      return;
    }

    const client = supabaseClient || await getSupabaseClient();
    const { error } = await client
      .from("reservations")
      .delete()
      .eq("id", id);

    if (error) throw error;

    showToast("Deleted", "Reservation successfully removed.", "success");
    await loadReservations();
  } catch (err) {
    console.error("Delete error:", err);
    showToast("Delete Failed", err.message, "error");
  }
}

// ==============================================================================
// 6. SEARCH & FILTER CONTROLS
// ==============================================================================
function initTableControls() {
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const refreshBtn = document.getElementById("refreshBtn");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      renderTable();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", (e) => {
      currentFilter = e.target.value;
      renderTable();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      await loadReservations();
      showToast("Refreshed", "Reservation list refreshed from database.", "success");
    });
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(title, message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icon = type === "success" ? "✓" : "⚠";

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(message)}</p>
    </div>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}
