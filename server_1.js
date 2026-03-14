const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;
const LOANS_FILE = path.join(__dirname, 'loans.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(compression()); // Add compression for faster responses
app.use(express.json({ limit: '10mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add caching headers for static files
app.use(express.static('public', {
  maxAge: '1d', // Cache static files for 1 day
  etag: true,
  lastModified: true
}));

// Helper function to read loans
function readLoans() {
  try {
    const data = fs.readFileSync(LOANS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Helper function to write loans
function writeLoans(loans) {
  fs.writeFileSync(LOANS_FILE, JSON.stringify(loans, null, 2));
}

// Helper function to read settings
function readSettings() {
  try {
    const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      notifications: true,
      autoBackup: true
    };
  }
}

// Helper function to write settings
function writeSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// Helper function to calculate loan status
function calculateLoanStatus(loan) {
  const totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = loan.amount - totalPaid;

  if (remainingBalance <= 0) {
    return 'paid_off';
  }

  const today = new Date();
  const startDate = new Date(loan.startDate);
  const monthsElapsed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24 * 30));

  if (monthsElapsed > loan.termMonths) {
    return 'overdue';
  }

  return 'active';
}

// Helper function to calculate next payment date
function calculateNextPaymentDate(loan) {
  const startDate = new Date(loan.startDate);
  const totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = loan.amount - totalPaid;

  if (remainingBalance <= 0) {
    return null; // Loan is paid off
  }

  const paymentsMade = loan.payments.length;
  const nextPaymentDate = new Date(startDate);
  nextPaymentDate.setMonth(startDate.getMonth() + paymentsMade);

  return nextPaymentDate;
}

// Routes
app.get('/api/loans', (req, res) => {
  const loans = readLoans();
  const enhancedLoans = loans.map(loan => ({
    ...loan,
    status: calculateLoanStatus(loan),
    nextPaymentDate: calculateNextPaymentDate(loan),
    totalPaid: loan.payments.reduce((sum, p) => sum + p.amount, 0),
    remainingBalance: loan.amount - loan.payments.reduce((sum, p) => sum + p.amount, 0)
  }));

  // Apply filters if provided
  let filteredLoans = enhancedLoans;
  if (req.query.status) {
    filteredLoans = filteredLoans.filter(loan => loan.status === req.query.status);
  }
  if (req.query.category) {
    filteredLoans = filteredLoans.filter(loan => loan.category === req.query.category);
  }
  if (req.query.search) {
    const searchTerm = req.query.search.toLowerCase();
    filteredLoans = filteredLoans.filter(loan =>
      loan.borrowerName.toLowerCase().includes(searchTerm) ||
      loan.description?.toLowerCase().includes(searchTerm)
    );
  }

  res.json(filteredLoans);
});

app.post('/api/loans', (req, res) => {
  const loans = readLoans();
  const newLoan = {
    id: Date.now().toString(),
    borrowerName: req.body.borrowerName,
    amount: parseFloat(req.body.amount),
    interestRate: parseFloat(req.body.interestRate),
    termMonths: parseInt(req.body.termMonths),
    startDate: req.body.startDate,
    category: req.body.category || 'personal',
    description: req.body.description || '',
    collateral: req.body.collateral || '',
    guarantor: req.body.guarantor || '',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    payments: []
  };
  loans.push(newLoan);
  writeLoans(loans);
  res.json(newLoan);
});

app.get('/api/loans/:id', (req, res) => {
  const loans = readLoans();
  const loan = loans.find(l => l.id === req.params.id);
  if (loan) {
    const enhancedLoan = {
      ...loan,
      status: calculateLoanStatus(loan),
      nextPaymentDate: calculateNextPaymentDate(loan),
      totalPaid: loan.payments.reduce((sum, p) => sum + p.amount, 0),
      remainingBalance: loan.amount - loan.payments.reduce((sum, p) => sum + p.amount, 0)
    };
    res.json(enhancedLoan);
  } else {
    res.status(404).json({ error: 'Loan not found' });
  }
});

app.put('/api/loans/:id', (req, res) => {
  const loans = readLoans();
  const loanIndex = loans.findIndex(l => l.id === req.params.id);
  if (loanIndex !== -1) {
    loans[loanIndex] = {
      ...loans[loanIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    writeLoans(loans);
    res.json(loans[loanIndex]);
  } else {
    res.status(404).json({ error: 'Loan not found' });
  }
});

app.delete('/api/loans/:id', (req, res) => {
  const loans = readLoans();
  const loanIndex = loans.findIndex(l => l.id === req.params.id);
  if (loanIndex !== -1) {
    const deletedLoan = loans.splice(loanIndex, 1)[0];
    writeLoans(loans);
    res.json(deletedLoan);
  } else {
    res.status(404).json({ error: 'Loan not found' });
  }
});

// New API endpoints for enhanced features
app.post('/api/loans/:id/payments', (req, res) => {
  const loans = readLoans();
  const loan = loans.find(l => l.id === req.params.id);
  if (loan) {
    const newPayment = {
      id: Date.now().toString(),
      amount: parseFloat(req.body.amount),
      date: req.body.date,
      method: req.body.method || 'cash',
      notes: req.body.notes || '',
      createdAt: new Date().toISOString()
    };
    loan.payments.push(newPayment);
    loan.updatedAt = new Date().toISOString();
    writeLoans(loans);
    res.json(newPayment);
  } else {
    res.status(404).json({ error: 'Loan not found' });
  }
});

app.delete('/api/loans/:loanId/payments/:paymentId', (req, res) => {
  const loans = readLoans();
  const loan = loans.find(l => l.id === req.params.loanId);
  if (loan) {
    const paymentIndex = loan.payments.findIndex(p => p.id === req.params.paymentId);
    if (paymentIndex !== -1) {
      const deletedPayment = loan.payments.splice(paymentIndex, 1)[0];
      loan.updatedAt = new Date().toISOString();
      writeLoans(loans);
      res.json(deletedPayment);
    } else {
      res.status(404).json({ error: 'Payment not found' });
    }
  } else {
    res.status(404).json({ error: 'Loan not found' });
  }
});

// Analytics endpoint
app.get('/api/analytics', (req, res) => {
  const loans = readLoans();
  const analytics = {
    totalLoans: loans.length,
    totalAmount: loans.reduce((sum, loan) => sum + loan.amount, 0),
    totalPaid: loans.reduce((sum, loan) => sum + loan.payments.reduce((pSum, p) => pSum + p.amount, 0), 0),
    totalOutstanding: 0,
    loansByStatus: { active: 0, paid_off: 0, overdue: 0 },
    loansByCategory: {},
    monthlyPayments: {},
    recentPayments: []
  };

  loans.forEach(loan => {
    const status = calculateLoanStatus(loan);
    analytics.loansByStatus[status]++;

    if (!analytics.loansByCategory[loan.category || 'personal']) {
      analytics.loansByCategory[loan.category || 'personal'] = 0;
    }
    analytics.loansByCategory[loan.category || 'personal']++;

    const outstanding = loan.amount - loan.payments.reduce((sum, p) => sum + p.amount, 0);
    analytics.totalOutstanding += outstanding;

    // Monthly payments data
    loan.payments.forEach(payment => {
      const month = new Date(payment.date).toISOString().substring(0, 7); // YYYY-MM
      if (!analytics.monthlyPayments[month]) {
        analytics.monthlyPayments[month] = 0;
      }
      analytics.monthlyPayments[month] += payment.amount;
    });

    // Recent payments
    loan.payments.forEach(payment => {
      analytics.recentPayments.push({
        ...payment,
        loanId: loan.id,
        borrowerName: loan.borrowerName
      });
    });
  });

  analytics.recentPayments.sort((a, b) => new Date(b.date) - new Date(a.date));
  analytics.recentPayments = analytics.recentPayments.slice(0, 10);

  res.json(analytics);
});

// Amortization schedule endpoint
app.get('/api/loans/:id/amortization', (req, res) => {
  const loans = readLoans();
  const loan = loans.find(l => l.id === req.params.id);
  if (loan) {
    const monthlyRate = loan.interestRate / 100 / 12;
    const monthlyPayment = (loan.amount * monthlyRate * Math.pow(1 + monthlyRate, loan.termMonths)) /
                          (Math.pow(1 + monthlyRate, loan.termMonths) - 1);

    const schedule = [];
    let remainingBalance = loan.amount;

    for (let month = 1; month <= loan.termMonths; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        remainingBalance: Math.max(0, remainingBalance),
        date: new Date(new Date(loan.startDate).getTime() + (month - 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }

    res.json(schedule);
  } else {
    res.status(404).json({ error: 'Loan not found' });
  }
});

// Export endpoints
app.get('/api/export/loans', (req, res) => {
  const loans = readLoans();
  const csvData = [
    ['ID', 'Borrower Name', 'Amount', 'Interest Rate', 'Term (Months)', 'Start Date', 'Category', 'Status', 'Total Paid', 'Remaining Balance'],
    ...loans.map(loan => {
      const totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
      const remainingBalance = loan.amount - totalPaid;
      const status = calculateLoanStatus(loan);
      return [
        loan.id,
        loan.borrowerName,
        loan.amount,
        loan.interestRate,
        loan.termMonths,
        loan.startDate,
        loan.category || 'personal',
        status,
        totalPaid,
        remainingBalance
      ];
    })
  ];

  const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="loans_export.csv"');
  res.send(csvContent);
});

app.get('/api/export/payments/:loanId', (req, res) => {
  const loans = readLoans();
  const loan = loans.find(l => l.id === req.params.loanId);
  if (loan) {
    const csvData = [
      ['Date', 'Amount', 'Method', 'Notes'],
      ...loan.payments.map(payment => [
        payment.date,
        payment.amount,
        payment.method || 'cash',
        payment.notes || ''
      ])
    ];

    const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payments_${loan.borrowerName.replace(/\s+/g, '_')}.csv"`);
    res.send(csvContent);
  } else {
    res.status(404).json({ error: 'Loan not found' });
  }
});

// Settings endpoints
app.get('/api/settings', (req, res) => {
  const settings = readSettings();
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const newSettings = req.body;
  writeSettings(newSettings);
  res.json(newSettings);
});

app.post('/api/settings/password', (req, res) => {
  // In a real application, you'd verify the current password and hash the new one
  // For this demo, we'll just accept the change
  res.json({ success: true, message: 'Password changed successfully' });
});

// Backup endpoints
app.post('/api/backup/create', (req, res) => {
  const loans = readLoans();
  const settings = readSettings();
  const backup = {
    loans,
    settings,
    timestamp: new Date().toISOString(),
    version: '1.0'
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="amandeeploan_backup.json"');
  res.send(JSON.stringify(backup, null, 2));
});

app.get('/api/backup/history', (req, res) => {
  // In a real application, you'd store backup metadata in a database
  // For this demo, we'll return mock data
  const mockBackups = [
    {
      id: '1',
      name: 'Daily Backup - ' + new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      size: '2.3 MB'
    },
    {
      id: '2',
      name: 'Weekly Backup - ' + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      size: '2.1 MB'
    }
  ];
  res.json(mockBackups);
});

app.get('/api/backup/download/:id', (req, res) => {
  // In a real application, you'd retrieve the specific backup file
  // For this demo, we'll return the current data as a backup
  const loans = readLoans();
  const settings = readSettings();
  const backup = {
    loans,
    settings,
    timestamp: new Date().toISOString(),
    version: '1.0'
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="backup_download.json"');
  res.send(JSON.stringify(backup, null, 2));
});

app.delete('/api/backup/:id', (req, res) => {
  // In a real application, you'd delete the specific backup file
  // For this demo, we'll just return success
  res.json({ success: true, message: 'Backup deleted successfully' });
});

// Import endpoint
app.post('/api/import', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');

    let importData;
    try {
      importData = JSON.parse(fileContent);
    } catch (parseError) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Invalid JSON file format' });
    }

    if (importData.loans && Array.isArray(importData.loans)) {
      // Validate and import loans
      const validLoans = importData.loans.filter(loan =>
        loan.id && loan.borrowerName && loan.amount && loan.interestRate && loan.termMonths
      );

      if (validLoans.length > 0) {
        const existingLoans = readLoans();
        // Generate new IDs to avoid conflicts
        const loansWithNewIds = validLoans.map(loan => ({
          ...loan,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          importedAt: new Date().toISOString()
        }));
        const mergedLoans = [...existingLoans, ...loansWithNewIds];
        writeLoans(mergedLoans);

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.json({
          success: true,
          message: `Successfully imported ${validLoans.length} loans`,
          imported: validLoans.length
        });
      } else {
        // Clean up uploaded file
        fs.unlinkSync(filePath);
        res.status(400).json({ error: 'No valid loans found in import data' });
      }
    } else {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      res.status(400).json({ error: 'Invalid import data format - missing loans array' });
    }
  } catch (error) {
    console.error('Import error:', error);
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// Enhanced export endpoints
app.get('/api/export/:type', (req, res) => {
  const exportType = req.params.type;
  const format = req.query.format || 'csv';

  switch (exportType) {
    case 'loans':
      exportLoans(res, format);
      break;
    case 'summary':
      exportSummary(res, format);
      break;
    case 'performance':
      exportPerformance(res, format);
      break;
    default:
      res.status(400).json({ error: 'Invalid export type' });
  }
});

function exportLoans(res, format) {
  const loans = readLoans();

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="loans_export.json"');
    res.send(JSON.stringify(loans, null, 2));
  } else {
    // CSV format
    const csvData = [
      ['ID', 'Borrower Name', 'Amount', 'Interest Rate', 'Term (Months)', 'Start Date', 'Category', 'Status', 'Total Paid', 'Remaining Balance'],
      ...loans.map(loan => {
        const totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
        const remainingBalance = loan.amount - totalPaid;
        const status = calculateLoanStatus(loan);
        return [
          loan.id,
          loan.borrowerName,
          loan.amount,
          loan.interestRate,
          loan.termMonths,
          loan.startDate,
          loan.category || 'personal',
          status,
          totalPaid,
          remainingBalance
        ];
      })
    ];

    const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="loans_export.csv"');
    res.send(csvContent);
  }
}

function exportSummary(res, format) {
  const loans = readLoans();
  const analytics = {
    totalLoans: loans.length,
    totalAmount: loans.reduce((sum, loan) => sum + loan.amount, 0),
    totalPaid: loans.reduce((sum, loan) => sum + loan.payments.reduce((pSum, p) => pSum + p.amount, 0), 0),
    loansByStatus: { active: 0, paid_off: 0, overdue: 0 }
  };

  loans.forEach(loan => {
    const status = calculateLoanStatus(loan);
    analytics.loansByStatus[status]++;
  });

  analytics.totalOutstanding = analytics.totalAmount - analytics.totalPaid;

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="summary_export.json"');
    res.send(JSON.stringify(analytics, null, 2));
  } else {
    // CSV format
    const csvData = [
      ['Metric', 'Value'],
      ['Total Loans', analytics.totalLoans],
      ['Total Amount', analytics.totalAmount],
      ['Total Paid', analytics.totalPaid],
      ['Total Outstanding', analytics.totalOutstanding],
      ['Active Loans', analytics.loansByStatus.active],
      ['Paid Off Loans', analytics.loansByStatus.paid_off],
      ['Overdue Loans', analytics.loansByStatus.overdue]
    ];

    const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="summary_export.csv"');
    res.send(csvContent);
  }
}

function exportPerformance(res, format) {
  const loans = readLoans();
  const performance = loans.map(loan => {
    const totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = loan.amount - totalPaid;
    const status = calculateLoanStatus(loan);
    const progress = (totalPaid / loan.amount) * 100;

    return {
      borrowerName: loan.borrowerName,
      loanAmount: loan.amount,
      interestRate: loan.interestRate,
      status,
      totalPaid,
      remainingBalance,
      progress: progress.toFixed(2),
      paymentsMade: loan.payments.length,
      nextPaymentDate: calculateNextPaymentDate(loan)
    };
  });

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="performance_export.json"');
    res.send(JSON.stringify(performance, null, 2));
  } else {
    // CSV format
    const csvData = [
      ['Borrower', 'Loan Amount', 'Interest Rate', 'Status', 'Total Paid', 'Remaining Balance', 'Progress (%)', 'Payments Made', 'Next Payment'],
      ...performance.map(p => [
        p.borrowerName,
        p.loanAmount,
        p.interestRate,
        p.status,
        p.totalPaid,
        p.remainingBalance,
        p.progress,
        p.paymentsMade,
        p.nextPaymentDate ? new Date(p.nextPaymentDate).toLocaleDateString() : 'N/A'
      ])
    ];

    const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="performance_export.csv"');
    res.send(csvContent);
  }
}

// Bulk operations
app.post('/api/loans/bulk-delete', (req, res) => {
  const { loanIds } = req.body;
  const loans = readLoans();
  const filteredLoans = loans.filter(loan => !loanIds.includes(loan.id));
  writeLoans(filteredLoans);
  res.json({ deleted: loanIds.length });
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/add', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'add.html'));
});

app.get('/calculator', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'calculator.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/history', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'history.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/reports', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reports.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

app.get('/help', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'help.html'));
});

app.get('/signin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signin.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/loan/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'detail.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Amandeep Loans server running at http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});