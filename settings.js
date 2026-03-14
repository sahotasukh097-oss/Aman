// settings.js

let currentSettings = {};

// Initialize settings page
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupEventListeners();
});

function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  });

  // Save settings
  document.getElementById('save-settings').addEventListener('click', saveSettings);

  // Reset settings
  document.getElementById('reset-settings').addEventListener('click', resetSettings);

  // Change password
  document.getElementById('change-password').addEventListener('click', changePassword);

  // Backup actions
  document.getElementById('create-backup').addEventListener('click', createBackup);
  document.getElementById('export-data').addEventListener('click', exportData);
  document.getElementById('import-data').addEventListener('click', importData);
}

function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  // Update tab content
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.getElementById(`${tabName}-tab`).classList.add('active');
}

async function loadSettings() {
  try {
    const response = await fetch('/api/settings');
    if (response.ok) {
      currentSettings = await response.json();
      populateSettingsForm(currentSettings);
    } else {
      // Load default settings if none exist
      currentSettings = getDefaultSettings();
      populateSettingsForm(currentSettings);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    // Load default settings
    currentSettings = getDefaultSettings();
    populateSettingsForm(currentSettings);
  }
}

function getDefaultSettings() {
  return {
    general: {
      defaultInterestRate: 8.5,
      defaultTerm: 36,
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      autoCalculate: true,
      showAmortization: true,
      enableSearch: true
    },
    notifications: {
      emailPaymentReminders: true,
      emailOverdueAlerts: true,
      emailNewLoans: false,
      emailWeeklyReports: false,
      browserReminders: true,
      reminderDays: 3,
      emailAddress: '',
      smtpServer: ''
    },
    appearance: {
      theme: 'light',
      primaryColor: '#4299e1',
      itemsPerPage: 25,
      compactView: false,
      showGridLines: true,
      dashboardRefresh: 30,
      showAnimations: true
    },
    security: {
      sessionTimeout: 60,
      rememberMe: true,
      encryptData: true,
      twoFactor: false
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'weekly',
      backupRetention: 30,
      includePayments: true,
      exportFormat: 'csv'
    }
  };
}

function populateSettingsForm(settings) {
  // General settings
  document.getElementById('default-interest-rate').value = settings.general?.defaultInterestRate || 8.5;
  document.getElementById('default-term').value = settings.general?.defaultTerm || 36;
  document.getElementById('currency').value = settings.general?.currency || 'USD';
  document.getElementById('date-format').value = settings.general?.dateFormat || 'MM/DD/YYYY';
  document.getElementById('auto-calculate').checked = settings.general?.autoCalculate ?? true;
  document.getElementById('show-amortization').checked = settings.general?.showAmortization ?? true;
  document.getElementById('enable-search').checked = settings.general?.enableSearch ?? true;

  // Notifications settings
  document.getElementById('email-payment-reminders').checked = settings.notifications?.emailPaymentReminders ?? true;
  document.getElementById('email-overdue-alerts').checked = settings.notifications?.emailOverdueAlerts ?? true;
  document.getElementById('email-new-loans').checked = settings.notifications?.emailNewLoans ?? false;
  document.getElementById('email-weekly-reports').checked = settings.notifications?.emailWeeklyReports ?? false;
  document.getElementById('browser-reminders').checked = settings.notifications?.browserReminders ?? true;
  document.getElementById('reminder-days').value = settings.notifications?.reminderDays || 3;
  document.getElementById('email-address').value = settings.notifications?.emailAddress || '';
  document.getElementById('smtp-server').value = settings.notifications?.smtpServer || '';

  // Appearance settings
  document.getElementById('theme').value = settings.appearance?.theme || 'light';
  document.getElementById('primary-color').value = settings.appearance?.primaryColor || '#4299e1';
  document.getElementById('items-per-page').value = settings.appearance?.itemsPerPage || 25;
  document.getElementById('compact-view').checked = settings.appearance?.compactView ?? false;
  document.getElementById('show-grid-lines').checked = settings.appearance?.showGridLines ?? true;
  document.getElementById('dashboard-refresh').value = settings.appearance?.dashboardRefresh || 30;
  document.getElementById('show-animations').checked = settings.appearance?.showAnimations ?? true;

  // Security settings
  document.getElementById('session-timeout').value = settings.security?.sessionTimeout || 60;
  document.getElementById('remember-me').checked = settings.security?.rememberMe ?? true;
  document.getElementById('encrypt-data').checked = settings.security?.encryptData ?? true;
  document.getElementById('two-factor').checked = settings.security?.twoFactor ?? false;

  // Backup settings
  document.getElementById('auto-backup').checked = settings.backup?.autoBackup ?? true;
  document.getElementById('backup-frequency').value = settings.backup?.backupFrequency || 'weekly';
  document.getElementById('backup-retention').value = settings.backup?.backupRetention || 30;
  document.getElementById('include-payments').checked = settings.backup?.includePayments ?? true;
  document.getElementById('export-format').value = settings.backup?.exportFormat || 'csv';
}

function collectSettingsFromForm() {
  return {
    general: {
      defaultInterestRate: parseFloat(document.getElementById('default-interest-rate').value),
      defaultTerm: parseInt(document.getElementById('default-term').value),
      currency: document.getElementById('currency').value,
      dateFormat: document.getElementById('date-format').value,
      autoCalculate: document.getElementById('auto-calculate').checked,
      showAmortization: document.getElementById('show-amortization').checked,
      enableSearch: document.getElementById('enable-search').checked
    },
    notifications: {
      emailPaymentReminders: document.getElementById('email-payment-reminders').checked,
      emailOverdueAlerts: document.getElementById('email-overdue-alerts').checked,
      emailNewLoans: document.getElementById('email-new-loans').checked,
      emailWeeklyReports: document.getElementById('email-weekly-reports').checked,
      browserReminders: document.getElementById('browser-reminders').checked,
      reminderDays: parseInt(document.getElementById('reminder-days').value),
      emailAddress: document.getElementById('email-address').value,
      smtpServer: document.getElementById('smtp-server').value
    },
    appearance: {
      theme: document.getElementById('theme').value,
      primaryColor: document.getElementById('primary-color').value,
      itemsPerPage: parseInt(document.getElementById('items-per-page').value),
      compactView: document.getElementById('compact-view').checked,
      showGridLines: document.getElementById('show-grid-lines').checked,
      dashboardRefresh: parseInt(document.getElementById('dashboard-refresh').value),
      showAnimations: document.getElementById('show-animations').checked
    },
    security: {
      sessionTimeout: parseInt(document.getElementById('session-timeout').value),
      rememberMe: document.getElementById('remember-me').checked,
      encryptData: document.getElementById('encrypt-data').checked,
      twoFactor: document.getElementById('two-factor').checked
    },
    backup: {
      autoBackup: document.getElementById('auto-backup').checked,
      backupFrequency: document.getElementById('backup-frequency').value,
      backupRetention: parseInt(document.getElementById('backup-retention').value),
      includePayments: document.getElementById('include-payments').checked,
      exportFormat: document.getElementById('export-format').value
    }
  };
}

async function saveSettings() {
  const newSettings = collectSettingsFromForm();

  try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newSettings)
    });

    if (response.ok) {
      currentSettings = newSettings;
      showNotification('Settings saved successfully!', 'success');
      applySettings(newSettings);
    } else {
      throw new Error('Failed to save settings');
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    showNotification('Error saving settings. Please try again.', 'error');
  }
}

function applySettings(settings) {
  // Apply theme
  document.documentElement.setAttribute('data-theme', settings.appearance.theme);

  // Apply primary color
  document.documentElement.style.setProperty('--primary-color', settings.appearance.primaryColor);

  // Apply other settings that can be applied immediately
  if (settings.appearance.compactView) {
    document.body.classList.add('compact-view');
  } else {
    document.body.classList.remove('compact-view');
  }

  if (!settings.appearance.showGridLines) {
    document.body.classList.add('no-grid-lines');
  } else {
    document.body.classList.remove('no-grid-lines');
  }
}

async function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
    const defaultSettings = getDefaultSettings();
    populateSettingsForm(defaultSettings);
    await saveSettings();
    showNotification('Settings reset to defaults.', 'info');
  }
}

async function changePassword() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    showNotification('Please fill in all password fields.', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showNotification('New passwords do not match.', 'error');
    return;
  }

  if (newPassword.length < 8) {
    showNotification('Password must be at least 8 characters long.', 'error');
    return;
  }

  try {
    const response = await fetch('/api/settings/password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    if (response.ok) {
      showNotification('Password changed successfully!', 'success');
      // Clear password fields
      document.getElementById('current-password').value = '';
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-password').value = '';
    } else {
      const error = await response.text();
      showNotification(`Error changing password: ${error}`, 'error');
    }
  } catch (error) {
    console.error('Error changing password:', error);
    showNotification('Error changing password. Please try again.', 'error');
  }
}

async function createBackup() {
  try {
    const response = await fetch('/api/backup/create', {
      method: 'POST'
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `amandeeoloan-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showNotification('Backup created successfully!', 'success');
      loadBackupHistory(); // Refresh backup history
    } else {
      throw new Error('Failed to create backup');
    }
  } catch (error) {
    console.error('Error creating backup:', error);
    showNotification('Error creating backup. Please try again.', 'error');
  }
}

function exportData() {
  const format = document.getElementById('export-format').value;
  window.open(`/api/export/loans?format=${format}`, '_blank');
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,.csv';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        showNotification('Data imported successfully!', 'success');
        // Refresh the page to show imported data
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const error = await response.text();
        showNotification(`Error importing data: ${error}`, 'error');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      showNotification('Error importing data. Please try again.', 'error');
    }
  };
  input.click();
}

async function loadBackupHistory() {
  try {
    const response = await fetch('/api/backup/history');
    if (response.ok) {
      const backups = await response.json();
      displayBackupHistory(backups);
    }
  } catch (error) {
    console.error('Error loading backup history:', error);
  }
}

function displayBackupHistory(backups) {
  const historyContainer = document.getElementById('backup-history');
  historyContainer.innerHTML = '';

  if (backups.length === 0) {
    historyContainer.innerHTML = '<p>No backups found.</p>';
    return;
  }

  backups.forEach(backup => {
    const backupItem = document.createElement('div');
    backupItem.className = 'backup-item';
    backupItem.innerHTML = `
      <div class="backup-info">
        <h4>${backup.name}</h4>
        <p>Created: ${new Date(backup.createdAt).toLocaleString()}</p>
        <p>Size: ${backup.size}</p>
      </div>
      <div class="backup-actions">
        <button class="btn btn-sm btn-secondary" onclick="downloadBackup('${backup.id}')">Download</button>
        <button class="btn btn-sm btn-danger" onclick="deleteBackup('${backup.id}')">Delete</button>
      </div>
    `;
    historyContainer.appendChild(backupItem);
  });
}

async function downloadBackup(backupId) {
  window.open(`/api/backup/download/${backupId}`, '_blank');
}

async function deleteBackup(backupId) {
  if (confirm('Are you sure you want to delete this backup?')) {
    try {
      const response = await fetch(`/api/backup/${backupId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showNotification('Backup deleted successfully.', 'success');
        loadBackupHistory();
      } else {
        throw new Error('Failed to delete backup');
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      showNotification('Error deleting backup. Please try again.', 'error');
    }
  }
}

function showNotification(message, type = 'info') {
  // Simple notification - in a real app, you'd have a proper notification system
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Load backup history on page load
document.addEventListener('DOMContentLoaded', () => {
  loadBackupHistory();
});