// reports.js

let currentReportData = {};
let statusChart = null;
let paymentTrendsChart = null;
let interestRateChart = null;
let amountDistributionChart = null;

// Initialize reports page
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadInitialData();
});

function setupEventListeners() {
  // Report type change
  document.getElementById('report-type').addEventListener('change', handleReportTypeChange);

  // Date range change
  document.getElementById('date-range').addEventListener('change', handleDateRangeChange);

  // Generate report button
  document.getElementById('generate-report').addEventListener('click', generateReport);

  // Export report button
  document.getElementById('export-report').addEventListener('click', exportReport);
}

function handleReportTypeChange() {
  const reportType = document.getElementById('report-type').value;
  // Update UI based on report type if needed
  console.log('Report type changed to:', reportType);
}

function handleDateRangeChange() {
  const dateRange = document.getElementById('date-range').value;
  const customDateRange = document.querySelector('.custom-date-range');

  if (dateRange === 'custom') {
    customDateRange.style.display = 'flex';
  } else {
    customDateRange.style.display = 'none';
  }
}

async function loadInitialData() {
  try {
    await loadSummaryData();
    await generateReport();
  } catch (error) {
    console.error('Error loading initial data:', error);
    showNotification('Error loading report data', 'error');
  }
}

function loadSummaryData() {
  try {
    const loans = JSON.parse(localStorage.getItem('loans') || '[]');

    const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const avgInterestRate = loans.length > 0 ?
      (loans.reduce((sum, loan) => sum + loan.interestRate, 0) / loans.length).toFixed(1) : 0;
    const avgTerm = loans.length > 0 ?
      Math.round(loans.reduce((sum, loan) => sum + loan.termMonths, 0) / loans.length) : 0;

    document.getElementById('total-portfolio').textContent = `$${totalAmount.toLocaleString()}`;
    document.getElementById('avg-interest-rate').textContent = `${avgInterestRate}%`;
    document.getElementById('avg-term').textContent = `${avgTerm} months`;
  } catch (error) {
    console.error('Error loading summary data:', error);
  }
}

function calculateAverageInterestRate(loansByStatus) {
  // This is a simplified calculation - in a real app, you'd have individual loan data
  return '8.5'; // Placeholder
}

function calculateAverageTerm(loansByStatus) {
  // This is a simplified calculation - in a real app, you'd have individual loan data
  return '36'; // Placeholder
}

function calculateDefaultRate(loansByStatus) {
  const totalLoans = loansByStatus.active + loansByStatus.paid_off + loansByStatus.overdue;
  if (totalLoans === 0) return '0.0';
  return ((loansByStatus.overdue / totalLoans) * 100).toFixed(1);
}

async function generateReport() {
  const reportType = document.getElementById('report-type').value;
  const dateRange = document.getElementById('date-range').value;

  try {
    let reportData;

    switch (reportType) {
      case 'summary':
        reportData = await generateSummaryReport(dateRange);
        break;
      case 'performance':
        reportData = await generatePerformanceReport(dateRange);
        break;
      case 'aging':
        reportData = await generateAgingReport(dateRange);
        break;
      case 'payment':
        reportData = await generatePaymentReport(dateRange);
        break;
      case 'portfolio':
        reportData = await generatePortfolioReport(dateRange);
        break;
      default:
        reportData = await generateSummaryReport(dateRange);
    }

    currentReportData = reportData;
    displayReport(reportData);
    updateCharts(reportData);

  } catch (error) {
    console.error('Error generating report:', error);
    showNotification('Error generating report', 'error');
  }
}

function generateSummaryReport(dateRange) {
  const loans = JSON.parse(localStorage.getItem('loans') || '[]');

  const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalPaid = loans.reduce((sum, loan) => {
    return sum + (loan.payments ? loan.payments.reduce((pSum, payment) => pSum + payment.amount, 0) : 0);
  }, 0);

  return {
    totalLoans: loans.length,
    totalAmount: totalAmount,
    totalPaid: totalPaid,
    totalOutstanding: totalAmount - totalPaid,
    loansByStatus: {
      active: loans.filter(loan => {
        const paid = loan.payments ? loan.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
        return paid < loan.amount;
      }).length,
      paid_off: loans.filter(loan => {
        const paid = loan.payments ? loan.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
        return paid >= loan.amount;
      }).length,
      overdue: 0 // Simplified for static version
    }
  };
}

function generatePerformanceReport(dateRange) {
  const loans = JSON.parse(localStorage.getItem('loans') || '[]');

  return {
    loans: loans,
    performance: calculatePerformanceMetrics(loans)
  };
}

function generateAgingReport(dateRange) {
  const loans = JSON.parse(localStorage.getItem('loans') || '[]');

  return {
    agingBuckets: calculateAgingBuckets(loans)
  };
}

async function generatePaymentReport(dateRange) {
  const response = await fetch('/api/loans');
  const loans = await response.json();

  return {
    paymentHistory: calculatePaymentHistory(loans)
  };
}

async function generatePortfolioReport(dateRange) {
  const response = await fetch('/api/loans');
  const loans = await response.json();

  return {
    portfolio: calculatePortfolioMetrics(loans)
  };
}

function calculatePerformanceMetrics(loans) {
  // Simplified performance calculations
  return {
    totalLoans: loans.length,
    activeLoans: loans.filter(l => l.status === 'active').length,
    paidOffLoans: loans.filter(l => l.status === 'paid_off').length,
    overdueLoans: loans.filter(l => l.status === 'overdue').length,
    averageLoanAmount: loans.reduce((sum, l) => sum + l.amount, 0) / loans.length || 0
  };
}

function calculateAgingBuckets(loans) {
  const now = new Date();
  const buckets = {
    current: 0,
    '1-30': 0,
    '31-60': 0,
    '61-90': 0,
    '90+': 0
  };

  loans.forEach(loan => {
    if (loan.status !== 'active') return;

    const nextPayment = new Date(loan.nextPaymentDate);
    const daysDiff = Math.floor((now - nextPayment) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 0) {
      buckets.current++;
    } else if (daysDiff <= 30) {
      buckets['1-30']++;
    } else if (daysDiff <= 60) {
      buckets['31-60']++;
    } else if (daysDiff <= 90) {
      buckets['61-90']++;
    } else {
      buckets['90+']++;
    }
  });

  return buckets;
}

function calculatePaymentHistory(loans) {
  // Simplified payment history calculation
  return loans.map(loan => ({
    borrowerName: loan.borrowerName,
    totalPaid: loan.amount * 0.3, // Simplified
    lastPayment: loan.lastPaymentDate || 'N/A',
    nextPayment: loan.nextPaymentDate
  }));
}

function calculatePortfolioMetrics(loans) {
  return {
    totalValue: loans.reduce((sum, l) => sum + l.amount, 0),
    averageLoanSize: loans.reduce((sum, l) => sum + l.amount, 0) / loans.length || 0,
    riskDistribution: {
      low: loans.filter(l => l.amount < 5000).length,
      medium: loans.filter(l => l.amount >= 5000 && l.amount < 20000).length,
      high: loans.filter(l => l.amount >= 20000).length
    }
  };
}

function displayReport(data) {
  const reportContent = document.getElementById('report-content');
  const reportType = document.getElementById('report-type').value;

  let html = '';

  switch (reportType) {
    case 'summary':
      html = generateSummaryReportHTML(data);
      break;
    case 'performance':
      html = generatePerformanceReportHTML(data);
      break;
    case 'aging':
      html = generateAgingReportHTML(data);
      break;
    case 'payment':
      html = generatePaymentReportHTML(data);
      break;
    case 'portfolio':
      html = generatePortfolioReportHTML(data);
      break;
  }

  reportContent.innerHTML = html;
}

function generateSummaryReportHTML(data) {
  return `
    <div class="report-section">
      <h2>Loan Summary Report</h2>
      <div class="summary-stats">
        <div class="stat-item">
          <h3>${data.totalLoans}</h3>
          <p>Total Loans</p>
        </div>
        <div class="stat-item">
          <h3>$${data.totalAmount.toLocaleString()}</h3>
          <p>Total Loan Amount</p>
        </div>
        <div class="stat-item">
          <h3>$${data.totalPaid.toLocaleString()}</h3>
          <p>Total Paid</p>
        </div>
        <div class="stat-item">
          <h3>$${data.totalOutstanding.toLocaleString()}</h3>
          <p>Outstanding Balance</p>
        </div>
      </div>
    </div>
  `;
}

function generatePerformanceReportHTML(data) {
  const tableRows = data.loans.map(loan => `
    <tr>
      <td>${loan.borrowerName}</td>
      <td>$${loan.amount.toLocaleString()}</td>
      <td>${loan.interestRate}%</td>
      <td><span class="status-${loan.status}">${loan.status.replace('_', ' ')}</span></td>
      <td>${loan.paymentsMade || 0}</td>
      <td>$${calculateOutstandingBalance(loan).toLocaleString()}</td>
      <td>${loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString() : 'N/A'}</td>
    </tr>
  `).join('');

  return `
    <div class="report-section">
      <h2>Loan Performance Report</h2>
      <div class="performance-metrics">
        <div class="metric">
          <h3>${data.performance.activeLoans}</h3>
          <p>Active Loans</p>
        </div>
        <div class="metric">
          <h3>${data.performance.paidOffLoans}</h3>
          <p>Paid Off Loans</p>
        </div>
        <div class="metric">
          <h3>${data.performance.overdueLoans}</h3>
          <p>Overdue Loans</p>
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Borrower</th>
              <th>Loan Amount</th>
              <th>Interest Rate</th>
              <th>Status</th>
              <th>Payments Made</th>
              <th>Outstanding Balance</th>
              <th>Next Payment</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function generateAgingReportHTML(data) {
  return `
    <div class="report-section">
      <h2>Loan Aging Report</h2>
      <div class="aging-buckets">
        <div class="aging-bucket">
          <h3>${data.agingBuckets.current}</h3>
          <p>Current</p>
        </div>
        <div class="aging-bucket">
          <h3>${data.agingBuckets['1-30']}</h3>
          <p>1-30 Days</p>
        </div>
        <div class="aging-bucket">
          <h3>${data.agingBuckets['31-60']}</h3>
          <p>31-60 Days</p>
        </div>
        <div class="aging-bucket">
          <h3>${data.agingBuckets['61-90']}</h3>
          <p>61-90 Days</p>
        </div>
        <div class="aging-bucket">
          <h3>${data.agingBuckets['90+']}</h3>
          <p>90+ Days</p>
        </div>
      </div>
    </div>
  `;
}

function generatePaymentReportHTML(data) {
  const paymentRows = data.paymentHistory.map(payment => `
    <tr>
      <td>${payment.borrowerName}</td>
      <td>$${payment.totalPaid.toLocaleString()}</td>
      <td>${payment.lastPayment}</td>
      <td>${payment.nextPayment ? new Date(payment.nextPayment).toLocaleDateString() : 'N/A'}</td>
    </tr>
  `).join('');

  return `
    <div class="report-section">
      <h2>Payment History Report</h2>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Borrower</th>
              <th>Total Paid</th>
              <th>Last Payment</th>
              <th>Next Payment</th>
            </tr>
          </thead>
          <tbody>
            ${paymentRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function generatePortfolioReportHTML(data) {
  return `
    <div class="report-section">
      <h2>Portfolio Analysis Report</h2>
      <div class="portfolio-metrics">
        <div class="metric">
          <h3>$${data.portfolio.totalValue.toLocaleString()}</h3>
          <p>Total Portfolio Value</p>
        </div>
        <div class="metric">
          <h3>$${data.portfolio.averageLoanSize.toLocaleString()}</h3>
          <p>Average Loan Size</p>
        </div>
      </div>
      <div class="risk-distribution">
        <h3>Risk Distribution</h3>
        <div class="risk-bars">
          <div class="risk-bar">
            <span>Low Risk (< $5,000)</span>
            <div class="bar">
              <div class="fill low" style="width: ${(data.portfolio.riskDistribution.low / Math.max(data.portfolio.riskDistribution.low + data.portfolio.riskDistribution.medium + data.portfolio.riskDistribution.high, 1)) * 100}%"></div>
            </div>
            <span>${data.portfolio.riskDistribution.low}</span>
          </div>
          <div class="risk-bar">
            <span>Medium Risk ($5,000 - $20,000)</span>
            <div class="bar">
              <div class="fill medium" style="width: ${(data.portfolio.riskDistribution.medium / Math.max(data.portfolio.riskDistribution.low + data.portfolio.riskDistribution.medium + data.portfolio.riskDistribution.high, 1)) * 100}%"></div>
            </div>
            <span>${data.portfolio.riskDistribution.medium}</span>
          </div>
          <div class="risk-bar">
            <span>High Risk (≥ $20,000)</span>
            <div class="bar">
              <div class="fill high" style="width: ${(data.portfolio.riskDistribution.high / Math.max(data.portfolio.riskDistribution.low + data.portfolio.riskDistribution.medium + data.portfolio.riskDistribution.high, 1)) * 100}%"></div>
            </div>
            <span>${data.portfolio.riskDistribution.high}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function calculateOutstandingBalance(loan) {
  // Simplified calculation - in real app, this would be more complex
  const paidAmount = (loan.paymentsMade || 0) * calculateMonthlyPayment(loan);
  return Math.max(0, loan.amount - paidAmount);
}

function calculateMonthlyPayment(loan) {
  const monthlyRate = loan.interestRate / 100 / 12;
  return (loan.amount * monthlyRate * Math.pow(1 + monthlyRate, loan.termMonths)) /
         (Math.pow(1 + monthlyRate, loan.termMonths) - 1);
}

function updateCharts(data) {
  updateStatusDistributionChart(data);
  updatePaymentTrendsChart(data);
  updateInterestRateChart(data);
  updateAmountDistributionChart(data);
}

function updateStatusDistributionChart(data) {
  const ctx = document.getElementById('statusDistributionChart').getContext('2d');

  if (statusChart) {
    statusChart.destroy();
  }

  statusChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Active', 'Paid Off', 'Overdue'],
      datasets: [{
        data: [
          data.loansByStatus.active,
          data.loansByStatus.paid_off,
          data.loansByStatus.overdue
        ],
        backgroundColor: ['#4299e1', '#48bb78', '#e53e3e'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function updatePaymentTrendsChart(data) {
  const ctx = document.getElementById('paymentTrendsChart').getContext('2d');

  if (paymentTrendsChart) {
    paymentTrendsChart.destroy();
  }

  // Use monthly payments data from analytics
  const sortedPayments = Object.entries(data.monthlyPayments || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12); // Last 12 months

  paymentTrendsChart = new Chart(ctx, {
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
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
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

function updateInterestRateChart(data) {
  const ctx = document.getElementById('interestRateChart').getContext('2d');

  if (interestRateChart) {
    interestRateChart.destroy();
  }

  // Simplified interest rate distribution
  const interestBuckets = {
    '5-7%': 0,
    '7-10%': 0,
    '10-15%': 0,
    '15%+': 0
  };

  // This would be calculated from actual loan data in a real app
  interestBuckets['7-10%'] = Math.floor(data.totalLoans * 0.6);
  interestBuckets['5-7%'] = Math.floor(data.totalLoans * 0.25);
  interestBuckets['10-15%'] = Math.floor(data.totalLoans * 0.1);
  interestBuckets['15%+'] = data.totalLoans - interestBuckets['7-10%'] - interestBuckets['5-7%'] - interestBuckets['10-15%'];

  interestRateChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(interestBuckets),
      datasets: [{
        label: 'Number of Loans',
        data: Object.values(interestBuckets),
        backgroundColor: '#48bb78',
        borderColor: '#38a169',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function updateAmountDistributionChart(data) {
  const ctx = document.getElementById('amountDistributionChart').getContext('2d');

  if (amountDistributionChart) {
    amountDistributionChart.destroy();
  }

  // Simplified loan amount distribution
  const amountBuckets = {
    '< $5K': 0,
    '$5K - $20K': 0,
    '$20K - $50K': 0,
    '$50K+': 0
  };

  // This would be calculated from actual loan data in a real app
  amountBuckets['$5K - $20K'] = Math.floor(data.totalLoans * 0.5);
  amountBuckets['< $5K'] = Math.floor(data.totalLoans * 0.3);
  amountBuckets['$20K - $50K'] = Math.floor(data.totalLoans * 0.15);
  amountBuckets['$50K+'] = data.totalLoans - amountBuckets['$5K - $20K'] - amountBuckets['< $5K'] - amountBuckets['$20K - $50K'];

  amountDistributionChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(amountBuckets),
      datasets: [{
        data: Object.values(amountBuckets),
        backgroundColor: ['#4299e1', '#48bb78', '#ed8936', '#e53e3e'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function exportReport() {
  const reportType = document.getElementById('report-type').value;
  const dateRange = document.getElementById('date-range').value;

  // Export as CSV or PDF - for now, we'll use the existing export endpoint
  window.open(`/api/export/${reportType}?range=${dateRange}`, '_blank');
}

function showNotification(message, type = 'info') {
  // Simple notification - in a real app, you'd have a proper notification system
  alert(message);
}