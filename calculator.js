// calculator.js - Loan Calculator functionality

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

// Calculate loan payments
function calculateLoan() {
  const amount = parseFloat(document.getElementById('calc-amount').value);
  const rate = parseFloat(document.getElementById('calc-rate').value) / 100 / 12; // Monthly rate
  const term = parseInt(document.getElementById('calc-term').value);
  const startDate = document.getElementById('calc-start-date').value;

  if (!amount || amount <= 0) {
    showNotification('Please enter a valid loan amount', 'error');
    return;
  }

  if (!rate || rate < 0) {
    showNotification('Please enter a valid interest rate', 'error');
    return;
  }

  if (!term || term <= 0) {
    showNotification('Please enter a valid loan term', 'error');
    return;
  }

  // Calculate monthly payment using loan formula
  const monthlyPayment = (amount * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
  const totalAmount = monthlyPayment * term;
  const totalInterest = totalAmount - amount;

  // Calculate payoff date
  let payoffDate = 'N/A';
  if (startDate) {
    const start = new Date(startDate);
    const payoff = new Date(start);
    payoff.setMonth(payoff.getMonth() + term);
    payoffDate = payoff.toLocaleDateString();
  }

  // Display results
  document.getElementById('monthly-payment').textContent = `$${monthlyPayment.toFixed(2)}`;
  document.getElementById('total-interest').textContent = `$${totalInterest.toFixed(2)}`;
  document.getElementById('total-amount').textContent = `$${totalAmount.toFixed(2)}`;
  document.getElementById('payoff-date').textContent = payoffDate;

  document.getElementById('results-section').style.display = 'block';

  // Store calculation for later use
  window.currentCalculation = {
    amount,
    rate: rate * 12 * 100, // Convert back to annual percentage
    term,
    monthlyPayment,
    totalAmount,
    totalInterest,
    startDate
  };

  showNotification('Loan calculation completed successfully!');
}

// Reset calculator
function resetCalculator() {
  document.getElementById('calc-amount').value = '';
  document.getElementById('calc-rate').value = '';
  document.getElementById('calc-term').value = '';
  document.getElementById('calc-start-date').value = '';

  document.getElementById('results-section').style.display = 'none';
  document.getElementById('amortization-section').style.display = 'none';

  window.currentCalculation = null;
}

// Create loan from calculation
function createLoanFromCalc() {
  if (!window.currentCalculation) {
    showNotification('Please calculate a loan first', 'error');
    return;
  }

  // Store calculation in sessionStorage to pass to add.html
  sessionStorage.setItem('loanFromCalc', JSON.stringify(window.currentCalculation));

  // Redirect to add loan page
  window.location.href = 'add.html';
}

// Show amortization schedule
function showAmortization() {
  if (!window.currentCalculation) {
    showNotification('Please calculate a loan first', 'error');
    return;
  }

  const calc = window.currentCalculation;
  const schedule = generateAmortizationSchedule(calc);

  displayAmortizationSchedule(schedule);
  document.getElementById('amortization-section').style.display = 'block';

  // Scroll to schedule
  document.getElementById('amortization-section').scrollIntoView({ behavior: 'smooth' });
}

// Generate amortization schedule
function generateAmortizationSchedule(calc) {
  const { amount, rate, term, monthlyPayment } = calc;
  const monthlyRate = rate / 100 / 12; // Convert to monthly decimal

  const schedule = [];
  let remainingBalance = amount;
  let startDate = calc.startDate ? new Date(calc.startDate) : new Date();

  for (let i = 1; i <= term; i++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    remainingBalance -= principalPayment;

    // Ensure balance doesn't go negative
    if (remainingBalance < 0) remainingBalance = 0;

    // Calculate payment date
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + i);

    schedule.push({
      paymentNumber: i,
      date: paymentDate.toLocaleDateString(),
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: remainingBalance
    });
  }

  return schedule;
}

// Display amortization schedule
function displayAmortizationSchedule(schedule) {
  const tbody = document.getElementById('schedule-body');
  tbody.innerHTML = '';

  schedule.forEach(payment => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${payment.paymentNumber}</td>
      <td>${payment.date}</td>
      <td>$${payment.payment.toFixed(2)}</td>
      <td>$${payment.principal.toFixed(2)}</td>
      <td>$${payment.interest.toFixed(2)}</td>
      <td>$${payment.balance.toFixed(2)}</td>
    `;
    tbody.appendChild(row);
  });
}

// Export amortization schedule
function exportSchedule() {
  if (!window.currentCalculation) {
    showNotification('No schedule to export', 'error');
    return;
  }

  const schedule = generateAmortizationSchedule(window.currentCalculation);

  // Create CSV content
  let csv = 'Payment #,Date,Payment,Principal,Interest,Balance\n';
  schedule.forEach(payment => {
    csv += `${payment.paymentNumber},${payment.date},"${payment.payment.toFixed(2)}","${payment.principal.toFixed(2)}","${payment.interest.toFixed(2)}","${payment.balance.toFixed(2)}"\n`;
  });

  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'amortization_schedule.csv';
  a.click();
  window.URL.revokeObjectURL(url);

  showNotification('Amortization schedule exported successfully!');
}

// Initialize calculator
document.addEventListener('DOMContentLoaded', () => {
  // Load calculation from sessionStorage if coming from calculator
  const savedCalc = sessionStorage.getItem('loanFromCalc');
  if (savedCalc) {
    const calc = JSON.parse(savedCalc);
    document.getElementById('calc-amount').value = calc.amount;
    document.getElementById('calc-rate').value = calc.rate;
    document.getElementById('calc-term').value = calc.term;
    if (calc.startDate) {
      document.getElementById('calc-start-date').value = calc.startDate;
    }

    // Calculate and show results
    calculateLoan();

    // Clear the stored calculation
    sessionStorage.removeItem('loanFromCalc');
  }
});