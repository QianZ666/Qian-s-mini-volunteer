// Load user information from the server when the page loads
async function loadUserInfo() {
  try {
    // Temporarily enable fieldset to populate values
    const fields = document.getElementById("personalInfoFields");
    const wasDisabled = fields.disabled;
    fields.disabled = false;
    // Make a request to the backend to get the current user's profile
    const res = await fetch("/profile/data", {
      headers: {
        // Pass the authorization token from localStorage
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    // If the request fails, throw an error
    if (!res.ok) throw new Error("Failed to fetch user profile");

    // Parse the JSON response
    const data = await res.json();

    // Populate form fields with user data
    document.getElementById("name").value = data.name || "";
    document.getElementById("bio").value = data.bio || "";
    document.getElementById("location").value = data.location || "";
    document.getElementById("uploadPhoto").src = data.avatarUrl || "";

    // Set the age dropdown value if age is available
    if (data.age) document.getElementById("ageInput").value = data.age;

    // Check the correct gender radio button if gender is set
    if (data.gender) {
      const genderInput = document.querySelector(
        `input[name="gender"][value="${data.gender}"]`
      );
      if (genderInput) genderInput.checked = true;
    }
    // Restore disabled state if it was originally disabled
    if (wasDisabled) fields.disabled = true;

  } catch (err) {
    // Log any errors to the console
    console.error("Error loading user info:", err);
  }
}

// Initialize when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeAgeDropdown();
  setupEventListeners();
  loadUserInfo();
});

// Populate age selection dropdown with options 18-100
function initializeAgeDropdown() {
  const ageSelect = document.getElementById("ageInput");
  // Generate age options dynamically
  for (let i = 18; i <= 100; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    ageSelect.appendChild(option);
  }
}

// Set up event listeners for interactive elements
function setupEventListeners() {
  // Save button click handler
  document.getElementById("savebtn").addEventListener("click", saveUserInfo);
  // Image upload change handler
  document
    .getElementById("fileInput")
    .addEventListener("change", handleImageUpload);
}

// Enable form editing mode
function editUserInfo() {
  const fields = document.getElementById("personalInfoFields");
  fields.disabled = false; // Remove disabled state
  document.getElementById("savebtn").style.display = "inline-block";
}

// Handle profile data submission
async function saveUserInfo() {
  // Collect form data
  const formData = new FormData();
  formData.append("name", document.getElementById("name").value);
  formData.append("bio", document.getElementById("bio").value);
  formData.append("location", document.getElementById("location").value);
  formData.append("age", document.getElementById("ageInput").value);
  formData.append("gender", document.getElementById('input[name="gender"]:checked')?.value);

  const fileInput = document.getElementById("fileInput");
  if (fileInput.files[0]) {
    formData.append("profileImage", fileInput.files[0]);
  }

  try {
    const response = await fetch("/profile/update", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData, 
    });

    if (!response.ok) throw new Error("Failed to update profile");
    showMessage("Profile updated successfully!", "success");
    document.getElementById("personalInfoFields").disabled = true;
    await loadUserInfo();
  } catch (error) {
    showMessage(error.message, "error");
  }
}


// Handle image file upload and preview
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Read and display image file
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("uploadPhoto").src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Validate form input fields
function validateForm(data) {
  // Check required fields
  if (!data.name?.trim()) {
    showMessage("Name is required", "error");
    return false;
  }
  // Validate age range
  if (data.age < 18 || data.age > 100) {
    showMessage("Please select a valid age", "error");
    return false;
  }
  return true;
}

// Display temporary status messages
function showMessage(message, type) {
  const messageDiv = document.getElementById("saveMessage");
  messageDiv.textContent = message;
  // Apply appropriate styling based on message type
  messageDiv.className = `alert alert-${
    type === "error" ? "danger" : "success"
  }`;
  messageDiv.style.display = "block";

  // Auto-hide message after 3 seconds
  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 3000);
}