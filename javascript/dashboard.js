// Escape booking text before placing it in the reservations table.
function escapeDashboardText(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Format a saved date and time slot for the resident table.
function formatDashboardDate(date, slot) {
  var dateText = date ? new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }) : "Date not set";
  var slotNames = {
    morning: "9:00 AM–12:00 PM",
    afternoon: "1:00 PM–4:00 PM",
    evening: "5:00 PM–9:00 PM"
  };
  return dateText + ", " + (slotNames[slot] || slot || "Time not set");
}

// Load Alex Rivera's saved bookings and refresh the dashboard table and metrics.
function renderDashboardBookings() {
  var bookings = typeof getBookings === "function" ? getBookings() : [];
  var residentBookings = bookings.filter(function (booking) {
    return booking.resident === "Alex Rivera";
  });
  var tableBody = document.querySelector("#bookings tbody");
  var metricValues = document.querySelectorAll(".metrics-grid .metric-card .metric-value");
  var activeCount = 0;
  var pendingCount = 0;

  residentBookings.forEach(function (booking) {
    var status = booking.status.toLowerCase();
    if (status === "approved" || status === "pending") {
      activeCount += 1;
    }
    if (status === "pending") {
      pendingCount += 1;
    }
  });

  if (metricValues[0]) {
    metricValues[0].textContent = String(activeCount);
  }
  if (metricValues[1]) {
    metricValues[1].textContent = String(pendingCount);
  }

  if (tableBody) {
    tableBody.innerHTML = residentBookings.map(function (booking) {
      var status = booking.status.toLowerCase();
      var badgeClass = status === "approved" ? "badge--approved"
        : status === "pending" ? "badge--pending"
          : status === "completed" ? "badge-completed" : "badge-cancelled";
      var categoryName = booking.category === "spaces" ? "Community Space"
        : booking.category === "tools" ? "Shared Equipment"
          : booking.category === "sports" ? "Sports &amp; Recreation" : "Community Resource";
      var canCancel = status === "approved" || status === "pending";

      return "<tr data-booking-id=\"" + escapeDashboardText(booking.id) + "\">"
        + "<td>" + escapeDashboardText(booking.resource) + "</td>"
        + "<td>" + categoryName + "</td>"
        + "<td>" + escapeDashboardText(formatDashboardDate(booking.date, booking.slot)) + "</td>"
        + '<td><span class="badge ' + badgeClass + '">' + escapeDashboardText(booking.status) + "</span></td>"
        + '<td><a class="button button--secondary" href="#bookings" data-view-pass>View Pass</a> '
        + (canCancel ? '<button class="button button--text" type="button">Cancel</button>' : '<span class="action-unavailable">—</span>')
        + "</td></tr>";
    }).join("");
  }
}

renderDashboardBookings();

// Cancel a saved booking or show its resident entry-pass details.
var reservationTableBody = document.querySelector("#bookings tbody");

if (reservationTableBody) {
  reservationTableBody.addEventListener("click", function (event) {
    var actionButton = event.target.closest("button, [data-view-pass]");

    if (!actionButton) {
      return;
    }

    var row = actionButton.closest("tr");
    var bookingId = row.getAttribute("data-booking-id");
    var bookings = getBookings();
    var selectedBooking = null;

    for (var index = 0; index < bookings.length; index += 1) {
      if (bookings[index].id === bookingId) {
        selectedBooking = bookings[index];
      }
    }

    if (!selectedBooking) {
      return;
    }

    if (actionButton.hasAttribute("data-view-pass")) {
      alert("Booking Pass\nResident: " + selectedBooking.resident + "\nFlat: " + selectedBooking.flat
        + "\nResource: " + selectedBooking.resource + "\nStatus: " + selectedBooking.status);
      return;
    }

    if (confirm("Are you sure you want to cancel this reservation?")) {
      selectedBooking.status = "Cancelled";
      saveBookings(bookings);
      renderDashboardBookings();
    }
  });
}
