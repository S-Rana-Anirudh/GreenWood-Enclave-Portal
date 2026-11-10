// Escape saved booking details before adding them to the page.
function escapeBookingText(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Turn saved date and slot values into readable booking details.
function formatBookingDate(date, slot) {
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

// Match the simplified filter tabs to the full status saved for each booking.
function getBookingFilterStatus(status) {
  var normalizedStatus = status.toLowerCase();
  if (normalizedStatus === "completed" || normalizedStatus === "cancelled") {
    return "past";
  }
  if (normalizedStatus.indexOf("reject") === 0) {
    return "rejected";
  }
  return normalizedStatus;
}

// Render Alex Rivera's saved bookings into the active cards and history table.
function renderResidentBookings() {
  var allBookings = typeof getBookings === "function" ? getBookings() : [];
  var residentBookings = allBookings.filter(function (booking) {
    return booking.resident === "Alex Rivera";
  });
  var activeList = document.querySelector(".active-bookings-list");
  var historyBody = document.querySelector(".bookings-history-table tbody");

  if (activeList) {
    activeList.querySelectorAll(".booking-detail-card").forEach(function (card) {
      card.remove();
    });

    residentBookings.forEach(function (booking) {
      var filterStatus = getBookingFilterStatus(booking.status);
      var badgeClass = filterStatus === "approved" ? "badge-approved"
        : filterStatus === "pending" ? "badge-pending"
          : filterStatus === "past" ? "badge-completed" : "badge-rejected";
      var card = document.createElement("article");
      card.className = "booking-detail-card";
      card.setAttribute("data-status", filterStatus);
      card.setAttribute("data-booking-id", booking.id);
      card.innerHTML = '<header class="booking-card-header"><h3>' + escapeBookingText(booking.resource) + "</h3>"
        + '<span class="badge ' + badgeClass + '">' + escapeBookingText(booking.status) + "</span></header>"
        + '<dl class="booking-details"><dt>Booking ID</dt><dd>' + escapeBookingText(booking.id) + "</dd>"
        + "<dt>Resident</dt><dd>" + escapeBookingText(booking.resident) + "</dd>"
        + "<dt>Flat Number</dt><dd>" + escapeBookingText(booking.flat) + "</dd>"
        + "<dt>Date &amp; Time</dt><dd>" + escapeBookingText(formatBookingDate(booking.date, booking.slot)) + "</dd>"
        + "<dt>Purpose</dt><dd>" + escapeBookingText(booking.purpose) + "</dd></dl>"
        + '<div class="booking-card-actions"><button class="btn-primary" type="button" data-open-details>View Entry Pass</button></div>';
      activeList.appendChild(card);
    });
  }

  if (historyBody) {
    historyBody.innerHTML = residentBookings.map(function (booking) {
      var filterStatus = getBookingFilterStatus(booking.status);
      var badgeClass = filterStatus === "approved" ? "badge-approved"
        : filterStatus === "pending" ? "badge-pending"
          : filterStatus === "past" ? "badge-completed" : "badge-rejected";

      return '<tr data-status="' + filterStatus + '">'
        + "<td>" + escapeBookingText(booking.id) + "</td>"
        + "<td>" + escapeBookingText(booking.resource) + "</td>"
        + "<td>" + escapeBookingText(booking.category) + "</td>"
        + "<td>" + escapeBookingText(formatBookingDate(booking.date, booking.slot)) + "</td>"
        + "<td>" + escapeBookingText(booking.purpose) + "</td>"
        + "<td>" + (filterStatus === "past" ? "Reservation completed" : "Reservation record") + "</td>"
        + '<td><span class="badge ' + badgeClass + '">' + escapeBookingText(booking.status) + "</span></td></tr>";
    }).join("");
  }
}

renderResidentBookings();

// Validate a booking request and save it after checking for schedule conflicts.
var reservationRequestForm = document.getElementById("reservation-request-form");

if (reservationRequestForm) {
  reservationRequestForm.addEventListener("submit", function (event) {
    event.preventDefault();

    var resourceSelect = document.getElementById("resource-select");
    var bookingDate = document.getElementById("booking-date");
    var bookingSlot = document.getElementById("booking-slot");
    var bookingPurpose = document.getElementById("booking-purpose");
    var rulesCheckbox = document.getElementById("accept-rules");
    var selectedOption = resourceSelect.options[resourceSelect.selectedIndex];
    var selectedResource = selectedOption.text;
    var selectedDate = bookingDate.value;
    var selectedSlot = bookingSlot.value;
    var selectedPurpose = bookingPurpose.value.trim();
    var conflictNotice = document.querySelector(".conflict-notice-card p");

    // Check that every required value and the resident agreement are present.
    if (!resourceSelect.value || !selectedDate || !selectedSlot || !selectedPurpose || !rulesCheckbox.checked) {
      alert("Please select a resource, date, and time slot, describe your purpose, and accept the usage rules.");
      return;
    }

    if (selectedResource === "4K Outdoor Projector") {
      selectedResource = "4K Outdoor Projector & Screen";
    }
    if (selectedResource === "Folding Event Tables") {
      selectedResource = "Folding Event Tables & 20 Chairs";
    }

    // Do not save a request if an approved or pending booking already has the same slot.
    var bookings = getBookings();
    var schedulingConflict = false;

    for (var index = 0; index < bookings.length; index += 1) {
      var existingBooking = bookings[index];
      var existingStatus = existingBooking.status.toLowerCase();

      if (
        (existingStatus === "approved" || existingStatus === "pending")
        && existingBooking.resource === selectedResource
        && existingBooking.date === selectedDate
        && existingBooking.slot === selectedSlot
      ) {
        schedulingConflict = true;
        break;
      }
    }

    if (schedulingConflict) {
      alert("Scheduling Conflict: This resource is already booked for the selected date and time slot. Please choose another slot.");
      if (conflictNotice) {
        conflictNotice.textContent = "Scheduling conflict: this resource already has an approved or pending booking for the selected date and time slot. Please choose another slot.";
      }
      return;
    }

    var selectedCategory = selectedOption.parentElement.label.toLowerCase();
    var requestId = "#BK-" + Math.floor(Math.random() * 900 + 100);
    var duplicateRequestId = true;

    while (duplicateRequestId) {
      duplicateRequestId = false;
      for (var idIndex = 0; idIndex < bookings.length; idIndex += 1) {
        if (bookings[idIndex].id === requestId) {
          duplicateRequestId = true;
          requestId = "#BK-" + Math.floor(Math.random() * 900 + 100);
          break;
        }
      }
    }

    bookings.push({
      id: requestId,
      resource: selectedResource,
      category: selectedCategory,
      resident: "Alex Rivera",
      flat: "402-B",
      date: selectedDate,
      slot: selectedSlot,
      purpose: selectedPurpose,
      payment: "Pending at Society Office",
      status: "Pending"
    });
    saveBookings(bookings);

    var confirmationMessage = "Success: Reservation recorded. Payment marked as 'Pending at Society Office' / 'Paid via Mock Gateway'.";
    var submittedStatus = document.getElementById("submitted-request-status");

    if (submittedStatus) {
      submittedStatus.hidden = false;
      submittedStatus.querySelector("p").textContent = confirmationMessage;
      submittedStatus.querySelector("strong").textContent = requestId;
      submittedStatus.querySelectorAll("p")[2].textContent = selectedResource + " — " + formatBookingDate(selectedDate, selectedSlot);
    }

    var statusBadge = document.querySelector("#live-submission-status .badge");
    if (statusBadge) {
      statusBadge.textContent = "Pending Admin Approval";
      statusBadge.classList.remove("badge-safe", "badge-approved");
      statusBadge.classList.add("badge-pending");
    }

    if (conflictNotice) {
      conflictNotice.textContent = confirmationMessage;
    }

    alert(confirmationMessage);
  });
}

// Filter the saved booking cards and history rows by the selected status.
var bookingStatusTabs = document.querySelectorAll(".status-tabs button[data-status]");

bookingStatusTabs.forEach(function (button) {
  button.addEventListener("click", function () {
    var selectedStatus = button.getAttribute("data-status");
    var bookingCards = document.querySelectorAll(".booking-detail-card");
    var historyRows = document.querySelectorAll(".bookings-history-table tbody tr");

    bookingStatusTabs.forEach(function (statusButton) {
      var isSelected = statusButton === button;
      statusButton.setAttribute("aria-pressed", String(isSelected));
      statusButton.classList.toggle("active", isSelected);
    });

    bookingCards.forEach(function (card) {
      var cardStatus = card.getAttribute("data-status");
      card.style.display = selectedStatus === "all" || cardStatus === selectedStatus ? "" : "none";
    });

    historyRows.forEach(function (row) {
      var rowStatus = row.getAttribute("data-status");
      row.style.display = selectedStatus === "all" || rowStatus === selectedStatus ? "" : "none";
    });
  });
});

// Show the selected booking details in the entry-pass dialog.
var entryPassModal = document.getElementById("booking-details-modal");
var entryPassList = document.querySelector(".active-bookings-list");

if (entryPassList) {
  entryPassList.addEventListener("click", function (event) {
    var passButton = event.target.closest("[data-open-details]");
    if (!passButton) {
      return;
    }

    var card = passButton.closest(".booking-detail-card");
    var bookingId = card.getAttribute("data-booking-id");
    var bookings = getBookings();
    var selectedBooking = null;

    for (var index = 0; index < bookings.length; index += 1) {
      if (bookings[index].id === bookingId) {
        selectedBooking = bookings[index];
      }
    }

    if (selectedBooking && entryPassModal) {
      document.getElementById("booking-details-heading").textContent = selectedBooking.resource + " — Entry Pass";
      var detailTerms = entryPassModal.querySelectorAll(".booking-details dt");

      detailTerms.forEach(function (term) {
        if (term.textContent === "Booking Reference ID") {
          term.nextElementSibling.textContent = selectedBooking.id;
        } else if (term.textContent === "Resident Name") {
          term.nextElementSibling.textContent = selectedBooking.resident;
        } else if (term.textContent === "Flat Number") {
          term.nextElementSibling.textContent = selectedBooking.flat;
        }
      });

      if (typeof entryPassModal.showModal === "function") {
        entryPassModal.showModal();
      } else {
        entryPassModal.hidden = false;
      }
    }
  });
}

// Close the booking entry-pass dialog.
var closeEntryPassButton = document.getElementById("close-details-modal");

if (closeEntryPassButton) {
  closeEntryPassButton.addEventListener("click", function () {
    if (entryPassModal && typeof entryPassModal.close === "function") {
      entryPassModal.close();
    } else if (entryPassModal) {
      entryPassModal.hidden = true;
    }
  });
}
