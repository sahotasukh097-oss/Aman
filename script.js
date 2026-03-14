// script.js - Static version without server dependencies

let allLoans = [];

// Local storage helper functions
function saveLoansToStorage(loans) {
  localStorage.setItem('loans', JSON.stringify(loans));
}

function loadLoansFromStorage() {
  const stored = localStorage.getItem('loans');
  return stored ? JSON.parse(stored) : [];
}

// Notification function
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  if (notification) {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }
}

// Load loans from localStorage
function loadLoans() {
  try {
    allLoans = loadLoansFromStorage();
    displayLoans(allLoans);
  } catch (error) {
    console.error('Error loading loans:', error);
    showNotification('Error loading loans', 'error');
  }
}

function displayLoans(loans) {
  const tbody = document.getElementById('loans-tbody');
  tbody.innerHTML = '';
  loans.forEach(loan => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><i class="fas fa-user"></i> ${loan.borrowerName}</td>
      <td><i class="fas fa-dollar-sign"></i> $${loan.amount.toLocaleString()}</td>
      <td><i class="fas fa-percent"></i> ${loan.interestRate}%</td>
      <td><i class="fas fa-calendar"></i> ${loan.termMonths} months</td>
      <td><i class="fas fa-calendar-alt"></i> ${new Date(loan.startDate).toLocaleDateString()}</td>
      <td>
        <a href="detail.html?id=${loan.id}" class="btn">View Details</a>
        <button class="btn-secondary delete-btn" data-id="${loan.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  // Add event listeners for delete buttons
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      if (confirm('Are you sure you want to delete this loan?')) {
        try {
          allLoans = allLoans.filter(loan => loan.id !== id);
          saveLoansToStorage(allLoans);
          showNotification('Loan deleted successfully');
          loadLoans();
        } catch (error) {
          console.error('Error deleting loan:', error);
          showNotification('Error deleting loan', 'error');
        }
      }
    });
  });
}

// Search functionality
function filterLoans() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const filteredLoans = allLoans.filter(loan =>
    loan.borrowerName.toLowerCase().includes(searchTerm)
  );
  displayLoans(filteredLoans);
}

// Enhanced form validation and progress tracking
function initializeLoanForm() {
  const form = document.getElementById('add-loan-form');
  if (!form) return;

  const progressSteps = document.querySelectorAll('.progress-step');
  const formSections = document.querySelectorAll('.form-section');
  let currentStep = 0;

  // Add input validation listeners
  const inputs = form.querySelectorAll('input[required]');
  inputs.forEach(input => {
    input.addEventListener('blur', validateField);
    input.addEventListener('input', updateFieldValidation);
  });

  // Update progress on section completion
  function updateProgress() {
    const completedSections = Array.from(formSections).filter(section => {
      const requiredInputs = section.querySelectorAll('input[required]');
      return Array.from(requiredInputs).every(input => input.value.trim() !== '');
    }).length;

    progressSteps.forEach((step, index) => {
      if (index < completedSections) {
        step.classList.add('completed');
        step.classList.remove('active');
      } else if (index === completedSections) {
        step.classList.add('active');
        step.classList.remove('completed');
      } else {
        step.classList.remove('active', 'completed');
      }
    });
  }

  // Validate individual field
  function validateField(event) {
    const field = event.target;
    const fieldGroup = field.closest('.form-group');
    const value = field.value.trim();

    // Remove existing validation classes
    fieldGroup.classList.remove('error', 'success');

    if (field.hasAttribute('required') && value === '') {
      showFieldError(fieldGroup, 'This field is required');
      return false;
    }

    // Field-specific validation
    switch (field.id) {
      case 'borrowerName':
        if (value.length < 2) {
          showFieldError(fieldGroup, 'Name must be at least 2 characters');
          return false;
        }
        break;
      case 'amount':
        const amount = parseFloat(value);
        if (isNaN(amount) || amount < 1000 || amount > 500000) {
          showFieldError(fieldGroup, 'Amount must be between $1,000 and $500,000');
          return false;
        }
        break;
      case 'interestRate':
        const rate = parseFloat(value);
        if (isNaN(rate) || rate < 0 || rate > 30) {
          showFieldError(fieldGroup, 'Interest rate must be between 0% and 30%');
          return false;
        }
        break;
      case 'termMonths':
        const months = parseInt(value);
        if (isNaN(months) || months < 6 || months > 360) {
          showFieldError(fieldGroup, 'Term must be between 6 and 360 months');
          return false;
        }
        break;
      case 'startDate':
        const startDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate < today) {
          showFieldError(fieldGroup, 'Start date cannot be in the past');
          return false;
        }
        break;
    }

    showFieldSuccess(fieldGroup);
    updateProgress();
    return true;
  }

  function updateFieldValidation(event) {
    const field = event.target;
    const fieldGroup = field.closest('.form-group');

    // Clear error state when user starts typing
    if (fieldGroup.classList.contains('error')) {
      fieldGroup.classList.remove('error');
      const errorMsg = fieldGroup.querySelector('.form-error-message');
      if (errorMsg) errorMsg.remove();
    }
  }

  function showFieldError(fieldGroup, message) {
    fieldGroup.classList.add('error');
    fieldGroup.classList.remove('success');

    // Remove existing error message
    const existingError = fieldGroup.querySelector('.form-error-message');
    if (existingError) existingError.remove();

    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error-message';
    errorDiv.textContent = message;
    fieldGroup.appendChild(errorDiv);

    // Shake animation
    fieldGroup.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
      fieldGroup.style.animation = '';
    }, 500);
  }

  function showFieldSuccess(fieldGroup) {
    fieldGroup.classList.add('success');
    fieldGroup.classList.remove('error');

    const errorMsg = fieldGroup.querySelector('.form-error-message');
    if (errorMsg) errorMsg.remove();
  }

  // Enhanced loan calculation with animations
  function calculateLoan() {
    const amount = parseFloat(document.getElementById('amount').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const termMonths = parseInt(document.getElementById('termMonths').value) || 0;

    if (amount > 0 && interestRate > 0 && termMonths > 0) {
      const monthlyRate = interestRate / 100 / 12;
      const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
                            (Math.pow(1 + monthlyRate, termMonths) - 1);
      const totalInterest = (monthlyPayment * termMonths) - amount;
      const totalAmount = amount + totalInterest;

      // Animate number changes
      animateValue('monthly-payment', monthlyPayment);
      animateValue('total-interest', totalInterest);
      animateValue('total-amount', totalAmount);
    } else {
      document.getElementById('monthly-payment').textContent = '$0.00';
      document.getElementById('total-interest').textContent = '$0.00';
      document.getElementById('total-amount').textContent = '$0.00';
    }
  }

  function animateValue(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const startValue = parseFloat(element.textContent.replace('$', '').replace(',', '')) || 0;
    const duration = 1000;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (targetValue - startValue) * easeOut;

      element.textContent = `$${currentValue.toFixed(2)}`;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // Add calculation listeners
  const calcFields = ['amount', 'interestRate', 'termMonths'];
  calcFields.forEach(field => {
    const element = document.getElementById(field);
    if (element) {
      element.addEventListener('input', calculateLoan);
    }
  });

  // Form submission with enhanced feedback
  form.addEventListener('submit', function(event) {
    event.preventDefault();

    // Validate all required fields
    let isValid = true;
    inputs.forEach(input => {
      if (!validateField({ target: input })) {
        isValid = false;
      }
    });

    if (!isValid) {
      showNotification('Please correct the errors in the form', 'error');
      return;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;

    // Simulate processing delay
    setTimeout(() => {
      const formData = new FormData(form);
      const loanData = {
        id: Date.now(),
        borrowerName: formData.get('borrowerName'),
        amount: parseFloat(formData.get('amount')),
        interestRate: parseFloat(formData.get('interestRate')),
        termMonths: parseInt(formData.get('termMonths')),
        startDate: formData.get('startDate'),
        payments: [],
      };

      try {
        allLoans.push(loanData);
        saveLoansToStorage(allLoans);
        showNotification('🎉 Loan application submitted successfully!', 'success');

        // Reset form and show success animation
        form.style.animation = 'fadeOut 0.5s ease-out';
        setTimeout(() => {
          form.reset();
          form.style.animation = '';
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          updateProgress();
        }, 500);

        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
      } catch (error) {
        console.error('Error adding loan:', error);
        showNotification('❌ Error submitting loan application', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    }, 1500);
  });

  // Initialize progress
  updateProgress();
}

// Add shake animation to CSS if not present
if (!document.querySelector('#shake-animation')) {
  const style = document.createElement('style');
  style.id = 'shake-animation';
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    @keyframes fadeOut {
      to { opacity: 0; transform: scale(0.95); }
    }
  `;
  document.head.appendChild(style);
}

// Handle add loan form
function handleAddLoan(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const loanData = {
    id: Date.now(), // Simple ID generation
    borrowerName: formData.get('borrowerName'),
    amount: parseFloat(formData.get('amount')),
    interestRate: parseFloat(formData.get('interestRate')),
    termMonths: parseInt(formData.get('termMonths')),
    startDate: formData.get('startDate'),
    payments: [], // Initialize empty payments array
  };

  try {
    allLoans.push(loanData);
    saveLoansToStorage(allLoans);
    showNotification('Loan application submitted successfully!');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
  } catch (error) {
    console.error('Error adding loan:', error);
    showNotification('Error submitting loan application', 'error');
  }
}

// Load loan details on detail.html
function loadLoanDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const loanId = parseInt(urlParams.get('id'));

  if (!loanId) {
    showNotification('Loan ID not found', 'error');
    return;
  }

  try {
    allLoans = loadLoansFromStorage();
    const loan = allLoans.find(l => l.id === loanId);

    if (!loan) {
      showNotification('Loan not found', 'error');
      return;
    }

    displayLoanInfo(loan);
    displayPayments(loan.payments);
  } catch (error) {
    console.error('Error loading loan details:', error);
    showNotification('Error loading loan details', 'error');
  }
}

function displayLoanInfo(loan) {
  const loanInfo = document.getElementById('loan-info');
  const totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = loan.amount - totalPaid;
  const progressPercent = (totalPaid / loan.amount) * 100;
  let status = 'Active';
  let statusClass = 'status-success-image';

  if (progressPercent >= 100) {
    status = 'Paid';
    statusClass = 'status-success-image';
  } else if (progressPercent > 50) {
    status = 'In Progress';
    statusClass = 'status-warning';
  } else {
    status = 'Active';
    statusClass = 'status-info';
  }

  // Update loan title
  document.getElementById('loan-title').textContent = `${loan.borrowerName}'s Loan`;

  loanInfo.innerHTML = `
    <div class="info-grid">
      <div class="info-item">
        <i class="fas fa-user-circle"></i>
        <div class="info-content">
          <h4>Borrower Name</h4>
          <div class="value">${loan.borrowerName}</div>
        </div>
      </div>
      <div class="info-item">
        <i class="fas fa-dollar-sign"></i>
        <div class="info-content">
          <h4>Loan Amount</h4>
          <div class="value">$${loan.amount.toLocaleString()}</div>
        </div>
      </div>
      <div class="info-item">
        <i class="fas fa-percent"></i>
        <div class="info-content">
          <h4>Interest Rate</h4>
          <div class="value">${loan.interestRate}%</div>
        </div>
      </div>
      <div class="info-item">
        <i class="fas fa-calendar-alt"></i>
        <div class="info-content">
          <h4>Loan Term</h4>
          <div class="value">${loan.termMonths} months</div>
        </div>
      </div>
      <div class="info-item">
        <i class="fas fa-calendar-day"></i>
        <div class="info-content">
          <h4>Start Date</h4>
          <div class="value">${new Date(loan.startDate).toLocaleDateString()}</div>
        </div>
      </div>
      <div class="info-item">
        <div class="${statusClass}"></div>
        <div class="info-content">
          <h4>Loan Status</h4>
          <div class="value">${status}</div>
        </div>
      </div>
      <div class="info-item">
        <i class="fas fa-money-bill-wave"></i>
        <div class="info-content">
          <h4>Total Paid</h4>
          <div class="value">$${totalPaid.toLocaleString()}</div>
        </div>
      </div>
      <div class="info-item">
        <i class="fas fa-balance-scale"></i>
        <div class="info-content">
          <h4>Remaining Balance</h4>
          <div class="value">$${remainingBalance.toLocaleString()}</div>
        </div>
      </div>
      <div class="info-item">
        <i class="fas fa-chart-line"></i>
        <div class="info-content">
          <h4>Payment Progress</h4>
          <div class="value">${progressPercent.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  `;
}

function displayPayments(payments) {
  const paymentsList = document.getElementById('payments-list');
  paymentsList.innerHTML = '';

  if (payments.length === 0) {
    paymentsList.innerHTML = '<li style="text-align: center; color: var(--text-light); padding: 2rem;">No payments recorded yet</li>';
    return;
  }

  payments.forEach(payment => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="payment-info">
        <i class="fas fa-check-circle"></i>
        <div class="payment-details">
          <h4>Payment Received</h4>
          <p>${new Date(payment.date).toLocaleDateString()}</p>
        </div>
      </div>
      <div class="payment-amount">$${payment.amount.toLocaleString()}</div>
    `;
    paymentsList.appendChild(li);
  });
}

// Handle add loan form
async function handleAddLoan(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const loanData = {
    borrowerName: formData.get('borrowerName'),
    amount: parseFloat(formData.get('amount')),
    interestRate: parseFloat(formData.get('interestRate')),
    termMonths: parseInt(formData.get('termMonths')),
    startDate: formData.get('startDate'),
  };
  try {
    await apiCall('/api/loans', {
      method: 'POST',
      body: JSON.stringify(loanData),
    });
    showNotification('Loan added successfully');
    window.location.href = '/';
  } catch (error) {
    console.error('Error adding loan:', error);
    showNotification('Error adding loan', 'error');
  }
}

// Load loan details on detail.html
async function loadLoanDetails() {
  const loanId = window.location.pathname.split('/').pop();
  try {
    const loan = await apiCall(`/api/loans/${loanId}`);
    displayLoanInfo(loan);
    displayPayments(loan.payments);
  } catch (error) {
    console.error('Error loading loan details:', error);
    showNotification('Error loading loan details', 'error');
  }
}

function displayLoanInfo(loan) {
  const loanInfo = document.getElementById('loan-info');
  const totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = loan.amount - totalPaid;
  loanInfo.innerHTML = `
    <p><strong>Borrower:</strong> ${loan.borrowerName}</p>
    <p><strong>Amount:</strong> $${loan.amount}</p>
    <p><strong>Interest Rate:</strong> ${loan.interestRate}%</p>
    <p><strong>Term:</strong> ${loan.termMonths} months</p>
    <p><strong>Start Date:</strong> ${loan.startDate}</p>
    <p><strong>Total Paid:</strong> $${totalPaid}</p>
    <p><strong>Remaining Balance:</strong> $${remainingBalance}</p>
  `;
}

function displayPayments(payments) {
  const paymentsList = document.getElementById('payments-list');
  paymentsList.innerHTML = '';
  payments.forEach(payment => {
    const li = document.createElement('li');
    li.textContent = `${payment.date}: $${payment.amount}`;
    paymentsList.appendChild(li);
  });
}

// Handle edit loan
function showEditForm(loan) {
  document.getElementById('edit-borrowerName').value = loan.borrowerName;
  document.getElementById('edit-amount').value = loan.amount;
  document.getElementById('edit-interestRate').value = loan.interestRate;
  document.getElementById('edit-termMonths').value = loan.termMonths;
  document.getElementById('edit-startDate').value = loan.startDate;
  document.getElementById('loan-info').style.display = 'none';
  document.getElementById('edit-form').style.display = 'block';
}

async function handleEditLoan(event) {
  event.preventDefault();
  const loanId = window.location.pathname.split('/').pop();
  const formData = new FormData(event.target);
  const loanData = {
    borrowerName: formData.get('borrowerName'),
    amount: parseFloat(formData.get('amount')),
    interestRate: parseFloat(formData.get('interestRate')),
    termMonths: parseInt(formData.get('termMonths')),
    startDate: formData.get('startDate'),
  };
  try {
    const updatedLoan = await apiCall(`/api/loans/${loanId}`, {
      method: 'PUT',
      body: JSON.stringify(loanData),
    });
    showNotification('Loan updated successfully');
    displayLoanInfo(updatedLoan);
    document.getElementById('loan-info').style.display = 'block';
    document.getElementById('edit-form').style.display = 'none';
  } catch (error) {
    console.error('Error updating loan:', error);
    showNotification('Error updating loan', 'error');
  }
}

async function deleteLoan() {
  const loanId = window.location.pathname.split('/').pop();
  if (confirm('Are you sure you want to delete this loan?')) {
    try {
      await apiCall(`/api/loans/${loanId}`, { method: 'DELETE' });
      showNotification('Loan deleted successfully');
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting loan:', error);
      showNotification('Error deleting loan', 'error');
    }
  }
}

// Handle add payment
function handleAddPayment() {
  const urlParams = new URLSearchParams(window.location.search);
  const loanId = parseInt(urlParams.get('id'));
  const amount = parseFloat(document.getElementById('paymentAmount').value);
  const date = document.getElementById('paymentDate').value;

  if (!amount || !date) {
    showNotification('Please fill in all payment fields', 'error');
    return;
  }

  try {
    allLoans = loadLoansFromStorage();
    const loanIndex = allLoans.findIndex(l => l.id === loanId);

    if (loanIndex === -1) {
      showNotification('Loan not found', 'error');
      return;
    }

    // Add payment to the loan
    if (!allLoans[loanIndex].payments) {
      allLoans[loanIndex].payments = [];
    }

    allLoans[loanIndex].payments.push({ amount, date });
    saveLoansToStorage(allLoans);

    showNotification('Payment added successfully');
    loadLoanDetails(); // Reload details
    document.getElementById('paymentAmount').value = '';
    document.getElementById('paymentDate').value = '';
  } catch (error) {
    console.error('Error adding payment:', error);
    showNotification('Error adding payment', 'error');
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Index page functionality
  if (document.getElementById('loans-tbody')) {
    loadLoans();
    document.getElementById('add-loan-btn').addEventListener('click', () => {
      window.location.href = '/add';
    });
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', filterLoans);
    }
  }

  // Initialize contact form
  initializeContactForm();

  // Initialize enhanced loan form
  initializeLoanForm();

  // Loan details page functionality
  if (document.getElementById('loan-info')) {
    loadLoanDetails();

    // Edit loan button
    const editBtn = document.getElementById('edit-loan-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        const loanId = window.location.pathname.split('/').pop();
        apiCall(`/api/loans/${loanId}`).then(showEditForm);
      });
    }

    // Delete loan button
    const deleteBtn = document.getElementById('delete-loan-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', deleteLoan);
    }

    // Edit form
    const editForm = document.getElementById('edit-loan-form');
    if (editForm) {
      editForm.addEventListener('submit', handleEditLoan);
    }

    // Cancel edit button
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => {
        document.getElementById('loan-info').style.display = 'block';
        document.getElementById('edit-form').style.display = 'none';
      });
    }

    // Add payment button
    const addPaymentBtn = document.getElementById('add-payment-btn');
    if (addPaymentBtn) {
      addPaymentBtn.addEventListener('click', handleAddPayment);
    }
  }
});

// Scroll Animation Functionality
document.addEventListener('DOMContentLoaded', function() {
  // Add animation classes to elements
  const animateElements = document.querySelectorAll('.animate-on-scroll');
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
      }
    });
  }, observerOptions);

  animateElements.forEach(element => {
    observer.observe(element);
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Add loading animation to buttons
  document.querySelectorAll('.btn-primary, .btn-secondary').forEach(button => {
    button.addEventListener('click', function() {
      if (!this.classList.contains('loading')) {
        this.classList.add('loading');
        const originalText = this.innerHTML;
        this.innerHTML = '<div class="loading"></div> Loading...';

        setTimeout(() => {
          this.classList.remove('loading');
          this.innerHTML = originalText;
        }, 2000);
      }
    });
  });

  // Enhanced form validation with visual feedback
  document.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('blur', function() {
      if (this.value.trim() !== '') {
        this.classList.add('has-value');
      } else {
        this.classList.remove('has-value');
      }
    });

    field.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
    });

    field.addEventListener('blur', function() {
      this.parentElement.classList.remove('focused');
    });
  });

  // Counter animation for statistics
  function animateCounter(element, target, duration = 2000) {
    const start = parseInt(element.textContent) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
        element.textContent = target.toLocaleString();
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current).toLocaleString();
      }
    }, 16);
  }

  // Animate stat numbers on page load
  document.querySelectorAll('.stat-number').forEach(stat => {
    const text = stat.textContent;
    const number = parseInt(text.replace(/[^0-9]/g, ''));
    if (number) {
      stat.textContent = '0';
      setTimeout(() => animateCounter(stat, number), 500);
    }
  });

  // Parallax effect for hero background
  window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const heroBackground = document.querySelector('.hero::after');
    if (heroBackground) {
      const rate = scrolled * -0.5;
      heroBackground.style.transform = `translateY(${rate}px)`;
    }
  });

  // Back to Top Button
  const backToTopButton = document.getElementById('back-to-top');
  if (backToTopButton) {
    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 300) {
        backToTopButton.classList.add('show');
      } else {
        backToTopButton.classList.remove('show');
      }
    });

    backToTopButton.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Initialize contact form
  initializeContactForm();

  // Add ripple effect to buttons
  document.querySelectorAll('.btn-primary, .btn-secondary').forEach(button => {
    button.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      this.appendChild(ripple);

      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
      ripple.style.top = e.clientY - rect.top - size / 2 + 'px';

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
});

// Contact Form Functionality
function initializeContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const data = Object.fromEntries(formData);
      
      // Show loading state
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;
      
      // Simulate form submission (replace with actual API call)
      setTimeout(() => {
        showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
        this.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }, 1000);
    });
  }
}

// Scroll Animation Functionality
function initializeScrollAnimations() {
  // Add animation classes to elements
  const animateElements = document.querySelectorAll('.animate-on-scroll');
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
      }
    });
  }, observerOptions);

  animateElements.forEach(element => {
    observer.observe(element);
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Counter animation for statistics
  function animateCounter(element, target, duration = 2000) {
    const start = parseInt(element.textContent) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
        element.textContent = target.toLocaleString();
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current).toLocaleString();
      }
    }, 16);
  }

  // Animate stat numbers on page load
  document.querySelectorAll('.stat-number').forEach(stat => {
    const text = stat.textContent;
    const number = parseInt(text.replace(/[^0-9]/g, ''));
    if (number) {
      stat.textContent = '0';
      setTimeout(() => animateCounter(stat, number), 500);
    }
  });

  // Parallax effect for hero background
  window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const heroBackground = document.querySelector('.hero::after');
    if (heroBackground) {
      const rate = scrolled * -0.5;
      heroBackground.style.transform = `translateY(${rate}px)`;
    }
  });

  // Back to Top Button
  const backToTopButton = document.getElementById('back-to-top');
  if (backToTopButton) {
    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 300) {
        backToTopButton.classList.add('show');
      } else {
        backToTopButton.classList.remove('show');
      }
    });

    backToTopButton.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeContactForm();
  initializeScrollAnimations();
  initializeLoanForm();
  initializeDashboard();
  initializeCalculator();
});