// Sign In page functionality
document.addEventListener('DOMContentLoaded', function() {
  setupSignInForm();
  setupForgotPasswordForm();
  checkRememberedUser();
});

// Setup sign in form
function setupSignInForm() {
  const signinForm = document.getElementById('signin-form');

  signinForm.addEventListener('submit', function(e) {
    e.preventDefault();

    if (validateSignInForm()) {
      signInUser();
    }
  });
}

// Validate sign in form
function validateSignInForm() {
  const email = document.getElementById('signin-email').value.trim();
  const password = document.getElementById('signin-password').value;

  if (!email) {
    showNotification('Please enter your email address.', 'error');
    return false;
  }

  if (!isValidEmail(email)) {
    showNotification('Please enter a valid email address.', 'error');
    return false;
  }

  if (!password) {
    showNotification('Please enter your password.', 'error');
    return false;
  }

  return true;
}

// Sign in user
function signInUser() {
  const email = document.getElementById('signin-email').value.trim();
  const password = document.getElementById('signin-password').value;
  const rememberMe = document.getElementById('remember-me').checked;

  // Get stored users
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find(u => u.email === email);

  if (!user) {
    showNotification('No account found with this email address.', 'error');
    return;
  }

  if (user.password !== password) {
    showNotification('Incorrect password. Please try again.', 'error');
    return;
  }

  // Create session
  const session = {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    loginTime: new Date().toISOString(),
    rememberMe: rememberMe
  };

  localStorage.setItem('currentSession', JSON.stringify(session));

  // Store remember me preference
  if (rememberMe) {
    localStorage.setItem('rememberedUser', email);
  } else {
    localStorage.removeItem('rememberedUser');
  }

  showNotification('Sign in successful! Redirecting...', 'success');

  // Redirect to dashboard after short delay
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 1500);
}

// Check for remembered user
function checkRememberedUser() {
  const rememberedUser = localStorage.getItem('rememberedUser');
  if (rememberedUser) {
    document.getElementById('signin-email').value = rememberedUser;
    document.getElementById('remember-me').checked = true;
  }
}

// Show forgot password modal
function showForgotPassword() {
  document.getElementById('forgot-modal').style.display = 'block';
}

// Close forgot password modal
function closeForgotModal() {
  document.getElementById('forgot-modal').style.display = 'none';
  document.getElementById('forgot-form').reset();
}

// Setup forgot password form
function setupForgotPasswordForm() {
  const forgotForm = document.getElementById('forgot-form');

  forgotForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('forgot-email').value.trim();

    if (!email || !isValidEmail(email)) {
      showNotification('Please enter a valid email address.', 'error');
      return;
    }

    // Check if user exists
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email);

    if (!user) {
      showNotification('No account found with this email address.', 'error');
      return;
    }

    // In a real application, this would send a reset email
    showNotification('Password reset link sent to your email!', 'success');
    closeForgotModal();
  });
}

// Social sign in functions (placeholders)
function signInWithGoogle() {
  showNotification('Google sign in coming soon!', 'info');
}

function signInWithFacebook() {
  showNotification('Facebook sign in coming soon!', 'info');
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

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('forgot-modal');
  if (event.target === modal) {
    closeForgotModal();
  }
};

// Handle keyboard shortcuts
document.addEventListener('keydown', function(e) {
  // Escape to close modal
  if (e.key === 'Escape') {
    closeForgotModal();
  }
});