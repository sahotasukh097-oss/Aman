// dashboard.js - Static version

let analyticsData = {};
let statusChart = null;
let paymentChart = null;

// Load dashboard data from localStorage
function loadDashboardData() {
  try {
    const loans = JSON.parse(localStorage.getItem('loans') || '[]');
    calculateAnalytics(loans);
    updateMetrics();
    updateCharts();
    updateRecentActivity();
    updateUpcomingPayments();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showNotification('Error loading dashboard data', 'error');
  }
}

// Calculate analytics from loans data
function calculateAnalytics(loans) {
  analyticsData = {
    totalLoans: loans.length,
    totalAmount: loans.reduce((sum, loan) => sum + loan.amount, 0),
    totalPaid: loans.reduce((sum, loan) => {
      return sum + (loan.payments ? loan.payments.reduce((pSum, payment) => pSum + payment.amount, 0) : 0);
    }, 0),
    totalOutstanding: 0,
    statusBreakdown: { active: 0, paid: 0, overdue: 0 },
    recentPayments: [],
    upcomingPayments: []
  };

  analyticsData.totalOutstanding = analyticsData.totalAmount - analyticsData.totalPaid;

  // Calculate status breakdown
  loans.forEach(loan => {
    const totalPaid = loan.payments ? loan.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
    const progress = (totalPaid / loan.amount) * 100;

    if (progress >= 100) {
      analyticsData.statusBreakdown.paid++;
    } else {
      analyticsData.statusBreakdown.active++;
    }

    // Collect recent payments
    if (loan.payments) {
      loan.payments.forEach(payment => {
        analyticsData.recentPayments.push({
          ...payment,
          borrowerName: loan.borrowerName,
          loanId: loan.id
        });
      });
    }
  });

  // Sort recent payments by date
  analyticsData.recentPayments.sort((a, b) => new Date(b.date) - new Date(a.date));
  analyticsData.recentPayments = analyticsData.recentPayments.slice(0, 10);
}

// Update key metrics
function updateMetrics() {
  document.getElementById('total-loans').textContent = analyticsData.totalLoans;
  document.getElementById('total-amount').textContent = `$${analyticsData.totalAmount.toLocaleString()}`;
  document.getElementById('total-paid').textContent = `$${analyticsData.totalPaid.toLocaleString()}`;
  document.getElementById('total-outstanding').textContent = `$${analyticsData.totalOutstanding.toLocaleString()}`;

  // Calculate changes (simplified - in real app would compare with previous period)
  document.getElementById('loans-change').textContent = `+${analyticsData.totalLoans} total`;
  document.getElementById('amount-change').textContent = `$${analyticsData.totalAmount.toLocaleString()} total`;
  document.getElementById('paid-change').textContent = `$${analyticsData.totalPaid.toLocaleString()} collected`;
  document.getElementById('outstanding-change').textContent = `$${analyticsData.totalOutstanding.toLocaleString()} remaining`;
}

// Update charts
function updateCharts() {
  updateStatusChart();
  updatePaymentChart();
}

function updateStatusChart() {
  const ctx = document.getElementById('statusChart').getContext('2d');

  if (statusChart) {
    statusChart.destroy();
  }

  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Active', 'Paid Off', 'Overdue'],
      datasets: [{
        data: [
          analyticsData.loansByStatus.active,
          analyticsData.loansByStatus.paid_off,
          analyticsData.loansByStatus.overdue
        ],
        backgroundColor: [
          '#4299e1', // Blue for active
          '#48bb78', // Green for paid off
          '#e53e3e'  // Red for overdue
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function updatePaymentChart() {
  const ctx = document.getElementById('paymentChart').getContext('2d');

  if (paymentChart) {
    paymentChart.destroy();
  }

  // Sort monthly payments by date
  const sortedPayments = Object.entries(analyticsData.monthlyPayments)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6); // Last 6 months

  paymentChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sortedPayments.map(([month]) => {
        const date = new Date(month + '-01');
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }),
      datasets: [{
        label: 'Monthly Payments',
        data: sortedPayments.map(([, amount]) => amount),
        borderColor: '#4299e1',
        backgroundColor: 'rgba(66, 153, 225, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#4299e1',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `$${context.parsed.y.toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString();
            }
          }
        }
      }
    }
  });
}

// Update recent activity
function updateRecentActivity() {
  const activityList = document.getElementById('recent-activity');
  activityList.innerHTML = '';

  if (analyticsData.recentPayments.length === 0) {
    activityList.innerHTML = '<div class="no-activity">No recent payments</div>';
    return;
  }

  analyticsData.recentPayments.slice(0, 5).forEach(payment => {
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.innerHTML = `
      <div class="activity-icon">
        <i class="fas fa-dollar-sign"></i>
      </div>
      <div class="activity-content">
        <h4>Payment Received</h4>
        <p>$${payment.amount.toLocaleString()} from ${payment.borrowerName}</p>
        <span class="activity-date">${new Date(payment.date).toLocaleDateString()}</span>
      </div>
    `;
    activityList.appendChild(activityItem);
  });
}

// Update upcoming payments
function updateUpcomingPayments() {
  const paymentsList = document.getElementById('upcoming-payments-list');

  // Get loans with upcoming payments
  fetch('/api/loans')
    .then(response => response.json())
    .then(loans => {
      const upcomingPayments = loans
        .filter(loan => loan.nextPaymentDate && loan.status === 'active')
        .sort((a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate))
        .slice(0, 5);

      paymentsList.innerHTML = '';

      if (upcomingPayments.length === 0) {
        paymentsList.innerHTML = '<div class="no-payments">No upcoming payments</div>';
        return;
      }

      upcomingPayments.forEach(loan => {
        const paymentItem = document.createElement('div');
        paymentItem.className = 'payment-item';

        const daysUntilDue = Math.ceil((new Date(loan.nextPaymentDate) - new Date()) / (1000 * 60 * 60 * 24));
        const isOverdue = daysUntilDue < 0;
        const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;

        paymentItem.innerHTML = `
          <div class="payment-info">
            <i class="fas fa-calendar-day ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : ''}"></i>
            <div class="payment-details">
              <h4>${loan.borrowerName}</h4>
              <p>Next payment: ${new Date(loan.nextPaymentDate).toLocaleDateString()}</p>
              <span class="payment-status ${isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : 'on-time'}">
                ${isOverdue ? `${Math.abs(daysUntilDue)} days overdue` :
                  isDueSoon ? `Due in ${daysUntilDue} days` :
                  `${daysUntilDue} days remaining`}
              </span>
            </div>
          </div>
          <div class="payment-amount">
            $${calculateMonthlyPayment(loan).toFixed(2)}
          </div>
        `;
        paymentsList.appendChild(paymentItem);
      });
    })
    .catch(error => {
      console.error('Error loading upcoming payments:', error);
    });
}

// Calculate monthly payment (simplified)
function calculateMonthlyPayment(loan) {
  const monthlyRate = loan.interestRate / 100 / 12;
  return (loan.amount * monthlyRate * Math.pow(1 + monthlyRate, loan.termMonths)) /
         (Math.pow(1 + monthlyRate, loan.termMonths) - 1);
}

// Export functions
function exportLoans() {
  window.open('/api/export/loans', '_blank');
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();

  // Refresh data every 30 seconds
  setInterval(loadDashboardData, 30000);
});