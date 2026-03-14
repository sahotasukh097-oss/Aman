// Sign Up page functionality
document.addEventListener('DOMContentLoaded', function() {
  setupSignUpForm();
  setupPasswordValidation();
});

// Setup sign up form
function setupSignUpForm() {
  const signupForm = document.getElementById('signup-form');

  signupForm.addEventListener('submit', function(e) {
    e.preventDefault();

    if (validateSignUpForm()) {
      signUpUser();
    }
  });
}

// Setup password validation
function setupPasswordValidation() {
  const passwordInput = document.getElementById('signup-password');
  const confirmPasswordInput = document.getElementById('signup-confirm-password');

  confirmPasswordInput.addEventListener('input', function() {
    const password = passwordInput.value;
    const confirmPassword = this.value;

    if (password !== confirmPassword) {
      this.setCustomValidity('Passwords do not match');
    } else {
      this.setCustomValidity('');
    }
  });

  passwordInput.addEventListener('input', function() {
    const confirmPassword = confirmPasswordInput.value;
    if (confirmPassword && this.value !== confirmPassword) {
      confirmPasswordInput.setCustomValidity('Passwords do not match');
    } else {
      confirmPasswordInput.setCustomValidity('');
    }
  });
}

// Validate sign up form
function validateSignUpForm() {
  const firstName = document.getElementById('signup-firstname').value.trim();
  const lastName = document.getElementById('signup-lastname').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm-password').value;
  const agreeTerms = document.getElementById('agree-terms').checked;

  if (!firstName) {
    showNotification('Please enter your first name.', 'error');
    return false;
  }

  if (!lastName) {
    showNotification('Please enter your last name.', 'error');
    return false;
  }

  if (!email) {
    showNotification('Please enter your email address.', 'error');
    return false;
  }

  if (!isValidEmail(email)) {
    showNotification('Please enter a valid email address.', 'error');
    return false;
  }

  if (password.length < 8) {
    showNotification('Password must be at least 8 characters long.', 'error');
    return false;
  }

  if (password !== confirmPassword) {
    showNotification('Passwords do not match.', 'error');
    return false;
  }

  if (!agreeTerms) {
    showNotification('Please agree to the Terms of Service and Privacy Policy.', 'error');
    return false;
  }

  return true;
}

// Sign up user
function signUpUser() {
  const firstName = document.getElementById('signup-firstname').value.trim();
  const lastName = document.getElementById('signup-lastname').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const phone = document.getElementById('signup-phone').value.trim();
  const password = document.getElementById('signup-password').value;
  const subscribeNewsletter = document.getElementById('subscribe-newsletter').checked;

  // Check if user already exists
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    showNotification('An account with this email already exists.', 'error');
    return;
  }

  // Create new user
  const newUser = {
    id: generateUserId(),
    firstName: firstName,
    lastName: lastName,
    email: email,
    phone: phone,
    password: password,
    subscribeNewsletter: subscribeNewsletter,
    createdAt: new Date().toISOString(),
    isActive: true,
    role: 'user'
  };

  // Add user to storage
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));

  // Create profile data
  const profile = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    phone: phone,
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
      marketingEmails: subscribeNewsletter
    }
  };

  localStorage.setItem('userProfile', JSON.stringify(profile));

  // Create session
  const session = {
    userId: newUser.id,
    email: email,
    firstName: firstName,
    lastName: lastName,
    loginTime: new Date().toISOString(),
    rememberMe: false
  };

  localStorage.setItem('currentSession', JSON.stringify(session));

  showNotification('Account created successfully! Welcome to Amandeeo Loans!', 'success');

  // Redirect to dashboard after short delay
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 2000);
}

// Social sign up functions (placeholders)
function signUpWithGoogle() {
  showNotification('Google sign up coming soon!', 'info');
}

function signUpWithFacebook() {
  showNotification('Facebook sign up coming soon!', 'info');
}

// Toggle password visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const button = input.nextElementSibling;
  const icon = button.querySelector('i');

  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fas fa-eye';
  }
}

// Generate unique user ID
function generateUserId() {
  return 'USER' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
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
  }, 5000);
}