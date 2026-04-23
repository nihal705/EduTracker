// public/js/script.js - COMPLETE WORKING VERSION WITH ALL FEATURES
const API_URL = 'http://localhost:3000/api';
let socket = null;
let currentUser = null;
let trendChart = null;
let currentStudentUsn = null;

// ============ DOM Elements ============
const mainContent = document.getElementById('mainContent');
const studentFormContainer = document.getElementById('studentFormContainer');
const institutionFormContainer = document.getElementById('institutionFormContainer');
const studentDashboard = document.getElementById('studentDashboard');
const institutionDashboard = document.getElementById('institutionDashboard');
const studentDetailPage = document.getElementById('studentDetailPage');
const externalsNav = document.getElementById('externalsNav');
const internalsNav = document.getElementById('internalsNav');

// ============ Navigation ============
document.getElementById('homeLink')?.addEventListener('click', showHome);
document.getElementById('studentLoginLink')?.addEventListener('click', showStudentLogin);
document.getElementById('institutionLoginLink')?.addEventListener('click', showInstitutionLogin);
document.getElementById('studentActionBtn')?.addEventListener('click', showStudentLogin);
document.getElementById('institutionActionBtn')?.addEventListener('click', showInstitutionLogin);

// ============ Tab Switching ============
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const tabName = this.id.replace('Tab', '');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        document.getElementById(tabName).classList.add('active');
    });
});

// ============ UI Functions ============
// ============ UI Functions ============
function hideAll() {
    if (mainContent) mainContent.style.display = 'none';
    if (studentFormContainer) studentFormContainer.style.display = 'none';
    if (institutionFormContainer) institutionFormContainer.style.display = 'none';
    if (studentDashboard) studentDashboard.style.display = 'none';
    if (institutionDashboard) institutionDashboard.style.display = 'none';
    if (studentDetailPage) studentDetailPage.style.display = 'none';
    
    // Hide the new dashboard containers
    const externalDash = document.getElementById('externalDashboard');
    const internalDash = document.getElementById('internalDashboard');
    const deptView = document.getElementById('departmentsView');
    
    if (externalDash) externalDash.style.display = 'none';
    if (internalDash) internalDash.style.display = 'none';
    if (deptView) deptView.style.display = 'none';
}

function showHome() {
    hideAll();
    if (mainContent) mainContent.style.display = 'block';
    updateNavbar();
}

function showStudentLogin() {
    hideAll();
    if (studentFormContainer) studentFormContainer.style.display = 'block';
    document.getElementById('studentLoginTab')?.click();
}

function showInstitutionLogin() {
    hideAll();
    if (institutionFormContainer) institutionFormContainer.style.display = 'block';
    document.getElementById('institutionLoginTab')?.click();
}

function showStudentDashboard() {
    hideAll();
    if (studentDashboard) studentDashboard.style.display = 'block';
}

function showDashboard() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) { showHome(); return; }
    if (user.role === 'student') {
        loadStudentDashboard();
        showStudentDashboard();
    } else if (user.role === 'institution') {
        loadInstitutionData();
        showInstitutionDashboard();
    }
}

// ============ Update Navbar ============
function updateNavbar() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    const studentLoginNav = document.getElementById('studentLoginNav');
    const institutionLoginNav = document.getElementById('institutionLoginNav');
    const logoutNav = document.getElementById('logoutNav');
    
    // Student specific
    const studentDashboardNav = document.getElementById('studentDashboardNav');
    const studentExamsNav = document.getElementById('studentExamsNav');
    
    // Institution specific
    const dashboardNav = document.getElementById('dashboardNav');
    const examTypeNav = document.getElementById('examTypeNav');
    const deptNav = document.getElementById('deptNav');
    const analyticsNav = document.getElementById('analyticsNav');
    
    console.log('Updating navbar - Token:', !!token, 'User:', user);
    
    if (token && user) {
        // Hide login links
        if (studentLoginNav) studentLoginNav.style.display = 'none';
        if (institutionLoginNav) institutionLoginNav.style.display = 'none';
        if (logoutNav) logoutNav.style.display = 'block';
        
        if (user.role === 'student') {
            console.log('Showing STUDENT navbar items');
            // Show student nav items
            if (studentDashboardNav) studentDashboardNav.style.display = 'block';
            if (studentExamsNav) studentExamsNav.style.display = 'block';
            
            // Hide institution nav items
            if (dashboardNav) dashboardNav.style.display = 'none';
            if (examTypeNav) examTypeNav.style.display = 'none';
            if (deptNav) deptNav.style.display = 'none';
            if (analyticsNav) analyticsNav.style.display = 'none';
            
        } else if (user.role === 'institution') {
            console.log('Showing INSTITUTION navbar items');
            // Show institution nav items
            if (dashboardNav) dashboardNav.style.display = 'block';
            if (examTypeNav) examTypeNav.style.display = 'block';
            if (deptNav) deptNav.style.display = 'block';
            if (analyticsNav) analyticsNav.style.display = 'block';
            
            // Hide student nav items
            if (studentDashboardNav) studentDashboardNav.style.display = 'none';
            if (studentExamsNav) studentExamsNav.style.display = 'none';
        }
    } else {
        console.log('User not logged in');
        // User not logged in
        if (studentLoginNav) studentLoginNav.style.display = 'block';
        if (institutionLoginNav) institutionLoginNav.style.display = 'block';
        if (logoutNav) logoutNav.style.display = 'none';
        
        // Hide all role-specific navs
        if (studentDashboardNav) studentDashboardNav.style.display = 'none';
        if (studentExamsNav) studentExamsNav.style.display = 'none';
        if (dashboardNav) dashboardNav.style.display = 'none';
        if (examTypeNav) examTypeNav.style.display = 'none';
        if (deptNav) deptNav.style.display = 'none';
        if (analyticsNav) analyticsNav.style.display = 'none';
    }
}

// ============ Notifications ============
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} notification`;
    notification.textContent = message;
    notification.style.cssText = 'position:fixed;top:80px;right:20px;z-index:10000;padding:12px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);animation:slideIn 0.3s ease;z-index:10001;';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

// ============ API Helper ============
async function makeApiRequest(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };
    
    const response = await fetch(`${API_URL}${url}`, { headers, ...options });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
}

// ============ Loading State ============
function setLoading(element, isLoading) {
    if (!element) return;
    if (isLoading) {
        element.disabled = true;
        element.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Loading...';
    } else {
        element.disabled = false;
        element.innerHTML = element.getAttribute('data-original') || 'Submit';
    }
}

// ============ STUDENT LOGIN ============
document.getElementById('studentLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usn = document.getElementById('studentUSN').value.trim().toUpperCase();
    const password = document.getElementById('studentPassword').value;
    const btn = e.target.querySelector('.btn-submit');
    btn.setAttribute('data-original', btn.innerHTML);
    setLoading(btn, true);
    
    try {
        const data = await makeApiRequest('/auth/student/login', { method: 'POST', body: JSON.stringify({ usn, password }) });
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            updateNavbar();  // Make sure this is called
            connectSocket();
            await loadStudentDashboard();
            showStudentDashboardView();  // This should show dashboard
            showNotification('Login successful!', 'success');
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Login failed', 'error');
    } finally {
        setLoading(btn, false);
    }
});

// ============ STUDENT REGISTER ============
document.getElementById('studentRegisterForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usn = document.getElementById('newStudentUSN').value.trim().toUpperCase();
    const name = document.getElementById('newStudentName').value.trim();
    const email = document.getElementById('newStudentEmail').value.trim();
    const department = document.getElementById('newStudentDept').value;
    const password = document.getElementById('newStudentPassword').value;
    const btn = e.target.querySelector('.btn-submit');
    btn.setAttribute('data-original', btn.innerHTML);
    setLoading(btn, true);
    
    try {
        const data = await makeApiRequest('/auth/student/register', { method: 'POST', body: JSON.stringify({ usn, name, email, department, password }) });
        if (data.success) {
            showNotification('Registration successful! Please login.', 'success');
            document.getElementById('studentLoginTab').click();
            e.target.reset();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Registration failed', 'error');
    } finally {
        setLoading(btn, false);
    }
});

// ============ INSTITUTION LOGIN ============
document.getElementById('institutionLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const institutionId = document.getElementById('institutionID').value.trim();
    const password = document.getElementById('institutionPassword').value;
    const btn = e.target.querySelector('.btn-submit');
    btn.setAttribute('data-original', btn.innerHTML);
    setLoading(btn, true);
    
    try {
        const data = await makeApiRequest('/auth/institution/login', { method: 'POST', body: JSON.stringify({ institutionId, password }) });
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            updateNavbar();
            connectSocket();
            await loadInstitutionData();
            showExternalsView();
            showNotification('Login successful!', 'success');
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Login failed', 'error');
    } finally {
        setLoading(btn, false);
    }
});

// ============ INSTITUTION REGISTER ============
document.getElementById('institutionRegisterForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('institutionName').value.trim();
    const email = document.getElementById('institutionEmail').value.trim();
    const adminName = document.getElementById('institutionAdmin').value.trim();
    const institutionCode = document.getElementById('institutionCode').value.trim().toUpperCase();
    const usnPrefix = document.getElementById('usnPrefix').value.trim().toUpperCase();
    const password = document.getElementById('newInstitutionPassword').value;
    const btn = e.target.querySelector('.btn-submit');
    btn.setAttribute('data-original', btn.innerHTML);
    setLoading(btn, true);
    
    try {
        const data = await makeApiRequest('/auth/institution/register', { 
            method: 'POST', 
            body: JSON.stringify({ name, email, adminName, password, institutionCode, usnPrefix }) 
        });
        if (data.success) {
            showNotification(`Registration successful! Your ID: ${data.institutionId}\nCode: ${data.institutionCode}\nUSN Prefix: ${data.usnPrefix}`, 'success');
            document.getElementById('institutionID').value = data.institutionId;
            document.getElementById('institutionLoginTab').click();
            e.target.reset();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Registration failed', 'error');
    } finally {
        setLoading(btn, false);
    }
});

// ============ FORGOT PASSWORD ============
function showForgotPasswordModal(userType) {
    const modal = document.createElement('div');
    modal.className = 'modal show d-block';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10001;overflow:auto';
    modal.innerHTML = `
        <div class="modal-dialog" style="margin:100px auto;max-width:450px">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title"><i class="fas fa-key"></i> Forgot Password - ${userType === 'student' ? 'Student' : 'Institution'}</h5>
                    <button type="button" class="btn-close btn-close-white" onclick="this.closest('.modal').remove()"></button>
                </div>
                <div class="modal-body">
                    <form id="forgotPasswordForm">
                        <div class="mb-3">
                            <label class="form-label">${userType === 'student' ? 'USN' : 'Institution ID'}</label>
                            <input type="text" class="form-control" id="forgotUsername" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Email Address</label>
                            <input type="email" class="form-control" id="forgotEmail" required>
                        </div>
                        <input type="hidden" id="forgotUserType" value="${userType}">
                        <button type="submit" class="btn btn-primary w-100">Send Reset Link</button>
                        <hr>
                        <div class="text-center">
                            <a href="#" onclick="this.closest('.modal').remove(); return false;" class="small">Back to Login</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('forgotUsername').value.trim();
        const email = document.getElementById('forgotEmail').value.trim();
        const role = document.getElementById('forgotUserType').value;
        const btn = e.target.querySelector('button[type="submit"]');
        
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Sending...';
        
        try {
            const data = await makeApiRequest('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ username, email, role })
            });
            
            if (data.success) {
                modal.innerHTML = `
                    <div class="modal-dialog" style="margin:100px auto;max-width:450px">
                        <div class="modal-content">
                            <div class="modal-header bg-success text-white">
                                <h5 class="modal-title"><i class="fas fa-check-circle"></i> Reset Link Sent!</h5>
                                <button type="button" class="btn-close btn-close-white" onclick="this.closest('.modal').remove()"></button>
                            </div>
                            <div class="modal-body text-center">
                                <i class="fas fa-envelope" style="font-size:48px;color:#3b71ca;"></i>
                                <p class="mt-3">A password reset link has been sent.</p>
                                <p class="text-muted small">Check console for link (demo mode)</p>
                                <button class="btn btn-primary mt-3" onclick="this.closest('.modal').remove()">Close</button>
                            </div>
                        </div>
                    </div>
                `;
                if (data.resetLink) console.log('Reset link:', data.resetLink);
            } else {
                showNotification(data.message, 'error');
                btn.disabled = false;
                btn.innerHTML = 'Send Reset Link';
            }
        } catch (error) {
            showNotification('Failed to send reset link', 'error');
            btn.disabled = false;
            btn.innerHTML = 'Send Reset Link';
        }
    });
}

// ============ PROFILE MODAL ============
async function showProfileModal() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        let profileData = null;
        
        if (user.role === 'student') {
            profileData = await makeApiRequest('/student/profile');
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal show d-block';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;overflow:auto';
        modal.innerHTML = `
            <div class="modal-dialog" style="margin:100px auto;max-width:500px">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white"><h5 class="modal-title"><i class="fas fa-user-circle"></i> My Profile</h5><button type="button" class="btn-close btn-close-white" onclick="this.closest('.modal').remove()"></button></div>
                    <div class="modal-body">
                        <div class="text-center mb-3"><div class="profile-avatar" style="font-size:48px;">${user.role === 'student' ? '👨‍🎓' : '🏛️'}</div></div>
                        <form id="profileForm">
                            <div class="mb-3"><label class="form-label">Username</label><input type="text" class="form-control" value="${user.role === 'student' ? user.usn : user.institutionId}" disabled></div>
                            <div class="mb-3"><label class="form-label">Name</label><input type="text" name="name" class="form-control" value="${profileData?.profile?.name || user.name || ''}" required></div>
                            <div class="mb-3"><label class="form-label">Email</label><input type="email" name="email" class="form-control" value="${profileData?.profile?.email || ''}" required></div>
                            ${user.role === 'student' ? `<div class="mb-3"><label class="form-label">Department</label><input type="text" class="form-control" value="${profileData?.profile?.department || ''}" disabled></div>` : ''}
                            <div class="mb-3"><label class="form-label">Phone</label><input type="text" name="phone" class="form-control" value="${profileData?.profile?.phone || ''}"></div>
                            <hr><h6>Change Password</h6>
                            <div class="mb-3"><label class="form-label">Current Password</label><input type="password" name="currentPassword" class="form-control" placeholder="Enter current password to change"></div>
                            <div class="mb-3"><label class="form-label">New Password</label><input type="password" name="newPassword" class="form-control" placeholder="Min 6 characters"></div>
                            <div class="mb-3"><label class="form-label">Confirm Password</label><input type="password" name="confirmPassword" class="form-control"></div>
                            <button type="submit" class="btn btn-success w-100">Save Changes</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('profileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const name = formData.get('name');
            const email = formData.get('email');
            const phone = formData.get('phone');
            const currentPassword = formData.get('currentPassword');
            const newPassword = formData.get('newPassword');
            const confirmPassword = formData.get('confirmPassword');
            
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Saving...';
            
            try {
                if (user.role === 'student') {
                    await makeApiRequest('/student/profile', { method: 'PUT', body: JSON.stringify({ name, email, phone }) });
                }
                
                if (currentPassword && newPassword) {
                    if (newPassword !== confirmPassword) {
                        showNotification('New passwords do not match', 'error');
                        btn.disabled = false;
                        btn.innerHTML = 'Save Changes';
                        return;
                    }
                    if (newPassword.length < 6) {
                        showNotification('Password must be at least 6 characters', 'error');
                        btn.disabled = false;
                        btn.innerHTML = 'Save Changes';
                        return;
                    }
                    await makeApiRequest('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
                    showNotification('Password changed! Please login again.', 'success');
                    setTimeout(() => logout(), 2000);
                } else {
                    showNotification('Profile updated successfully', 'success');
                    modal.remove();
                    if (user.role === 'student') loadStudentDashboard();
                    else loadInstitutionData();
                }
            } catch (error) {
                showNotification(error.message || 'Update failed', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Save Changes';
            }
        });
    } catch (error) {
        showNotification('Failed to load profile', 'error');
    }
}

// ============ STUDENT DASHBOARD ============
async function loadStudentDashboard() {
    studentDashboard.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Loading your dashboard...</p></div>';
    
    try {
        const [dashboardData, rankData] = await Promise.all([
            makeApiRequest('/student/dashboard'),
            makeApiRequest('/student/rank')
        ]);
        
        if (dashboardData.success) {
            displayStudentDashboard(dashboardData, rankData);
        }
    } catch (error) {
        studentDashboard.innerHTML = `<div class="alert alert-danger">Failed to load data: ${error.message}</div>`;
    }
}

function displayStudentDashboard(dashboardData, rankData) {
    const { student, semesters, stats } = dashboardData;
    const rank = rankData.rank || '-';
    const percentile = rankData.percentile || 0;
    
    studentDashboard.innerHTML = `
        <div class="dashboard-header d-flex justify-content-between flex-wrap">
            <h2><i class="fas fa-user-graduate"></i> My Academic Dashboard</h2>
            <div>
                <button class="btn btn-outline-light me-2" onclick="showProfileModal()"><i class="fas fa-user-circle"></i> Profile</button>
                <button class="btn btn-outline-light" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</button>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${stats.cgpa}</div><div class="stat-label">CGPA</div></div></div>
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${stats.totalSemesters}</div><div class="stat-label">Semesters Completed</div></div></div>
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${stats.averageSgpa}</div><div class="stat-label">Average SGPA</div></div></div>
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${rank}</div><div class="stat-label">Rank (${percentile}th percentile)</div></div></div>
        </div>
        
        <div class="student-info-card">
            <div class="row">
                <div class="col-md-6"><p><strong>📘 USN:</strong> ${student.usn}</p><p><strong>👤 Name:</strong> ${student.name}</p></div>
                <div class="col-md-6"><p><strong>🏛️ Department:</strong> ${student.department}</p><p><strong>📧 Email:</strong> ${student.email || 'N/A'}</p></div>
            </div>
        </div>
        
        <div class="card mb-4">
            <div class="card-header bg-primary text-white"><h5 class="mb-0"><i class="fas fa-chart-line"></i> SGPA Trend</h5></div>
            <div class="card-body"><canvas id="trendChart" height="150" style="max-height:250px;"></canvas></div>
        </div>
        
        <div class="card">
            <div class="card-header bg-primary text-white"><h5 class="mb-0"><i class="fas fa-list-ol"></i> Semester Summary</h5></div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Semester</th>
                                <th>SGPA</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${semesters.map(sem => `
                                <tr>
                                    <td><strong>Semester ${sem.semester_number}</strong></td>
                                    <td><span class="badge bg-primary fs-6">${parseFloat(sem.sgpa).toFixed(2)}</span></td>
                                    <td>${parseFloat(sem.sgpa) >= 8 ? '🏆 Excellent' : parseFloat(sem.sgpa) >= 7 ? '👍 Good' : parseFloat(sem.sgpa) >= 6 ? '📚 Satisfactory' : '⚠️ Need Improvement'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <div class="cgpa-card text-center mt-4">
            <h4><i class="fas fa-star"></i> Overall CGPA</h4>
            <div class="cgpa-score">${stats.cgpa}</div>
            <p class="mt-2">${getCgpaRemark(stats.cgpa)}</p>
        </div>
    `;
    
    // Load trend chart
    if (semesters && semesters.length > 0) {
        const ctx = document.getElementById('trendChart')?.getContext('2d');
        if (ctx) {
            if (trendChart) trendChart.destroy();
            trendChart = new Chart(ctx, {
                type: 'line',
                data: { 
                    labels: semesters.map(s => `Sem ${s.semester_number}`), 
                    datasets: [{ 
                        label: 'SGPA', 
                        data: semesters.map(s => parseFloat(s.sgpa)), 
                        borderColor: '#3b71ca', 
                        backgroundColor: 'rgba(59,113,202,0.1)', 
                        fill: true, 
                        tension: 0.4 
                    }] 
                },
                options: { responsive: true, maintainAspectRatio: true, scales: { y: { min: 0, max: 10 } } }
            });
        }
    }
}

function getCgpaRemark(cgpa) {
    const num = parseFloat(cgpa);
    if (num >= 8.5) return '🏆 Excellent Performance! Keep it up!';
    if (num >= 7) return '👍 Good Performance!';
    if (num >= 6) return '📚 Satisfactory - Can improve further';
    if (num >= 5) return '⚠️ Need Improvement';
    return '❌ Needs Significant Improvement';
}

function getGradeBadgeClass(grade) {
    switch(grade) { 
        case 'S': return 'bg-success'; 
        case 'A': return 'bg-primary'; 
        case 'B': return 'bg-info'; 
        case 'C': return 'bg-warning'; 
        case 'D': return 'bg-secondary'; 
        default: return 'bg-danger'; 
    }
}

// ============ INSTITUTION DASHBOARD ============
async function loadInstitutionData() {
    institutionDashboard.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Loading data...</p></div>';
    
    try {
        const students = await makeApiRequest('/institution/students');
        const stats = await makeApiRequest('/institution/stats');
        const semesterPerf = await makeApiRequest('/institution/semester-performance');
        const deptComparison = await makeApiRequest('/institution/department-comparison');
        
        displayInstitutionData(students.students, stats.data, semesterPerf.data, deptComparison.data);
    } catch (error) {
        institutionDashboard.innerHTML = `<div class="alert alert-danger">Failed to load data: ${error.message}</div>`;
    }
}

function displayInstitutionData(students, stats, semesterPerf, deptComparison) {
    const uniqueDepts = [...new Set(students.map(s => s.department))];
    
    institutionDashboard.innerHTML = `
        <div class="dashboard-header d-flex justify-content-between flex-wrap">
            <h2><i class="fas fa-building"></i> Institution Dashboard</h2>
            <div>
                <button class="btn btn-outline-light me-2" onclick="showProfileModal()"><i class="fas fa-user-circle"></i> Profile</button>
                <button class="btn btn-outline-light me-2" onclick="showAddRecordForm()"><i class="fas fa-plus"></i> Add Record</button>
                <button class="btn btn-outline-danger" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</button>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${stats?.totalStudents || 0}</div><div class="stat-label">Total Students</div></div></div>
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${stats?.totalSemesters || 0}</div><div class="stat-label">Total Semesters</div></div></div>
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${stats?.avgCgpa || 0}</div><div class="stat-label">Avg CGPA</div></div></div>
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${stats?.maxCgpa || 0}</div><div class="stat-label">Highest CGPA</div></div></div>
        </div>
        
        <ul class="nav nav-tabs mb-4" id="deptTabs">
            <li class="nav-item"><button class="nav-link active" data-dept="all">All Departments</button></li>
            ${uniqueDepts.map(dept => `<li class="nav-item"><button class="nav-link" data-dept="${dept}">${dept}</button></li>`).join('')}
        </ul>
        
        <div class="row mb-4">
            <div class="col-md-6"><div class="card"><div class="card-header bg-primary text-white"><h5 class="mb-0">📊 Department-wise CGPA</h5></div><div class="card-body"><canvas id="deptChart" height="200"></canvas></div></div></div>
            <div class="col-md-6"><div class="card"><div class="card-header bg-primary text-white"><h5 class="mb-0">📈 Semester Performance</h5></div><div class="card-body"><canvas id="semPerfChart" height="200"></canvas></div></div></div>
        </div>
        
        ${stats?.topStudent ? `<div class="alert alert-success"><strong>🏆 Top Performer:</strong> ${stats.topStudent.name} (${stats.topStudent.usn}) - CGPA: ${stats.topStudent.cgpa}</div>` : ''}
        
        <div class="card">
            <div class="card-header bg-primary text-white"><h5 class="mb-0"><i class="fas fa-users"></i> Student Records</h5></div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover"><thead><tr><th>USN</th><th>Name</th><th>Department</th><th>CGPA</th><th>Semesters</th><th>Actions</th></tr></thead><tbody id="studentsTableBody"></tbody></table>
                </div>
            </div>
        </div>
    `;
    
    if (deptComparison && deptComparison.length) {
        new Chart(document.getElementById('deptChart').getContext('2d'), { type: 'bar', data: { labels: deptComparison.map(d => d.department), datasets: [{ label: 'Avg CGPA', data: deptComparison.map(d => parseFloat(d.avg_cgpa)), backgroundColor: '#3b71ca', borderRadius: 8 }] } });
    }
    if (semesterPerf && semesterPerf.length) {
        new Chart(document.getElementById('semPerfChart').getContext('2d'), { type: 'line', data: { labels: semesterPerf.map(s => `Sem ${s.semester_number}`), datasets: [{ label: 'Avg SGPA', data: semesterPerf.map(s => parseFloat(s.avg_sgpa)), borderColor: '#14a44d', fill: true, tension: 0.4 }] } });
    }
    
    const tbody = document.getElementById('studentsTableBody');
    if (students && students.length) {
        tbody.innerHTML = students.map(s => `
            <tr data-dept="${s.department}"><td><strong>${s.usn}</strong></td><td>${s.name}</td><td>${s.department}</td>
            <td><span class="badge bg-primary">${s.cgpa ? parseFloat(s.cgpa).toFixed(2) : 'N/A'}</span></td>
            <td>${s.semester_count || 0}</td>
            <td><button class="btn btn-sm btn-info me-1" onclick="viewStudentDetail('${s.usn}')"><i class="fas fa-eye"></i> View</button>
            <button class="btn btn-sm btn-danger" onclick="deleteStudent('${s.usn}')"><i class="fas fa-trash"></i> Delete</button></td></tr>
        `).join('');
    }
    
    document.querySelectorAll('#deptTabs .nav-link').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('#deptTabs .nav-link').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const dept = this.dataset.dept;
            const rows = document.querySelectorAll('#studentsTableBody tr');
            rows.forEach(row => { row.style.display = (dept === 'all' || row.dataset.dept === dept) ? '' : 'none'; });
        });
    });
}

// ============ STUDENT DETAIL PAGE ============
function backToInstitutionDashboard() {
    if (studentDetailPage) studentDetailPage.style.display = 'none';
    institutionDashboard.style.display = 'block';
    loadInstitutionData();
}

async function viewStudentDetail(usn) {
    currentStudentUsn = usn;
    const detailContainer = document.getElementById('studentDetailContent');
    detailContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Loading...</p></div>';
    if (studentDetailPage) studentDetailPage.style.display = 'block';
    institutionDashboard.style.display = 'none';
    
    try {
        const data = await makeApiRequest(`/institution/student/${usn}`);
        if (data.success) displayStudentDetail(data.student, data.semesters);
    } catch (error) {
        detailContainer.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

function displayStudentDetail(student, semesters) {
    const container = document.getElementById('studentDetailContent');
    const cgpa = student.cgpa ? parseFloat(student.cgpa).toFixed(2) : '0.00';
    container.innerHTML = `
        <div class="dashboard-header d-flex justify-content-between"><h2><i class="fas fa-user-graduate"></i> Student: ${student.usn}</h2>
        <div><button class="btn btn-outline-light me-2" onclick="showEditStudentModal()"><i class="fas fa-edit"></i> Edit</button>
        <button class="btn btn-outline-light me-2" onclick="showAddSemesterModal()"><i class="fas fa-plus"></i> Add Semester</button>
        <button class="btn btn-outline-secondary" onclick="backToInstitutionDashboard()">Back</button></div></div>
        <div class="row mb-4">${['usn','name','department','cgpa'].map((f,i)=>`<div class="col-md-3"><div class="stat-card"><div class="stat-value">${f==='cgpa'?cgpa:student[f]}</div><div class="stat-label">${f.toUpperCase()}</div></div></div>`).join('')}</div>
        <div id="semesterList"></div>`;
    
    const semesterList = document.getElementById('semesterList');
    if (semesters?.length) {
        semesterList.innerHTML = semesters.map(sem => `
            <div class="card mb-3"><div class="card-header d-flex justify-content-between"><strong>Semester ${sem.semester_number} - SGPA: ${parseFloat(sem.sgpa).toFixed(2)}</strong>
            <div><button class="btn btn-sm btn-warning me-1" onclick="editSemester(${sem.id},${sem.semester_number})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteSemester(${sem.id})">Delete</button></div></div>
            <div class="card-body"><table class="table table-sm"><thead><tr><th>Subject</th><th>Marks</th><th>Credits</th><th>Grade</th></tr></thead><tbody>${sem.subjects.map(s => `<tr><td>${s.subject_name}</td><td>${s.marks}</td><td>${s.credits}</td><td>${s.grade}</td></tr>`).join('')}</tbody></table></div></div>
        `).join('');
    } else semesterList.innerHTML = '<div class="alert alert-info">No semesters added.</div>';
}

// ============ ADD RECORD MODAL ============
// ============ ADD EXTERNAL RECORD FORM (WITH AUTO-FILL SUBJECTS) ============
async function showAddRecordForm() {
    // First, get departments for dropdown
    let departments = [];
    try {
        const deptData = await makeApiRequest('/institution/departments');
        departments = deptData.data;
    } catch (error) {
        console.error('Load departments error:', error);
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal show d-block';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;overflow:auto';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg" style="margin:50px auto;max-width:700px">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title"><i class="fas fa-plus-circle"></i> Add External Record (SGPA/CGPA)</h5>
                    <button type="button" class="btn-close btn-close-white" onclick="this.closest('.modal').remove()"></button>
                </div>
                <div class="modal-body">
                    <form id="addRecordForm">
                        <div class="row mb-3">
                            <div class="col-md-6"><label class="form-label">USN *</label><input type="text" id="usn" class="form-control" required placeholder="e.g., 1SP23CS001"></div>
                            <div class="col-md-6"><label class="form-label">Student Name *</label><input type="text" id="studentName" class="form-control" required></div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Department *</label>
                                <select id="department" class="form-control" required>
                                    <option value="">Select Department</option>
                                    ${departments.map(d => `<option value="${d.department_code}">${d.department_name} (${d.department_code})</option>`).join('')}
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Semester *</label>
                                <select id="semester" class="form-control" required>
                                    <option value="">Select Department First</option>
                                </select>
                            </div>
                        </div>
                        <div id="subjectEntries" class="mt-3"></div>
                        <div class="mt-4">
                            <button type="submit" class="btn btn-success">Submit Record</button>
                            <button type="button" class="btn btn-secondary ms-2" onclick="this.closest('.modal').remove()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Load semesters when department changes
    document.getElementById('department').addEventListener('change', async function() {
        const departmentCode = this.value;
        const semesterSelect = document.getElementById('semester');
        
        if (!departmentCode) {
            semesterSelect.innerHTML = '<option value="">Select Department First</option>';
            return;
        }
        
        semesterSelect.innerHTML = '<option value="">Loading semesters...</option>';
        
        try {
            const semestersData = await makeApiRequest(`/institution/available-semesters?department_code=${departmentCode}&type=external`);
            const availableSemesters = semestersData.data;
            
            if (availableSemesters.length === 0) {
                semesterSelect.innerHTML = '<option value="">No subjects configured. Add subjects first.</option>';
                return;
            }
            
            semesterSelect.innerHTML = '<option value="">Select Semester</option>' + 
                availableSemesters.map(s => `<option value="${s}">${s}${s==1?'st':s==2?'nd':s==3?'rd':'th'} Semester</option>`).join('');
        } catch (error) {
            semesterSelect.innerHTML = '<option value="">Error loading semesters</option>';
        }
    });
    
    // Load subjects when semester changes
    document.getElementById('semester').addEventListener('change', async function() {
        const departmentCode = document.getElementById('department').value;
        const semester = this.value;
        const container = document.getElementById('subjectEntries');
        
        if (!departmentCode || !semester) {
            container.innerHTML = '';
            return;
        }
        
        container.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary"></div><p>Loading subjects...</p></div>';
        
        try {
            const subjectsData = await makeApiRequest(`/institution/subjects-for-form?department_code=${departmentCode}&semester_number=${semester}&type=external`);
            const subjects = subjectsData.data;
            
            if (subjects.length === 0) {
                container.innerHTML = '<div class="alert alert-warning">No subjects configured for this semester. Please add subjects in Department management first.</div>';
                return;
            }
            
            container.innerHTML = '<h6 class="mb-3">Subjects (Credits will be auto-filled)</h6>';
            subjects.forEach((subject, index) => {
                container.innerHTML += `
                    <div class="subject-entry mb-3 p-3 border rounded">
                        <div class="row g-2">
                            <div class="col-md-5">
                                <label class="form-label small">Subject Name</label>
                                <input type="text" class="form-control subject-name" value="${subject.name}" readonly style="background:#f5f5f5;">
                                <small class="text-muted">Code: ${subject.code}</small>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label small">Marks (0-${subject.maxMarks})</label>
                                <input type="number" class="form-control subject-marks" placeholder="Marks" min="0" max="${subject.maxMarks}" required>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label small">Credits</label>
                                <input type="number" class="form-control subject-credits" value="${subject.credits}" readonly style="background:#f5f5f5;" step="0.5">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small">Grade</label>
                                <select class="form-select subject-grade" required>
                                    <option value="">Auto-calculate</option>
                                    <option value="10">S (10)</option><option value="9">A (9)</option><option value="8">B (8)</option>
                                    <option value="7">C (7)</option><option value="6">D (6)</option><option value="5">E (5)</option><option value="0">F (0)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            // Add auto-grade calculation
            document.querySelectorAll('.subject-marks').forEach(marksInput => {
                marksInput.addEventListener('input', function() {
                    const marks = parseInt(this.value);
                    const gradeSelect = this.closest('.subject-entry').querySelector('.subject-grade');
                    if (gradeSelect && gradeSelect.value === '') {
                        if (marks >= 90) gradeSelect.value = '10';
                        else if (marks >= 80) gradeSelect.value = '9';
                        else if (marks >= 70) gradeSelect.value = '8';
                        else if (marks >= 60) gradeSelect.value = '7';
                        else if (marks >= 50) gradeSelect.value = '6';
                        else if (marks >= 45) gradeSelect.value = '5';
                        else if (marks >= 0) gradeSelect.value = '0';
                    }
                });
            });
            
        } catch (error) {
            container.innerHTML = `<div class="alert alert-danger">Failed to load subjects: ${error.message}</div>`;
        }
    });
    
    // Form submission
    document.getElementById('addRecordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const usn = document.getElementById('usn').value.toUpperCase();
        const name = document.getElementById('studentName').value;
        const department = document.getElementById('department').value;
        const semester = parseInt(document.getElementById('semester').value);
        
        if (!usn || !name || !department || !semester) {
            showNotification('Please fill all fields', 'error');
            return;
        }
        
        const subjects = [];
        let hasError = false;
        
        document.querySelectorAll('.subject-entry').forEach(entry => {
            const subjectName = entry.querySelector('.subject-name')?.value;
            const marks = entry.querySelector('.subject-marks')?.value;
            const credits = entry.querySelector('.subject-credits')?.value;
            let gradePoint = entry.querySelector('.subject-grade')?.value;
            
            // Auto-calculate grade if not manually selected
            if (!gradePoint && marks) {
                const m = parseInt(marks);
                if (m >= 90) gradePoint = 10;
                else if (m >= 80) gradePoint = 9;
                else if (m >= 70) gradePoint = 8;
                else if (m >= 60) gradePoint = 7;
                else if (m >= 50) gradePoint = 6;
                else if (m >= 45) gradePoint = 5;
                else gradePoint = 0;
            }
            
            if (!subjectName) return;
            
            if (!marks) {
                showNotification(`Marks required for ${subjectName}`, 'error');
                hasError = true;
                return;
            }
            
            subjects.push({
                name: subjectName,
                marks: parseInt(marks),
                credits: parseFloat(credits),
                gradePoint: parseInt(gradePoint) || 0,
                grade: gradePoint === 10 ? 'S' : gradePoint === 9 ? 'A' : gradePoint === 8 ? 'B' : gradePoint === 7 ? 'C' : gradePoint === 6 ? 'D' : gradePoint === 5 ? 'E' : 'F'
            });
        });
        
        if (hasError || subjects.length === 0) return;
        
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Submitting...';
        
        try {
    const response = await fetch(`${API_URL}/institution/add-internal-record`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ usn, name, department, semester, subjects: subjectsList })
    });
    
    // Get the response text first to see what's coming back
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    let data;
    try {
        data = JSON.parse(responseText);
    } catch(e) {
        console.error('Failed to parse JSON:', responseText);
        throw new Error('Server returned invalid response');
    }
    
    if (response.ok && data.success) {
        showNotification('Internal marks added successfully!', 'success');
        modal.remove();
        showInternalsView();
        if (currentStudentUsn) {
            viewStudentInternalDetail(currentStudentUsn);
        }
    } else {
        showNotification(data.message || 'Failed to add internal record', 'error');
    }
} catch (error) {
    console.error('Submit error:', error);
    showNotification('Failed to add internal record: ' + error.message, 'error');
} finally {
            btn.disabled = false;
            btn.innerHTML = 'Submit Record';
        }
    });
}

// ============ ADD SEMESTER MODAL ============
function showAddSemesterModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show d-block';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;overflow:auto';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg" style="margin:50px auto;max-width:700px">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white"><h5 class="modal-title">Add Semester for ${currentStudentUsn}</h5><button type="button" class="btn-close btn-close-white" onclick="this.closest('.modal').remove()"></button></div>
                <div class="modal-body">
                    <form id="addSemesterForm">
                        <div class="mb-3"><label class="form-label">Semester Number *</label><select id="semesterNumber" class="form-control" required><option value="">Select</option>${[1,2,3,4,5,6,7,8].map(n => `<option value="${n}">${n}${n==1?'st':n==2?'nd':n==3?'rd':'th'} Semester</option>`).join('')}</select></div>
                        <div class="mb-3"><label class="form-label">Number of Subjects *</label><select id="subjectCount" class="form-control" required><option value="">Select</option>${[...Array(10)].map((_,i) => `<option value="${i+1}">${i+1}</option>`).join('')}</select></div>
                        <div id="subjectEntries"></div>
                        <div class="mt-4"><button type="submit" class="btn btn-success">Add Semester</button><button type="button" class="btn btn-secondary ms-2" onclick="this.closest('.modal').remove()">Cancel</button></div>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('subjectCount').addEventListener('change', function() {
        const container = document.getElementById('subjectEntries');
        container.innerHTML = '';
        for (let i = 1; i <= parseInt(this.value); i++) {
            container.innerHTML += `
                <div class="subject-entry mb-2 p-2 border rounded"><div class="row g-2"><div class="col-md-5"><input type="text" class="form-control sub-name" placeholder="Subject Name" required></div>
                <div class="col-md-2"><input type="number" class="form-control sub-marks" placeholder="Marks (0-100)" min="0" max="100" required></div>
                <div class="col-md-2"><input type="number" class="form-control sub-credits" placeholder="Credits (1-5)" min="1" max="5" step="0.5" required></div>
                <div class="col-md-2"><select class="form-select sub-grade" required><option value="">Grade</option><option value="10">S</option><option value="9">A</option><option value="8">B</option><option value="7">C</option><option value="6">D</option><option value="5">E</option><option value="0">F</option></select></div>
                <div class="col-md-1"><button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.subject-entry').remove()">×</button></div></div></div>
            `;
        }
    });
    
    document.getElementById('addSemesterForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const semester = parseInt(document.getElementById('semesterNumber').value);
        const subjects = [];
        document.querySelectorAll('.subject-entry').forEach(entry => {
            subjects.push({
                name: entry.querySelector('.sub-name')?.value,
                marks: parseInt(entry.querySelector('.sub-marks')?.value),
                credits: parseFloat(entry.querySelector('.sub-credits')?.value),
                gradePoint: parseInt(entry.querySelector('.sub-grade')?.value),
                grade: entry.querySelector('.sub-grade')?.options[entry.querySelector('.sub-grade')?.selectedIndex]?.text
            });
        });
        
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = 'Adding...';
        
        try {
            await makeApiRequest('/institution/add-record', { method: 'POST', body: JSON.stringify({ usn: currentStudentUsn, name: '', department: '', semester, subjects }) });
            showNotification('Semester added successfully', 'success');
            modal.remove();
            viewStudentDetail(currentStudentUsn);
        } catch (error) { showNotification('Failed to add semester', 'error'); }
        finally { btn.disabled = false; btn.innerHTML = 'Add Semester'; }
    });
}

// ============ EDIT STUDENT MODAL ============
async function showEditStudentModal() {
    const student = await makeApiRequest(`/institution/student/${currentStudentUsn}`);
    const s = student.student;
    
    const modal = document.createElement('div');
    modal.className = 'modal show d-block';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000';
    modal.innerHTML = `
        <div class="modal-dialog" style="margin:100px auto;max-width:500px">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white"><h5 class="modal-title">Edit Student Details</h5><button type="button" class="btn-close btn-close-white" onclick="this.closest('.modal').remove()"></button></div>
                <div class="modal-body">
                    <form id="editStudentForm">
                        <div class="mb-3"><label class="form-label">USN</label><input type="text" class="form-control" value="${s.usn}" disabled></div>
                        <div class="mb-3"><label class="form-label">Name</label><input type="text" name="name" class="form-control" value="${s.name}" required></div>
                        <div class="mb-3"><label class="form-label">Email</label><input type="email" name="email" class="form-control" value="${s.email || ''}"></div>
                        <div class="mb-3"><label class="form-label">Department</label><select name="department" class="form-control"><option ${s.department === 'CSE' ? 'selected' : ''}>CSE</option><option ${s.department === 'ECE' ? 'selected' : ''}>ECE</option><option ${s.department === 'ISE' ? 'selected' : ''}>ISE</option><option ${s.department === 'AIML' ? 'selected' : ''}>AIML</option><option ${s.department === 'DS' ? 'selected' : ''}>DS</option></select></div>
                        <div class="mb-3"><label class="form-label">Phone</label><input type="text" name="phone" class="form-control" value="${s.phone || ''}"></div>
                        <button type="submit" class="btn btn-success w-100">Save Changes</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('editStudentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = { name: formData.get('name'), email: formData.get('email'), department: formData.get('department'), phone: formData.get('phone') };
        
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = 'Saving...';
        
        try {
            await makeApiRequest(`/institution/student/${currentStudentUsn}`, { method: 'PUT', body: JSON.stringify(data) });
            showNotification('Student updated successfully', 'success');
            modal.remove();
            viewStudentDetail(currentStudentUsn);
        } catch (error) { showNotification('Update failed', 'error'); }
        finally { btn.disabled = false; btn.innerHTML = 'Save Changes'; }
    });
}

// ============ EDIT SEMESTER MODAL ============
async function editSemester(semesterId, semesterNumber) {
    const student = await makeApiRequest(`/institution/student/${currentStudentUsn}`);
    const semester = student.semesters.find(s => s.id === semesterId);
    
    const modal = document.createElement('div');
    modal.className = 'modal show d-block';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;overflow:auto';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg" style="margin:50px auto;max-width:700px">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white"><h5 class="modal-title">Edit Semester ${semesterNumber}</h5><button type="button" class="btn-close btn-close-white" onclick="this.closest('.modal').remove()"></button></div>
                <div class="modal-body"><form id="editSemesterForm"><div id="subjectEntriesEdit"></div><div class="mt-4"><button type="submit" class="btn btn-success">Save Changes</button><button type="button" class="btn btn-secondary ms-2" onclick="this.closest('.modal').remove()">Cancel</button></div></form></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const container = document.getElementById('subjectEntriesEdit');
    container.innerHTML = '';
    semester.subjects.forEach((sub, idx) => {
        container.innerHTML += `
            <div class="subject-entry mb-2 p-2 border rounded"><h6>Subject ${idx + 1}</h6><div class="row g-2"><div class="col-md-5"><input type="text" class="form-control sub-name" value="${sub.subject_name}" required></div>
            <div class="col-md-2"><input type="number" class="form-control sub-marks" value="${sub.marks}" min="0" max="100" required></div>
            <div class="col-md-2"><input type="number" class="form-control sub-credits" value="${sub.credits}" min="1" max="5" step="0.5" required></div>
            <div class="col-md-2"><select class="form-select sub-grade" required><option value="">Grade</option><option value="10" ${sub.grade_point == 10 ? 'selected' : ''}>S</option><option value="9" ${sub.grade_point == 9 ? 'selected' : ''}>A</option><option value="8" ${sub.grade_point == 8 ? 'selected' : ''}>B</option><option value="7" ${sub.grade_point == 7 ? 'selected' : ''}>C</option><option value="6" ${sub.grade_point == 6 ? 'selected' : ''}>D</option><option value="5" ${sub.grade_point == 5 ? 'selected' : ''}>E</option><option value="0" ${sub.grade_point == 0 ? 'selected' : ''}>F</option></select></div>
            <div class="col-md-1"><button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.subject-entry').remove()">×</button></div></div></div>
        `;
    });
    
    document.getElementById('editSemesterForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const subjects = [];
        document.querySelectorAll('#subjectEntriesEdit .subject-entry').forEach(entry => {
            subjects.push({
                name: entry.querySelector('.sub-name')?.value,
                marks: parseInt(entry.querySelector('.sub-marks')?.value),
                credits: parseFloat(entry.querySelector('.sub-credits')?.value),
                gradePoint: parseInt(entry.querySelector('.sub-grade')?.value),
                grade: entry.querySelector('.sub-grade')?.options[entry.querySelector('.sub-grade')?.selectedIndex]?.text
            });
        });
        
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = 'Saving...';
        
        try {
            await makeApiRequest(`/institution/semester/${semesterId}`, { method: 'PUT', body: JSON.stringify({ semester_number: semesterNumber, subjects }) });
            showNotification('Semester updated successfully', 'success');
            modal.remove();
            viewStudentDetail(currentStudentUsn);
        } catch (error) { showNotification('Update failed', 'error'); }
        finally { btn.disabled = false; btn.innerHTML = 'Save Changes'; }
    });
}

// ============ DELETE FUNCTIONS ============
async function deleteStudent(usn) {
    if (confirm(`Delete ${usn}? All records will be removed.`)) {
        try { await makeApiRequest(`/institution/student/${usn}`, { method: 'DELETE' }); showNotification('Student deleted', 'success'); loadInstitutionData(); } 
        catch { showNotification('Delete failed', 'error'); }
    }
}

async function deleteSemester(id) {
    if (confirm('Delete this semester?')) {
        try { await makeApiRequest(`/institution/semester/${id}`, { method: 'DELETE' }); showNotification('Semester deleted', 'success'); viewStudentDetail(currentStudentUsn); } 
        catch { showNotification('Delete failed', 'error'); }
    }
}

async function checkDuplicateUsn(usn) {
    try { const result = await makeApiRequest(`/institution/check-usn/${usn}`); return result.exists; } catch { return false; }
}

// ============ EXAM TYPE VIEWS ============

let currentViewType = 'externals'; // 'externals' or 'internals'

function showExternalsView() {
    currentViewType = 'externals';
    hideAll();
    const externalDash = document.getElementById('externalDashboard');
    if (externalDash) {
        externalDash.style.display = 'block';
        loadExternalsData();
    } else {
        console.error('externalDashboard element not found');
    }
}

function showInternalsView() {
    currentViewType = 'internals';
    hideAll();
    const internalDash = document.getElementById('internalDashboard');
    if (internalDash) {
        internalDash.style.display = 'block';
        loadInternalsData();
    } else {
        console.error('internalDashboard element not found');
    }
}

function showDepartmentsView() {
    hideAll();
    const deptView = document.getElementById('departmentsView');
    if (deptView) {
        deptView.style.display = 'block';
        loadDepartmentsData();
    } else {
        console.error('departmentsView element not found');
    }
}
// Update navbar for institution
function updateInstitutionNavbar() {
    const examTypeNav = document.getElementById('examTypeNav');
    const deptNav = document.getElementById('deptNav');
    const dashboardNav = document.getElementById('dashboardNav');
    
    if (currentUser && currentUser.role === 'institution') {
        if (examTypeNav) examTypeNav.style.display = 'block';
        if (deptNav) deptNav.style.display = 'block';
        if (dashboardNav) dashboardNav.style.display = 'block';
    }
}

// Load Externals Data (SGPA/CGPA)
async function loadExternalsData() {
    const container = document.getElementById('externalDashboard');
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Loading externals data...</p></div>';
    
    try {
        const students = await makeApiRequest('/institution/students');
        const stats = await makeApiRequest('/institution/stats');
        const semesterPerf = await makeApiRequest('/institution/semester-performance');
        const deptComparison = await makeApiRequest('/institution/department-comparison');
        
        displayExternalsData(students.students, stats.data, semesterPerf.data, deptComparison.data);
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Failed to load data: ${error.message}</div>`;
    }
}

function displayExternalsData(students, stats, semesterPerf, deptComparison) {
    const container = document.getElementById('externalDashboard');
    const avgCgpa = stats?.avgCgpa || 0;
    const maxCgpa = stats?.maxCgpa || 0;
    
    // Calculate grade distribution for the card
    let distinctionCount = 0, firstClassCount = 0, secondClassCount = 0, passCount = 0;
    students.forEach(s => {
        const cgpa = parseFloat(s.cgpa);
        if (cgpa >= 8.5) distinctionCount++;
        else if (cgpa >= 7) firstClassCount++;
        else if (cgpa >= 6) secondClassCount++;
        else if (cgpa > 0) passCount++;
    });
    
    container.innerHTML = `
        <div class="dashboard-header d-flex justify-content-between flex-wrap">
            <h2><i class="fas fa-book-open"></i> External Exams (SGPA/CGPA)</h2>
            <div>
                <button class="btn btn-outline-light me-2" onclick="showAddRecordForm()"><i class="fas fa-plus"></i> Add External Record</button>
                <button class="btn btn-outline-light" onclick="showInstitutionDashboard()"><i class="fas fa-chart-line"></i> Analytics</button>
            </div>
        </div>
        
        <!-- Stats Cards -->
        <div class="row mb-4">
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${stats?.totalStudents || 0}</div><div class="stat-label">Total Students</div></div></div>
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${stats?.totalSemesters || 0}</div><div class="stat-label">Total Semesters</div></div></div>
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${avgCgpa}</div><div class="stat-label">Avg CGPA</div></div></div>
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${maxCgpa}</div><div class="stat-label">Highest CGPA</div></div></div>
        </div>
        
        <h5 class="mb-3">All Students (External Records)</h5>
        
        <!-- Charts Row -->
        <div class="row mb-4">
            <div class="col-md-6"><div class="card"><div class="card-header bg-primary text-white"><h5 class="mb-0">📊 Department-wise CGPA</h5></div><div class="card-body"><canvas id="externalDeptChart" height="200"></canvas></div></div></div>
            <div class="col-md-6"><div class="card"><div class="card-header bg-primary text-white"><h5 class="mb-0">📈 Semester Performance</h5></div><div class="card-body"><canvas id="externalSemPerfChart" height="200"></canvas></div></div></div>
        </div>
        
        ${stats?.topStudent ? `<div class="alert alert-success"><strong>🏆 Top Performer:</strong> ${stats.topStudent.name} (${stats.topStudent.usn}) - CGPA: ${stats.topStudent.cgpa}</div>` : ''}
        
        <!-- Students Table -->
        <div class="card mb-4">
            <div class="card-header bg-primary text-white"><h5 class="mb-0"><i class="fas fa-users"></i> External Records</h5></div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover"><thead><tr><th>USN</th><th>Name</th><th>Department</th><th>CGPA</th><th>Semesters</th><th>Actions</th></tr></thead><tbody id="externalStudentsBody"></tbody><tr>
                </div>
            </div>
        </div>
        
    `;
    
    // Load charts
    if (deptComparison && deptComparison.length) {
        const deptCtx = document.getElementById('externalDeptChart')?.getContext('2d');
        if (deptCtx) {
            new Chart(deptCtx, { type: 'bar', data: { labels: deptComparison.map(d => d.department), datasets: [{ label: 'Avg CGPA', data: deptComparison.map(d => parseFloat(d.avg_cgpa)), backgroundColor: '#3b71ca', borderRadius: 8 }] } });
        }
    }
    if (semesterPerf && semesterPerf.length) {
        const perfCtx = document.getElementById('externalSemPerfChart')?.getContext('2d');
        if (perfCtx) {
            new Chart(perfCtx, { type: 'line', data: { labels: semesterPerf.map(s => `Sem ${s.semester_number}`), datasets: [{ label: 'Avg SGPA', data: semesterPerf.map(s => parseFloat(s.avg_sgpa)), borderColor: '#14a44d', fill: true, tension: 0.4 }] } });
        }
    }
    
    // Student table
    const tbody = document.getElementById('externalStudentsBody');
    if (students && students.length) {
        tbody.innerHTML = students.map(s => `
            <tr>
                <td><strong>${s.usn}</strong></td>
                <td>${s.name}</td>
                <td>${s.department}</td>
                <td><span class="badge bg-primary">${s.cgpa ? parseFloat(s.cgpa).toFixed(2) : 'N/A'}</span></td>
                <td>${s.semester_count || 0}</td>
                <td><button class="btn btn-sm btn-info" onclick="viewStudentExternalDetail('${s.usn}')"><i class="fas fa-eye"></i> View</button></td>
            </tr>
        `).join('');
    }
}

// Load Internals Data
async function loadInternalsData() {
    const container = document.getElementById('internalDashboard');
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Loading internals data...</p></div>';
    
    try {
        const students = await makeApiRequest('/institution/internal-students');
        displayInternalsData(students.students);
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Failed to load data: ${error.message}</div>`;
    }
}

function displayInternalsData(students) {
    const container = document.getElementById('internalDashboard');
    const uniqueDepts = [...new Set(students.map(s => s.department))];
    
    container.innerHTML = `
        <div class="dashboard-header d-flex justify-content-between flex-wrap">
            <h2><i class="fas fa-edit"></i> Internal Exams (IA1/IA2 Marks)</h2>
            <button class="btn btn-outline-light" onclick="showAddInternalRecordForm()"><i class="fas fa-plus"></i> Add Internal Record</button>
        </div>
        
        <h5 class="mb-3">All Students (Internal Records)</h5>
        
        <div class="card">
            <div class="card-header bg-primary text-white"><h5 class="mb-0"><i class="fas fa-users"></i> Internal Records</h5></div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover"><thead><tr><th>USN</th><th>Name</th><th>Department</th><th>Semesters</th><th>Actions</th></tr></thead><tbody id="internalStudentsBody"></tbody></tr>
                </div>
            </div>
        </div>
    `;
    
    const tbody = document.getElementById('internalStudentsBody');
    if (students && students.length) {
        tbody.innerHTML = students.map(s => `
            <tr>
                <td><strong>${s.usn}</strong></td>
                <td>${s.name}</td>
                <td>${s.department}</td>
                <td>${s.semester_count || 0}</td>
                <td><button class="btn btn-sm btn-info" onclick="viewStudentInternalDetail('${s.usn}')"><i class="fas fa-eye"></i> View</button></td>
            </tr>
        `).join('');
    }
}

// ============ ADD INTERNAL RECORD FORM (WITH AUTO-FILL & DUPLICATE CHECK) ============
async function showAddInternalRecordForm(studentUsn = null, studentName = null) {
    // First, get departments for dropdown
    let departments = [];
    try {
        const deptData = await makeApiRequest('/institution/departments');
        departments = deptData.data || [];
    } catch (error) {
        console.error('Load departments error:', error);
    }
    
    // If studentUsn is provided, get student details
    let preFillUsn = studentUsn || '';
    let preFillName = studentName || '';
    let preFillDepartment = '';
    
    if (studentUsn) {
        try {
            const studentData = await makeApiRequest(`/institution/student/${studentUsn}`);
            if (studentData.success) {
                preFillName = studentData.student.name;
                preFillDepartment = studentData.student.department;
            }
        } catch (error) {
            console.error('Load student details error:', error);
        }
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal show d-block';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;overflow:auto';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg" style="margin:50px auto;max-width:800px">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title"><i class="fas fa-plus-circle"></i> Add Internal Record (IA1/IA2)</h5>
                    <button type="button" class="btn-close btn-close-white" onclick="this.closest('.modal').remove()"></button>
                </div>
                <div class="modal-body">
                    <form id="addInternalForm">
                        <div class="row mb-3">
                            <div class="col-md-6"><label class="form-label">USN *</label><input type="text" id="intUsn" class="form-control" value="${preFillUsn}" required placeholder="e.g., 1SP23CS001" readonly="${preFillUsn ? 'readonly' : ''}"></div>
                            <div class="col-md-6"><label class="form-label">Student Name *</label><input type="text" id="intStudentName" class="form-control" value="${preFillName}" required ${preFillName ? 'readonly' : ''}></div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Department *</label>
                                <select id="intDepartment" class="form-control" required>
                                    <option value="">Select Department</option>
                                    ${departments.map(d => `<option value="${d.department_code}" ${preFillDepartment === d.department_code ? 'selected' : ''}>${d.department_name} (${d.department_code})</option>`).join('')}
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Semester *</label>
                                <select id="intSemester" class="form-control" required>
                                    <option value="">Select Semester</option>
                                </select>
                            </div>
                        </div>
                        <div id="internalSubjectEntries" class="mt-3"></div>
                        <div class="mt-4">
                            <button type="submit" class="btn btn-success">Submit Internal Record</button>
                            <button type="button" class="btn btn-secondary ms-2" onclick="this.closest('.modal').remove()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Store existing subjects for duplicate check
    let existingSubjects = [];
    
    // Function to load semesters and subjects
    async function loadSemestersAndSubjects() {
        const departmentCode = document.getElementById('intDepartment').value;
        const semesterSelect = document.getElementById('intSemester');
        const usn = document.getElementById('intUsn').value;
        
        if (!departmentCode) {
            semesterSelect.innerHTML = '<option value="">Select Department First</option>';
            document.getElementById('internalSubjectEntries').innerHTML = '';
            return;
        }
        
        semesterSelect.innerHTML = '<option value="">Loading semesters...</option>';
        
        try {
            const semestersData = await makeApiRequest(`/institution/available-semesters?department_code=${departmentCode}&type=internal`);
            const availableSemesters = semestersData.data || [];
            
            if (availableSemesters.length === 0) {
                semesterSelect.innerHTML = '<option value="">No subjects configured. Add subjects first.</option>';
                document.getElementById('internalSubjectEntries').innerHTML = '';
                return;
            }
            
            semesterSelect.innerHTML = '<option value="">Select Semester</option>' + 
                availableSemesters.map(s => `<option value="${s}">${s}${s==1?'st':s==2?'nd':s==3?'rd':'th'} Semester</option>`).join('');
            
            // If there's only one semester, auto-select it
            if (availableSemesters.length === 1) {
                semesterSelect.value = availableSemesters[0];
                // Trigger change event to load subjects
                await loadSubjectsForSemester();
            }
        } catch (error) {
            semesterSelect.innerHTML = '<option value="">Error loading semesters</option>';
        }
    }
    
    // Function to load subjects for selected semester
    async function loadSubjectsForSemester() {
        const departmentCode = document.getElementById('intDepartment').value;
        const semester = document.getElementById('intSemester').value;
        const container = document.getElementById('internalSubjectEntries');
        const usn = document.getElementById('intUsn').value;
        
        if (!departmentCode || !semester) {
            container.innerHTML = '';
            return;
        }
        
        container.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary"></div><p>Loading subjects...</p></div>';
        
        try {
            const subjectsData = await makeApiRequest(`/institution/subjects-for-form?department_code=${departmentCode}&semester_number=${semester}&type=internal`);
            const subjectsList = subjectsData.data || [];
            
            if (subjectsList.length === 0) {
                container.innerHTML = '<div class="alert alert-warning">No subjects configured for this semester. Please add subjects in Department management first.</div>';
                return;
            }
            
            // Get existing internal marks for this student and semester
            existingSubjects = [];
            if (usn) {
                try {
                    const existingData = await makeApiRequest(`/institution/student-internal/${usn}`);
                    if (existingData.success && existingData.data[semester]) {
                        existingSubjects = existingData.data[semester].map(s => s.subject_name);
                    }
                } catch (error) {
                    console.log('No existing records or error fetching:', error);
                }
            }
            
            container.innerHTML = '<h6 class="mb-3">Subjects (Max marks will be auto-filled)</h6>';
            subjectsList.forEach((subject, index) => {
                const isExisting = existingSubjects.includes(subject.name);
                container.innerHTML += `
                    <div class="internal-subject-entry mb-3 p-3 border rounded ${isExisting ? 'border-warning' : ''}">
                        <div class="row g-2">
                            <div class="col-md-12 mb-2">
                                <label class="form-label small">Subject Name</label>
                                <input type="text" class="form-control sub-name" value="${subject.name}" readonly style="background:#f5f5f5;">
                                <small class="text-muted">Code: ${subject.code}</small>
                                ${isExisting ? '<span class="badge bg-warning ms-2">Already has records</span>' : ''}
                            </div>
                            <div class="col-md-6">
                                <div class="row">
                                    <div class="col-7">
                                        <label class="form-label small">IA1 Marks (0-${subject.ia1MaxMarks})</label>
                                        <input type="number" class="form-control sub-ia1-marks" placeholder="IA1 Marks" min="0" max="${subject.ia1MaxMarks}" ${isExisting ? 'disabled' : ''}>
                                    </div>
                                    <div class="col-5">
                                        <label class="form-label small">Out of</label>
                                        <input type="number" class="form-control sub-ia1-outof" value="${subject.ia1MaxMarks}" readonly style="background:#f5f5f5;">
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="row">
                                    <div class="col-7">
                                        <label class="form-label small">IA2 Marks (0-${subject.ia2MaxMarks})</label>
                                        <input type="number" class="form-control sub-ia2-marks" placeholder="IA2 Marks" min="0" max="${subject.ia2MaxMarks}" ${isExisting ? 'disabled' : ''}>
                                    </div>
                                    <div class="col-5">
                                        <label class="form-label small">Out of</label>
                                        <input type="number" class="form-control sub-ia2-outof" value="${subject.ia2MaxMarks}" readonly style="background:#f5f5f5;">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
        } catch (error) {
            console.error('Load subjects error:', error);
            container.innerHTML = `<div class="alert alert-danger">Failed to load subjects: ${error.message}</div>`;
        }
    }
    
    // Load semesters when department changes
    document.getElementById('intDepartment').addEventListener('change', loadSemestersAndSubjects);
    
    // Load subjects when semester changes
    document.getElementById('intSemester').addEventListener('change', loadSubjectsForSemester);
    
    // If department is already selected (when editing student), trigger load immediately
    if (preFillDepartment) {
        // Set the department value and trigger change
        const deptSelect = document.getElementById('intDepartment');
        deptSelect.value = preFillDepartment;
        // Manually trigger the change event
        await loadSemestersAndSubjects();
    }
    
    // Form submission
    const addInternalForm = document.getElementById('addInternalForm');
    if (addInternalForm) {
        addInternalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const usn = document.getElementById('intUsn').value.toUpperCase();
            const name = document.getElementById('intStudentName').value;
            const department = document.getElementById('intDepartment').value;
            const semester = parseInt(document.getElementById('intSemester').value);
            
            if (!usn || !name || !department || !semester) {
                showNotification('Please fill all fields', 'error');
                return;
            }
            
            const subjectsList = [];
            let hasError = false;
            
            const subjectEntries = document.querySelectorAll('.internal-subject-entry');
            
            if (subjectEntries.length === 0) {
                showNotification('No subjects found', 'error');
                return;
            }
            
            subjectEntries.forEach((entry, idx) => {
                const subjectName = entry.querySelector('.sub-name')?.value;
                const isDisabled = entry.querySelector('.sub-ia1-marks')?.disabled;
                
                // Skip if already has records (disabled inputs)
                if (isDisabled) return;
                
                if (!subjectName) return;
                
                const ia1Marks = entry.querySelector('.sub-ia1-marks')?.value;
                const ia1OutOf = entry.querySelector('.sub-ia1-outof')?.value;
                const ia2Marks = entry.querySelector('.sub-ia2-marks')?.value;
                const ia2OutOf = entry.querySelector('.sub-ia2-outof')?.value;
                
                // Only add subject if at least one mark is provided
                if ((ia1Marks && ia1Marks !== '') || (ia2Marks && ia2Marks !== '')) {
                    subjectsList.push({
                        name: subjectName,
                        ia1Marks: (ia1Marks && ia1Marks !== '') ? parseFloat(ia1Marks) : null,
                        ia1OutOf: (ia1OutOf && ia1OutOf !== '') ? parseFloat(ia1OutOf) : 100,
                        ia2Marks: (ia2Marks && ia2Marks !== '') ? parseFloat(ia2Marks) : null,
                        ia2OutOf: (ia2OutOf && ia2OutOf !== '') ? parseFloat(ia2OutOf) : 100
                    });
                }
            });
            
            if (subjectsList.length === 0) {
                showNotification('Please enter marks for at least one subject', 'error');
                return;
            }
            
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Submitting...';
            
            try {
                const data = await makeApiRequest('/institution/add-internal-record', {
                    method: 'POST',
                    body: JSON.stringify({ usn, name, department, semester, subjects: subjectsList })
                });
                
                if (data.success) {
                    showNotification('Internal marks added successfully!', 'success');
                    modal.remove();
                    showInternalsView();
                    
                    // Refresh the student detail if open
                    if (currentStudentUsn) {
                        viewStudentInternalDetail(currentStudentUsn);
                    }
                } else {
                    showNotification(data.message || 'Failed to add internal record', 'error');
                }
            } catch (error) {
                console.error('Submit error:', error);
                showNotification('Failed to add internal record: ' + error.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Submit Internal Record';
            }
        });
    }
}

// View Student External Detail
async function viewStudentExternalDetail(usn) {
    currentStudentUsn = usn;
    const detailContainer = document.getElementById('studentDetailContent');
    detailContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Loading...</p></div>';
    if (studentDetailPage) studentDetailPage.style.display = 'block';
    document.getElementById('externalDashboard').style.display = 'none';
    
    try {
        const data = await makeApiRequest(`/institution/student/${usn}`);
        if (data.success) {
            displayStudentExternalDetail(data.student, data.semesters);
        }
    } catch (error) {
        detailContainer.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

function displayStudentExternalDetail(student, semesters) {
    const container = document.getElementById('studentDetailContent');
    const cgpa = student.cgpa ? parseFloat(student.cgpa).toFixed(2) : '0.00';
    container.innerHTML = `
        <div class="dashboard-header d-flex justify-content-between"><h2><i class="fas fa-book-open"></i> External Records: ${student.usn}</h2>
        <div><button class="btn btn-outline-light me-2" onclick="showEditStudentModal()">Edit Student</button>
        <button class="btn btn-outline-light me-2" onclick="showAddSemesterModal()">Add Semester</button>
        <button class="btn btn-outline-secondary" onclick="backToExternalsView()">Back</button></div></div>
        <div class="row mb-4"><div class="col-md-3"><div class="stat-card"><div class="stat-value">${student.usn}</div><div class="stat-label">USN</div></div></div>
        <div class="col-md-3"><div class="stat-card"><div class="stat-value">${student.name}</div><div class="stat-label">Name</div></div></div>
        <div class="col-md-3"><div class="stat-card"><div class="stat-value">${student.department}</div><div class="stat-label">Department</div></div></div>
        <div class="col-md-3"><div class="stat-card"><div class="stat-value">${cgpa}</div><div class="stat-label">CGPA</div></div></div></div>
        <div id="externalSemesterList"></div>
        <div class="cgpa-card text-center mt-3"><h4>Overall CGPA</h4><div class="cgpa-score">${cgpa}</div></div>
    `;
    
    const semesterList = document.getElementById('externalSemesterList');
    if (semesters?.length) {
        semesterList.innerHTML = semesters.map(sem => `
            <div class="card mb-3"><div class="card-header d-flex justify-content-between"><strong>Semester ${sem.semester_number} - SGPA: ${parseFloat(sem.sgpa).toFixed(2)}</strong>
            <div><button class="btn btn-sm btn-warning me-1" onclick="editSemester(${sem.id},${sem.semester_number})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteSemester(${sem.id})">Delete</button></div></div>
            <div class="card-body"><table class="table table-sm"><thead><tr><th>Subject</th><th>Marks</th><th>Credits</th><th>Grade</th></tr></thead><tbody>${sem.subjects.map(s => `<td>${s.subject_name}</td><td>${s.marks}</td><td>${s.credits}</td><td>${s.grade}</td></tr>`).join('')}</tbody></table></div></div>
        `).join('');
    } else semesterList.innerHTML = '<div class="alert alert-info">No external records added.</div>';
}

// View Student Internal Detail
async function viewStudentInternalDetail(usn) {
    currentStudentUsn = usn;
    const detailContainer = document.getElementById('studentDetailContent');
    detailContainer.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Loading...</p></div>';
    if (studentDetailPage) studentDetailPage.style.display = 'block';
    document.getElementById('internalDashboard').style.display = 'none';
    
    try {
        const [studentData, internalData] = await Promise.all([
            makeApiRequest(`/institution/student/${usn}`),
            makeApiRequest(`/institution/student-internal/${usn}`)
        ]);
        if (studentData.success) {
            displayStudentInternalDetail(studentData.student, internalData.data);
        }
    } catch (error) {
        detailContainer.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

function displayStudentInternalDetail(student, internalMarks) {
    const container = document.getElementById('studentDetailContent');
    container.innerHTML = `
        <div class="dashboard-header d-flex justify-content-between">
            <h2><i class="fas fa-edit"></i> Internal Records: ${student.usn}</h2>
            <div>
                <button class="btn btn-outline-light me-2" onclick="showAddInternalRecordForm('${student.usn}', '${student.name}')"><i class="fas fa-plus"></i> Add Internal Marks</button>
                <button class="btn btn-outline-secondary" onclick="backToInternalsView()">Back</button>
            </div>
        </div>
        <div class="row mb-4">
            <div class="col-md-4"><div class="stat-card"><div class="stat-value">${student.usn}</div><div class="stat-label">USN</div></div></div>
            <div class="col-md-4"><div class="stat-card"><div class="stat-value">${student.name}</div><div class="stat-label">Name</div></div></div>
            <div class="col-md-4"><div class="stat-card"><div class="stat-value">${student.department}</div><div class="stat-label">Department</div></div></div>
        </div>
        <div id="internalSemesterList"></div>
    `;
    
    const semesterList = document.getElementById('internalSemesterList');
    if (Object.keys(internalMarks).length > 0) {
        semesterList.innerHTML = Object.keys(internalMarks).sort((a,b) => a-b).map(sem => `
            <div class="card mb-3">
                <div class="card-header bg-primary text-white d-flex justify-content-between">
                    <strong>Semester ${sem}</strong>
                    <button class="btn btn-sm btn-danger" onclick="deleteInternalSemester('${student.usn}', ${sem})">Delete Semester</button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th>Subject</th>
                                    <th>IA1 Marks</th>
                                    <th>IA2 Marks</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${internalMarks[sem].map(m => `
                                    <tr>
                                        <td>${m.subject_name}</td>
                                        <td>${m.ia1_marks !== null ? `${m.ia1_marks}/${m.ia1_out_of || 100}` : 'Not Conducted'}</td>
                                        <td>${m.ia2_marks !== null ? `${m.ia2_marks}/${m.ia2_out_of || 100}` : 'Not Conducted'}</td>
                                        <td>
                                            <button class="btn btn-sm btn-warning" onclick="editInternalMarks('${student.usn}', ${sem}, '${m.subject_name}', ${m.ia1_marks || 0}, ${m.ia1_out_of || 100}, ${m.ia2_marks || 0}, ${m.ia2_out_of || 100})">
                                                <i class="fas fa-edit"></i> Edit
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        semesterList.innerHTML = '<div class="alert alert-info">No internal records added.</div>';
    }
}

// Edit Internal Marks Modal
async function editInternalMarks(usn, semester, subjectName, currentIa1Marks, currentIa1OutOf, currentIa2Marks, currentIa2OutOf) {
    const modal = document.createElement('div');
    modal.className = 'modal show d-block';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;overflow:auto';
    modal.innerHTML = `
        <div class="modal-dialog" style="margin:100px auto;max-width:500px">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title"><i class="fas fa-edit"></i> Edit Internal Marks</h5>
                    <button type="button" class="btn-close btn-close-white" onclick="this.closest('.modal').remove()"></button>
                </div>
                <div class="modal-body">
                    <form id="editInternalForm">
                        <div class="mb-3">
                            <label class="form-label">Student USN</label>
                            <input type="text" class="form-control" value="${usn}" disabled>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Semester</label>
                            <input type="text" class="form-control" value="${semester}" disabled>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Subject Name</label>
                            <input type="text" class="form-control" value="${subjectName}" disabled>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">IA1 Marks</label>
                            <div class="row">
                                <div class="col-8">
                                    <input type="number" id="editIa1Marks" class="form-control" value="${currentIa1Marks || ''}" min="0" max="${currentIa1OutOf}" placeholder="Marks (leave blank if not conducted)">
                                </div>
                                <div class="col-4">
                                    <label class="form-label">Out of</label>
                                    <input type="number" id="editIa1OutOf" class="form-control" value="${currentIa1OutOf || 100}" min="1">
                                </div>
                            </div>
                            <small class="text-muted">Leave blank if IA1 not conducted</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">IA2 Marks</label>
                            <div class="row">
                                <div class="col-8">
                                    <input type="number" id="editIa2Marks" class="form-control" value="${currentIa2Marks || ''}" min="0" max="${currentIa2OutOf}" placeholder="Marks (leave blank if not conducted)">
                                </div>
                                <div class="col-4">
                                    <label class="form-label">Out of</label>
                                    <input type="number" id="editIa2OutOf" class="form-control" value="${currentIa2OutOf || 100}" min="1">
                                </div>
                            </div>
                            <small class="text-muted">Leave blank if IA2 not conducted</small>
                        </div>
                        <button type="submit" class="btn btn-success w-100">Save Changes</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('editInternalForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const ia1Marks = document.getElementById('editIa1Marks').value;
        const ia1OutOf = document.getElementById('editIa1OutOf').value;
        const ia2Marks = document.getElementById('editIa2Marks').value;
        const ia2OutOf = document.getElementById('editIa2OutOf').value;
        
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Saving...';
        
        try {
            const data = await makeApiRequest('/institution/edit-internal-marks', {
                method: 'PUT',
                body: JSON.stringify({
                    usn: usn,
                    semester: semester,
                    subject_name: subjectName,
                    ia1Marks: ia1Marks !== '' ? parseInt(ia1Marks) : null,
                    ia1OutOf: ia1OutOf !== '' ? parseInt(ia1OutOf) : 100,
                    ia2Marks: ia2Marks !== '' ? parseInt(ia2Marks) : null,
                    ia2OutOf: ia2OutOf !== '' ? parseInt(ia2OutOf) : 100
                })
            });
            
            if (data.success) {
                showNotification('Internal marks updated successfully!', 'success');
                modal.remove();
                // Refresh the view
                viewStudentInternalDetail(usn);
            } else {
                showNotification(data.message || 'Failed to update', 'error');
            }
        } catch (error) {
            console.error('Edit error:', error);
            showNotification('Failed to update internal marks', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Save Changes';
        }
    });
}

async function deleteInternalSemester(usn, semester) {
    if (confirm(`Delete all internal marks for Semester ${semester}?`)) {
        try {
            await makeApiRequest(`/institution/internal-semester/${usn}/${semester}`, { method: 'DELETE' });
            showNotification('Internal semester deleted', 'success');
            viewStudentInternalDetail(usn);
        } catch (error) { showNotification('Delete failed', 'error'); }
    }
}

function backToExternalsView() {
    if (studentDetailPage) studentDetailPage.style.display = 'none';
    showExternalsView();
}

function backToInternalsView() {
    if (studentDetailPage) studentDetailPage.style.display = 'none';
    showInternalsView();
}

// Institution Dashboard (Analytics & Overview)
async function showInstitutionDashboard() {
    hideAll();
    const institutionDash = document.getElementById('institutionDashboard');
    if (institutionDash) {
        institutionDash.style.display = 'block';
        await loadInstitutionDashboard();
    }
}

async function loadInstitutionDashboard() {
    institutionDashboard.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Loading dashboard...</p></div>';
    
    try {
        const [students, stats, semesterPerf, deptComparison] = await Promise.all([
            makeApiRequest('/institution/students'),
            makeApiRequest('/institution/stats'),
            makeApiRequest('/institution/semester-performance'),
            makeApiRequest('/institution/department-comparison')
        ]);
        
        displayInstitutionDashboard(students.students, stats.data, semesterPerf.data, deptComparison.data);
    } catch (error) {
        institutionDashboard.innerHTML = `<div class="alert alert-danger">Failed to load data: ${error.message}</div>`;
    }
}

function displayInstitutionDashboard(students, stats, semesterPerf, deptComparison) {
    const uniqueDepts = [...new Set(students.map(s => s.department))];
    
    institutionDashboard.innerHTML = `
        <div class="dashboard-header d-flex justify-content-between flex-wrap">
            <h2><i class="fas fa-chart-pie"></i> Institution Dashboard</h2>
            <div>
                <button class="btn btn-outline-light me-2" onclick="showProfileModal()"><i class="fas fa-user-circle"></i> Profile</button>
                <button class="btn btn-outline-danger" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</button>
            </div>
        </div>
        
        <!-- Stats Cards -->
        <div class="row mb-4">
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${stats?.totalStudents || 0}</div><div class="stat-label">Total Students</div></div></div>
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${stats?.totalSemesters || 0}</div><div class="stat-label">Total Semesters</div></div></div>
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${stats?.avgCgpa || 0}</div><div class="stat-label">Avg CGPA</div></div></div>
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${stats?.maxCgpa || 0}</div><div class="stat-label">Highest CGPA</div></div></div>
        </div>
        
        <!-- Charts Row -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-primary text-white"><h5 class="mb-0">📊 Department-wise CGPA</h5></div>
                    <div class="card-body"><canvas id="dashboardDeptChart" height="200"></canvas></div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-primary text-white"><h5 class="mb-0">📈 Semester Performance</h5></div>
                    <div class="card-body"><canvas id="dashboardSemPerfChart" height="200"></canvas></div>
                </div>
            </div>
        </div>
        
        <!-- Grade Distribution Card -->
        <div class="card mb-4">
            <div class="card-header bg-primary text-white"><h5 class="mb-0"><i class="fas fa-chart-bar"></i> Grade Distribution</h5></div>
            <div class="card-body">
                <div class="row text-center">
                    <div class="col-md-3">
                        <div class="stat-card bg-success text-white">
                            <div class="stat-value">${stats?.gradeDistribution?.distinction || 0}</div>
                            <div class="stat-label">Distinction (≥8.5)</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card bg-primary text-white">
                            <div class="stat-value">${stats?.gradeDistribution?.first_class || 0}</div>
                            <div class="stat-label">First Class (≥7)</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card bg-info text-white">
                            <div class="stat-value">${stats?.gradeDistribution?.second_class || 0}</div>
                            <div class="stat-label">Second Class (≥6)</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card bg-warning text-white">
                            <div class="stat-value">${stats?.gradeDistribution?.pass || 0}</div>
                            <div class="stat-label">Pass (≥5)</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        ${stats?.topStudent ? `<div class="alert alert-success"><strong>🏆 Top Performer:</strong> ${stats.topStudent.name} (${stats.topStudent.usn}) - CGPA: ${stats.topStudent.cgpa}</div>` : ''}
        
        <!-- Department Tabs for Student List -->
        <div class="card">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-users"></i> Student Records</h5>
            </div>
            <div class="card-body">
                <ul class="nav nav-tabs mb-3" id="dashboardDeptTabs">
                    <li class="nav-item"><button class="nav-link active" data-dept="all">All Departments</button></li>
                    ${uniqueDepts.map(dept => `<li class="nav-item"><button class="nav-link" data-dept="${dept}">${dept}</button></li>`).join('')}
                </ul>
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr><th>USN</th><th>Name</th><th>Department</th><th>CGPA</th><th>Semesters</th><th>Actions</th></tr>
                        </thead>
                        <tbody id="dashboardStudentsBody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // Load charts
    if (deptComparison && deptComparison.length) {
        new Chart(document.getElementById('dashboardDeptChart').getContext('2d'), { 
            type: 'bar', 
            data: { 
                labels: deptComparison.map(d => d.department), 
                datasets: [{ label: 'Avg CGPA', data: deptComparison.map(d => parseFloat(d.avg_cgpa)), backgroundColor: '#3b71ca', borderRadius: 8 }] 
            } 
        });
    }
    if (semesterPerf && semesterPerf.length) {
        new Chart(document.getElementById('dashboardSemPerfChart').getContext('2d'), { 
            type: 'line', 
            data: { 
                labels: semesterPerf.map(s => `Sem ${s.semester_number}`), 
                datasets: [{ label: 'Avg SGPA', data: semesterPerf.map(s => parseFloat(s.avg_sgpa)), borderColor: '#14a44d', fill: true, tension: 0.4 }] 
            } 
        });
    }
    
    // Load student table
    const tbody = document.getElementById('dashboardStudentsBody');
    if (students && students.length) {
        tbody.innerHTML = students.map(s => `
            <tr data-dept="${s.department}">
                <td><strong>${s.usn}</strong></td>
                <td>${s.name}</td>
                <td>${s.department}</td>
                <td><span class="badge bg-primary">${s.cgpa ? parseFloat(s.cgpa).toFixed(2) : 'N/A'}</span></td>
                <td>${s.semester_count || 0}</td>
                <td>
                    <button class="btn btn-sm btn-info me-1" onclick="viewStudentExternalDetail('${s.usn}')"><i class="fas fa-eye"></i> View</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteStudent('${s.usn}')"><i class="fas fa-trash"></i> Delete</button>
                </td>
            </tr>
        `).join('');
    }
    
    // Department filter
    document.querySelectorAll('#dashboardDeptTabs .nav-link').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('#dashboardDeptTabs .nav-link').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const dept = this.dataset.dept;
            const rows = document.querySelectorAll('#dashboardStudentsBody tr');
            rows.forEach(row => { row.style.display = (dept === 'all' || row.dataset.dept === dept) ? '' : 'none'; });
        });
    });
}

// Externals View (SGPA/CGPA Records)
async function showExternalsView() {
    hideAll();
    const externalDash = document.getElementById('externalDashboard');
    if (externalDash) {
        externalDash.style.display = 'block';
        await loadExternalsData();
    }
}

async function loadExternalsData() {
    const container = document.getElementById('externalDashboard');
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Loading externals data...</p></div>';
    
    try {
        const students = await makeApiRequest('/institution/students');
        displayExternalsData(students.students);
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Failed to load data: ${error.message}</div>`;
    }
}

function displayExternalsData(students) {
    const container = document.getElementById('externalDashboard');
    
    container.innerHTML = `
        <div class="dashboard-header d-flex justify-content-between flex-wrap">
            <h2><i class="fas fa-book-open"></i> External Records (SGPA/CGPA)</h2>
            <div>
                <button class="btn btn-outline-light me-2" onclick="showAddRecordForm()"><i class="fas fa-plus"></i> Add External Record</button>
                <button class="btn btn-outline-light" onclick="showInstitutionDashboard()"><i class="fas fa-arrow-left"></i> Back to Dashboard</button>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header bg-primary text-white"><h5 class="mb-0"><i class="fas fa-users"></i> Student External Records</h5></div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr><th>USN</th><th>Name</th><th>Department</th><th>CGPA</th><th>Semesters</th><th>Actions</th></tr>
                        </thead>
                        <tbody id="externalsStudentsBody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    const tbody = document.getElementById('externalsStudentsBody');
    if (students && students.length) {
        tbody.innerHTML = students.map(s => `
            <tr>
                <td><strong>${s.usn}</strong></td>
                <td>${s.name}</td>
                <td>${s.department}</td>
                <td><span class="badge bg-primary">${s.cgpa ? parseFloat(s.cgpa).toFixed(2) : 'N/A'}</span></td>
                <td>${s.semester_count || 0}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewStudentExternalDetail('${s.usn}')"><i class="fas fa-eye"></i> View Records</button>
                </td>
            </tr>
        `).join('');
    }
}

// Internals View (IA1/IA2 Records)
async function showInternalsView() {
    hideAll();
    const internalDash = document.getElementById('internalDashboard');
    if (internalDash) {
        internalDash.style.display = 'block';
        await loadInternalsData();
    }
}

async function loadInternalsData() {
    const container = document.getElementById('internalDashboard');
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Loading internals data...</p></div>';
    
    try {
        const students = await makeApiRequest('/institution/internal-students');
        displayInternalsData(students.students);
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Failed to load data: ${error.message}</div>`;
    }
}

function displayInternalsData(students) {
    const container = document.getElementById('internalDashboard');
    
    container.innerHTML = `
        <div class="dashboard-header d-flex justify-content-between flex-wrap">
            <h2><i class="fas fa-edit"></i> Internal Records (IA1/IA2 Marks)</h2>
            <div>
                <button class="btn btn-outline-light me-2" onclick="showAddInternalRecordForm()"><i class="fas fa-plus"></i> Add Internal Record</button>
                <button class="btn btn-outline-light" onclick="showInstitutionDashboard()"><i class="fas fa-arrow-left"></i> Back to Dashboard</button>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header bg-primary text-white"><h5 class="mb-0"><i class="fas fa-users"></i> Student Internal Records</h5></div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr><th>USN</th><th>Name</th><th>Department</th><th>Semesters</th><th>Actions</th></tr>
                        </thead>
                        <tbody id="internalsStudentsBody"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    const tbody = document.getElementById('internalsStudentsBody');
    if (students && students.length) {
        tbody.innerHTML = students.map(s => `
            <tr>
                <td><strong>${s.usn}</strong></td>
                <td>${s.name}</td>
                <td>${s.department}</td>
                <td>${s.semester_count || 0}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewStudentInternalDetail('${s.usn}')"><i class="fas fa-eye"></i> View Records</button>
                    <button class="btn btn-sm btn-success ms-1" onclick="showAddInternalRecordForm('${s.usn}', '${s.name}')"><i class="fas fa-plus"></i> Add Marks</button>
                </td>
            </tr>
        `).join('');
    }
}

// Load Departments View
async function loadDepartmentsData() {
    const container = document.getElementById('departmentsView');
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Loading departments...</p></div>';
    
    try {
        // Get departments and students in parallel
        const [departments, students] = await Promise.all([
            makeApiRequest('/institution/departments'),
            makeApiRequest('/institution/students')
        ]);
        
        const departmentsList = departments.data || [];
        const studentsList = students.students || [];
        
        if (departmentsList.length === 0) {
            container.innerHTML = `
                <div class="dashboard-header d-flex justify-content-between">
                    <h2><i class="fas fa-building"></i> Departments</h2>
                    <button class="btn btn-outline-light" onclick="showAddDepartmentModal()"><i class="fas fa-plus"></i> Add Department</button>
                </div>
                <div class="alert alert-info text-center mt-4">
                    <i class="fas fa-info-circle"></i> No departments added yet.
                    <button class="btn btn-primary ms-3" onclick="showAddDepartmentModal()">Add Your First Department</button>
                </div>
                <div class="text-center mt-4"><button class="btn btn-secondary" onclick="showInstitutionDashboard()">Back to Dashboard</button></div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="dashboard-header d-flex justify-content-between">
                <h2><i class="fas fa-building"></i> Departments</h2>
                <button class="btn btn-outline-light" onclick="showAddDepartmentModal()"><i class="fas fa-plus"></i> Add Department</button>
            </div>
            <div class="row">
                ${departmentsList.map(dept => `
                    <div class="col-md-4 mb-4">
                        <div class="card h-100">
                            <div class="card-header bg-primary text-white d-flex justify-content-between">
                                <h5 class="mb-0">${dept.department_name} (${dept.department_code})</h5>
                                <button class="btn btn-sm btn-danger" onclick="deleteDepartment('${dept.department_code}')"><i class="fas fa-trash"></i></button>
                            </div>
                            <div class="card-body">
                                <button class="btn btn-outline-primary w-100 mb-2" onclick="showDepartmentSubjectsModal('${dept.department_code}', '${dept.department_name}')">
                                    <i class="fas fa-book"></i> Manage Subjects
                                </button>
                                <div class="list-group">
                                    <div class="list-group-item bg-light"><strong>Students in this department:</strong></div>
                                </div>
                                <div class="mt-2" style="max-height:200px; overflow-y:auto">
                                    ${studentsList.filter(s => s.department === dept.department_code).map(s => `
                                        <div class="list-group-item d-flex justify-content-between align-items-center">
                                            <div><strong>${s.usn}</strong><br><small>${s.name}</small></div>
                                            <div>
                                                <button class="btn btn-sm btn-info" onclick="viewStudentExternalDetail('${s.usn}')"><i class="fas fa-eye"></i> External</button>
                                                <button class="btn btn-sm btn-warning ms-1" onclick="viewStudentInternalDetail('${s.usn}')"><i class="fas fa-eye"></i> Internal</button>
                                            </div>
                                        </div>
                                    `).join('')}
                                    ${studentsList.filter(s => s.department === dept.department_code).length === 0 ? '<div class="list-group-item text-muted">No students in this department</div>' : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="text-center mt-4"><button class="btn btn-secondary" onclick="showInstitutionDashboard()">Back to Dashboard</button></div>
        `;
    } catch (error) {
        console.error('Load departments error:', error);
        container.innerHTML = `<div class="alert alert-danger">Failed to load departments: ${error.message}</div>`;
    }
}

function showAddDepartmentModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show d-block';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;overflow:auto';
    modal.innerHTML = `
        <div class="modal-dialog" style="margin:100px auto;max-width:500px">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title"><i class="fas fa-plus"></i> Add New Department</h5>
                    <button type="button" class="btn-close btn-close-white" onclick="this.closest('.modal').remove()"></button>
                </div>
                <div class="modal-body">
                    <form id="addDepartmentForm">
                        <div class="mb-3"><label class="form-label">Department Code *</label>
                            <input type="text" id="deptCode" class="form-control" required placeholder="e.g., CSE, ECE, ME, CE">
                            <small class="text-muted">Short code (2-5 letters)</small>
                        </div>
                        <div class="mb-3"><label class="form-label">Department Name *</label>
                            <input type="text" id="deptName" class="form-control" required placeholder="e.g., Computer Science Engineering">
                        </div>
                        <button type="submit" class="btn btn-success w-100">Add Department</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('addDepartmentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const department_code = document.getElementById('deptCode').value.toUpperCase();
        const department_name = document.getElementById('deptName').value;
        
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Adding...';
        
        try {
            await makeApiRequest('/institution/departments', { 
                method: 'POST', 
                body: JSON.stringify({ department_code, department_name }) 
            });
            showNotification('Department added successfully', 'success');
            modal.remove();
            loadDepartmentsData();
        } catch (error) {
            showNotification('Failed to add department: ' + error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Add Department';
        }
    });
}

async function deleteDepartment(departmentCode) {
    if (confirm(`Delete department ${departmentCode}? This will remove all subjects for this department.`)) {
        try {
            await makeApiRequest(`/institution/departments/${departmentCode}`, { method: 'DELETE' });
            showNotification('Department deleted', 'success');
            loadDepartmentsData();
        } catch (error) {
            showNotification('Delete failed: ' + error.message, 'error');
        }
    }
}

// Update showDashboard to check user role
function showDashboard() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) { showHome(); return; }
    if (user.role === 'student') {
        showStudentDashboardView();
    } else if (user.role === 'institution') {
        showInstitutionAnalytics();
    }
}

// ============ STUDENT VIEW FUNCTIONS ============

// Show Student Dashboard
async function showStudentDashboardView() {
    hideAll();
    const container = document.getElementById('studentDashboardContainer');
    if (!container) {
        console.error('studentDashboardContainer not found');
        return;
    }
    container.style.display = 'block';
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Loading dashboard...</p></div>';
    
    try {
        const [dashboardData, rankData] = await Promise.all([
            makeApiRequest('/student/dashboard'),
            makeApiRequest('/student/rank')
        ]);
        
        if (dashboardData.success) {
            displayStudentDashboardView(dashboardData, rankData);
        }
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Failed to load data: ${error.message}</div>`;
    }
}

function displayStudentDashboardView(dashboardData, rankData) {
    const { student, semesters, stats } = dashboardData;
    const rank = rankData.rank || '-';
    const percentile = rankData.percentile || 0;
    const container = document.getElementById('studentDashboardContainer');
    
    container.innerHTML = `
        <div class="dashboard-header d-flex justify-content-between flex-wrap">
            <h2><i class="fas fa-user-graduate"></i> My Dashboard</h2>
            <div>
                <button class="btn btn-outline-light me-2" onclick="showProfileModal()"><i class="fas fa-user-circle"></i> Profile</button>
                <button class="btn btn-outline-light" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</button>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${stats.cgpa}</div><div class="stat-label">CGPA</div></div></div>
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${stats.totalSemesters}</div><div class="stat-label">Semesters</div></div></div>
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${stats.averageSgpa}</div><div class="stat-label">Avg SGPA</div></div></div>
            <div class="col-md-3"><div class="stat-card"><div class="stat-value">${rank}</div><div class="stat-label">Rank (${percentile}th percentile)</div></div></div>
        </div>
        
        <div class="student-info-card">
            <div class="row">
                <div class="col-md-6"><p><strong>📘 USN:</strong> ${student.usn}</p><p><strong>👤 Name:</strong> ${student.name}</p></div>
                <div class="col-md-6"><p><strong>🏛️ Department:</strong> ${student.department}</p><p><strong>📧 Email:</strong> ${student.email || 'N/A'}</p></div>
            </div>
        </div>
        
        <div class="card mb-4">
            <div class="card-header bg-primary text-white"><h5 class="mb-0"><i class="fas fa-chart-line"></i> SGPA Trend</h5></div>
            <div class="card-body"><canvas id="studentTrendChart" height="150"></canvas></div>
        </div>
        
        <div class="card">
            <div class="card-header bg-primary text-white"><h5 class="mb-0"><i class="fas fa-book"></i> Semester Summary</h5></div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead><tr><th>Semester</th><th>SGPA</th><th>Status</th></tr></thead>
                        <tbody>
                            ${semesters.map(sem => `
                                <tr>
                                    <td>Semester ${sem.semester_number}</td>
                                    <td><span class="badge bg-primary">${parseFloat(sem.sgpa).toFixed(2)}</span></td>
                                    <td>${parseFloat(sem.sgpa) >= 8 ? '🏆 Excellent' : parseFloat(sem.sgpa) >= 7 ? '👍 Good' : parseFloat(sem.sgpa) >= 6 ? '📚 Satisfactory' : '⚠️ Need Improvement'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <div class="cgpa-card text-center mt-4">
            <h4><i class="fas fa-star"></i> Overall CGPA</h4>
            <div class="cgpa-score">${stats.cgpa}</div>
            <p class="mt-2">${getCgpaRemark(stats.cgpa)}</p>
        </div>
    `;
    
    // Load trend chart
    if (semesters && semesters.length > 0) {
        const ctx = document.getElementById('studentTrendChart')?.getContext('2d');
        if (ctx) {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: semesters.map(s => `Sem ${s.semester_number}`),
                    datasets: [{ label: 'SGPA', data: semesters.map(s => parseFloat(s.sgpa)), borderColor: '#3b71ca', fill: true, tension: 0.4 }]
                },
                options: { responsive: true, scales: { y: { min: 0, max: 10 } } }
            });
        }
    }
}

// Show Student External Records
async function showStudentExternalsView() {
    hideAll();
    const container = document.getElementById('studentExternalsView');
    if (!container) return;
    container.style.display = 'block';
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Loading external records...</p></div>';
    
    try {
        const dashboardData = await makeApiRequest('/student/dashboard');
        if (dashboardData && dashboardData.success) {
            displayStudentExternalsView(dashboardData);
        } else {
            container.innerHTML = '<div class="alert alert-danger">Failed to load external records</div>';
        }
    } catch (error) {
        console.error('Load external records error:', error);
        container.innerHTML = `<div class="alert alert-danger">Failed to load: ${error.message}</div>`;
    }
}

function displayStudentExternalsView(dashboardData) {
    const { student, semesters, stats } = dashboardData;
    const container = document.getElementById('studentExternalsView');
    const semestersList = semesters || [];
    
    container.innerHTML = `
        <!-- Header -->
        <div class="dashboard-header d-flex justify-content-between flex-wrap">
            <h2><i class="fas fa-book-open"></i> External Records (SGPA/CGPA)</h2>
            <button class="btn btn-outline-light" onclick="logout()">Logout</button>
        </div>
        
        <!-- Student Info Cards -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="stat-card"><div class="stat-value">${student?.usn || 'N/A'}</div><div class="stat-label">USN</div></div>
            </div>
            <div class="col-md-3">
                <div class="stat-card"><div class="stat-value">${student?.name || 'N/A'}</div><div class="stat-label">Name</div></div>
            </div>
            <div class="col-md-3">
                <div class="stat-card"><div class="stat-value">${student?.department || 'N/A'}</div><div class="stat-label">Department</div></div>
            </div>
            <div class="col-md-3">
                <div class="stat-card"><div class="stat-value">${stats?.cgpa || '0.00'}</div><div class="stat-label">CGPA</div></div>
            </div>
        </div>
        
        <!-- Small SGPA Trend Chart -->
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-chart-line"></i> SGPA Trend</h5>
            </div>
            <div class="card-body">
                <canvas id="externalTrendChart" style="height: 200px; width: 100%;"></canvas>
            </div>
        </div>
        
        <!-- Semester-wise External Records -->
        ${semestersList.map(sem => `
            <div class="card mb-3">
                <div class="card-header bg-info text-white">
                    <strong>Semester ${sem.semester_number} - SGPA: ${parseFloat(sem.sgpa).toFixed(2)}</strong>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm table-bordered">
                            <thead class="table-light">
                                <tr><th>Subject</th><th>Marks</th><th>Credits</th><th>Grade</th></tr>
                            </thead>
                            <tbody>
                                ${(sem.subjects || []).map(s => `
                                    <tr>
                                        <td>${s.subject_name}</td>
                                        <td>${s.marks}</td>
                                        <td>${s.credits}</td>
                                        <td><span class="badge ${getGradeBadgeClass(s.grade)}">${s.grade}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `).join('')}
        
        ${semestersList.length === 0 ? '<div class="alert alert-info">No external records found.</div>' : ''}
        
        <!-- CGPA Card at Bottom -->
        <div class="cgpa-card text-center mt-4">
            <h4><i class="fas fa-star"></i> Overall CGPA</h4>
            <div class="cgpa-score">${stats?.cgpa || '0.00'}</div>
            <p class="mt-2">${getCgpaRemark(stats?.cgpa || 0)}</p>
        </div>
    `;
    
    // Load small trend chart
    if (semestersList.length > 0) {
        const ctx = document.getElementById('externalTrendChart')?.getContext('2d');
        if (ctx) {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: semestersList.map(s => `Sem ${s.semester_number}`),
                    datasets: [{ 
                        label: 'SGPA', 
                        data: semestersList.map(s => parseFloat(s.sgpa)), 
                        borderColor: '#3b71ca', 
                        backgroundColor: 'rgba(59,113,202,0.1)', 
                        fill: true, 
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } }
                    },
                    scales: { 
                        y: { 
                            min: 0, 
                            max: 10, 
                            title: { display: true, text: 'SGPA', font: { size: 10 } },
                            ticks: { font: { size: 9 } }
                        },
                        x: { 
                            title: { display: true, text: 'Semester', font: { size: 10 } },
                            ticks: { font: { size: 9 } }
                        }
                    }
                }
            });
        }
    }
}

// Show Student Internal Records
async function showStudentInternalsView() {
    hideAll();
    const container = document.getElementById('studentInternalsView');
    if (!container) return;
    container.style.display = 'block';
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div><p>Loading internal records...</p></div>';
    
    try {
        const internalData = await makeApiRequest('/student/internal-marks');
        if (internalData && internalData.success) {
            displayStudentInternalsView(internalData.data || {});
        } else {
            container.innerHTML = '<div class="alert alert-info">No internal records found. Contact your institution.</div>';
        }
    } catch (error) {
        console.error('Load internal records error:', error);
        container.innerHTML = `<div class="alert alert-danger">Failed to load: ${error.message}</div>`;
    }
}

function displayStudentInternalsView(internalMarks) {
    const container = document.getElementById('studentInternalsView');
    const marksData = (internalMarks && typeof internalMarks === 'object') ? internalMarks : {};
    const semesterKeys = Object.keys(marksData);
    
    container.innerHTML = `
        <!-- Header -->
        <div class="dashboard-header d-flex justify-content-between flex-wrap">
            <h2><i class="fas fa-edit"></i> Internal Records (IA1/IA2)</h2>
            <button class="btn btn-outline-light" onclick="logout()">Logout</button>
        </div>
        <div id="studentInternalList"></div>
    `;
    
    const listContainer = document.getElementById('studentInternalList');
    
    if (semesterKeys.length === 0) {
        listContainer.innerHTML = '<div class="alert alert-info">No internal records found. Contact your institution.</div>';
        return;
    }
    
    let html = '';
    for (const sem of semesterKeys.sort((a, b) => Number(a) - Number(b))) {
        const subjects = marksData[sem];
        if (!subjects || subjects.length === 0) continue;
        
        html += `
            <div class="card mb-3">
                <div class="card-header bg-primary text-white">
                    <strong>Semester ${sem}</strong>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th>Subject</th>
                                    <th>IA1 Marks</th>
                                    <th>IA2 Marks</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${subjects.map(m => {
                                    const ia1Display = (m.ia1_marks !== null && m.ia1_marks !== undefined) ? `${m.ia1_marks}/${m.ia1_out_of || 100}` : 'Not Conducted';
                                    const ia2Display = (m.ia2_marks !== null && m.ia2_marks !== undefined) ? `${m.ia2_marks}/${m.ia2_out_of || 100}` : 'Not Conducted';
                                    return `
                                        <tr>
                                            <td>${m.subject_name}</td>
                                            <td>${ia1Display}</td>
                                            <td>${ia2Display}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
    listContainer.innerHTML = html;
}

// ============ DEPARTMENT & SUBJECT MANAGEMENT ============

let currentDepartmentSubjects = null;
let currentSubjectType = 'external'; // 'external' or 'internal'

async function loadDepartmentsList() {
    try {
        const departments = await makeApiRequest('/institution/departments');
        return departments.data;
    } catch (error) {
        console.error('Load departments error:', error);
        return [];
    }
}

function showDepartmentSubjectsModal(departmentCode, departmentName) {
    currentDepartmentSubjects = departmentCode;
    const modal = document.createElement('div');
    modal.className = 'modal show d-block';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;overflow:auto';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg" style="margin:100px auto;max-width:800px">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title"><i class="fas fa-book"></i> Manage Subjects - ${departmentName} (${departmentCode})</h5>
                    <button type="button" class="btn-close btn-close-white" onclick="this.closest('.modal').remove()"></button>
                </div>
                <div class="modal-body">
                    <ul class="nav nav-tabs mb-3">
                        <li class="nav-item"><button class="nav-link active" data-type="external" onclick="loadSubjectManagement('external', '${departmentCode}')">📘 External Subjects (SGPA/CGPA)</button></li>
                        <li class="nav-item"><button class="nav-link" data-type="internal" onclick="loadSubjectManagement('internal', '${departmentCode}')">📝 Internal Subjects (IA1/IA2)</button></li>
                    </ul>
                    <div id="subjectManagementContent">
                        <div class="text-center py-3"><div class="spinner-border text-primary"></div><p>Loading subjects...</p></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    loadSubjectManagement('external', departmentCode);
}

async function loadSubjectManagement(type, departmentCode) {
    currentSubjectType = type;
    const container = document.getElementById('subjectManagementContent');
    container.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary"></div><p>Loading subjects...</p></div>';
    
    try {
        const subjects = await makeApiRequest(`/institution/${type}-subjects?department_code=${departmentCode}`);
        displaySubjectManagement(type, departmentCode, subjects.data);
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Failed to load: ${error.message}</div>`;
    }
}

function displaySubjectManagement(type, departmentCode, subjects) {
    const container = document.getElementById('subjectManagementContent');
    
    // Group subjects by semester
    const groupedBySemester = {};
    subjects.forEach(sub => {
        if (!groupedBySemester[sub.semester_number]) {
            groupedBySemester[sub.semester_number] = [];
        }
        groupedBySemester[sub.semester_number].push(sub);
    });
    
    let semestersHtml = '';
    for (let sem = 1; sem <= 8; sem++) {
        const semSubjects = groupedBySemester[sem] || [];
        semestersHtml += `
            <div class="card mb-3">
                <div class="card-header bg-info text-white d-flex justify-content-between">
                    <strong>Semester ${sem}</strong>
                    <button class="btn btn-sm btn-light" onclick="showAddSubjectModal('${type}', '${departmentCode}', ${sem})">+ Add Subject</button>
                </div>
                <div class="card-body">
                    ${semSubjects.length === 0 ? '<p class="text-muted">No subjects added yet.</p>' : `
                        <div class="table-responsive">
                            <table class="table table-sm table-bordered">
                                <thead class="table-light">
                                    <tr><th>Subject Code</th><th>Subject Name</th>${type === 'external' ? '<th>Credits</th><th>Max Marks</th>' : '<th>IA1 Max</th><th>IA2 Max</th>'}<th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    ${semSubjects.map(sub => `
                                        <tr>
                                            <td>${sub.subject_code}</td>
                                            <td>${sub.subject_name}</td>
                                            ${type === 'external' ? `
                                                <td>${sub.credits}</td>
                                                <td>${sub.max_marks}</td>
                                            ` : `
                                                <td>${sub.ia1_max_marks}</td>
                                                <td>${sub.ia2_max_marks}</td>
                                            `}
                                            <td>
                                                <button class="btn btn-sm btn-warning" onclick="editSubject('${type}', ${sub.id}, '${sub.subject_code}', '${sub.subject_name}', ${sub.credits || sub.ia1_max_marks}, ${sub.max_marks || sub.ia2_max_marks}, ${sub.semester_number})"><i class="fas fa-edit"></i></button>
                                                <button class="btn btn-sm btn-danger" onclick="deleteSubject('${type}', ${sub.id})"><i class="fas fa-trash"></i></button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = semestersHtml;
}

function showAddSubjectModal(type, departmentCode, semester) {
    const modal = document.createElement('div');
    modal.className = 'modal show d-block';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;overflow:auto';
    modal.innerHTML = `
        <div class="modal-dialog" style="margin:100px auto;max-width:500px">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">Add ${type === 'external' ? 'External' : 'Internal'} Subject - Semester ${semester}</h5>
                    <button type="button" class="btn-close btn-close-white" onclick="this.closest('.modal').remove()"></button>
                </div>
                <div class="modal-body">
                    <form id="addSubjectForm">
                        <div class="mb-3"><label class="form-label">Subject Code *</label><input type="text" id="subjectCode" class="form-control" required placeholder="e.g., MAT101"></div>
                        <div class="mb-3"><label class="form-label">Subject Name *</label><input type="text" id="subjectName" class="form-control" required></div>
                        ${type === 'external' ? `
                            <div class="mb-3"><label class="form-label">Credits *</label><input type="number" id="credits" class="form-control" required min="1" max="5" step="0.5"></div>
                            <div class="mb-3"><label class="form-label">Max Marks</label><input type="number" id="maxMarks" class="form-control" value="100" min="1" max="100"></div>
                        ` : `
                            <div class="mb-3"><label class="form-label">IA1 Max Marks</label><input type="number" id="ia1Max" class="form-control" value="50" min="1" max="100"></div>
                            <div class="mb-3"><label class="form-label">IA2 Max Marks</label><input type="number" id="ia2Max" class="form-control" value="50" min="1" max="100"></div>
                        `}
                        <button type="submit" class="btn btn-success w-100">Add Subject</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('addSubjectForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const subjectCode = document.getElementById('subjectCode').value.toUpperCase();
        const subjectName = document.getElementById('subjectName').value;
        
        let body = {
            department_code: departmentCode,
            semester_number: semester,
            subject_code: subjectCode,
            subject_name: subjectName
        };
        
        if (type === 'external') {
            body.credits = parseFloat(document.getElementById('credits').value);
            body.max_marks = parseInt(document.getElementById('maxMarks').value);
        } else {
            body.ia1_max_marks = parseInt(document.getElementById('ia1Max').value);
            body.ia2_max_marks = parseInt(document.getElementById('ia2Max').value);
        }
        
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Adding...';
        
        try {
            await makeApiRequest(`/institution/${type}-subjects`, { method: 'POST', body: JSON.stringify(body) });
            showNotification('Subject added successfully', 'success');
            modal.remove();
            loadSubjectManagement(type, departmentCode);
        } catch (error) {
            showNotification('Failed to add subject', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Add Subject';
        }
    });
}

async function editSubject(type, id, subjectCode, subjectName, creditsOrIa1Max, maxOrIa2Max, semester) {
    const modal = document.createElement('div');
    modal.className = 'modal show d-block';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;overflow:auto';
    modal.innerHTML = `
        <div class="modal-dialog" style="margin:100px auto;max-width:500px">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">Edit ${type === 'external' ? 'External' : 'Internal'} Subject</h5>
                    <button type="button" class="btn-close btn-close-white" onclick="this.closest('.modal').remove()"></button>
                </div>
                <div class="modal-body">
                    <form id="editSubjectForm">
                        <div class="mb-3"><label class="form-label">Subject Code</label><input type="text" class="form-control" value="${subjectCode}" disabled></div>
                        <div class="mb-3"><label class="form-label">Subject Name *</label><input type="text" id="editSubjectName" class="form-control" value="${subjectName}" required></div>
                        ${type === 'external' ? `
                            <div class="mb-3"><label class="form-label">Credits *</label><input type="number" id="editCredits" class="form-control" value="${creditsOrIa1Max}" min="1" max="5" step="0.5" required></div>
                            <div class="mb-3"><label class="form-label">Max Marks</label><input type="number" id="editMaxMarks" class="form-control" value="${maxOrIa2Max}" min="1" max="100"></div>
                        ` : `
                            <div class="mb-3"><label class="form-label">IA1 Max Marks</label><input type="number" id="editIa1Max" class="form-control" value="${creditsOrIa1Max}" min="1" max="100"></div>
                            <div class="mb-3"><label class="form-label">IA2 Max Marks</label><input type="number" id="editIa2Max" class="form-control" value="${maxOrIa2Max}" min="1" max="100"></div>
                        `}
                        <button type="submit" class="btn btn-success w-100">Save Changes</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('editSubjectForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const subjectName = document.getElementById('editSubjectName').value;
        
        let body = { subject_name: subjectName };
        
        if (type === 'external') {
            body.credits = parseFloat(document.getElementById('editCredits').value);
            body.max_marks = parseInt(document.getElementById('editMaxMarks').value);
        } else {
            body.ia1_max_marks = parseInt(document.getElementById('editIa1Max').value);
            body.ia2_max_marks = parseInt(document.getElementById('editIa2Max').value);
        }
        
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Saving...';
        
        try {
            await makeApiRequest(`/institution/${type}-subjects`, { method: 'POST', body: JSON.stringify({ ...body, id }) });
            showNotification('Subject updated successfully', 'success');
            modal.remove();
            loadSubjectManagement(type, currentDepartmentSubjects);
        } catch (error) {
            showNotification('Failed to update subject', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Save Changes';
        }
    });
}

async function deleteSubject(type, id) {
    if (confirm('Delete this subject? This will affect student records.')) {
        try {
            await makeApiRequest(`/institution/${type}-subjects/${id}`, { method: 'DELETE' });
            showNotification('Subject deleted', 'success');
            loadSubjectManagement(type, currentDepartmentSubjects);
        } catch (error) {
            showNotification('Delete failed', 'error');
        }
    }
}

function showDepartmentsView() {
    hideAll();
    const deptView = document.getElementById('departmentsView');
    if (deptView) {
        deptView.style.display = 'block';
        loadDepartmentsData();
    } else {
        console.error('departmentsView element not found');
    }
}

// Show Institution Analytics Dashboard
function showInstitutionAnalytics() {
    hideAll();
    const institutionDash = document.getElementById('institutionDashboard');
    if (institutionDash) {
        institutionDash.style.display = 'block';
        loadInstitutionData();
    }
}

// ============ SOCKET.IO ============
function connectSocket() {
    socket = io();
    socket.on('connect', () => { if (currentUser?.role === 'student') socket.emit('join_notifications', currentUser.usn); });
    socket.on('new_notification', (data) => showNotification(data.message, data.type));
    socket.on('new_result', (data) => showNotification(`New result! Semester ${data.semester}: SGPA ${data.sgpa}`, 'success'));
}

// ============ LOGOUT ============
function logout() {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    if (socket) socket.disconnect();
    currentUser = null; updateNavbar(); showHome();
    showNotification('Logged out successfully', 'success');
}

// ============ INITIALIZE ============
window.addEventListener('DOMContentLoaded', async () => {
    updateNavbar();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (token && user) {
        if (user.role === 'student') { await loadStudentDashboard(); showStudentDashboard(); }
        else if (user.role === 'institution') { await loadInstitutionData(); showInstitutionDashboard(); }
    } else showHome();
});

// ============ GLOBAL FUNCTIONS ============
window.showHome = showHome; 
window.showDashboard = showDashboard; 
window.showStudentLogin = showStudentLogin;
window.showInstitutionLogin = showInstitutionLogin;
window.logout = logout; 
window.showAddRecordForm = showAddRecordForm;
window.showAddSemesterModal = showAddSemesterModal; 
window.showEditStudentModal = showEditStudentModal;
window.viewStudentDetail = viewStudentDetail; 
window.backToInstitutionDashboard = backToInstitutionDashboard;
window.editSemester = editSemester; 
window.deleteSemester = deleteSemester; 
window.deleteStudent = deleteStudent;
window.showProfileModal = showProfileModal; 
window.showForgotPasswordModal = showForgotPasswordModal;
window.checkDuplicateUsn = checkDuplicateUsn;
window.showExternalsView = showExternalsView;
window.showInternalsView = showInternalsView;
window.showDepartmentsView = showDepartmentsView;
window.showAddInternalRecordForm = showAddInternalRecordForm;
window.viewStudentExternalDetail = viewStudentExternalDetail;
window.viewStudentInternalDetail = viewStudentInternalDetail;
window.backToExternalsView = backToExternalsView;
window.backToInternalsView = backToInternalsView;
window.deleteInternalSemester = deleteInternalSemester;
window.showInstitutionDashboard = showInstitutionDashboard;
window.showDepartmentSubjectsModal = showDepartmentSubjectsModal;
window.loadSubjectManagement = loadSubjectManagement;
window.showAddSubjectModal = showAddSubjectModal;
window.editSubject = editSubject;
window.deleteSubject = deleteSubject;
window.showAddDepartmentModal = showAddDepartmentModal;
window.deleteDepartment = deleteDepartment;
window.showAddDepartmentModal = showAddDepartmentModal;
window.deleteDepartment = deleteDepartment;
window.showDepartmentSubjectsModal = showDepartmentSubjectsModal;
window.loadSubjectManagement = loadSubjectManagement;
window.showAddSubjectModal = showAddSubjectModal;
window.editSubject = editSubject;
window.deleteSubject = deleteSubject;
window.showStudentDashboardView = showStudentDashboardView;
window.showStudentExternalsView = showStudentExternalsView;
window.showStudentInternalsView = showStudentInternalsView;
