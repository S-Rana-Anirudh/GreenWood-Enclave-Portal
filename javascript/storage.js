// Add starter bookings and resources the first time the portal is opened.
function initStorage() {
  var savedBookings = localStorage.getItem("greenwood_bookings");
  var savedResources = localStorage.getItem("greenwood_resources");

  if (!savedBookings || JSON.parse(savedBookings).length === 0) {
    var starterBookings = [
      {
        id: "#BK-901",
        resource: "Clubhouse Banquet Hall",
        category: "spaces",
        resident: "Alex Rivera",
        flat: "402-B",
        date: "2026-10-28",
        slot: "evening",
        purpose: "Family birthday gathering",
        status: "Approved"
      },
      {
        id: "#BK-904",
        resource: "High-Pressure Washer Kit",
        category: "tools",
        resident: "Alex Rivera",
        flat: "402-B",
        date: "2026-10-26",
        slot: "morning",
        purpose: "Balcony and car cleaning",
        status: "Pending"
      },
      {
        id: "#BK-915",
        resource: "Indoor Badminton Court 1",
        category: "sports",
        resident: "Priya Nair",
        flat: "104-A",
        date: "2026-10-27",
        slot: "evening",
        purpose: "Doubles practice",
        status: "Approved"
      },
      {
        id: "#BK-922",
        resource: "4K Outdoor Projector & Screen",
        category: "spaces",
        resident: "Rohan Verma",
        flat: "309-C",
        date: "2026-11-02",
        slot: "evening",
        purpose: "Community movie night",
        status: "Pending"
      },
      {
        id: "#BK-870",
        resource: "Folding Event Tables & 20 Chairs",
        category: "spaces",
        resident: "Meera Joshi",
        flat: "201-B",
        date: "2026-10-20",
        slot: "afternoon",
        purpose: "Neighbourhood potluck",
        status: "Completed"
      }
    ];
    saveBookings(starterBookings);
  }

  if (!savedResources || JSON.parse(savedResources).length === 0) {
    var starterResources = [
      { name: "Clubhouse Banquet Hall", category: "spaces", status: "available", deposit: 500 },
      { name: "Indoor Badminton Court 1", category: "sports", status: "reserved", deposit: 0 },
      { name: "High-Pressure Washer Kit", category: "tools", status: "available", deposit: 100 },
      { name: "Electric Lawn Mower", category: "tools", status: "under-repair", deposit: 0 },
      { name: "4K Outdoor Projector & Screen", category: "spaces", status: "available", deposit: 250 },
      { name: "Folding Event Tables & 20 Chairs", category: "spaces", status: "available", deposit: 0 }
    ];
    saveResources(starterResources);
  }
}

// Read and return the saved booking records.
function getBookings() {
  return JSON.parse(localStorage.getItem("greenwood_bookings"));
}

// Save all booking records as JSON text.
function saveBookings(bookingsArray) {
  localStorage.setItem("greenwood_bookings", JSON.stringify(bookingsArray));
}

// Read and return the saved community resources.
function getResources() {
  return JSON.parse(localStorage.getItem("greenwood_resources"));
}

// Save all community resources as JSON text.
function saveResources(resourcesArray) {
  localStorage.setItem("greenwood_resources", JSON.stringify(resourcesArray));
}

initStorage();
