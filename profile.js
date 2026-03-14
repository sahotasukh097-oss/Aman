// Profile page functionality
document.addEventListener('DOMContentLoaded', function() {
  loadProfileData();
  setupFormValidation();
  setupEventListeners();
});

// Load profile data from localStorage
function loadProfileData() {
  const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');

  // Set default values if no profile exists
  const defaultProfile = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '',
    company: '',
    jobTitle: '',
    bio: '',
    role: 'Loan Manager',
    lastPasswordChange: null,
    preferences: {
      emailNotifications: true,
      paymentReminders: true,
      loanUpdates: true,
      theme: 'light',
      language: 'en',
      currency: 'USD',
      dataAnalytics: true,
      marketingEmails: false
    }
  };

  const userProfile = { ...defaultProfile, ...profile };

  // Populate personal information
  document.getElementById('first-name').value = userProfile.firstName;
  document.getElementById('last-name').value = userProfile.lastName;
  document.getElementById('email').value = userProfile.email;
  document.getElementById('phone').value = userProfile.phone;
  document.getElementById('company').value = userProfile.company;
  document.getElementById('job-title').value = userProfile.jobTitle;
  document.getElementById('bio').value = userProfile.bio;

  // Update profile display
  document.getElementById('profile-name').textContent = `${userProfile.firstName} ${userProfile.lastName}`;
  document.getElementById('profile-role').textContent = userProfile.role;

  // Populate preferences
  const prefs = userProfile.preferences;
  document.getElementById('email-notifications').checked = prefs.emailNotifications;
  document.getElementById('payment-reminders').checked = prefs.paymentReminders;
  document.getElementById('loan-updates').checked = prefs.loanUpdates;
  document.getElementById('theme-select').value = prefs.theme;
  document.getElementById('language-select').value = prefs.language;
  document.getElementById('currency-select').value = prefs.currency;
  document.getElementById('data-analytics').checked = prefs.dataAnalytics;
  document.getElementById('marketing-emails').checked = prefs.marketingEmails;

  // Update last password change
  if (userProfile.lastPasswordChange) {
    document.getElementById('last-password-change').textContent =
      new Date(userProfile.lastPasswordChange).toLocaleDateString();
  }

  // Apply theme
  applyTheme(prefs.theme);
}

// Setup form validation
function setupFormValidation() {
  // Personal form validation
  const personalForm = document.getElementById('personal-form');
  personalForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (validatePersonalForm()) {
      savePersonalInfo();
    }
  });

  // Password form validation
  const passwordForm = document.getElementById('password-form');
  passwordForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (validatePasswordForm()) {
      changePassword();
    }
  });
}

// Setup event listeners
function setupEventListeners() {
  // Profile navigation
  const navLinks = document.querySelectorAll('.profile-nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetSection = this.getAttribute('href').substring(1);
      showProfileSection(targetSection);
    });
  });

  // Theme change
  document.getElementById('theme-select').addEventListener('change', function() {
    applyTheme(this.value);
  });

  // Password confirmation validation
  document.getElementById('confirm-password').addEventListener('input', function() {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = this.value;

    if (newPassword !== confirmPassword) {
      this.setCustomValidity('Passwords do not match');
    } else {
      this.setCustomValidity('');
    }
  });
}

// Show profile section
function showProfileSection(sectionId) {
  // Hide all sections
  const sections = document.querySelectorAll('.profile-section');
  sections.forEach(section => section.classList.remove('active'));

  // Remove active class from nav links
  const navLinks = document.querySelectorAll('.profile-nav-link');
  navLinks.forEach(link => link.classList.remove('active'));

  // Show selected section
  document.getElementById(sectionId + '-section').classList.add('active');

  // Add active class to clicked nav link
  event.target.classList.add('active');
}

// Validate personal form
function validatePersonalForm() {
  const firstName = document.getElementById('first-name').value.trim();
  const lastName = document.getElementById('last-name').value.trim();
  const email = document.getElementById('email').value.trim();

  if (!firstName || !lastName) {
    showNotification('Please enter your first and last name.', 'error');
    return false;
  }

  if (!email || !isValidEmail(email)) {
    showNotification('Please enter a valid email address.', 'error');
    return false;
  }

  return true;
}

// Validate password form
function validatePasswordForm() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (!currentPassword) {
    showNotification('Please enter your current password.', 'error');
    return false;
  }

  if (newPassword.length < 8) {
    showNotification('New password must be at least 8 characters long.', 'error');
    return false;
  }

  if (newPassword !== confirmPassword) {
    showNotification('New passwords do not match.', 'error');
    return false;
  }

  if (currentPassword === newPassword) {
    showNotification('New password must be different from current password.', 'error');
    return false;
  }

  return true;
}

// Save personal information
function savePersonalInfo() {
  const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');

  const updatedProfile = {
    ...profile,
    firstName: document.getElementById('first-name').value.trim(),
    lastName: document.getElementById('last-name').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    company: document.getElementById('company').value.trim(),
    jobTitle: document.getElementById('job-title').value.trim(),
    bio: document.getElementById('bio').value.trim()
  };

  localStorage.setItem('userProfile', JSON.stringify(updatedProfile));

  // Update profile display
  document.getElementById('profile-name').textContent =
    `${updatedProfile.firstName} ${updatedProfile.lastName}`;

  showNotification('Personal information updated successfully!', 'success');
}

// Change password
function changePassword() {
  const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');

  const updatedProfile = {
    ...profile,
    lastPasswordChange: new Date().toISOString()
  };

  localStorage.setItem('userProfile', JSON.stringify(updatedProfile));

  // Reset form
  document.getElementById('password-form').reset();

  // Update display
  document.getElementById('last-password-change').textContent =
    new Date().toLocaleDateString();

  showNotification('Password changed successfully!', 'success');
}

// Save preferences
function savePreferences() {
  const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');

  const preferences = {
    emailNotifications: document.getElementById('email-notifications').checked,
    paymentReminders: document.getElementById('payment-reminders').checked,
    loanUpdates: document.getElementById('loan-updates').checked,
    theme: document.getElementById('theme-select').value,
    language: document.getElementById('language-select').value,
    currency: document.getElementById('currency-select').value,
    dataAnalytics: document.getElementById('data-analytics').checked,
    marketingEmails: document.getElementById('marketing-emails').checked
  };

  const updatedProfile = {
    ...profile,
    preferences: preferences
  };

  localStorage.setItem('userProfile', JSON.stringify(updatedProfile));

  // Apply theme
  applyTheme(preferences.theme);

  showNotification('Preferences saved successfully!', 'success');
}

// Apply theme
function applyTheme(theme) {
  const body = document.body;

  // Remove existing theme classes
  body.classList.remove('theme-light', 'theme-dark', 'theme-auto');

  // Add new theme class
  body.classList.add(`theme-${theme}`);

  // For auto theme, detect system preference
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
  }
}

// Reset personal form
function resetPersonalForm() {
  loadProfileData();
  showNotification('Form reset to last saved values.', 'info');
}

// Filter activity log
function filterActivity() {
  const filterType = document.getElementById('activity-filter').value;
  const dateFrom = document.getElementById('activity-date-from').value;
  const dateTo = document.getElementById('activity-date-to').value;

  // In a real application, this would filter the activity list
  // For now, just show a notification
  showNotification('Activity filter applied.', 'info');
}

// Utility functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.style.display = 'block';

  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}

// Listen for theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
  const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  if (profile.preferences?.theme === 'auto') {
    applyTheme('auto');
  }
});