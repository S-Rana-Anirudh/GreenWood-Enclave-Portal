// Escape saved text before placing it in an HTML table.
function escapeAdminText(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Format booking dates and time slots for the administrator tables.
function formatAdminBookingDate(date, slot) {
  var dateText = date ? new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }) : "Date not set";
  var slotNames = {
    morning: "09:00–12:00",
    afternoon: "13:00–16:00",
    evening: "17:00–21:00"
  };
  return dateText + ", " + (slotNames[slot] || slot || "Time not set");
}

// Draw the pending requests and complete booking history from shared storage.
function renderAdminBookings() {
  var bookings = typeof getBookings === "function" ? getBookings() : [];
  var pendingBody = document.querySelector("#pending-requests tbody");
  var historyBody = document.querySelector("#all-bookings-history tbody");
  var pendingMetric = document.querySelector(".admin-metrics .metric-card .metric-value");
  var pendingBookings = bookings.filter(function (booking) {
    return booking.status.toLowerCase() === "pending";
  });

  if (pendingBody) {
    pendingBody.innerHTML = pendingBookings.map(function (booking) {
      return '<tr data-booking-id="' + escapeAdminText(booking.id) + '">'
        + "<td>" + escapeAdminText(booking.id) + "</td>"
        + "<td>" + escapeAdminText(booking.resident) + ", " + escapeAdminText(booking.flat) + "</td>"
        + "<td>" + escapeAdminText(booking.resource) + "</td>"
        + "<td>" + escapeAdminText(formatAdminBookingDate(booking.date, booking.slot)) + "</td>"
        + "<td>" + escapeAdminText(booking.purpose) + "</td>"
        + '<td><span class="badge badge-safe">No Conflict</span></td>'
        + '<td><button class="btn-approve" type="button">Approve</button> <button class="btn-reject" type="button">Reject</button></td>'
        + "</tr>";
    }).join("");
  }

  if (historyBody) {
    historyBody.innerHTML = bookings.map(function (booking) {
      var status = booking.status.toLowerCase();
      var badgeClass = status === "approved" ? "badge-approved"
        : status === "pending" ? "badge-pending"
          : status === "completed" ? "badge-completed"
            : "badge-rejected";
      var note = status === "completed" ? "Completed reservation" : "Reservation record";

      return '<tr data-booking-id="' + escapeAdminText(booking.id) + '">'
        + "<td>" + escapeAdminText(booking.id) + "</td>"
        + "<td>" + escapeAdminText(booking.resident) + ", " + escapeAdminText(booking.flat) + "</td>"
        + "<td>" + escapeAdminText(booking.resource) + "</td>"
        + "<td>" + escapeAdminText(formatAdminBookingDate(booking.date, booking.slot)) + "</td>"
        + "<td>" + note + (booking.purpose ? ": " + escapeAdminText(booking.purpose) : "") + "</td>"
        + '<td><span class="badge ' + badgeClass + '">' + escapeAdminText(booking.status) + "</span></td></tr>";
    }).join("");
  }

  if (pendingMetric) {
    pendingMetric.textContent = String(pendingBookings.length);
  }
}

renderAdminBookings();

// Save the selected approval decision so it is visible on resident pages.
var pendingRequestSection = document.querySelector("#pending-requests");

if (pendingRequestSection) {
  pendingRequestSection.addEventListener("click", function (event) {
    var decisionButton = event.target.closest(".btn-approve, .btn-reject");
    if (!decisionButton) {
      return;
    }

    var row = decisionButton.closest("tr");
    var bookingId = row.getAttribute("data-booking-id");
    var bookings = getBookings();
    var newStatus = decisionButton.classList.contains("btn-approve") ? "Approved" : "Rejected";

    for (var index = 0; index < bookings.length; index += 1) {
      if (bookings[index].id === bookingId) {
        bookings[index].status = newStatus;
      }
    }

    saveBookings(bookings);
    renderAdminBookings();
  });
}

// Save a resource record when an administrator adds or edits a row.
function saveResourceRecord(resourceName, category, status, deposit, oldName) {
  if (typeof getResources === "function" && typeof saveResources === "function") {
    var resources = getResources();
    var resourceWasUpdated = false;

    for (var index = 0; index < resources.length; index += 1) {
      if (resources[index].name === oldName || (!oldName && resources[index].name === resourceName)) {
        resources[index] = {
          name: resourceName,
          category: category,
          status: status,
          deposit: Number(deposit)
        };
        resourceWasUpdated = true;
      }
    }

    if (!resourceWasUpdated) {
      resources.push({
        name: resourceName,
        category: category,
        status: status,
        deposit: Number(deposit)
      });
    }

    saveResources(resources);
  }
}

// Add a resource row or replace the resource currently being edited.
var resourceForm = document.querySelector("#resource-crud-form");
var resourceTableBody = document.querySelector("#manage-resources .existing-resources-section tbody");
var rowBeingEdited = null;
var originalResourceName = "";

if (resourceForm && resourceTableBody) {
  resourceForm.addEventListener("submit", function (event) {
    event.preventDefault();

    var resourceName = document.querySelector("#resource-name").value.trim();
    var categoryInput = document.querySelector("#resource-category");
    var statusInput = document.querySelector("#resource-status");
    var category = categoryInput.value;
    var status = statusInput.value;
    var deposit = document.querySelector("#deposit-fee").value;
    var categoryLabel = categoryInput.options[categoryInput.selectedIndex].text;
    var statusLabel = statusInput.options[statusInput.selectedIndex].text;
    var rowHtml = "<td>" + escapeAdminText(resourceName) + "</td>"
      + "<td>" + escapeAdminText(categoryLabel) + "</td>"
      + "<td>" + escapeAdminText(statusLabel) + "</td>"
      + "<td>₹" + escapeAdminText(deposit) + "</td>"
      + '<td><button class="btn-edit" type="button">Edit</button> <button class="btn-delete" type="button">Remove</button></td>';

    if (rowBeingEdited) {
      rowBeingEdited.innerHTML = rowHtml;
    } else {
      var newRow = document.createElement("tr");
      newRow.innerHTML = rowHtml;
      resourceTableBody.appendChild(newRow);
    }

    saveResourceRecord(resourceName, category, status, deposit, originalResourceName);
    rowBeingEdited = null;
    originalResourceName = "";
    resourceForm.reset();
  });
}

// Use one listener to handle Edit and Remove buttons, including new rows.
var resourceManagement = document.querySelector("#manage-resources");

if (resourceManagement) {
  resourceManagement.addEventListener("click", function (event) {
    var clickedButton = event.target.closest(".btn-delete, .btn-edit");

    if (!clickedButton) {
      return;
    }

    var row = clickedButton.closest("tr");
    var resourceName = row.cells[0].textContent.trim();

    if (clickedButton.classList.contains("btn-delete")) {
      if (confirm("Remove this resource from the community catalogue?")) {
        row.remove();

        if (typeof getResources === "function" && typeof saveResources === "function") {
          var resources = getResources();
          var remainingResources = [];
          resources.forEach(function (resource) {
            if (resource.name !== resourceName) {
              remainingResources.push(resource);
            }
          });
          saveResources(remainingResources);
        }
      }
    } else if (resourceForm) {
      rowBeingEdited = row;
      originalResourceName = resourceName;
      document.querySelector("#resource-name").value = resourceName;
      document.querySelector("#resource-category").value = row.cells[1].textContent.trim().toLowerCase();
      document.querySelector("#resource-status").value = row.cells[2].textContent.trim().toLowerCase().replace(/ /g, "-");
      document.querySelector("#deposit-fee").value = row.cells[3].textContent.replace("₹", "").trim();
      document.querySelector("#resource-name").focus();
    }
  });
}

// Filter booking history using the selected status value.
var bookingHistoryFilter = document.querySelector("#all-bookings-history #booking-status-filter");

if (bookingHistoryFilter) {
  bookingHistoryFilter.addEventListener("change", function () {
    var selectedStatus = bookingHistoryFilter.value.toLowerCase();
    var historyRows = document.querySelectorAll("#all-bookings-history tbody tr");

    historyRows.forEach(function (row) {
      var rowStatus = row.querySelector(".badge").textContent.toLowerCase();
      row.style.display = selectedStatus === "all" || rowStatus === selectedStatus ? "" : "none";
    });
  });
}

// Confirm that updated community rules were submitted.
var rulesManagementForm = document.querySelector("#rules-management-form");

if (rulesManagementForm) {
  rulesManagementForm.addEventListener("submit", function (event) {
    event.preventDefault();
    alert("Community usage rules and borrowing limits updated successfully.");
  });
}
