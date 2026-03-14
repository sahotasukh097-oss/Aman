// History page functionality
document.addEventListener('DOMContentLoaded', function() {
  loadHistory();
  populateYearFilter();
  updateStatistics();
});

// Load and display loan history
function loadHistory() {
  const loans = JSON.parse(localStorage.getItem('loans') || '[]');
  const historyTable = document.getElementById('history-tbody');
  const noResults = document.getElementById('no-results');

  historyTable.innerHTML = '';

  if (loans.length === 0) {
    noResults.style.display = 'block';
    return;
  }

  noResults.style.display = 'none';

  // Sort loans by creation date (newest first)
  loans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  loans.forEach(loan => {
    const row = createHistoryRow(loan);
    historyTable.appendChild(row);
  });
}

// Create a table row for a loan
function createHistoryRow(loan) {
  const row = document.createElement('tr');

  // Calculate completion percentage
  const completionPercentage = calculateCompletionPercentage(loan);
  const statusClass = getStatusClass(loan);
  const statusText = getStatusText(loan);

  // Calculate total paid
  const totalPaid = calculateTotalPaid(loan);

  row.innerHTML = `
    <td>
      <div class="borrower-info">
        <strong>${loan.borrowerName}</strong>
        <small>ID: ${loan.id}</small>
      </div>
    </td>
    <td>$${loan.amount.toLocaleString()}</td>
    <td>${loan.interestRate}%</td>
    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
    <td>${formatDate(loan.createdAt)}</td>
    <td>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${completionPercentage}%"></div>
        <span class="progress-text">${completionPercentage}%</span>
      </div>
    </td>
    <td>$${totalPaid.toLocaleString()}</td>
    <td>
      <div class="action-buttons">
        <button class="btn-icon" onclick="viewLoanDetails('${loan.id}')" title="View Details">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn-icon" onclick="duplicateLoan('${loan.id}')" title="Duplicate">
          <i class="fas fa-copy"></i>
        </button>
        <button class="btn-icon delete" onclick="deleteLoan('${loan.id}')" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </td>
  `;

  return row;
}

// Calculate completion percentage
function calculateCompletionPercentage(loan) {
  if (!loan.payments || loan.payments.length === 0) return 0;

  const totalPaid = loan.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalOwed = loan.amount + (loan.amount * loan.interestRate * loan.term / 100);

  return Math.min(Math.round((totalPaid / totalOwed) * 100), 100);
}

// Get status class for styling
function getStatusClass(loan) {
  if (!loan.payments || loan.payments.length === 0) return 'status-active';

  const totalPaid = loan.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalOwed = loan.amount + (loan.amount * loan.interestRate * loan.term / 100);

  if (totalPaid >= totalOwed) return 'status-paid';
  if (isOverdue(loan)) return 'status-overdue';
  return 'status-active';
}

// Get status text
function getStatusText(loan) {
  if (!loan.payments || loan.payments.length === 0) return 'Active';

  const totalPaid = loan.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalOwed = loan.amount + (loan.amount * loan.interestRate * loan.term / 100);

  if (totalPaid >= totalOwed) return 'Paid Off';
  if (isOverdue(loan)) return 'Overdue';
  return 'Active';
}

// Check if loan is overdue
function isOverdue(loan) {
  const dueDate = new Date(loan.createdAt);
  dueDate.setMonth(dueDate.getMonth() + loan.term);
  return new Date() > dueDate;
}

// Calculate total paid
function calculateTotalPaid(loan) {
  if (!loan.payments || loan.payments.length === 0) return 0;
  return loan.payments.reduce((sum, payment) => sum + payment.amount, 0);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Populate year filter
function populateYearFilter() {
  const loans = JSON.parse(localStorage.getItem('loans') || '[]');
  const yearFilter = document.getElementById('year-filter');
  const years = new Set();

  loans.forEach(loan => {
    const year = new Date(loan.createdAt).getFullYear();
    years.add(year);
  });

  // Clear existing options except "All Years"
  while (yearFilter.children.length > 1) {
    yearFilter.removeChild(yearFilter.lastChild);
  }

  // Add year options
  Array.from(years).sort((a, b) => b - a).forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearFilter.appendChild(option);
  });
}

// Filter history
function filterHistory() {
  const statusFilter = document.getElementById('status-filter').value;
  const yearFilter = document.getElementById('year-filter').value;
  const searchTerm = document.getElementById('search-input').value.toLowerCase();

  const loans = JSON.parse(localStorage.getItem('loans') || '[]');
  const filteredLoans = loans.filter(loan => {
    // Status filter
    if (statusFilter !== 'all') {
      const loanStatus = getStatusText(loan).toLowerCase().replace(' ', '-');
      if (loanStatus !== statusFilter) return false;
    }

    // Year filter
    if (yearFilter !== 'all') {
      const loanYear = new Date(loan.createdAt).getFullYear().toString();
      if (loanYear !== yearFilter) return false;
    }

    // Search filter
    if (searchTerm && !loan.borrowerName.toLowerCase().includes(searchTerm)) {
      return false;
    }

    return true;
  });

  displayFilteredLoans(filteredLoans);
}

// Display filtered loans
function displayFilteredLoans(loans) {
  const historyTable = document.getElementById('history-tbody');
  const noResults = document.getElementById('no-results');

  historyTable.innerHTML = '';

  if (loans.length === 0) {
    noResults.style.display = 'block';
    return;
  }

  noResults.style.display = 'none';

  // Sort loans by creation date (newest first)
  loans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  loans.forEach(loan => {
    const row = createHistoryRow(loan);
    historyTable.appendChild(row);
  });
}

// Clear all filters
function clearFilters() {
  document.getElementById('status-filter').value = 'all';
  document.getElementById('year-filter').value = 'all';
  document.getElementById('search-input').value = '';
  loadHistory();
}

// Update statistics
function updateStatistics() {
  const loans = JSON.parse(localStorage.getItem('loans') || '[]');

  let paidLoans = 0;
  let totalCollected = 0;
  let totalCompletion = 0;
  let totalDuration = 0;
  let activeLoans = 0;

  loans.forEach(loan => {
    const completion = calculateCompletionPercentage(loan);
    totalCompletion += completion;

    if (completion >= 100) {
      paidLoans++;
    } else {
      activeLoans++;
    }

    totalCollected += calculateTotalPaid(loan);

    // Calculate duration for paid loans
    if (completion >= 100 && loan.payments && loan.payments.length > 0) {
      const startDate = new Date(loan.createdAt);
      const lastPayment = new Date(Math.max(...loan.payments.map(p => new Date(p.date))));
      const duration = Math.ceil((lastPayment - startDate) / (1000 * 60 * 60 * 24));
      totalDuration += duration;
    }
  });

  document.getElementById('total-paid-loans').textContent = paidLoans;
  document.getElementById('total-collected').textContent = `$${totalCollected.toLocaleString()}`;
  document.getElementById('avg-completion').textContent = loans.length > 0 ? Math.round(totalCompletion / loans.length) + '%' : '0%';
  document.getElementById('avg-duration').textContent = paidLoans > 0 ? Math.round(totalDuration / paidLoans) + ' days' : '0 days';
}

// View loan details
function viewLoanDetails(loanId) {
  const loans = JSON.parse(localStorage.getItem('loans') || '[]');
  const loan = loans.find(l => l.id === loanId);

  if (!loan) return;

  const modal = document.getElementById('loan-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');

  modalTitle.textContent = `Loan Details - ${loan.borrowerName}`;

  const completion = calculateCompletionPercentage(loan);
  const totalPaid = calculateTotalPaid(loan);
  const totalOwed = loan.amount + (loan.amount * loan.interestRate * loan.term / 100);
  const remaining = Math.max(totalOwed - totalPaid, 0);

  modalBody.innerHTML = `
    <div class="loan-details">
      <div class="detail-section">
        <h4>Loan Information</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Loan ID:</label>
            <span>${loan.id}</span>
          </div>
          <div class="detail-item">
            <label>Borrower:</label>
            <span>${loan.borrowerName}</span>
          </div>
          <div class="detail-item">
            <label>Amount:</label>
            <span>$${loan.amount.toLocaleString()}</span>
          </div>
          <div class="detail-item">
            <label>Interest Rate:</label>
            <span>${loan.interestRate}%</span>
          </div>
          <div class="detail-item">
            <label>Term:</label>
            <span>${loan.term} months</span>
          </div>
          <div class="detail-item">
            <label>Start Date:</label>
            <span>${formatDate(loan.createdAt)}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>Payment Summary</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Total Paid:</label>
            <span>$${totalPaid.toLocaleString()}</span>
          </div>
          <div class="detail-item">
            <label>Remaining Balance:</label>
            <span>$${remaining.toLocaleString()}</span>
          </div>
          <div class="detail-item">
            <label>Completion:</label>
            <span>${completion}%</span>
          </div>
          <div class="detail-item">
            <label>Status:</label>
            <span class="status-badge ${getStatusClass(loan)}">${getStatusText(loan)}</span>
          </div>
        </div>
      </div>

      ${loan.payments && loan.payments.length > 0 ? `
        <div class="detail-section">
          <h4>Payment History</h4>
          <div class="payments-table">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                ${loan.payments.map(payment => `
                  <tr>
                    <td>${formatDate(payment.date)}</td>
                    <td>$${payment.amount.toLocaleString()}</td>
                    <td>${payment.method || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  modal.style.display = 'block';
}

// Close modal
function closeModal() {
  document.getElementById('loan-modal').style.display = 'none';
}

// Duplicate loan
function duplicateLoan(loanId) {
  const loans = JSON.parse(localStorage.getItem('loans') || '[]');
  const loan = loans.find(l => l.id === loanId);

  if (!loan) return;

  // Create duplicate with new ID and current date
  const duplicate = {
    ...loan,
    id: generateLoanId(),
    borrowerName: `${loan.borrowerName} (Copy)`,
    createdAt: new Date().toISOString(),
    payments: [] // Clear payment history
  };

  loans.push(duplicate);
  localStorage.setItem('loans', JSON.stringify(loans));

  showNotification('Loan duplicated successfully!', 'success');
  loadHistory();
  updateStatistics();
}

// Delete loan
function deleteLoan(loanId) {
  if (!confirm('Are you sure you want to delete this loan? This action cannot be undone.')) {
    return;
  }

  const loans = JSON.parse(localStorage.getItem('loans') || '[]');
  const filteredLoans = loans.filter(l => l.id !== loanId);

  localStorage.setItem('loans', JSON.stringify(filteredLoans));

  showNotification('Loan deleted successfully!', 'success');
  loadHistory();
  updateStatistics();
}

// Export history to CSV
function exportHistory() {
  const loans = JSON.parse(localStorage.getItem('loans') || '[]');

  if (loans.length === 0) {
    showNotification('No loans to export.', 'warning');
    return;
  }

  const csvContent = [
    ['Loan ID', 'Borrower Name', 'Amount', 'Interest Rate', 'Term', 'Status', 'Start Date', 'Completion %', 'Total Paid'],
    ...loans.map(loan => [
      loan.id,
      loan.borrowerName,
      loan.amount,
      loan.interestRate,
      loan.term,
      getStatusText(loan),
      formatDate(loan.createdAt),
      calculateCompletionPercentage(loan),
      calculateTotalPaid(loan)
    ])
  ];

  const csvString = csvContent.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `loan_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  showNotification('History exported successfully!', 'success');
}

// Generate loan ID
function generateLoanId() {
  return 'LN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
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

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('loan-modal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};