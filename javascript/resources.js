// Filter the resource catalogue when a category button is selected.
var categoryButtons = document.querySelectorAll(".filter-buttons button");
var resourceCards = document.querySelectorAll(".resource-card");
var activeResourceCategory = "all";
var resourceSearchText = "";

// Apply category and search choices together so one filter does not undo the other.
function filterResourceCards() {
  resourceCards.forEach(function (card) {
    var cardCategory = card.getAttribute("data-category");
    var title = card.querySelector("h2");
    var titleText = title ? title.textContent.toLowerCase() : "";
    var matchesCategory = activeResourceCategory === "all" || cardCategory === activeResourceCategory;
    var matchesSearch = titleText.includes(resourceSearchText);
    card.style.display = matchesCategory && matchesSearch ? "" : "none";
  });
}

categoryButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    activeResourceCategory = button.getAttribute("data-filter");

    categoryButtons.forEach(function (categoryButton) {
      categoryButton.setAttribute("aria-pressed", String(categoryButton === button));
    });

    filterResourceCards();
  });
});

// Search resource titles as the resident types.
var resourceSearch = document.getElementById("resource-search");

if (resourceSearch) {
  resourceSearch.addEventListener("input", function () {
    resourceSearchText = resourceSearch.value.toLowerCase();
    filterResourceCards();
  });
}

// Open the booking form for the selected catalogue resource.
var bookingModal = document.getElementById("booking-modal");
var bookingForm = document.getElementById("booking-form");
var bookingSuccess = document.getElementById("booking-success");
var modalResourceName = document.getElementById("modal-resource-name");
var bookNowButtons = document.querySelectorAll(".resource-card button[data-resource]:not(:disabled)");

bookNowButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    var card = button.closest(".resource-card");
    var title = card.querySelector("h2");
    var resourceName = title ? title.textContent.trim() : button.getAttribute("data-resource");

    if (modalResourceName) {
      modalResourceName.value = resourceName;
    }

    if (bookingForm) {
      bookingForm.hidden = false;
    }

    if (bookingSuccess) {
      bookingSuccess.hidden = true;
    }

    if (bookingModal && typeof bookingModal.showModal === "function") {
      bookingModal.showModal();
    } else if (bookingModal) {
      bookingModal.hidden = false;
    }
  });
});

// Close the booking dialog when its close button is pressed.
var closeBookingModal = document.getElementById("close-modal");

if (closeBookingModal) {
  closeBookingModal.addEventListener("click", function () {
    if (bookingModal && typeof bookingModal.close === "function") {
      bookingModal.close();
    } else if (bookingModal) {
      bookingModal.hidden = true;
    }
  });
}

// Save a booking request and show its generated reference number.
if (bookingForm) {
  bookingForm.addEventListener("submit", function (event) {
    event.preventDefault();

    var dateInput = document.getElementById("reservation-date");
    var slotInput = document.getElementById("time-slot");
    var purposeInput = document.getElementById("booking-purpose");
    var selectedCard = document.querySelector(".resource-card [data-resource=\"" + modalResourceName.value + "\"]");
    var bookingReference = document.getElementById("booking-reference");

    if (typeof getBookings === "function" && typeof saveBookings === "function") {
      var bookings = getBookings();
      var category = selectedCard ? selectedCard.closest(".resource-card").getAttribute("data-category") : "";

      if (!category) {
        var selectedOption = document.querySelector("#resource-select option:checked");
        var selectedGroup = selectedOption ? selectedOption.parentElement : null;
        category = selectedGroup && selectedGroup.label ? selectedGroup.label.toLowerCase() : "";
      }

      var selectedDate = dateInput.value;
      var selectedSlot = slotInput.value;
      var schedulingConflict = false;

      for (var index = 0; index < bookings.length; index += 1) {
        var existingBooking = bookings[index];
        var existingStatus = existingBooking.status.toLowerCase();
        if (
          (existingStatus === "approved" || existingStatus === "pending")
          && existingBooking.resource === modalResourceName.value
          && existingBooking.date === selectedDate
          && existingBooking.slot === selectedSlot
        ) {
          schedulingConflict = true;
          break;
        }
      }

      if (schedulingConflict) {
        alert("Scheduling Conflict: This resource is already booked for the selected date and time slot. Please choose another slot.");
        return;
      }

      var referenceId = "#BK-" + Math.floor(Math.random() * 900 + 100);
      var referenceExists = true;

      while (referenceExists) {
        referenceExists = false;
        for (var bookingIndex = 0; bookingIndex < bookings.length; bookingIndex += 1) {
          if (bookings[bookingIndex].id === referenceId) {
            referenceExists = true;
            referenceId = "#BK-" + Math.floor(Math.random() * 900 + 100);
            break;
          }
        }
      }

      bookings.push({
        id: referenceId,
        resource: modalResourceName.value,
        category: category,
        resident: "Alex Rivera",
        flat: "402-B",
        date: selectedDate,
        slot: selectedSlot,
        purpose: purposeInput.value,
        payment: "Pending at Society Office",
        status: "Pending"
      });
      saveBookings(bookings);

      var confirmationMessage = "Success: Reservation recorded. Payment marked as 'Pending at Society Office' / 'Paid via Mock Gateway'.";
      var successMessage = bookingSuccess ? bookingSuccess.querySelector("p") : null;
      if (successMessage) {
        successMessage.textContent = confirmationMessage;
      }
      alert(confirmationMessage);
    }

    if (bookingReference) {
      bookingReference.textContent = referenceId;
    }

    bookingForm.hidden = true;
    if (bookingSuccess) {
      bookingSuccess.hidden = false;
    }
  });
}
