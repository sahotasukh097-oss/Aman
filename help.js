// Help page functionality
document.addEventListener('DOMContentLoaded', function() {
  setupFAQAccordion();
  setupContactForm();
});

// Setup FAQ accordion
function setupFAQAccordion() {
  // FAQ items are already set up with onclick handlers in HTML
}

// Toggle FAQ answer visibility
function toggleFAQ(questionElement) {
  const faqItem = questionElement.parentElement;
  const answer = faqItem.querySelector('.faq-answer');
  const icon = questionElement.querySelector('i');

  // Close all other FAQ items
  const allFaqItems = document.querySelectorAll('.faq-item');
  allFaqItems.forEach(item => {
    if (item !== faqItem) {
      item.querySelector('.faq-answer').style.display = 'none';
      item.querySelector('.faq-question i').className = 'fas fa-chevron-down';
      item.classList.remove('active');
    }
  });

  // Toggle current FAQ item
  if (answer.style.display === 'block') {
    answer.style.display = 'none';
    icon.className = 'fas fa-chevron-down';
    faqItem.classList.remove('active');
  } else {
    answer.style.display = 'block';
    icon.className = 'fas fa-chevron-up';
    faqItem.classList.add('active');
  }
}

// Search help content
function searchHelp() {
  const searchTerm = document.getElementById('help-search').value.toLowerCase().trim();

  if (!searchTerm) {
    showNotification('Please enter a search term.', 'warning');
    return;
  }

  // Get all FAQ items
  const faqItems = document.querySelectorAll('.faq-item');
  let foundResults = false;

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question h3').textContent.toLowerCase();
    const answer = item.querySelector('.faq-answer').textContent.toLowerCase();

    if (question.includes(searchTerm) || answer.includes(searchTerm)) {
      item.style.display = 'block';
      if (!foundResults) {
        // Expand the first matching result
        toggleFAQ(item.querySelector('.faq-question'));
        foundResults = true;
      }
    } else {
      item.style.display = 'none';
      // Close if it was open
      item.querySelector('.faq-answer').style.display = 'none';
      item.querySelector('.faq-question i').className = 'fas fa-chevron-down';
      item.classList.remove('active');
    }
  });

  if (!foundResults) {
    showNotification('No results found for "' + searchTerm + '". Try different keywords.', 'info');
  } else {
    showNotification('Found results for "' + searchTerm + '".', 'success');
  }
}

// Show contact form modal
function showContactForm() {
  const modal = document.getElementById('contact-modal');
  modal.style.display = 'block';

  // Pre-fill user information if available
  const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
  if (profile.firstName && profile.lastName) {
    document.getElementById('contact-name').value = `${profile.firstName} ${profile.lastName}`;
  }
  if (profile.email) {
    document.getElementById('contact-email').value = profile.email;
  }
}

// Close contact modal
function closeContactModal() {
  document.getElementById('contact-modal').style.display = 'none';
  document.getElementById('contact-form').reset();
}

// Setup contact form
function setupContactForm() {
  const contactForm = document.getElementById('contact-form');

  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();

    if (validateContactForm()) {
      submitContactForm();
    }
  });
}

// Validate contact form
function validateContactForm() {
  const name = document.getElementById('contact-name').value.trim();
  const email = document.getElementById('contact-email').value.trim();
  const subject = document.getElementById('contact-subject').value;
  const message = document.getElementById('contact-message').value.trim();

  if (!name) {
    showNotification('Please enter your name.', 'error');
    return false;
  }

  if (!email || !isValidEmail(email)) {
    showNotification('Please enter a valid email address.', 'error');
    return false;
  }

  if (!subject) {
    showNotification('Please select a subject.', 'error');
    return false;
  }

  if (!message) {
    showNotification('Please enter your message.', 'error');
    return false;
  }

  return true;
}

// Submit contact form
function submitContactForm() {
  const formData = {
    name: document.getElementById('contact-name').value.trim(),
    email: document.getElementById('contact-email').value.trim(),
    subject: document.getElementById('contact-subject').value,
    message: document.getElementById('contact-message').value.trim(),
    priority: document.getElementById('contact-priority').value,
    timestamp: new Date().toISOString()
  };

  // In a real application, this would send the data to a server
  // For now, we'll store it locally and show a success message

  // Store contact submissions (for demo purposes)
  const submissions = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
  submissions.push(formData);
  localStorage.setItem('contactSubmissions', JSON.stringify(submissions));

  showNotification('Your message has been sent successfully! We\'ll get back to you within 24 hours.', 'success');

  closeContactModal();
}

// Start live chat (placeholder)
function startLiveChat() {
  showNotification('Live chat feature coming soon! Please use the contact form for now.', 'info');
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

// Handle keyboard shortcuts
document.addEventListener('keydown', function(e) {
  // Ctrl/Cmd + K to focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('help-search').focus();
  }

  // Escape to close modal
  if (e.key === 'Escape') {
    closeContactModal();
  }
});

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('contact-modal');
  if (event.target === modal) {
    closeContactModal();
  }
};