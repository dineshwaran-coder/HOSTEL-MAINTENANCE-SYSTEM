/* app.js */

window.addEventListener('error', (event) => {
  const msg = `JS Runtime Error: ${event.message} in ${event.filename} at line ${event.lineno}`;
  console.error(msg);
  alert(msg);
});

// Application state with initial seeds
let state = {
  complaints: [],
  workers: [],
  notifications: [],
  auth: {
    isAuthenticated: false,
    role: null, // 'student' or 'admin'
    user: null  // user profile details
  },
  credentials: {
    student: { reg: '2026CSE0302', password: 'student123' },
    admin: { username: 'admin', password: 'admin123' }
  }
};

// Global chart references
let categoryChartInstance = null;
let monthlyChartInstance = null;

// Modal tracking
let selectedComplaintIdForAction = null;

// Filter states
let studentHistoryFilter = 'all';
let adminComplaintsFilter = 'all';

// Temporary Image Attachment base64 string
let tempAttachedImageBase64 = null;

// Mock Seed Data
const MOCK_WORKERS = [
  { id: 'w1', name: 'Ramesh Kumar', category: 'Plumbing', activeJobs: 0, completedJobs: 14, rating: 4.8 },
  { id: 'w2', name: 'Suresh Patel', category: 'Electrical', activeJobs: 0, completedJobs: 22, rating: 4.9 },
  { id: 'w3', name: 'Jagdish Singh', category: 'Furniture', activeJobs: 0, completedJobs: 8, rating: 4.5 },
  { id: 'w4', name: 'Amit Sharma', category: 'Cleaning', activeJobs: 0, completedJobs: 30, rating: 4.7 },
  { id: 'w5', name: 'Karan Johar', category: 'Appliance', activeJobs: 0, completedJobs: 11, rating: 4.6 },
  { id: 'w6', name: 'Devendra Verma', category: 'Internet', activeJobs: 0, completedJobs: 5, rating: 4.3 }
];

const MOCK_COMPLAINTS = [
  {
    id: 'C-101',
    studentName: 'Aarav Mehta',
    room: '302',
    block: 'Block B',
    category: 'Plumbing',
    urgency: 'high',
    title: 'Bathroom flush tank leaking',
    desc: 'The flush tank in room B-302 toilet is constantly leaking water, making a continuous noise and wasting water.',
    status: 'closed', // Student accepted and signed off
    workerId: 'w1',
    priority: 'high',
    expectedCompletionDate: '2026-06-12',
    createdTime: '2026-06-11T09:30:00.000Z',
    image: null,
    rating: 5,
    comment: 'Quick and clean repair. Ramesh was very professional.',
    logs: [
      { status: 'submitted', time: '2026-06-11T09:30:00.000Z', note: 'Complaint filed' },
      { status: 'verified', time: '2026-06-11T11:15:00.000Z', note: 'Warden verified and approved' },
      { status: 'assigned', time: '2026-06-11T12:00:00.000Z', note: 'Assigned to Ramesh Kumar' },
      { status: 'inprogress', time: '2026-06-11T14:10:00.000Z', note: 'Worker started repairs' },
      { status: 'fixed', time: '2026-06-11T15:30:00.000Z', note: 'Worker replaced flush washer' },
      { status: 'completed', time: '2026-06-11T16:00:00.000Z', note: 'Warden signed off completion' },
      { status: 'closed', time: '2026-06-11T17:30:00.000Z', note: 'Student accepted. Rating: 5 stars.' }
    ]
  },
  {
    id: 'C-102',
    studentName: 'Aarav Mehta',
    room: '302',
    block: 'Block B',
    category: 'Electrical',
    urgency: 'medium',
    title: 'Ceiling fan making clicking sound',
    desc: 'The ceiling fan at speed 3 makes a loud clicking noise. Speed is also very slow.',
    status: 'submitted', // Filed but not verified
    workerId: null,
    priority: null,
    expectedCompletionDate: null,
    createdTime: '2026-06-13T10:15:00.000Z',
    image: null,
    rating: null,
    comment: null,
    logs: [
      { status: 'submitted', time: '2026-06-13T10:15:00.000Z', note: 'Complaint filed' }
    ]
  },
  {
    id: 'C-103',
    studentName: 'Aarav Mehta',
    room: '302',
    block: 'Block B',
    category: 'Internet',
    urgency: 'low',
    title: 'LAN port not getting IP address',
    desc: 'Wired LAN port near desk is dead. Wi-Fi works but LAN port does not connect.',
    status: 'assigned', // Verified and assigned to worker
    workerId: 'w6',
    priority: 'medium',
    expectedCompletionDate: '2026-06-15',
    createdTime: '2026-06-12T14:00:00.000Z',
    image: null,
    rating: null,
    comment: null,
    logs: [
      { status: 'submitted', time: '2026-06-12T14:00:00.000Z', note: 'Complaint filed' },
      { status: 'verified', time: '2026-06-12T16:30:00.000Z', note: 'Warden verified and approved' },
      { status: 'assigned', time: '2026-06-13T09:00:00.000Z', note: 'Assigned to Devendra Verma' }
    ]
  },
  {
    id: 'C-104',
    studentName: 'Vijay K',
    room: '108',
    block: 'Block A',
    category: 'Cleaning',
    urgency: 'high',
    title: 'Water clogging in corridor',
    desc: 'After the rain, water has accumulated in front of rooms. Very bad odor.',
    status: 'inprogress', // Worker started work
    workerId: 'w4',
    priority: 'high',
    expectedCompletionDate: '2026-06-14',
    createdTime: '2026-06-13T08:00:00.000Z',
    image: null,
    rating: null,
    comment: null,
    logs: [
      { status: 'submitted', time: '2026-06-13T08:00:00.000Z', note: 'Complaint filed' },
      { status: 'verified', time: '2026-06-13T08:30:00.000Z', note: 'Warden verified and approved' },
      { status: 'assigned', time: '2026-06-13T09:15:00.000Z', note: 'Assigned to Amit Sharma' },
      { status: 'inprogress', time: '2026-06-13T11:00:00.000Z', note: 'Worker started cleaning' }
    ]
  },
  {
    id: 'C-105',
    studentName: 'Vijay K',
    room: '108',
    block: 'Block A',
    category: 'Furniture',
    urgency: 'medium',
    title: 'Bed wooden plank cracked',
    desc: 'The center wooden plank supporting the mattress is cracked. Sagging a lot.',
    status: 'completed', // Admin marked completed, student receives notification
    workerId: 'w3',
    priority: 'medium',
    expectedCompletionDate: '2026-06-14',
    createdTime: '2026-06-12T10:00:00.000Z',
    image: null,
    rating: null,
    comment: null,
    logs: [
      { status: 'submitted', time: '2026-06-12T10:00:00.000Z', note: 'Complaint filed' },
      { status: 'verified', time: '2026-06-12T11:00:00.000Z', note: 'Warden approved' },
      { status: 'assigned', time: '2026-06-12T11:30:00.000Z', note: 'Assigned to Jagdish Singh' },
      { status: 'inprogress', time: '2026-06-12T14:00:00.000Z', note: 'Worker checking plank sizing' },
      { status: 'fixed', time: '2026-06-13T12:00:00.000Z', note: 'Worker replaced the cracked central support board.' },
      { status: 'completed', time: '2026-06-13T14:30:00.000Z', note: 'Warden inspected and signed off repairs' }
    ]
  }
];

const MOCK_NOTIFICATIONS = [
  { id: 'n1', role: 'student', message: 'Warden has verified your complaint C-103: "LAN port not getting IP address".', time: '2026-06-12T16:30:00.000Z', read: false },
  { id: 'n2', role: 'student', message: 'Technician Jagdish Singh has fixed your issue C-105. Warden has verified and signed off. Please review.', time: '2026-06-13T14:35:00.000Z', read: false }
];

// Initialize System
async function initApp() {
  try {
    const res = await fetch('/api/state');
    const dbState = await res.json();
    
    state.complaints = dbState.complaints;
    state.workers = dbState.workers;
    state.notifications = dbState.notifications;
    state.credentials = dbState.credentials;
    
    // Auth session is stored locally so login persists
    const savedAuth = localStorage.getItem('hostelfix_auth_session');
    if (savedAuth) {
      try {
        state.auth = JSON.parse(savedAuth);
      } catch(e) {
        state.auth = { isAuthenticated: false, role: null, user: null };
      }
    } else {
      state.auth = { isAuthenticated: false, role: null, user: null };
    }
    
    recalculateWorkerLoads();
  } catch (error) {
    console.error('Failed to load state from database server, falling back to mock localStorage:', error);
    const savedState = localStorage.getItem('hostelfix_extended_state');
    if (savedState) {
      try {
        state = JSON.parse(savedState);
      } catch (e) {
        loadMockSeeds();
      }
    } else {
      loadMockSeeds();
    }
  }

  updateHeaderTime();
  setInterval(updateHeaderTime, 60000);

  setupRouting();
  setupFormHandlers();
  setupWorkerFormHandlers();
  setupSimulationHandlers();
  setupModalControls();
  setupReports();
  setupDashboardCardClickListeners();
  setupPremiumFeatures();

  // If already authenticated, redirect to correct portal, else show home
  if (state.auth.isAuthenticated) {
    loginRedirect(state.auth.role, state.auth.user);
  } else {
    navigateToPage('home');
  }
}

function loadMockSeeds() {
  state.complaints = JSON.parse(JSON.stringify(MOCK_COMPLAINTS));
  state.workers = JSON.parse(JSON.stringify(MOCK_WORKERS));
  state.notifications = JSON.parse(JSON.stringify(MOCK_NOTIFICATIONS));
  state.auth = { isAuthenticated: false, role: null, user: null };
  state.credentials = {
    student: { reg: '2026CSE0302', password: 'student123' },
    admin: { username: 'admin', password: 'admin123' }
  };
  recalculateWorkerLoads();
  saveState();
}

function saveState() {
  localStorage.setItem('hostelfix_extended_state', JSON.stringify(state));
}

function saveAuthSession() {
  localStorage.setItem('hostelfix_auth_session', JSON.stringify(state.auth));
}

function recalculateWorkerLoads() {
  state.workers.forEach(w => {
    w.activeJobs = state.complaints.filter(c => c.workerId === w.id && ['assigned', 'inprogress', 'fixed', 'reopened'].includes(c.status)).length;
    
    // Average ratings
    const completedTasks = state.complaints.filter(c => c.workerId === w.id && c.status === 'closed' && c.rating);
    if (completedTasks.length > 0) {
      const sum = completedTasks.reduce((acc, curr) => acc + curr.rating, 0);
      w.rating = parseFloat((sum / completedTasks.length).toFixed(1));
    }
    w.completedJobs = state.complaints.filter(c => c.workerId === w.id && c.status === 'closed').length;
  });
}

function updateHeaderTime() {
  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').substring(0, 16);
  const clockNode = document.getElementById('header-time');
  if (clockNode) clockNode.textContent = timeStr;
}

/* ================== CLIENT-SIDE ROUTER ================== */
function setupRouting() {
  // Public links
  document.querySelectorAll('.public-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.public-link').forEach(l => l.classList.remove('active'));
      e.target.classList.add('active');
      navigateToPage(e.target.getAttribute('data-target'));
    });
  });

  // Logo click triggers home
  document.getElementById('nav-logo').addEventListener('click', () => {
    if (!state.auth.isAuthenticated) {
      document.querySelectorAll('.public-link').forEach(l => l.classList.remove('active'));
      document.querySelector('.public-link[data-target="home"]').classList.add('active');
      navigateToPage('home');
    } else {
      navigateToPage(state.auth.role + '-dashboard');
    }
  });

  // Login header button
  document.getElementById('btn-go-login').addEventListener('click', () => navigateToPage('login'));
  document.getElementById('btn-hero-login').addEventListener('click', () => navigateToPage('login'));
  document.getElementById('btn-hero-about').addEventListener('click', () => {
    document.querySelectorAll('.public-link').forEach(l => l.classList.remove('active'));
    document.querySelector('.public-link[data-target="about"]').classList.add('active');
    navigateToPage('about');
  });

  // Logout button
  document.getElementById('btn-logout').addEventListener('click', () => {
    state.auth.isAuthenticated = false;
    state.auth.role = null;
    state.auth.user = null;
    saveAuthSession();
    
    // UI hide sidebars
    document.getElementById('app-sidebar').style.display = 'none';
    document.getElementById('logged-nav').style.display = 'none';
    document.getElementById('sim-control-bar').style.display = 'none';
    
    document.getElementById('public-nav').style.display = 'flex';
    document.querySelectorAll('.public-link').forEach(l => l.classList.remove('active'));
    document.querySelector('.public-link[data-target="home"]').classList.add('active');
    navigateToPage('home');
    showToast('Logged out successfully', 'info');
  });
}

function setupDashboardCardClickListeners() {
  // Student Dashboard Card Clicks
  const bindStdCard = (cardId, filterVal) => {
    const card = document.getElementById(cardId);
    if (card) {
      card.addEventListener('click', () => {
        studentHistoryFilter = filterVal;
        navigateToPage('student-history');
      });
    }
  };
  bindStdCard('std-card-total', 'all');
  bindStdCard('std-card-pending', 'pending');
  bindStdCard('std-card-completed', 'completed');
  bindStdCard('std-card-reopened', 'reopened');

  // Admin Dashboard Card Clicks
  const bindAdmCard = (cardId, filterVal) => {
    const card = document.getElementById(cardId);
    if (card) {
      card.addEventListener('click', () => {
        adminComplaintsFilter = filterVal;
        navigateToPage('admin-complaints');
      });
    }
  };
  bindAdmCard('adm-card-total', 'all');
  bindAdmCard('adm-card-pending', 'pending_verify');
  bindAdmCard('adm-card-assigned', 'assigned');
  bindAdmCard('adm-card-completed', 'completed');
  bindAdmCard('adm-card-reopened', 'reopened');

  // Filter Dropdown Change Handlers
  const stdFilterSelect = document.getElementById('student-history-filter');
  if (stdFilterSelect) {
    stdFilterSelect.addEventListener('change', (e) => {
      studentHistoryFilter = e.target.value;
      renderStudentHistory();
    });
  }

  const admFilterSelect = document.getElementById('admin-complaints-filter');
  if (admFilterSelect) {
    admFilterSelect.addEventListener('change', (e) => {
      adminComplaintsFilter = e.target.value;
      renderAdminComplaints();
    });
  }
}

function navigateToPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page-container').forEach(page => page.classList.remove('active'));
  
  const targetPage = document.getElementById('page-' + pageId) || document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  // Switch sidebar active state if in portal
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('data-target') === pageId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Trigger page-specific re-renders
  if (pageId === 'student-dashboard') renderStudentDashboard();
  if (pageId === 'student-history') renderStudentHistory();
  if (pageId === 'student-notifications') renderStudentNotifications();
  if (pageId === 'student-profile') renderStudentProfile();

  if (pageId === 'admin-dashboard') renderAdminDashboard();
  if (pageId === 'admin-complaints') renderAdminComplaints();
  if (pageId === 'admin-workers') renderAdminWorkers();
  if (pageId === 'admin-assign') renderAdminAssignQueue();
  if (pageId === 'admin-analytics') renderAdminAnalytics();
  if (pageId === 'admin-reports') renderAdminReports();
  if (pageId === 'admin-profile') renderAdminProfile();

  if (pageId === 'worker-dashboard') renderWorkerDashboard();
  if (pageId === 'worker-jobs') renderWorkerJobs();
  if (pageId === 'worker-profile') renderWorkerProfile();

  // Refresh icons
  lucide.createIcons();
}

/* ================== AUTHENTICATION FLOW ================== */
function setupFormHandlers() {
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const role = document.getElementById('login-role').value;
    const usernameInput = document.getElementById('login-username').value;
    const passwordInput = document.getElementById('login-password').value;

    if (role === 'student') {
      if (usernameInput === state.credentials.student.reg && passwordInput === state.credentials.student.password) {
        handleSuccessLogin('student', { name: 'Aarav Mehta', reg: usernameInput, block: 'Block B', room: '302' });
      } else {
        showToast('Invalid Student credentials!', 'danger');
      }
    } else if (role === 'admin') {
      if (usernameInput === state.credentials.admin.username && passwordInput === state.credentials.admin.password) {
        handleSuccessLogin('admin', { username: usernameInput, roleName: 'System Warden' });
      } else {
        showToast('Invalid Admin credentials!', 'danger');
      }
    } else if (role === 'worker') {
      const worker = state.workers.find(w => w.id === usernameInput || w.name.toLowerCase() === usernameInput.toLowerCase());
      if (worker && passwordInput === 'worker123') {
        handleSuccessLogin('worker', worker);
      } else {
        showToast('Invalid Worker credentials! Use Worker ID (e.g. w1) and password "worker123".', 'danger');
      }
    }
  });

  // Quick Login Shortcuts
  document.getElementById('btn-quick-student').addEventListener('click', (e) => {
    e.preventDefault();
    handleSuccessLogin('student', { name: 'Aarav Mehta', reg: state.credentials.student.reg, block: 'Block B', room: '302' });
  });

  document.getElementById('btn-quick-admin').addEventListener('click', (e) => {
    e.preventDefault();
    handleSuccessLogin('admin', { username: state.credentials.admin.username, roleName: 'System Warden' });
  });

  document.getElementById('btn-quick-worker').addEventListener('click', (e) => {
    e.preventDefault();
    const workersList = state.workers || [];
    const worker = workersList.find(w => w && w.id === 'w1') || { id: 'w1', name: 'Ramesh Kumar', category: 'Plumbing', rating: 4.8 };
    handleSuccessLogin('worker', worker);
  });

  // Password modification forms
  document.getElementById('student-password-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const oldPw = document.getElementById('std-old-pw').value;
    const newPw = document.getElementById('std-new-pw').value;

    if (oldPw === state.credentials.student.password) {
      fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'student', password: newPw })
      })
      .then(res => res.json())
      .then(async (data) => {
        if (data.success) {
          state.credentials.student.password = newPw;
          showToast('Student password successfully changed!', 'success');
          document.getElementById('student-password-form').reset();
        } else {
          showToast('Failed to update password on server!', 'danger');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Connection error!', 'danger');
      });
    } else {
      showToast('Current password incorrect!', 'danger');
    }
  });

  document.getElementById('admin-password-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const oldPw = document.getElementById('adm-old-pw').value;
    const newPw = document.getElementById('adm-new-pw').value;

    if (oldPw === state.credentials.admin.password) {
      fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin', password: newPw })
      })
      .then(res => res.json())
      .then(async (data) => {
        if (data.success) {
          state.credentials.admin.password = newPw;
          showToast('Admin password successfully changed!', 'success');
          document.getElementById('admin-password-form').reset();
        } else {
          showToast('Failed to update password on server!', 'danger');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Connection error!', 'danger');
      });
    } else {
      showToast('Current password incorrect!', 'danger');
    }
  });
}

function handleSuccessLogin(role, profile) {
  state.auth.isAuthenticated = true;
  state.auth.role = role;
  state.auth.user = profile;
  saveAuthSession();

  showToast(`Welcome back, ${profile.name || profile.username}!`, 'success');
  loginRedirect(role, profile);
}

function loginRedirect(role, profile) {
  // Hide public headers
  document.getElementById('public-nav').style.display = 'none';
  
  // Show app elements
  document.getElementById('app-sidebar').style.display = 'flex';
  document.getElementById('logged-nav').style.display = 'flex';
  document.getElementById('sim-control-bar').style.display = 'flex';

  // Setup Sidebar details
  const avatarNode = document.getElementById('sidebar-avatar');
  const userNode = document.getElementById('sidebar-username');
  const roleNode = document.getElementById('sidebar-userrole');
  const menuNode = document.getElementById('sidebar-menu');

  menuNode.innerHTML = ''; // reset menu links

  if (role === 'student') {
    avatarNode.textContent = 'AM';
    avatarNode.style.background = 'linear-gradient(135deg, var(--primary), #3b82f6)';
    userNode.textContent = profile.name;
    roleNode.textContent = `${profile.block}, Room ${profile.room}`;

    // Student Links
    menuNode.innerHTML = `
      <a class="nav-link" data-target="student-dashboard"><i data-lucide="layout-dashboard"></i> <span>Dashboard</span></a>
      <a class="nav-link" data-target="student-raise-complaint"><i data-lucide="edit-3"></i> <span>Raise Complaint</span></a>
      <a class="nav-link" data-target="student-history"><i data-lucide="list-todo"></i> <span>Complaint History</span></a>
      <a class="nav-link" data-target="student-notifications"><i data-lucide="bell"></i> <span>Notifications</span></a>
      <a class="nav-link" data-target="student-profile"><i data-lucide="user"></i> <span>My Profile</span></a>
    `;
    navigateToPage('student-dashboard');
  } else if (role === 'admin') {
    avatarNode.textContent = 'AD';
    avatarNode.style.background = 'linear-gradient(135deg, #ec4899, #d946ef)';
    userNode.textContent = 'Operations Admin';
    roleNode.textContent = 'Warden & Manager';

    // Admin Links
    menuNode.innerHTML = `
      <a class="nav-link" data-target="admin-dashboard"><i data-lucide="layout-dashboard"></i> <span>Dashboard</span></a>
      <a class="nav-link" data-target="admin-complaints"><i data-lucide="folder-search"></i> <span>Complaints Log</span></a>
      <a class="nav-link" data-target="admin-assign"><i data-lucide="user-plus"></i> <span>Assign Work</span></a>
      <a class="nav-link" data-target="admin-workers"><i data-lucide="wrench"></i> <span>Worker CRUD</span></a>
      <a class="nav-link" data-target="admin-analytics"><i data-lucide="bar-chart-3"></i> <span>Analytics</span></a>
      <a class="nav-link" data-target="admin-reports"><i data-lucide="file-spreadsheet"></i> <span>Reports</span></a>
      <a class="nav-link" data-target="admin-profile"><i data-lucide="settings"></i> <span>Admin Security</span></a>
    `;
    navigateToPage('admin-dashboard');
  } else if (role === 'worker') {
    avatarNode.textContent = profile.name.split(' ').map(n=>n[0]).join('');
    avatarNode.style.background = 'linear-gradient(135deg, var(--info), #10b981)';
    userNode.textContent = profile.name;
    roleNode.textContent = `${profile.category} Specialist`;

    // Worker Links
    menuNode.innerHTML = `
      <a class="nav-link" data-target="worker-dashboard"><i data-lucide="layout-dashboard"></i> <span>Dashboard</span></a>
      <a class="nav-link" data-target="worker-jobs"><i data-lucide="wrench"></i> <span>My Jobs</span></a>
      <a class="nav-link" data-target="worker-profile"><i data-lucide="user"></i> <span>My Profile</span></a>
    `;
    navigateToPage('worker-dashboard');
  }

  // Bind sidebar nav click events
  document.querySelectorAll('.sidebar .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = e.currentTarget.getAttribute('data-target');
      navigateToPage(target);
    });
  });

  lucide.createIcons();
}

/* ================== STUDENT PORTAL LOGIC ================== */

// Image drag/drop file reader attachment
const dropZone = document.getElementById('image-upload-zone');
const fileInput = document.getElementById('raise-image-input');
const uploadPreview = document.getElementById('image-upload-preview');
const previewImage = document.getElementById('img-preview-tag');
const cancelUpload = document.getElementById('btn-cancel-image');

if (dropZone) {
  dropZone.addEventListener('click', () => fileInput.click());
  
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleImageFile(file);
  });
}

if (cancelUpload) {
  cancelUpload.addEventListener('click', (e) => {
    e.stopPropagation();
    tempAttachedImageBase64 = null;
    fileInput.value = '';
    uploadPreview.style.display = 'none';
    dropZone.style.display = 'block';
  });
}

function handleImageFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('File must be an image!', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    tempAttachedImageBase64 = e.target.result;
    previewImage.src = tempAttachedImageBase64;
    uploadPreview.style.display = 'block';
    dropZone.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// Student raise form submission
const studentRaiseForm = document.getElementById('student-raise-form');
if (studentRaiseForm) {
  studentRaiseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const category = document.getElementById('raise-category').value;
    const room = document.getElementById('raise-room').value;
    const title = document.getElementById('raise-title').value;
    const desc = document.getElementById('raise-desc').value;

    const nextId = 'C-' + (100 + state.complaints.length + 1);
    const now = new Date().toISOString();

    const newTicket = {
      id: nextId,
      studentName: state.auth.user.name,
      room: room,
      block: state.auth.user.block,
      category: category,
      urgency: 'medium', // Default urgency before Admin Verification priority allocation
      title: title,
      desc: desc,
      status: 'submitted',
      workerId: null,
      priority: null,
      expectedCompletionDate: null,
      createdTime: now,
      image: tempAttachedImageBase64,
      rating: null,
      comment: null
    };

    fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTicket)
    })
    .then(res => res.json())
    .then(async (data) => {
      if (data.success) {
        const resState = await fetch('/api/state');
        const dbState = await resState.json();
        state.complaints = dbState.complaints;
        state.workers = dbState.workers;
        state.notifications = dbState.notifications;
        recalculateWorkerLoads();

        // Reset Form
        studentRaiseForm.reset();
        tempAttachedImageBase64 = null;
        uploadPreview.style.display = 'none';
        dropZone.style.display = 'block';

        showToast(`Ticket ${nextId} submitted successfully!`, 'success');
        navigateToPage('student-dashboard');
      } else {
        showToast('Error submitting complaint!', 'danger');
      }
    })
    .catch(err => {
      console.error(err);
      showToast('Connection error!', 'danger');
    });
  });
}

function renderStudentDashboard() {
  const list = document.getElementById('student-active-track-list');
  list.innerHTML = '';

  const myTickets = state.complaints.filter(c => c.studentName === state.auth.user.name);
  
  // Update dashboard counters
  const total = myTickets.length;
  const pending = myTickets.filter(c => ['submitted', 'verified', 'assigned', 'inprogress', 'reopened'].includes(c.status)).length;
  const completed = myTickets.filter(c => c.status === 'completed').length;
  const reopened = myTickets.filter(c => c.status === 'reopened').length;

  document.getElementById('std-stat-total').textContent = total;
  document.getElementById('std-stat-pending').textContent = pending;
  document.getElementById('std-stat-completed').textContent = completed;
  document.getElementById('std-stat-reopened').textContent = reopened;

  // Render alerts list
  const notifList = document.getElementById('student-dashboard-notifications');
  notifList.innerHTML = '';
  const myNotifs = state.notifications.filter(n => n.role === 'student').sort((a,b)=>new Date(b.time)-new Date(a.time));
  
  if (myNotifs.length === 0) {
    notifList.innerHTML = '<div style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding:1.5rem">No notifications yet.</div>';
  } else {
    myNotifs.slice(0, 5).forEach(n => {
      const type = n.message.includes('completed') || n.message.includes('reopen') ? 'success' : 'info';
      const div = document.createElement('div');
      div.className = `notification-item ${type}`;
      div.innerHTML = `
        <p>${n.message}</p>
        <span class="notification-time">${formatTimeAgo(n.time)}</span>
      `;
      notifList.appendChild(div);
    });
  }

  // Render Active Tracking Items
  const activeTickets = myTickets.filter(c => ['submitted', 'verified', 'assigned', 'inprogress', 'fixed', 'completed', 'reopened'].includes(c.status));
  if (activeTickets.length === 0) {
    list.innerHTML = '<div style="color:var(--text-muted); padding:2rem; text-align:center;">No active maintenance requests.</div>';
    return;
  }

  activeTickets.forEach(c => {
    const card = document.createElement('div');
    card.className = 'complaint-item';
    
    let btnHTML = '';
    if (c.status === 'completed') {
      btnHTML = `
        <button class="btn btn-success btn-sm btn-open-feedback-modal" data-id="${c.id}">
          <i data-lucide="check-circle"></i> Review & Close Ticket
        </button>
      `;
    }

    let workerInfoHTML = '';
    if (c.workerId) {
      const worker = state.workers.find(w => w.id === c.workerId);
      const workerName = worker ? worker.name : 'Technician';
      if (c.status === 'assigned') {
        workerInfoHTML = `<span class="meta-item" style="color:var(--warning); font-weight: 600;"><i data-lucide="user" style="width:14px"></i> Assigned: ${workerName} (Awaiting Acceptance)</span>`;
      } else {
        workerInfoHTML = `<span class="meta-item" style="color:var(--success); font-weight: 600;"><i data-lucide="user" style="width:14px"></i> Accepted by: ${workerName}</span>`;
      }
    }

    card.innerHTML = `
      <div class="complaint-header">
        <div>
          <h4>${c.title}</h4>
          <div class="complaint-meta">
            <span class="meta-item"><i data-lucide="hash" style="width:14px"></i> ${c.id}</span>
            <span class="meta-item"><i data-lucide="tag" style="width:14px"></i> ${c.category}</span>
            <span class="meta-item"><i data-lucide="calendar" style="width:14px"></i> ${new Date(c.createdTime).toLocaleDateString()}</span>
            ${workerInfoHTML}
          </div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem">
          <span class="badge badge-${c.status}">${c.status}</span>
        </div>
      </div>
      
      <!-- Stepper timeline component -->
      ${getTimelineHTML(c)}

      <div class="complaint-footer">
        <span style="font-size:0.8rem; color:var(--text-muted);">Urgency: ${c.urgency.toUpperCase()}</span>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-secondary btn-sm btn-view-logs" data-id="${c.id}">Logs</button>
          ${btnHTML}
        </div>
      </div>
    `;
    list.appendChild(card);
  });

  // Attach event handlers
  document.querySelectorAll('.btn-open-feedback-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      selectedComplaintIdForAction = e.currentTarget.getAttribute('data-id');
      openModal('feedback-modal');
    });
  });

  document.querySelectorAll('.btn-view-logs').forEach(btn => {
    btn.addEventListener('click', (e) => {
      openComplaintDetailModal(e.currentTarget.getAttribute('data-id'));
    });
  });
}

function renderStudentHistory() {
  const tbody = document.getElementById('student-history-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  let myTickets = state.complaints.filter(c => c.studentName === state.auth.user.name);

  // Sync filter select dropdown UI
  const stdFilterSelect = document.getElementById('student-history-filter');
  if (stdFilterSelect) {
    stdFilterSelect.value = studentHistoryFilter;
  }

  // Filter matching status criteria
  if (studentHistoryFilter === 'pending') {
    myTickets = myTickets.filter(c => ['submitted', 'verified', 'assigned', 'inprogress', 'reopened'].includes(c.status));
  } else if (studentHistoryFilter === 'completed') {
    myTickets = myTickets.filter(c => ['completed', 'closed'].includes(c.status));
  } else if (studentHistoryFilter === 'reopened') {
    myTickets = myTickets.filter(c => c.status === 'reopened');
  }

  // Live Search Filter
  const searchInput = document.getElementById('student-history-search');
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
  if (searchQuery) {
    myTickets = myTickets.filter(c => 
      c.id.toLowerCase().includes(searchQuery) ||
      c.title.toLowerCase().includes(searchQuery) ||
      c.category.toLowerCase().includes(searchQuery) ||
      (c.desc && c.desc.toLowerCase().includes(searchQuery))
    );
  }

  if (myTickets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted)">No matching complaints found.</td></tr>`;
    return;
  }

  myTickets.sort((a,b) => new Date(b.createdTime) - new Date(a.createdTime)).forEach(c => {
    const tr = document.createElement('tr');
    const workerName = c.workerId ? (state.workers.find(w => w.id === c.workerId)?.name || 'Technician') : 'N/A';
    
    tr.innerHTML = `
      <td><strong>${c.id}</strong></td>
      <td>${new Date(c.createdTime).toLocaleDateString()}</td>
      <td>${c.category}</td>
      <td>${c.title}</td>
      <td><span class="badge badge-${c.status}">${c.status}</span></td>
      <td>${workerName}</td>
      <td>
        <button class="btn btn-secondary btn-sm btn-view-history-detail" data-id="${c.id}">
          Details
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.btn-view-history-detail').forEach(btn => {
    btn.addEventListener('click', (e) => {
      openComplaintDetailModal(e.currentTarget.getAttribute('data-id'));
    });
  });
}

function renderStudentNotifications() {
  const list = document.getElementById('student-full-notifications');
  list.innerHTML = '';

  const myNotifs = state.notifications.filter(n => n.role === 'student').sort((a,b)=>new Date(b.time)-new Date(a.time));
  if (myNotifs.length === 0) {
    list.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:2rem">No alerts in your inbox.</div>';
    return;
  }

  myNotifs.forEach(n => {
    const item = document.createElement('div');
    item.className = 'notification-item info';
    item.innerHTML = `
      <p>${n.message}</p>
      <span class="notification-time">${new Date(n.time).toLocaleString()}</span>
    `;
    list.appendChild(item);
  });
}

function renderStudentProfile() {
  document.getElementById('profile-std-name').value = state.auth.user.name;
  document.getElementById('profile-std-reg').value = state.auth.user.reg;
  document.getElementById('profile-std-block').value = state.auth.user.block;
  document.getElementById('profile-std-room').value = state.auth.user.room;
}

/* ================== ADMIN PORTAL LOGIC ================== */
function renderAdminDashboard() {
  // Counters
  const total = state.complaints.length;
  const pending = state.complaints.filter(c => ['submitted', 'reopened'].includes(c.status)).length;
  const assigned = state.complaints.filter(c => c.status === 'assigned').length;
  const completed = state.complaints.filter(c => ['completed', 'closed'].includes(c.status)).length;
  const reopened = state.complaints.filter(c => c.status === 'reopened').length;

  document.getElementById('adm-stat-total').textContent = total;
  document.getElementById('adm-stat-pending').textContent = pending;
  document.getElementById('adm-stat-assigned').textContent = assigned;
  document.getElementById('adm-stat-completed').textContent = completed;
  document.getElementById('adm-stat-reopened').textContent = reopened;

  // Render recent urgent complaints queue
  const queue = document.getElementById('admin-dashboard-queue-list');
  queue.innerHTML = '';
  const urgentIssues = state.complaints.filter(c => ['submitted', 'reopened'].includes(c.status)).slice(0, 5);

  if (urgentIssues.length === 0) {
    queue.innerHTML = '<div style="color:var(--text-muted); padding:2rem; text-align:center">All complaints verified. Verification queue clear!</div>';
  } else {
    urgentIssues.forEach(c => {
      const item = document.createElement('div');
      item.className = 'complaint-item';
      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start">
          <div>
            <h5 style="font-weight:700">${c.title}</h5>
            <span style="font-size:0.75rem; color:var(--text-muted)">Rm ${c.room} | filed ${formatTimeAgo(c.createdTime)}</span>
          </div>
          <button class="btn btn-primary btn-sm btn-quick-verify" data-id="${c.id}">Verify</button>
        </div>
      `;
      queue.appendChild(item);
    });
  }

  document.querySelectorAll('.btn-quick-verify').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = e.currentTarget.getAttribute('data-id');
      handleVerifyComplaint(id);
    });
  });

  // Render technicians quick list
  const workerList = document.getElementById('admin-dashboard-worker-list');
  workerList.innerHTML = '';
  state.workers.forEach(w => {
    const div = document.createElement('div');
    div.style = 'display:flex; justify-content:space-between; align-items:center; background-color:rgba(255,255,255,0.02); padding:0.75rem; border-radius:var(--radius-sm); border:1px solid var(--border-color);';
    div.innerHTML = `
      <div>
        <strong style="font-size:0.85rem">${w.name}</strong><br>
        <span style="font-size:0.7rem; color:var(--text-muted)">${w.category} specialist</span>
      </div>
      <div style="text-align:right">
        <span class="badge" style="background-color: var(--primary-light); color:var(--primary); font-size:0.7rem">${w.activeJobs} Jobs</span>
      </div>
    `;
    workerList.appendChild(div);
  });
}

function renderAdminComplaints() {
  const container = document.getElementById('admin-complaint-manage-list');
  if (!container) return;
  container.innerHTML = '';

  let list = [...state.complaints];

  // Sync filter select dropdown UI
  const admFilterSelect = document.getElementById('admin-complaints-filter');
  if (admFilterSelect) {
    admFilterSelect.value = adminComplaintsFilter;
  }

  // Filter based on selected criteria
  if (adminComplaintsFilter === 'pending' || adminComplaintsFilter === 'pending_verify') {
    list = list.filter(c => ['submitted', 'reopened'].includes(c.status));
  } else if (adminComplaintsFilter === 'assigned') {
    list = list.filter(c => ['assigned', 'inprogress', 'fixed'].includes(c.status));
  } else if (adminComplaintsFilter === 'completed') {
    list = list.filter(c => ['completed', 'closed'].includes(c.status));
  } else if (adminComplaintsFilter === 'reopened') {
    list = list.filter(c => c.status === 'reopened');
  }

  // Live Search Filter
  const searchInput = document.getElementById('admin-complaints-search');
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
  if (searchQuery) {
    list = list.filter(c => 
      c.id.toLowerCase().includes(searchQuery) ||
      c.title.toLowerCase().includes(searchQuery) ||
      c.category.toLowerCase().includes(searchQuery) ||
      c.studentName.toLowerCase().includes(searchQuery) ||
      c.room.toLowerCase().includes(searchQuery) ||
      (c.desc && c.desc.toLowerCase().includes(searchQuery))
    );
  }

  if (list.length === 0) {
    container.innerHTML = `<div style="color:var(--text-muted); padding:2rem; text-align:center">No matching complaints found.</div>`;
    return;
  }

  // Sort complaints by state (unverified/reopened first, then active, then closed)
  const sorted = list.sort((a,b) => {
    const statusWeight = { reopened: 1, submitted: 2, verified: 3, assigned: 4, inprogress: 5, fixed: 6, completed: 7, closed: 8, rejected: 9 };
    return statusWeight[a.status] - statusWeight[b.status];
  });

  sorted.forEach(c => {
    const item = document.createElement('div');
    item.className = 'complaint-item';
    
    let actionsHTML = '';
    if (c.status === 'submitted' || c.status === 'reopened') {
      actionsHTML = `
        <button class="btn btn-success btn-sm btn-admin-verify" data-id="${c.id}">
          <i data-lucide="check"></i> Verify & Approve
        </button>
        <button class="btn btn-danger btn-sm btn-admin-reject" data-id="${c.id}">
          <i data-lucide="x"></i> Reject Ticket
        </button>
      `;
    } else if (c.status === 'fixed') {
      // Admin verification (acts as Warden signoff)
      actionsHTML = `
        <button class="btn btn-success btn-sm btn-admin-complete" data-id="${c.id}">
          <i data-lucide="check-square"></i> Mark Completed
        </button>
      `;
    }

    item.innerHTML = `
      <div class="complaint-header">
        <div>
          <h4>${c.title}</h4>
          <div class="complaint-meta">
            <span class="meta-item">ID: ${c.id}</span>
            <span class="meta-item">Sector: ${c.category}</span>
            <span class="meta-item">Student: ${c.studentName} (Room ${c.room})</span>
          </div>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <span class="badge badge-${c.status}">${c.status}</span>
        </div>
      </div>
      <div class="complaint-body">
        <p>${c.desc}</p>
        ${c.image ? `<div style="margin-top:0.75rem;"><img src="${c.image}" style="max-width:180px; max-height:120px; border-radius:var(--radius-sm); border:1px solid var(--border-color);" alt="Resident Proof"></div>` : ''}
      </div>
      <div class="complaint-footer">
        <span style="font-size:0.8rem; color:var(--text-muted)">Filed: ${new Date(c.createdTime).toLocaleString()}</span>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-secondary btn-sm btn-view-logs" data-id="${c.id}">View Logs</button>
          ${actionsHTML}
        </div>
      </div>
    `;
    container.appendChild(item);
  });

  // Bind actions
  document.querySelectorAll('.btn-admin-verify').forEach(btn => {
    btn.addEventListener('click', (e) => handleVerifyComplaint(e.currentTarget.getAttribute('data-id')));
  });

  document.querySelectorAll('.btn-admin-reject').forEach(btn => {
    btn.addEventListener('click', (e) => handleRejectComplaint(e.currentTarget.getAttribute('data-id')));
  });

  document.querySelectorAll('.btn-admin-complete').forEach(btn => {
    btn.addEventListener('click', (e) => handleMarkCompleted(e.currentTarget.getAttribute('data-id')));
  });

  document.querySelectorAll('.btn-view-logs').forEach(btn => {
    btn.addEventListener('click', (e) => openComplaintDetailModal(e.currentTarget.getAttribute('data-id')));
  });
}

function handleVerifyComplaint(id) {
  fetch(`/api/complaints/${id}/verify`, { method: 'POST' })
  .then(res => res.json())
  .then(async (data) => {
    if (data.success) {
      const resState = await fetch('/api/state');
      const dbState = await resState.json();
      state.complaints = dbState.complaints;
      state.workers = dbState.workers;
      state.notifications = dbState.notifications;
      recalculateWorkerLoads();
      showToast(`Ticket ${id} verified successfully!`, 'success');
      navigateToPage(state.auth.role + '-dashboard'); // refresh active portal
    } else {
      showToast('Error verifying complaint!', 'danger');
    }
  })
  .catch(err => {
    console.error(err);
    showToast('Connection error!', 'danger');
  });
}

function handleRejectComplaint(id) {
  const reason = prompt('Provide rejection reasoning:');
  if (reason === null) return;

  fetch(`/api/complaints/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  })
  .then(res => res.json())
  .then(async (data) => {
    if (data.success) {
      const resState = await fetch('/api/state');
      const dbState = await resState.json();
      state.complaints = dbState.complaints;
      state.workers = dbState.workers;
      state.notifications = dbState.notifications;
      recalculateWorkerLoads();
      showToast(`Ticket ${id} rejected.`, 'warning');
      renderAdminComplaints();
    } else {
      showToast('Error rejecting complaint!', 'danger');
    }
  })
  .catch(err => {
    console.error(err);
    showToast('Connection error!', 'danger');
  });
}

function handleMarkCompleted(id) {
  fetch(`/api/complaints/${id}/complete`, { method: 'POST' })
  .then(res => res.json())
  .then(async (data) => {
    if (data.success) {
      const resState = await fetch('/api/state');
      const dbState = await resState.json();
      state.complaints = dbState.complaints;
      state.workers = dbState.workers;
      state.notifications = dbState.notifications;
      recalculateWorkerLoads();
      showToast(`Ticket ${id} marked completed! Resident notified.`, 'success');
      renderAdminComplaints();
    } else {
      showToast('Error completing complaint!', 'danger');
    }
  })
  .catch(err => {
    console.error(err);
    showToast('Connection error!', 'danger');
  });
}

function renderAdminAssignQueue() {
  const container = document.getElementById('admin-assign-queue-list');
  container.innerHTML = '';

  const verified = state.complaints.filter(c => c.status === 'verified');
  if (verified.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted); padding:2rem; text-align:center">No complaints awaiting scheduling/worker assignment.</div>';
    return;
  }

  verified.forEach(c => {
    const item = document.createElement('div');
    item.className = 'complaint-item';
    item.innerHTML = `
      <div class="complaint-header">
        <div>
          <h4>${c.title}</h4>
          <span style="font-size:0.8rem; color:var(--text-muted)">ID: ${c.id} | Needed Specialization: <strong>${c.category}</strong></span>
        </div>
        <button class="btn btn-primary btn-sm btn-dispatch-modal" data-id="${c.id}">Dispatch Worker</button>
      </div>
      <div class="complaint-body">
        <p>${c.desc}</p>
      </div>
    `;
    container.appendChild(item);
  });

  document.querySelectorAll('.btn-dispatch-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      openDispatchModal(id);
    });
  });
}

// Open Dispatch Modal with matching workers
let selectedWorkerIdForDispatch = null;
function openDispatchModal(complaintId) {
  selectedComplaintIdForAction = complaintId;
  selectedWorkerIdForDispatch = null;
  document.getElementById('btn-confirm-dispatch').disabled = true;

  const complaint = state.complaints.find(c => c.id === complaintId);
  if (!complaint) return;

  // Set default expected completion date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('dispatch-due').value = tomorrow.toISOString().split('T')[0];

  const workersList = document.getElementById('modal-dispatch-worker-select');
  workersList.innerHTML = '';

  // Filter workers by matching category first
  const sorted = [...state.workers].sort((a,b) => {
    if (a.category.toLowerCase() === complaint.category.toLowerCase() && b.category.toLowerCase() !== complaint.category.toLowerCase()) return -1;
    if (a.category.toLowerCase() !== complaint.category.toLowerCase() && b.category.toLowerCase() === complaint.category.toLowerCase()) return 1;
    return a.activeJobs - b.activeJobs;
  });

  sorted.forEach(w => {
    const isMatch = w.category.toLowerCase() === complaint.category.toLowerCase();
    const div = document.createElement('div');
    div.className = 'worker-select-item';
    div.innerHTML = `
      <div>
        <strong>${w.name}</strong> 
        ${isMatch ? '<span style="color:var(--success); font-size:0.7rem; font-weight:700;">[Matching Specialist]</span>' : `<span style="color:var(--text-muted); font-size:0.7rem;">[${w.category}]</span>`}
      </div>
      <div style="font-size:0.75rem; text-align:right">
        Active Jobs: <strong>${w.activeJobs}</strong> | rating: ${w.rating}★
      </div>
    `;

    div.addEventListener('click', () => {
      document.querySelectorAll('.worker-select-item').forEach(i => i.classList.remove('selected'));
      div.classList.add('selected');
      selectedWorkerIdForDispatch = w.id;
      document.getElementById('btn-confirm-dispatch').disabled = false;
    });

    workersList.appendChild(div);
  });

  openModal('dispatch-modal');
}

// Submit Dispatch modal
document.getElementById('btn-confirm-dispatch').addEventListener('click', () => {
  if (!selectedComplaintIdForAction || !selectedWorkerIdForDispatch) return;

  const complaint = state.complaints.find(c => c.id === selectedComplaintIdForAction);
  const worker = state.workers.find(w => w.id === selectedWorkerIdForDispatch);

  if (!complaint || !worker) return;

  const priority = document.getElementById('dispatch-priority').value;
  const dueDate = document.getElementById('dispatch-due').value;

  fetch(`/api/complaints/${complaint.id}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workerId: worker.id,
      workerName: worker.name,
      priority: priority,
      dueDate: dueDate
    })
  })
  .then(res => res.json())
  .then(async (data) => {
    if (data.success) {
      const resState = await fetch('/api/state');
      const dbState = await resState.json();
      state.complaints = dbState.complaints;
      state.workers = dbState.workers;
      state.notifications = dbState.notifications;
      recalculateWorkerLoads();
      closeModal('dispatch-modal');
      showToast(`Worker dispatched successfully for ${complaint.id}!`, 'success');
      renderAdminAssignQueue();
    } else {
      showToast('Error dispatching worker!', 'danger');
    }
  })
  .catch(err => {
    console.error(err);
    showToast('Connection error!', 'danger');
  });
});

/* ================== WORKER CRUD PANEL ================== */
function renderAdminWorkers() {
  const container = document.getElementById('admin-workers-crud-grid');
  container.innerHTML = '';

  state.workers.forEach(w => {
    const card = document.createElement('div');
    card.className = 'worker-card glass';
    card.innerHTML = `
      <div class="worker-card-header">
        <div class="worker-avatar">${w.name.split(' ').map(n=>n[0]).join('')}</div>
        <div class="worker-meta">
          <h5>${w.name}</h5>
          <p>${w.category.toUpperCase()} sector</p>
        </div>
      </div>
      <div class="worker-stats">
        <div>
          <div class="worker-stat-val">${w.activeJobs}</div>
          <div class="worker-stat-lbl">Active</div>
        </div>
        <div>
          <div class="worker-stat-val">${w.completedJobs}</div>
          <div class="worker-stat-lbl">Completed</div>
        </div>
      </div>
      <div style="font-size:0.75rem; text-align:center; color: var(--text-secondary)">
        Rating: <span style="color:var(--warning)">${w.rating} ★</span>
      </div>
      
      <div class="worker-card-actions">
        <button class="btn btn-secondary btn-sm btn-edit-worker" data-id="${w.id}">
          <i data-lucide="edit" style="width:14px; height:14px;"></i>
        </button>
        <button class="btn btn-danger btn-sm btn-delete-worker" data-id="${w.id}">
          <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  lucide.createIcons();

  // CRUD Listeners
  document.querySelectorAll('.btn-edit-worker').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      handleEditWorkerSetup(id);
    });
  });

  document.querySelectorAll('.btn-delete-worker').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      handleDeleteWorker(id);
    });
  });
}

function handleEditWorkerSetup(id) {
  const w = state.workers.find(worker => worker.id === id);
  if (!w) return;

  document.getElementById('crud-worker-id').value = w.id;
  document.getElementById('crud-worker-name').value = w.name;
  document.getElementById('crud-worker-category').value = w.category;
  document.getElementById('crud-worker-rating').value = w.rating;

  // Show extra fields
  document.getElementById('worker-rating-group').style.display = 'block';
  document.getElementById('worker-form-title').textContent = 'Edit Technician';
  document.getElementById('btn-cancel-worker-edit').style.display = 'inline-flex';
  document.getElementById('btn-submit-worker-crud').innerHTML = '<i data-lucide="save"></i> Save Changes';
  lucide.createIcons();
}

function handleCancelWorkerEdit() {
  document.getElementById('admin-worker-crud-form').reset();
  document.getElementById('crud-worker-id').value = '';
  document.getElementById('worker-rating-group').style.display = 'none';
  document.getElementById('worker-form-title').textContent = 'Register Technician';
  document.getElementById('btn-cancel-worker-edit').style.display = 'none';
  document.getElementById('btn-submit-worker-crud').innerHTML = '<i data-lucide="user-plus"></i> Register Worker';
  lucide.createIcons();
}

document.getElementById('btn-cancel-worker-edit').addEventListener('click', handleCancelWorkerEdit);

function setupWorkerFormHandlers() {
  const form = document.getElementById('admin-worker-crud-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('crud-worker-id').value;
    const name = document.getElementById('crud-worker-name').value;
    const category = document.getElementById('crud-worker-category').value;

    if (id) {
      // Edit
      const rating = parseFloat(document.getElementById('crud-worker-rating').value) || 5.0;
      fetch(`/api/workers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, rating })
      })
      .then(res => res.json())
      .then(async (data) => {
        if (data.success) {
          const resState = await fetch('/api/state');
          const dbState = await resState.json();
          state.workers = dbState.workers;
          recalculateWorkerLoads();
          showToast('Technician details updated!', 'success');
          handleCancelWorkerEdit();
          renderAdminWorkers();
        } else {
          showToast('Error updating worker!', 'danger');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Connection error!', 'danger');
      });
    } else {
      // Create
      const newId = 'w_' + Date.now();
      fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newId, name, category, rating: 5.0 })
      })
      .then(res => res.json())
      .then(async (data) => {
        if (data.success) {
          const resState = await fetch('/api/state');
          const dbState = await resState.json();
          state.workers = dbState.workers;
          recalculateWorkerLoads();
          showToast('Technician registered!', 'success');
          handleCancelWorkerEdit();
          renderAdminWorkers();
        } else {
          showToast('Error registering worker!', 'danger');
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Connection error!', 'danger');
      });
    }
  });
}

function handleDeleteWorker(id) {
  const worker = state.workers.find(w => w.id === id);
  if (!worker) return;

  if (worker.activeJobs > 0) {
    showToast('Cannot delete worker with active jobs assigned!', 'warning');
    return;
  }

  if (confirm(`Are you sure you want to delete worker ${worker.name}?`)) {
    fetch(`/api/workers/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(async (data) => {
      if (data.success) {
        const resState = await fetch('/api/state');
        const dbState = await resState.json();
        state.workers = dbState.workers;
        recalculateWorkerLoads();
        showToast('Worker deleted successfully.', 'info');
        renderAdminWorkers();
      } else {
        showToast('Error deleting worker!', 'danger');
      }
    })
    .catch(err => {
      console.error(err);
      showToast('Connection error!', 'danger');
    });
  }
}

function renderAdminAnalytics() {
  const isLight = document.body.classList.contains('light-theme');
  const textColor = isLight ? '#0f172a' : '#f8fafc';
  const gridColor = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.05)';
  const chartBorderColor = isLight ? '#ffffff' : '#1e293b';

  // Chart 1: Complaints by Category
  const catCanvas = document.getElementById('admin-chart-category');
  if (catCanvas) {
    const categories = ['Electrical', 'Plumbing', 'Internet', 'Furniture', 'Cleaning', 'Appliance'];
    const counts = categories.map(cat => state.complaints.filter(c => c.category.toLowerCase() === cat.toLowerCase()).length);

    if (categoryChartInstance) categoryChartInstance.destroy();

    categoryChartInstance = new Chart(catCanvas, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: counts,
          backgroundColor: ['#6366f1', '#10b981', '#0ea5e9', '#f59e0b', '#ec4899', '#8b5cf6'],
          borderWidth: 2,
          borderColor: chartBorderColor
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 10 } } }
        }
      }
    });
  }

  // Chart 2: Monthly Trends
  const monthlyCanvas = document.getElementById('admin-chart-monthly');
  if (monthlyCanvas) {
    // Generate simulated monthly counts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    // Let's count actual June tickets and distribute others mockup
    const juneCount = state.complaints.length;
    const monthlyCounts = [14, 18, 12, 22, 19, juneCount];

    if (monthlyChartInstance) monthlyChartInstance.destroy();

    monthlyChartInstance = new Chart(monthlyCanvas, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Filed Issues',
          data: monthlyCounts,
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          borderColor: '#6366f1',
          borderWidth: 1.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: textColor }, grid: { color: gridColor } },
          y: { ticks: { color: textColor }, grid: { color: gridColor } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // Common issues list
  const commonTbody = document.getElementById('analytics-common-tbody');
  commonTbody.innerHTML = '';

  const categories = ['Electrical', 'Plumbing', 'Internet', 'Furniture', 'Cleaning', 'Appliance'];
  categories.forEach(cat => {
    const catTickets = state.complaints.filter(c => c.category.toLowerCase() === cat.toLowerCase());
    const count = catTickets.length;
    const reopens = catTickets.filter(c => c.logs.some(l => l.status === 'reopened')).length;
    const reopenRate = count > 0 ? Math.round((reopens / count) * 100) : 0;
    
    // Average resolution time (speed)
    let speed = 'N/A';
    let times = [];
    catTickets.forEach(c => {
      const submitted = c.logs.find(l => l.status === 'submitted');
      const completed = c.logs.find(l => l.status === 'completed');
      if (submitted && completed) {
        times.push((new Date(completed.time) - new Date(submitted.time)) / (1000 * 60 * 60)); // hours
      }
    });
    if (times.length > 0) {
      speed = (times.reduce((a,b)=>a+b, 0) / times.length).toFixed(1) + ' hrs';
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${cat}</strong></td>
      <td>${count} tickets</td>
      <td>${speed}</td>
      <td><span class="badge badge-${reopenRate > 20 ? 'reopened' : 'completed'}">${reopenRate}%</span></td>
    `;
    commonTbody.appendChild(tr);
  });

  // Technician performance lists
  const workerContainer = document.getElementById('analytics-worker-tbody');
  workerContainer.innerHTML = '';
  state.workers.sort((a,b) => b.rating - a.rating).forEach(w => {
    const div = document.createElement('div');
    div.style = 'display:flex; justify-content:space-between; align-items:center; background-color:rgba(255,255,255,0.02); padding:0.75rem; border-radius:var(--radius-sm); border:1px solid var(--border-color);';
    div.innerHTML = `
      <div>
        <strong style="font-size:0.85rem">${w.name}</strong> (${w.category})<br>
        <span style="font-size:0.7rem; color:var(--text-muted)">Resolved: ${w.completedJobs} jobs</span>
      </div>
      <div style="font-weight:700; color:var(--warning)">
        ${w.rating} ★
      </div>
    `;
    workerContainer.appendChild(div);
  });
}

function renderAdminProfile() {
  // Static profile details
}

/* ================== REPORTS PANEL LOGIC ================== */
function setupReports() {
  document.getElementById('report-select-month').addEventListener('change', buildLiveReportPreview);
  document.getElementById('report-select-category').addEventListener('change', buildLiveReportPreview);

  document.getElementById('btn-export-pdf').addEventListener('click', () => {
    window.print();
  });

  document.getElementById('btn-export-excel').addEventListener('click', handleCSVExport);

  buildLiveReportPreview();
}

function buildLiveReportPreview() {
  const monthFilter = document.getElementById('report-select-month').value;
  const sectorFilter = document.getElementById('report-select-category').value;
  
  let filtered = [...state.complaints];

  // Apply Sector Filter
  if (sectorFilter !== 'all') {
    filtered = filtered.filter(c => c.category.toLowerCase() === sectorFilter.toLowerCase());
  }

  // Apply Month Filter
  if (monthFilter === 'current') {
    filtered = filtered.filter(c => new Date(c.createdTime).getMonth() === 5); // June (0-indexed 5)
  } else if (monthFilter === 'last') {
    filtered = filtered.filter(c => new Date(c.createdTime).getMonth() === 4); // May (0-indexed 4)
  }

  const preview = document.getElementById('report-print-preview');
  
  // Calculate analytics for matching reports
  const total = filtered.length;
  const closed = filtered.filter(c => c.status === 'closed').length;
  const activeCount = filtered.filter(c => ['submitted', 'verified', 'assigned', 'inprogress', 'reopened', 'fixed', 'completed'].includes(c.status)).length;
  const rate = total > 0 ? Math.round((closed / total) * 100) : 0;

  let reportTitle = 'Hostel Monthly Maintenance Report';
  if (monthFilter === 'current') reportTitle = 'Hostel Maintenance Report - June 2026';
  else if (monthFilter === 'last') reportTitle = 'Hostel Maintenance Report - May 2026';

  let tableRows = '';
  filtered.forEach(c => {
    const workerName = c.workerId ? (state.workers.find(w => w.id === c.workerId)?.name || 'Technician') : 'N/A';
    tableRows += `
      <tr>
        <td>${c.id}</td>
        <td>${new Date(c.createdTime).toLocaleDateString()}</td>
        <td>${c.category}</td>
        <td>Rm ${c.room}</td>
        <td>${c.title}</td>
        <td>${c.status.toUpperCase()}</td>
        <td>${workerName}</td>
      </tr>
    `;
  });

  if (filtered.length === 0) {
    tableRows = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted)">No matching records found.</td></tr>';
  }

  preview.innerHTML = `
    <div class="report-title-header">
      <div>
        <h2>${reportTitle}</h2>
        <span style="font-size:0.75rem; color:var(--text-secondary);">Filter: Sector = ${sectorFilter.toUpperCase()}</span>
      </div>
      <div style="text-align:right">
        <span style="font-size:0.75rem; color:var(--text-muted)">Generated: 2026-06-13 17:28</span>
      </div>
    </div>

    <div class="report-summary-meta">
      <div class="report-meta-box">
        <span>Total Issues</span>
        <div>${total}</div>
      </div>
      <div class="report-meta-box">
        <span>Active Issues</span>
        <div>${activeCount}</div>
      </div>
      <div class="report-meta-box">
        <span>Closed Issues</span>
        <div>${closed}</div>
      </div>
      <div class="report-meta-box">
        <span>Resolution Rate</span>
        <div>${rate}%</div>
      </div>
    </div>

    <div>
      <h3 style="font-size:1rem; margin-bottom: 0.75rem;">Complaint Records Listing</h3>
      <table class="report-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Sector</th>
            <th>Room</th>
            <th>Title</th>
            <th>Status</th>
            <th>Technician</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>

    <div style="margin-top: 3rem; display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-muted);" class="no-print">
      <span>Authorized Warden Signature: _______________________</span>
      <span>Facility Manager Signature: _______________________</span>
    </div>
  `;
}
function handleCSVExport() {
  const monthFilter = document.getElementById('report-select-month').value;
  const sectorFilter = document.getElementById('report-select-category').value;
  
  let filtered = [...state.complaints];

  if (sectorFilter !== 'all') {
    filtered = filtered.filter(c => c.category.toLowerCase() === sectorFilter.toLowerCase());
  }

  if (monthFilter === 'current') {
    filtered = filtered.filter(c => new Date(c.createdTime).getMonth() === 5);
  } else if (monthFilter === 'last') {
    filtered = filtered.filter(c => new Date(c.createdTime).getMonth() === 4);
  }

  if (filtered.length === 0) {
    showToast('No records to export!', 'warning');
    return;
  }

  // Compile CSV using robust RFC 4180 escaping
  let csvRows = [];
  csvRows.push("Complaint ID,Date Raised,Category,Room,Block,Title,Description,Status,Priority,Expected Due,Worker,Feedback Rating,Feedback Comment");

  filtered.forEach(c => {
    const workerName = c.workerId ? (state.workers.find(w => w.id === c.workerId)?.name || 'Technician') : 'N/A';
    
    const escapeCSVField = (field) => {
      if (field === null || field === undefined) return '""';
      const str = String(field);
      return '"' + str.replace(/"/g, '""') + '"';
    };

    const row = [
      escapeCSVField(c.id),
      escapeCSVField(new Date(c.createdTime).toLocaleDateString()),
      escapeCSVField(c.category),
      escapeCSVField(c.room),
      escapeCSVField(c.block),
      escapeCSVField(c.title),
      escapeCSVField(c.desc),
      escapeCSVField(c.status),
      escapeCSVField(c.priority || 'N/A'),
      escapeCSVField(c.expectedCompletionDate || 'N/A'),
      escapeCSVField(workerName),
      escapeCSVField(c.rating || 'N/A'),
      escapeCSVField(c.comment || 'N/A')
    ].join(",");
    
    csvRows.push(row);
  });

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `HostelFix_Report_${monthFilter}_${sectorFilter}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('Spreadsheet downloaded!', 'success');
}

/* ================== DIALOG & TIMELINES MODALS UTILITY ================== */
function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

function setupModalControls() {
  document.getElementById('modal-close-dispatch').addEventListener('click', () => closeModal('dispatch-modal'));
  document.getElementById('btn-cancel-dispatch').addEventListener('click', () => closeModal('dispatch-modal'));

  document.getElementById('modal-close-feedback').addEventListener('click', () => closeModal('feedback-modal'));
  document.getElementById('modal-close-detail').addEventListener('click', () => closeModal('complaint-detail-modal'));
  document.getElementById('btn-close-detail-modal').addEventListener('click', () => closeModal('complaint-detail-modal'));

  // Feedback signoff buttons
  document.getElementById('btn-feedback-accept').addEventListener('click', (e) => {
    e.preventDefault();
    handleFeedbackSubmit('closed');
  });

  document.getElementById('btn-feedback-reopen').addEventListener('click', (e) => {
    e.preventDefault();
    handleFeedbackSubmit('reopened');
  });
}

function handleFeedbackSubmit(targetStatus) {
  if (!selectedComplaintIdForAction) return;

  const complaint = state.complaints.find(c => c.id === selectedComplaintIdForAction);
  if (!complaint) return;

  let bodyData = { status: targetStatus };

  if (targetStatus === 'closed') {
    const ratingRadio = document.querySelector('input[name="service-rating"]:checked');
    const rating = ratingRadio ? parseInt(ratingRadio.value) : 5; // default 5 star
    const comment = document.getElementById('feedback-comment').value || 'Resolution accepted by student.';
    bodyData.rating = rating;
    bodyData.comment = comment;
  } else if (targetStatus === 'reopened') {
    const comment = document.getElementById('feedback-comment').value || 'Resident reopened issue. Resolution unsatisfactory.';
    bodyData.comment = comment;
  }

  fetch(`/api/complaints/${complaint.id}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyData)
  })
  .then(res => res.json())
  .then(async (data) => {
    if (data.success) {
      const resState = await fetch('/api/state');
      const dbState = await resState.json();
      state.complaints = dbState.complaints;
      state.workers = dbState.workers;
      state.notifications = dbState.notifications;
      recalculateWorkerLoads();

      if (targetStatus === 'closed') {
        showToast(`Ticket ${complaint.id} successfully closed!`, 'success');
      } else {
        showToast(`Ticket ${complaint.id} reopened and routed to Warden review queue.`, 'warning');
      }

      // Reset feedback form
      document.getElementById('feedback-form-inner').reset();
      closeModal('feedback-modal');
      renderStudentDashboard();
    } else {
      showToast('Error sending feedback!', 'danger');
    }
  })
  .catch(err => {
    console.error(err);
    showToast('Connection error!', 'danger');
  });
}

function getTimelineHTML(complaint) {
  const steps = [
    { key: 'submitted', label: 'Pending Verify' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'inprogress', label: 'In Progress' },
    { key: 'fixed', label: 'Repaired' },
    { key: 'completed', label: 'Completed' }
  ];

  let currentStepIndex = 0;
  if (complaint.status === 'submitted') currentStepIndex = 0;
  else if (complaint.status === 'verified') currentStepIndex = 1; // Visually show progressed towards assignment
  else if (complaint.status === 'assigned') currentStepIndex = 1;
  else if (complaint.status === 'inprogress') currentStepIndex = 2;
  else if (complaint.status === 'fixed') currentStepIndex = 3;
  else if (complaint.status === 'completed' || complaint.status === 'closed') currentStepIndex = 4;
  else if (complaint.status === 'reopened') currentStepIndex = 1;

  const pct = (currentStepIndex / (steps.length - 1)) * 100;

  let stepsHTML = '';
  steps.forEach((step, idx) => {
    let classes = 'timeline-step';
    if (idx < currentStepIndex) classes += ' completed';
    else if (idx === currentStepIndex) {
      if (complaint.status === 'reopened') classes += ' reopened active';
      else classes += ' active';
    }

    stepsHTML += `
      <div class="${classes}">
        <div class="step-node">${idx + 1}</div>
        <span class="step-label">${step.label}</span>
      </div>
    `;
  });

  return `
    <div class="complaint-timeline">
      <div class="timeline-progress-line" style="width: ${pct}%"></div>
      ${stepsHTML}
    </div>
  `;
}

function openComplaintDetailModal(id) {
  const complaint = state.complaints.find(c => c.id === id);
  if (!complaint) return;

  const detailBody = document.getElementById('detail-modal-body');
  
  let workerName = 'Not Assigned';
  if (complaint.workerId) {
    const worker = state.workers.find(w => w.id === complaint.workerId);
    workerName = worker ? `${worker.name} (${worker.category})` : 'N/A';
  }

  let logsHTML = '';
  complaint.logs.forEach(log => {
    logsHTML += `
      <div style="padding: 0.5rem 0; border-left: 2px solid var(--primary); padding-left: 1rem; margin-left: 0.5rem; position: relative;">
        <span style="position: absolute; left:-6px; top: 10px; width:10px; height: 10px; border-radius:50%; background-color: var(--primary)"></span>
        <div style="font-size:0.75rem; color:var(--text-muted)">${new Date(log.time).toLocaleString()}</div>
        <div style="font-weight: 600; font-size:0.85rem; color:var(--text-primary); text-transform:capitalize;">Status: ${log.status}</div>
        <div style="font-size:0.85rem; color:var(--text-secondary); margin-top: 0.15rem;">${log.note}</div>
      </div>
    `;
  });

  detailBody.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
      <div>
        <strong style="color:var(--text-muted); font-size:0.8rem">TICKET ID:</strong>
        <span style="font-weight: 700; color:var(--text-primary);">${complaint.id}</span>
      </div>
      <div>
        <strong style="color:var(--text-muted); font-size:0.8rem">STATUS:</strong>
        <span class="badge badge-${complaint.status}">${complaint.status}</span>
      </div>
    </div>

    <div style="margin-bottom: 1.25rem;">
      <h4 style="font-size: 1.05rem; margin-bottom: 0.25rem;">${complaint.title}</h4>
      <p style="font-size:0.9rem; color:var(--text-secondary); line-height:1.5">${complaint.desc}</p>
      ${complaint.image ? `<div style="margin-top:0.75rem;"><img src="${complaint.image}" style="max-width:100%; max-height:220px; border-radius:var(--radius-sm); border:1px solid var(--border-color);" alt="Resident Proof"></div>` : ''}
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; background-color:rgba(15,23,42,0.4); padding:0.75rem; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:1.5rem;">
      <div>
        <span style="font-size:0.75rem; color:var(--text-muted)">Location:</span><br>
        <span style="font-size:0.9rem; font-weight:600;">${complaint.block}, Room ${complaint.room}</span>
      </div>
      <div>
        <span style="font-size:0.75rem; color:var(--text-muted)">Category:</span><br>
        <span style="font-size:0.9rem; font-weight:600; text-transform:capitalize;">${complaint.category}</span>
      </div>
      <div>
        <span style="font-size:0.75rem; color:var(--text-muted)">Reporter:</span><br>
        <span style="font-size:0.9rem; font-weight:600;">${complaint.studentName}</span>
      </div>
      <div>
        <span style="font-size:0.75rem; color:var(--text-muted)">Assigned Tech:</span><br>
        <span style="font-size:0.9rem; font-weight:600;">${workerName}</span>
      </div>
      <div>
        <span style="font-size:0.75rem; color:var(--text-muted)">Priority:</span><br>
        <span style="font-size:0.9rem; font-weight:600; text-transform:capitalize;">${complaint.priority || 'N/A'}</span>
      </div>
      <div>
        <span style="font-size:0.75rem; color:var(--text-muted)">Expected Due:</span><br>
        <span style="font-size:0.9rem; font-weight:600;">${complaint.expectedCompletionDate || 'N/A'}</span>
      </div>
    </div>

    ${complaint.rating ? `
      <div style="background-color:rgba(245,158,11,0.05); padding:0.75rem; border-radius:var(--radius-md); border:1px solid rgba(245,158,11,0.2); margin-bottom:1.5rem;">
        <span style="font-size:0.75rem; color:var(--warning); font-weight:600;">RESIDENT FEEDBACK:</span><br>
        <div style="color:var(--warning); font-size:1.1rem; margin:0.25rem 0;">${'★'.repeat(complaint.rating)}</div>
        <p style="font-size:0.85rem; color:var(--text-primary); font-style:italic">"${complaint.comment}"</p>
      </div>
    ` : ''}

    <div>
      <h5 style="font-size:0.9rem; margin-bottom:0.75rem; color:var(--text-primary);">Audit Logs & History</h5>
      <div style="display:flex; flex-direction:column; gap:0.5rem;">
        ${logsHTML}
      </div>
    </div>

    ${state.auth.role === 'admin' ? `
      <div style="background-color:rgba(99, 102, 241, 0.05); padding:1rem; border-radius:var(--radius-md); border:1px solid rgba(99, 102, 241, 0.2); margin-top:1.5rem; margin-bottom:0.5rem;">
        <h5 style="font-size:0.9rem; margin-bottom:0.75rem; color:var(--primary); font-weight:700;">Admin Actions: Update Status</h5>
        <div style="display:flex; gap:0.5rem;">
          <select id="admin-change-status-select" class="form-control" style="flex:2;">
            <option value="submitted" ${complaint.status === 'submitted' ? 'selected' : ''}>Pending Verification</option>
            <option value="verified" ${complaint.status === 'verified' ? 'selected' : ''}>Approved (Verified)</option>
            <option value="assigned" ${complaint.status === 'assigned' ? 'selected' : ''}>Assigned Worker</option>
            <option value="inprogress" ${complaint.status === 'inprogress' ? 'selected' : ''}>In Progress</option>
            <option value="fixed" ${complaint.status === 'fixed' ? 'selected' : ''}>Repaired (Fixed)</option>
            <option value="completed" ${complaint.status === 'completed' ? 'selected' : ''}>Completed (Awaiting Sign-off)</option>
            <option value="reopened" ${complaint.status === 'reopened' ? 'selected' : ''}>Reopened</option>
            <option value="rejected" ${complaint.status === 'rejected' ? 'selected' : ''}>Rejected</option>
            <option value="closed" ${complaint.status === 'closed' ? 'selected' : ''}>Closed (Accepted)</option>
          </select>
          <button class="btn btn-primary btn-sm" id="btn-admin-change-status" data-id="${complaint.id}" style="flex:1;">Update</button>
        </div>
      </div>
    ` : ''}
  `;

  document.getElementById('detail-modal-title').textContent = `Ticket: ${complaint.id}`;
  openModal('complaint-detail-modal');

  if (state.auth.role === 'admin') {
    const btnChangeStatus = document.getElementById('btn-admin-change-status');
    if (btnChangeStatus) {
      btnChangeStatus.addEventListener('click', () => {
        const selectedStatus = document.getElementById('admin-change-status-select').value;
        fetch(`/api/complaints/${complaint.id}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: selectedStatus })
        })
        .then(res => res.json())
        .then(async (data) => {
          if (data.success) {
            const resState = await fetch('/api/state');
            const dbState = await resState.json();
            state.complaints = dbState.complaints;
            state.workers = dbState.workers;
            state.notifications = dbState.notifications;
            recalculateWorkerLoads();
            closeModal('complaint-detail-modal');
            showToast(`Ticket status updated to ${selectedStatus}!`, 'success');
            navigateToPage(state.auth.role + '-dashboard');
          } else {
            showToast('Error updating ticket status!', 'danger');
          }
        })
        .catch(err => {
          console.error(err);
          showToast('Connection error!', 'danger');
        });
      });
    }
  }

  lucide.createIcons();
}

/* ================== WORKFLOW AUTO-SIMULATOR ================== */
function setupSimulationHandlers() {
  document.getElementById('btn-simulate-step').addEventListener('click', () => {
    runSimulationStep();
  });
}

function runSimulationStep() {
  fetch('/api/simulate-step', { method: 'POST' })
  .then(res => res.json())
  .then(async (data) => {
    if (data.success) {
      const resState = await fetch('/api/state');
      const dbState = await resState.json();
      state.complaints = dbState.complaints;
      state.workers = dbState.workers;
      state.notifications = dbState.notifications;
      recalculateWorkerLoads();
      showToast(data.toastMsg || 'Simulation step advanced!', 'success');
      navigateToPage(state.auth.role + '-dashboard');
    } else {
      showToast(data.message || 'All complaints are already closed!', 'warning');
    }
  })
  .catch(err => {
    console.error(err);
    showToast('Connection error!', 'danger');
  });
}

/* ================== GENERAL UTILITIES ================== */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `glass`;
  toast.style.position = 'fixed';
  toast.style.bottom = '2rem';
  toast.style.right = '2rem';
  toast.style.padding = '1rem 1.5rem';
  toast.style.borderRadius = 'var(--radius-md)';
  toast.style.zIndex = '9999';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '0.75rem';
  toast.style.boxShadow = 'var(--shadow-xl)';
  toast.style.animation = 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
  toast.style.borderLeft = `4px solid var(--${type})`;

  let iconName = 'bell';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'warning') iconName = 'alert-triangle';
  if (type === 'danger') iconName = 'alert-octagon';
  if (type === 'info') iconName = 'info';

  toast.innerHTML = `
    <i data-lucide="${iconName}" style="color: var(--${type})"></i>
    <span style="font-size: 0.9rem; font-weight: 500;">${message}</span>
  `;

  document.body.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

function formatTimeAgo(timeString) {
  const date = new Date(timeString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
}

document.getElementById('btn-reset-db').addEventListener('click', () => {
  if (confirm('Reset all databases? This deletes custom worker additions and tickets.')) {
    fetch('/api/reset', { method: 'POST' })
    .then(res => res.json())
    .then(async (dbState) => {
      state.complaints = dbState.complaints;
      state.workers = dbState.workers;
      state.notifications = dbState.notifications;
      state.credentials = dbState.credentials;
      recalculateWorkerLoads();
      showToast('Database reset!', 'info');
      navigateToPage(state.auth.role + '-dashboard');
    })
    .catch(err => {
      console.error(err);
      showToast('Connection error!', 'danger');
    });
  }
});

// Run Init
window.addEventListener('DOMContentLoaded', () => {
  initApp();
});

/* ================== PREMIUM FEATURES INTEGRATION ================== */

function setupPremiumFeatures() {
  initThemeSwitcher();
  initOnboardingTour();
  initLiveSearch();
}

/* 1. Dynamic Theme Switcher */
function initThemeSwitcher() {
  const toggleBtn = document.getElementById('btn-theme-toggle');
  if (!toggleBtn) return;

  // Load saved theme
  const savedTheme = localStorage.getItem('hostelfix_theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    toggleBtn.innerHTML = '<i data-lucide="moon"></i>';
  } else {
    document.body.classList.remove('light-theme');
    toggleBtn.innerHTML = '<i data-lucide="sun"></i>';
  }
  lucide.createIcons();

  toggleBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('hostelfix_theme', isLight ? 'light' : 'dark');
    toggleBtn.innerHTML = isLight ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
    lucide.createIcons();
    showToast(`Switched to ${isLight ? 'Light' : 'Dark'} mode!`, 'info');

    // Update charts dynamic configuration
    updateChartsTheme();
  });
}

function updateChartsTheme() {
  const activePage = document.querySelector('.page-container.active');
  if (activePage && activePage.id === 'admin-analytics') {
    renderAdminAnalytics();
  }
}

/* 2. Interactive Onboarding Tour */
let currentTourStep = 0;
let tourOverlay = null;
let tourTooltip = null;

const TOUR_STEPS = [
  {
    title: "Welcome to HostelFix 🛠️",
    body: "This is a premium maintenance management portal. It connects students directly with specialists (plumbers, electricians, cleaners) and helps hostel wardens track operations.",
    target: "#nav-logo",
    position: "bottom"
  },
  {
    title: "Quick Access Shortcuts 🔑",
    body: "No need to type credentials! Use these shortcut buttons to immediately log in as a Student or Warden/Admin.",
    target: ".quick-login-box",
    position: "top",
    onShow: () => {
      if (state.auth.isAuthenticated) {
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) logoutBtn.click();
      }
      navigateToPage('login');
    }
  },
  {
    title: "Raise a Complaint 📝",
    body: "Students can log issues in their room here. Choose categories, write descriptions, and upload picture proofs easily.",
    target: ".nav-link[data-target='student-raise-complaint']",
    position: "right",
    onShow: () => {
      if (!state.auth.isAuthenticated || state.auth.role !== 'student') {
        const quickStdBtn = document.getElementById('btn-quick-student');
        if (quickStdBtn) quickStdBtn.click();
      }
      navigateToPage('student-raise-complaint');
    }
  },
  {
    title: "Instant Search logs 🔍",
    body: "You can query complaints by title, category, description, or Ticket ID using this live search box.",
    target: "#student-history-search",
    position: "left",
    onShow: () => {
      if (!state.auth.isAuthenticated || state.auth.role !== 'student') {
        const quickStdBtn = document.getElementById('btn-quick-student');
        if (quickStdBtn) quickStdBtn.click();
      }
      navigateToPage('student-history');
    }
  },
  {
    title: "Progress simulator ⚡",
    body: "Use this button to auto-simulate step-by-step resolution of complaints, from filed to dispatched to completed and closed!",
    target: "#sim-control-bar",
    position: "bottom",
    onShow: () => {
      if (!state.auth.isAuthenticated) {
        const quickStdBtn = document.getElementById('btn-quick-student');
        if (quickStdBtn) quickStdBtn.click();
      }
      const simBar = document.getElementById('sim-control-bar');
      if (simBar) simBar.style.display = 'flex';
    }
  },
  {
    title: "Interactive Analytics & PDF/Excel 📊",
    body: "Admins can view monthly statistics, print PDFs, or download binary blob-based CSV spreadsheets securely.",
    target: ".nav-link[data-target='admin-reports']",
    position: "right",
    onShow: () => {
      const quickAdmBtn = document.getElementById('btn-quick-admin');
      if (quickAdmBtn) quickAdmBtn.click();
      navigateToPage('admin-reports');
    }
  }
];

function initOnboardingTour() {
  const startBtn = document.getElementById('btn-start-tour');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      startTour();
    });
  }
}

function startTour() {
  currentTourStep = 0;
  if (!tourOverlay) {
    tourOverlay = document.createElement('div');
    tourOverlay.className = 'tour-overlay';
    document.body.appendChild(tourOverlay);
  }
  showTourStep(0);
}

function closeTour() {
  if (tourOverlay) {
    tourOverlay.remove();
    tourOverlay = null;
  }
  if (tourTooltip) {
    tourTooltip.remove();
    tourTooltip = null;
  }
  document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
}

function showTourStep(index) {
  if (index < 0 || index >= TOUR_STEPS.length) {
    closeTour();
    showToast('Tour completed! Enjoy the portal! 🎉', 'success');
    return;
  }
  
  currentTourStep = index;
  const step = TOUR_STEPS[index];

  if (step.onShow) {
    step.onShow();
  }

  setTimeout(() => {
    const targetElement = document.querySelector(step.target);
    if (!targetElement) {
      showTourStep(index + 1);
      return;
    }

    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    targetElement.classList.add('tour-highlight');

    if (!tourTooltip) {
      tourTooltip = document.createElement('div');
      tourTooltip.className = 'tour-tooltip';
      document.body.appendChild(tourTooltip);
    }

    tourTooltip.innerHTML = `
      <div class="tour-tooltip-title">
        <i data-lucide="help-circle" style="width: 18px; height: 18px;"></i>
        <span>${step.title}</span>
      </div>
      <div class="tour-tooltip-body">
        ${step.body}
      </div>
      <div class="tour-tooltip-footer">
        <span class="tour-step-indicator">Step ${index + 1} of ${TOUR_STEPS.length}</span>
        <div class="tour-actions">
          <button class="btn btn-secondary btn-sm" id="btn-tour-skip" style="padding: 0.25rem 0.5rem;">Skip</button>
          <button class="btn btn-primary btn-sm" id="btn-tour-next" style="padding: 0.25rem 0.6rem;">${index === TOUR_STEPS.length - 1 ? 'Finish' : 'Next →'}</button>
        </div>
      </div>
    `;

    lucide.createIcons();
    positionTooltip(targetElement, tourTooltip, step.position);

    document.getElementById('btn-tour-skip').addEventListener('click', closeTour);
    document.getElementById('btn-tour-next').addEventListener('click', () => {
      showTourStep(currentTourStep + 1);
    });
  }, 200);
}

function positionTooltip(target, tooltip, position) {
  const rect = target.getBoundingClientRect();
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;

  let top = 0;
  let left = 0;

  if (position === 'bottom') {
    top = rect.bottom + scrollY + 10;
    left = rect.left + scrollX + (rect.width / 2) - (tooltip.offsetWidth / 2);
  } else if (position === 'top') {
    top = rect.top + scrollY - tooltip.offsetHeight - 10;
    left = rect.left + scrollX + (rect.width / 2) - (tooltip.offsetWidth / 2);
  } else if (position === 'right') {
    top = rect.top + scrollY + (rect.height / 2) - (tooltip.offsetHeight / 2);
    left = rect.right + scrollX + 10;
  } else if (position === 'left') {
    top = rect.top + scrollY + (rect.height / 2) - (tooltip.offsetHeight / 2);
    left = rect.left + scrollX - tooltip.offsetWidth - 10;
  }

  if (left < 10) left = 10;
  if (left + tooltip.offsetWidth > window.innerWidth - 10) {
    left = window.innerWidth - tooltip.offsetWidth - 10;
  }
  if (top < 10) top = 10;

  tooltip.style.top = top + 'px';
  tooltip.style.left = left + 'px';
}

/* 3. Live Search & Advanced Filter Logic */
function initLiveSearch() {
  const studentSearch = document.getElementById('student-history-search');
  if (studentSearch) {
    studentSearch.addEventListener('input', () => {
      renderStudentHistory();
    });
  }

  const adminSearch = document.getElementById('admin-complaints-search');
  if (adminSearch) {
    adminSearch.addEventListener('input', () => {
      renderAdminComplaints();
    });
  }
}

/* ================== WORKER PORTAL LOGIC ================== */

function renderWorkerDashboard() {
  const worker = state.auth.user;
  if (!worker) return;

  const complaintsList = state.complaints || [];
  const myTickets = complaintsList.filter(c => c && c.workerId === worker.id);
  const assignedJobs = myTickets.filter(c => c.status === 'assigned');
  const activeJobs = myTickets.filter(c => c.status === 'inprogress');
  const completedJobs = myTickets.filter(c => ['fixed', 'completed', 'closed'].includes(c.status));

  document.getElementById('wrk-stat-assigned').textContent = assignedJobs.length;
  document.getElementById('wrk-stat-active').textContent = activeJobs.length;
  document.getElementById('wrk-stat-completed').textContent = completedJobs.length;

  // Render Invitations (assigned status)
  const invitationsContainer = document.getElementById('worker-invitations-list');
  invitationsContainer.innerHTML = '';

  if (assignedJobs.length === 0) {
    invitationsContainer.innerHTML = '<div style="color:var(--text-muted); padding:2rem; text-align:center">No new job invitations.</div>';
  } else {
    assignedJobs.forEach(c => {
      const item = document.createElement('div');
      item.className = 'complaint-item';
      item.innerHTML = `
        <div class="complaint-header">
          <div>
            <h4>${c.title}</h4>
            <span style="font-size:0.8rem; color:var(--text-muted)">ID: ${c.id} | Location: Room ${c.room} (${c.block}) | Priority: <strong>${c.priority || 'Medium'}</strong></span>
          </div>
          <button class="btn btn-success btn-sm btn-accept-job" data-id="${c.id}">Accept Job</button>
        </div>
        <div class="complaint-body">
          <p>${c.desc}</p>
        </div>
      `;
      invitationsContainer.appendChild(item);
    });

    document.querySelectorAll('.btn-accept-job').forEach(btn => {
      btn.addEventListener('click', (e) => {
        handleAcceptJob(e.currentTarget.getAttribute('data-id'));
      });
    });
  }

  // Render Notifications
  const notifList = document.getElementById('worker-dashboard-notifications');
  notifList.innerHTML = '';
  const notificationsList = state.notifications || [];
  const myNotifs = notificationsList.filter(n => n && (n.role === 'admin' || (n.message && n.message.includes(worker.name)))).sort((a,b)=>new Date(b.time || 0)-new Date(a.time || 0));
  
  if (myNotifs.length === 0) {
    notifList.innerHTML = '<div style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding:1.5rem">No notifications yet.</div>';
  } else {
    myNotifs.slice(0, 5).forEach(n => {
      const div = document.createElement('div');
      div.className = `notification-item info`;
      div.innerHTML = `
        <p>${n.message}</p>
        <span class="notification-time">${formatTimeAgo(n.time)}</span>
      `;
      notifList.appendChild(div);
    });
  }
}

function renderWorkerJobs() {
  const worker = state.auth.user;
  if (!worker) return;

  const container = document.getElementById('worker-jobs-list');
  container.innerHTML = '';

  const filterSelect = document.getElementById('worker-jobs-filter');
  const filterVal = filterSelect ? filterSelect.value : 'all';
  const complaintsList = state.complaints || [];
  let list = complaintsList.filter(c => c && c.workerId === worker.id);

  if (filterVal === 'assigned') {
    list = list.filter(c => c.status === 'assigned');
  } else if (filterVal === 'inprogress') {
    list = list.filter(c => c.status === 'inprogress');
  } else if (filterVal === 'completed') {
    list = list.filter(c => ['fixed', 'completed', 'closed'].includes(c.status));
  }

  if (list.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted); padding:2rem; text-align:center">No jobs found in this category.</div>';
    return;
  }

  list.forEach(c => {
    const item = document.createElement('div');
    item.className = 'complaint-item';
    
    let btnHTML = '';
    if (c.status === 'assigned') {
      btnHTML = `
        <button class="btn btn-success btn-sm btn-accept-job-list" data-id="${c.id}">
          <i data-lucide="check"></i> Accept Work
        </button>
      `;
    } else if (c.status === 'inprogress') {
      btnHTML = `
        <button class="btn btn-primary btn-sm btn-fix-job-list" data-id="${c.id}">
          <i data-lucide="check-square"></i> Mark as Repaired
        </button>
      `;
    }

    item.innerHTML = `
      <div class="complaint-header">
        <div>
          <h4>${c.title}</h4>
          <div class="complaint-meta">
            <span class="meta-item">ID: ${c.id}</span>
            <span class="meta-item">Location: Room ${c.room} (${c.block})</span>
            <span class="meta-item">Priority: <strong>${c.priority || 'Medium'}</strong></span>
            <span class="meta-item">Due: ${c.expectedCompletionDate || 'N/A'}</span>
          </div>
        </div>
        <span class="badge badge-${c.status}">${c.status}</span>
      </div>
      <div class="complaint-body">
        <p>${c.desc}</p>
        ${c.image ? `<div style="margin-top:0.75rem;"><img src="${c.image}" style="max-width:180px; max-height:120px; border-radius:var(--radius-sm); border:1px solid var(--border-color);" alt="Proof"></div>` : ''}
      </div>
      <div class="complaint-footer">
        <span style="font-size:0.8rem; color:var(--text-muted)">Reported by: ${c.studentName}</span>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-secondary btn-sm btn-view-logs" data-id="${c.id}">View Logs</button>
          ${btnHTML}
        </div>
      </div>
    `;
    container.appendChild(item);
  });

  document.querySelectorAll('.btn-accept-job-list').forEach(btn => {
    btn.addEventListener('click', (e) => {
      handleAcceptJob(e.currentTarget.getAttribute('data-id'));
    });
  });

  document.querySelectorAll('.btn-fix-job-list').forEach(btn => {
    btn.addEventListener('click', (e) => {
      handleFixJob(e.currentTarget.getAttribute('data-id'));
    });
  });

  document.querySelectorAll('.btn-view-logs').forEach(btn => {
    btn.addEventListener('click', (e) => {
      openComplaintDetailModal(e.currentTarget.getAttribute('data-id'));
    });
  });

  lucide.createIcons();
}

// Bind worker job filter dropdown
const workerJobsFilter = document.getElementById('worker-jobs-filter');
if (workerJobsFilter) {
  workerJobsFilter.addEventListener('change', () => {
    renderWorkerJobs();
  });
}

function renderWorkerProfile() {
  const worker = state.auth.user;
  if (!worker) return;

  document.getElementById('profile-wrk-id').value = worker.id;
  document.getElementById('profile-wrk-name').value = worker.name;
  document.getElementById('profile-wrk-sector').value = worker.category;

  document.getElementById('profile-wrk-avatar').textContent = worker.name ? worker.name.split(' ').map(n=>n[0]).join('') : '--';
  document.getElementById('profile-wrk-avatar').style.background = 'linear-gradient(135deg, var(--info), #10b981)';
  document.getElementById('profile-wrk-name-big').textContent = worker.name || 'Specialist Name';
  document.getElementById('profile-wrk-sector-big').textContent = `${worker.category || 'Specialty'} Specialist`;
  const ratingVal = parseFloat(worker.rating || 5);
  document.getElementById('profile-wrk-rating').textContent = isNaN(ratingVal) ? '5.0' : ratingVal.toFixed(1);
}

function handleAcceptJob(id) {
  const worker = state.auth.user;
  if (!worker) return;

  fetch(`/api/complaints/${id}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workerName: worker.name })
  })
  .then(res => res.json())
  .then(async (data) => {
    if (data.success) {
      const resState = await fetch('/api/state');
      const dbState = await resState.json();
      state.complaints = dbState.complaints;
      state.workers = dbState.workers;
      state.notifications = dbState.notifications;
      recalculateWorkerLoads();
      showToast(`Job ${id} accepted successfully!`, 'success');
      navigateToPage('worker-dashboard');
    } else {
      showToast('Error accepting job!', 'danger');
    }
  })
  .catch(err => {
    console.error(err);
    showToast('Connection error!', 'danger');
  });
}

function handleFixJob(id) {
  const worker = state.auth.user;
  if (!worker) return;

  fetch(`/api/complaints/${id}/fix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workerName: worker.name })
  })
  .then(res => res.json())
  .then(async (data) => {
    if (data.success) {
      const resState = await fetch('/api/state');
      const dbState = await resState.json();
      state.complaints = dbState.complaints;
      state.workers = dbState.workers;
      state.notifications = dbState.notifications;
      recalculateWorkerLoads();
      showToast(`Job ${id} marked as fixed! Warden notified.`, 'success');
      navigateToPage('worker-dashboard');
    } else {
      showToast('Error marking job as fixed!', 'danger');
    }
  })
  .catch(err => {
    console.error(err);
    showToast('Connection error!', 'danger');
  });
}
