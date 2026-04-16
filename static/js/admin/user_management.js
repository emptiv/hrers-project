/* =================================
    User Management JavaScript
    ================================= */

let currentEditingUserId = null;
let selectedUsers = [];
let confirmedAction = null; // To store the action for the confirm modal
let userDirectory = [];
let departmentDirectory = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeUserManagement();
});

function initializeUserManagement() {
    loadUserManagementData();
    setupEventListeners();
    setupFilterListeners();
    updateSelectedUsers(); // Initialize bulk actions visibility
}

async function loadUserManagementData() {
    try {
        const [usersResponse, departmentsResponse] = await Promise.all([
            fetch('/accounts/users'),
            fetch('/accounts/departments'),
        ]);

        const usersPayload = usersResponse.ok ? await usersResponse.json() : { items: [] };
        const departmentsPayload = departmentsResponse.ok ? await departmentsResponse.json() : { items: [] };

        userDirectory = Array.isArray(usersPayload.items) ? usersPayload.items : [];
        departmentDirectory = Array.isArray(departmentsPayload.items) ? departmentsPayload.items : [];

        renderUserRows(userDirectory);
        populateDepartmentOptions();
        setupTableCheckboxes();
        updateSelectedUsers();
    } catch (error) {
        userDirectory = [];
        renderUserRows([]);
    }
}

function roleBadgeClass(role) {
    if (role === 'admin') return 'role-admin';
    if (role === 'department_head') return 'role-head';
    if (role === 'employee') return 'role-employee';
    return 'role-hr';
}

function formatDisplayDate(isoString) {
    if (!isoString) return '--';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
}

function splitDisplayName(fullName) {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return { firstName: '', lastName: '' };
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function mapRoleForUserModal(roleValue) {
    const normalizedRole = String(roleValue || '').toLowerCase();
    if (normalizedRole === 'department_head') return 'head';
    if (normalizedRole === 'hr_head' || normalizedRole === 'hr_evaluator') return 'hr';
    return normalizedRole;
}

function renderUserRows(items) {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;

    if (!items.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; padding:20px;">No users found.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = items.map((item) => {
        const userId = Number(item.id || 0);
        const role = String(item.role || 'employee');
        const roleLabel = String(item.roleLabel || role.replace(/_/g, ' '));
        const department = String(item.department || 'Unassigned');
        const statusClass = item.isActive ? 'active' : 'inactive';
        const statusLabel = item.isActive ? 'Active' : 'Inactive';
        const fullName = String(item.name || 'Unknown User');
        const escapedName = fullName.replace(/"/g, '&quot;');
        return `
            <tr class="user-row" data-user-id="${userId}" data-role="${role}" data-status="${statusClass}" data-department-id="${item.departmentId || ''}" data-search="${(fullName + ' ' + (item.email || '') + ' ' + (item.employeeNo || userId)).toLowerCase()}">
                <td><input type="checkbox" class="user-checkbox"></td>
                <td>#${userId}</td>
                <td>
                    <div class="user-cell">
                        <img src="../../static/img/sample-profile-pic.jfif" alt="${escapedName}" class="user-avatar">
                        <span>${fullName}</span>
                    </div>
                </td>
                <td>${item.email || '--'}</td>
                <td><span class="role-badge ${roleBadgeClass(role)}">${roleLabel}</span></td>
                <td>${department}</td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                <td>${formatDisplayDate(item.createdAt)}</td>
                <td class="action-cell">
                    <button class="action-btn" onclick="toggleDropdown(this)">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="dropdown-menu">
                        <a href="#" class="dropdown-item edit-user" data-user-id="${userId}"><i class="fas fa-edit"></i> Edit</a>
                        <a href="#" class="dropdown-item assign-role" data-user-id="${userId}" data-user-name="${escapedName}" data-current-role="${role}" data-current-department="${item.departmentId || ''}"><i class="fas fa-user-tie"></i> Assign Role</a>
                        <a href="#" class="dropdown-item reset-password" data-user-id="${userId}" data-user-name="${escapedName}"><i class="fas fa-key"></i> Reset Password</a>
                        <hr>
                        <a href="#" class="dropdown-item delete-user" data-user-id="${userId}"><i class="fas fa-trash"></i> Delete</a>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function populateDepartmentOptions() {
    const departmentFilter = document.getElementById('departmentFilter');
    const newDepartment = document.getElementById('newDepartment');
    const departmentUserModal = document.getElementById('departmentUserModal');

    const options = departmentDirectory
        .filter((item) => item.isActive)
        .map((item) => `<option value="${item.id}">${item.name}</option>`)
        .join('');

    if (departmentFilter) {
        departmentFilter.innerHTML = `<option value="">All Departments</option>${options}`;
    }

    if (newDepartment) {
        newDepartment.innerHTML = `<option value="">Select Department</option>${options}`;
    }

    if (departmentUserModal) {
        departmentUserModal.innerHTML = `<option value="">Select Department</option>${options}`;
    }
}

function toggleUserModalDepartment(roleValue) {
    const deptGroup = document.getElementById('departmentSelectGroupUserModal');
    const deptSelect = document.getElementById('departmentUserModal');
    if (!deptGroup || !deptSelect) return;

    const requiresDepartment = true;

    deptGroup.style.display = requiresDepartment ? 'block' : 'none';
    deptSelect.required = requiresDepartment;
    if (!requiresDepartment) {
        deptSelect.value = '';
    }
}

function setupEventListeners() {
    // Create User Button
    // Ultimate failsafe: Listen to the whole page and catch clicks on the button or its icons
    document.body.addEventListener('click', function(e) {
        const createBtn = e.target.closest('#createUserBtn, [onclick*="openUserModal"]');
        if (createBtn) {
            e.preventDefault();
            openUserModal();
        }

        const editBtn = e.target.closest('.edit-user');
        if (editBtn) {
            e.preventDefault();
            editUser(editBtn.dataset.userId);
        }

        const assignBtn = e.target.closest('.assign-role');
        if (assignBtn) {
            e.preventDefault();
            openAssignRoleModal(
                assignBtn.dataset.userId,
                assignBtn.dataset.userName,
                assignBtn.dataset.currentRole,
                assignBtn.dataset.currentDepartment
            );
        }

        const resetBtn = e.target.closest('.reset-password');
        if (resetBtn) {
            e.preventDefault();
            openResetPasswordModal(resetBtn.dataset.userId, resetBtn.dataset.userName);
        }

        const deleteBtn = e.target.closest('.delete-user');
        if (deleteBtn) {
            e.preventDefault();
            confirmDeleteUser(deleteBtn.dataset.userId);
        }

        const lockBtn = e.target.closest('.lock-user');
        if (lockBtn) {
            e.preventDefault();
            confirmUserStatusChange(lockBtn.dataset.userId, 'lock');
        }

        const unlockBtn = e.target.closest('.unlock-user');
        if (unlockBtn) {
            e.preventDefault();
            confirmUserStatusChange(unlockBtn.dataset.userId, 'unlock');
        }
    });

    // Edit User Links
    document.querySelectorAll('.edit-user').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.dataset.userId;
            editUser(userId);
        });
    });

    // Assign Role Links
    document.querySelectorAll('.assign-role').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.dataset.userId;
            const userName = this.dataset.userName;
            const currentRole = this.dataset.currentRole;
            const currentDepartment = this.dataset.currentDepartment;
            openAssignRoleModal(userId, userName, currentRole, currentDepartment);
        });
    });

    // Lock/Unlock User
    document.querySelectorAll('.lock-user').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.dataset.userId;
            confirmUserStatusChange(userId, 'lock');
        });
    });
    document.querySelectorAll('.unlock-user').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.dataset.userId;
            confirmUserStatusChange(userId, 'unlock');
        });
    });
    // Reset Password Links
    document.querySelectorAll('.reset-password').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.dataset.userId;
            const userName = this.dataset.userName;
            openResetPasswordModal(userId, userName);
        });
    });

    // Activate/Deactivate User
    document.querySelectorAll('.deactivate-user, .activate-user').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.dataset.userId;
            const action = this.classList.contains('deactivate-user') ? 'deactivate' : 'activate'; // This line is redundant now, as I've separated the event listeners.
            confirmUserStatusChange(userId, action);
        });
    });

    // Delete User
    document.querySelectorAll('.delete-user').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.dataset.userId;
            confirmDeleteUser(userId);
        });
    });

    // Modal Close Buttons
    document.querySelectorAll('.modal .close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('show');
        });
    });

    // Form Submissions
    document.getElementById('userForm')?.addEventListener('submit', handleUserFormSubmit);
    document.getElementById('assignRoleForm')?.addEventListener('submit', handleAssignRoleSubmit);
    document.getElementById('resetPasswordForm')?.addEventListener('submit', handleResetPasswordSubmit);

    // Password strength indicator
    document.getElementById('newPassword')?.addEventListener('input', updatePasswordStrength);
    document.getElementById('password')?.addEventListener('input', updatePasswordStrengthForCreateEdit); // For create/edit user modal

    // Department visibility for create/edit user modal
    document.getElementById('role')?.addEventListener('change', function() {
        toggleUserModalDepartment(this.value);
    });

    // Bulk Actions
    document.getElementById('bulkDeactivate')?.addEventListener('click', bulkDeactivateUsers);
    document.getElementById('bulkActivate')?.addEventListener('click', bulkActivateUsers);
    document.getElementById('bulkDelete')?.addEventListener('click', bulkDeleteUsers);

    document.getElementById('bulkLock')?.addEventListener('click', bulkLockUsers);
    document.getElementById('bulkUnlock')?.addEventListener('click', bulkUnlockUsers);

    // Confirm Modal Button
    document.getElementById('confirmBtn')?.addEventListener('click', executeConfirmedAction);
}

function setupFilterListeners() {
    document.getElementById('userSearch')?.addEventListener('keyup', debounce(applyFilters, 300));
    document.getElementById('roleFilter')?.addEventListener('change', applyFilters);
    document.getElementById('statusFilter')?.addEventListener('change', applyFilters);
    document.getElementById('departmentFilter')?.addEventListener('change', applyFilters);
    document.getElementById('applyFiltersBtn')?.addEventListener('click', applyFilters);
    document.getElementById('clearFiltersBtn')?.addEventListener('click', clearFilters);
}

function setupTableCheckboxes() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const userCheckboxes = document.querySelectorAll('.user-checkbox');

    selectAllCheckbox?.addEventListener('change', function() {
        userCheckboxes.forEach(cb => {
            cb.checked = this.checked;
        });
        updateSelectedUsers();
    });

    userCheckboxes.forEach(cb => {
        cb.addEventListener('change', updateSelectedUsers);
    });
}

function updateSelectedUsers() {
    const checkboxes = document.querySelectorAll('.user-checkbox:checked');
    selectedUsers = Array.from(checkboxes).map(cb => 
        cb.closest('tr').dataset.userId
    );

    const bulkActionsDiv = document.getElementById('bulkActions');
    if (selectedUsers.length > 0) {
        bulkActionsDiv.style.display = 'flex';
        document.getElementById('selectedCount').textContent = 
            `${selectedUsers.length} selected`;
    } else {
        bulkActionsDiv.style.display = 'none';
    }
}

function openUserModal() {
    const modal = document.getElementById('userModal');
    if (!modal) {
        console.error("ERROR: Cannot find the modal HTML. Did the ID get deleted?");
        showAlert("Developer Error: Modal not found. Check F12 Console.", 'danger');
        return;
    }

    // --- ADD THESE 3 LINES TO FIX THE 0x0 SIZE PROBLEM ---
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('width', '100vw', 'important');
    modal.style.setProperty('height', '100vh', 'important');

    const form = document.getElementById('userForm');
    if (form) form.reset(); // Clear out any old text

    // Reset hidden fields and titles safely
    const titleField = document.getElementById('modalTitle');
    if (titleField) titleField.textContent = 'Create New User';

    const userIdField = document.getElementById('userIdForEdit');
    if (userIdField) userIdField.value = '';

    toggleUserModalDepartment(document.getElementById('role')?.value || '');

    // Finally, force it to show!
    modal.classList.add('show');
}
// Make the function globally available so the inline `onclick="openUserModal()"` attribute can find it.
window.openUserModal = openUserModal;


function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

async function editUser(userId) {
    currentEditingUserId = userId;

    const cachedUser = userDirectory.find((item) => String(item.id) === String(userId));
    try {
        let userData = null;

        if (cachedUser) {
            const nameParts = splitDisplayName(cachedUser.name);
            userData = {
                first_name: nameParts.firstName,
                last_name: nameParts.lastName,
                email: cachedUser.email || '',
                username: cachedUser.email ? String(cachedUser.email).split('@')[0] : '',
                role: cachedUser.role || '',
                department_id: cachedUser.departmentId || '',
            };
        } else {
            const response = await fetch(`/accounts/get-user-data/${userId}/`);
            if (!response.ok) {
                throw new Error(`Failed to fetch user data (${response.status}).`);
            }
            userData = await response.json();
        }

        if (document.getElementById('firstName')) document.getElementById('firstName').value = userData.first_name || '';
        if (document.getElementById('lastName')) document.getElementById('lastName').value = userData.last_name || '';
        if (document.getElementById('email')) document.getElementById('email').value = userData.email || '';
        if (document.getElementById('username')) document.getElementById('username').value = userData.username || '';
        const roleValue = String(userData.role || '');
        const roleForUi = mapRoleForUserModal(roleValue);
        if (document.getElementById('role')) document.getElementById('role').value = roleForUi || '';
        if (document.getElementById('userIdForEdit')) document.getElementById('userIdForEdit').value = userId;
        const deptSelect = document.getElementById('departmentUserModal');
        if (deptSelect) deptSelect.value = userData.department_id ? String(userData.department_id) : '';

        // Password fields are not required for edit unless explicitly changing
        const pwdField = document.getElementById('password');
        const confirmPwdField = document.getElementById('confirmPassword');

        if (pwdField) {
            pwdField.required = false;
            pwdField.value = '';
        }
        if (confirmPwdField) {
            confirmPwdField.required = false;
            confirmPwdField.value = '';
        }

        toggleUserModalDepartment(roleForUi);

    document.getElementById('modalTitle').textContent = 'Edit User';
    document.getElementById('userModal').style.display = 'flex';

    } catch (error) {
        console.error('Error fetching user data:', error);
        showAlert('Error fetching user data.', 'danger');
    }
}

function openAssignRoleModal(userId, userName, currentRole, currentDepartment) {
    
    document.getElementById('assignRoleUserId').value = userId;
    document.getElementById('userNameDisplay').textContent = `User: ${userName}`;
    const roleValue = String(currentRole || '');
    const roleForUi = roleValue === 'department_head' ? 'head' : (roleValue.startsWith('hr_') ? 'hr' : roleValue);
    document.getElementById('newRole').value = roleForUi;

    const deptGroup = document.getElementById('departmentSelectGroup');
    if ((currentRole || '').toLowerCase() === 'head' || (currentRole || '').toLowerCase() === 'department_head') {
        deptGroup.style.display = 'block';
        document.getElementById('newDepartment').required = true;
        document.getElementById('newDepartment').value = currentDepartment || '';
    } else {
        deptGroup.style.display = 'none';
        document.getElementById('newDepartment').required = false;
        document.getElementById('newDepartment').value = '';
    }
    document.getElementById('assignRoleModal').style.display = 'flex';
}

function closeAssignRoleModal() {
    document.getElementById('assignRoleModal').style.display = 'none';
}

function openResetPasswordModal(userId, userName) {
    
    document.getElementById('resetUserId').value = userId;
    document.getElementById('resetUserDisplay').textContent = `User: ${userName}`;
    document.getElementById('resetPasswordForm').reset();
    document.getElementById('strengthIndicator').textContent = 'Weak';
    document.getElementById('strengthIndicator').className = 'weak';
    document.getElementById('resetPasswordModal').style.display = 'flex';
}

function closeResetPasswordModal() {
    document.getElementById('resetPasswordModal').style.display = 'none';
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('show');
    confirmedAction = null; // Clear the stored action
}

async function handleUserFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData();
    const userIdField = document.getElementById('userIdForEdit');
    const userId = userIdField ? userIdField.value : '';

    const firstName = (document.getElementById('firstName')?.value || '').trim();
    const lastName = (document.getElementById('lastName')?.value || '').trim();
    const email = (document.getElementById('email')?.value || '').trim();
    const username = email ? email.split('@')[0] : '';
    const role = (document.getElementById('role')?.value || '').trim();
    const departmentId = (document.getElementById('departmentUserModal')?.value || '').trim();

    formData.set('firstName', firstName);
    formData.set('lastName', lastName);
    formData.set('email', email);
    formData.set('username', username);
    formData.set('role', role);
    formData.set('department', departmentId);

    // Grab whatever the HTML input names are (usually password / confirm_password)
    const pwd = (document.getElementById('password')?.value || '').trim();
    const confirmPwd = (document.getElementById('confirmPassword')?.value || '').trim();

    // Force them into the names Django's CustomUserCreationForm expects
    if (pwd) formData.set('password1', pwd);
    if (confirmPwd) formData.set('password2', confirmPwd);

    // Validation
    if (pwd && pwd !== confirmPwd) {
        showAlert('Passwords do not match!', 'danger');
        return;
    }
    
    // Safety check: only check length if password actually exists
    if (pwd && pwd.length < 8) {
        showAlert('Password must be at least 8 characters long!', 'danger');
        return;
    }

    if (!departmentId) {
        showAlert('Please select a department for this role.', 'danger');
        return;
    }

    const url = userId ? `/accounts/edit-user/${userId}/` : '/accounts/create-user/';

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(data.message, 'success');
            closeUserModal();
            location.reload();
        } else {
            showAlert(data.message || 'An error occurred.', 'danger');
            if (data.errors) {
                console.error('Form errors:', data.errors);
                for (const field in data.errors) {
                    const errorList = data.errors[field];
                    // If Django returns an object, we get the message string
                    errorList.forEach(error => {
                        const msg = typeof error === 'string' ? error : error.message;
                        showAlert(`${field}: ${msg}`, 'danger');
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error submitting user form:', error);
        showAlert('An unexpected error occurred.', 'danger');
    }
}

async function handleAssignRoleSubmit(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.set('assignRoleUserId', document.getElementById('assignRoleUserId')?.value || '');
    formData.set('newRole', document.getElementById('newRole')?.value || '');
    formData.set('newDepartment', document.getElementById('newDepartment')?.value || '');

    if (!formData.get('newRole')) {
        showAlert('Please select a role!', 'danger');
        return;
    }

    if (formData.get('newRole') === 'head' && !formData.get('newDepartment')) {
        showAlert('Please select a department for department heads!', 'danger');
        return;
    }

    try {
        const response = await fetch('/accounts/assign-role/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(data.message, 'success');
            closeAssignRoleModal();
            location.reload();
        } else {
            showAlert(data.message || 'An error occurred.', 'danger');
            if (data.errors) {
                for (const field in data.errors) {
                    const errorList = data.errors[field];
                    errorList.forEach(error => showAlert(`${field}: ${error.message}`, 'danger'));
                }
            }
        }
    } catch (error) {
        console.error('Error assigning role:', error);
        showAlert('An unexpected error occurred.', 'danger');
    }
}

async function handleResetPasswordSubmit(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.set('resetUserId', document.getElementById('resetUserId')?.value || '');
    formData.set('newPassword', document.getElementById('newPassword')?.value || '');
    formData.set('confirmNewPassword', document.getElementById('confirmNewPassword')?.value || '');

    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmNewPassword');

    if (newPassword !== confirmPassword) {
        showAlert('Passwords do not match!', 'danger');
        return;
    }
    if (newPassword.length < 8) {
        showAlert('Password must be at least 8 characters long!', 'danger');
        return;
    }

    try {
        const response = await fetch('/accounts/reset-password/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(data.message, 'success');
            closeResetPasswordModal();
        } else {
            showAlert(data.message || 'An error occurred.', 'danger');
            if (data.errors) {
                for (const field in data.errors) {
                    const errorList = data.errors[field];
                    errorList.forEach(error => showAlert(`${field}: ${error.message}`, 'danger'));
                }
            }
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        showAlert('An unexpected error occurred.', 'danger');
    }
}

function updatePasswordStrength(e) {
    const password = e.target.value;
    const indicator = document.getElementById('strengthIndicator');
    updatePasswordStrengthDisplay(password, indicator);
}

function updatePasswordStrengthForCreateEdit(e) {
    const password = e.target.value;
    getPasswordStrength(password);
}

function getPasswordStrength(password) {
    if (!password) return 0;

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(password);

    const strength = [
        password.length >= 8,
        hasUppercase,
        hasLowercase,
        hasNumbers,
        hasSpecial
    ].filter(Boolean).length;

    return strength;
}

function updatePasswordStrengthDisplay(password, indicator) {
    const strength = getPasswordStrength(password);
    
    if (strength <= 2) {
        indicator.textContent = 'Weak';
        indicator.className = 'weak';
    } else if (strength <= 3) {
        indicator.textContent = 'Medium';
        indicator.className = 'medium';
    } else {
        indicator.textContent = 'Strong';
        indicator.className = 'strong';
    }
}

function applyFilters() {
    const searchTerm = (document.getElementById('userSearch').value || '').trim().toLowerCase();
    const roleFilter = document.getElementById('roleFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const departmentFilter = document.getElementById('departmentFilter').value;

    document.querySelectorAll('.user-row').forEach((row) => {
        const rowSearch = row.dataset.search || '';
        const rowRole = row.dataset.role || '';
        const rowStatus = row.dataset.status || '';
        const rowDepartmentId = row.dataset.departmentId || '';

        const searchOk = !searchTerm || rowSearch.includes(searchTerm);
        const roleOk = !roleFilter
            || rowRole === roleFilter
            || (roleFilter === 'hr' && ['hr_head', 'hr_evaluator'].includes(rowRole))
            || (roleFilter === 'head' && rowRole === 'department_head');
        const statusOk = !statusFilter || rowStatus === statusFilter;
        const deptOk = !departmentFilter || rowDepartmentId === departmentFilter;

        row.style.display = searchOk && roleOk && statusOk && deptOk ? '' : 'none';
    });
}

function clearFilters() {
    const userSearch = document.getElementById('userSearch');
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    const departmentFilter = document.getElementById('departmentFilter');

    if (userSearch) userSearch.value = '';
    if (roleFilter) roleFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (departmentFilter) departmentFilter.value = '';

    applyFilters();
}

function confirmUserStatusChange(userId, action) {
    const modal = document.getElementById('confirmModal');
    const message = document.getElementById('confirmMessage');
    
    let actionText = '';
    if (action === 'deactivate') actionText = 'deactivate';
    else if (action === 'activate') actionText = 'activate';
    else if (action === 'lock') actionText = 'lock';
    else if (action === 'unlock') actionText = 'unlock';

    message.textContent = `Are you sure you want to ${actionText} this user account?`;
    
    confirmedAction = { type: 'single', action: action, userId: userId };
    modal.style.display = 'flex'; 
}

// And for closing:
function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

async function performSingleAction(action, userId) {
    try {
        const formData = new FormData();
        formData.append('user_ids[]', userId);
        formData.append('action', action);

        const response = await fetch('/accounts/update-account-status/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(data.message, 'success');
            location.reload();
        } else {
            showAlert(data.message || 'An error occurred.', 'danger');
        }
    } catch (error) {
        console.error(`Error performing ${action} action:`, error);
        showAlert('An unexpected error occurred.', 'danger');
    }
}

function confirmDeleteUser(userId) {
    const modal = document.getElementById('confirmModal');
    const message = document.getElementById('confirmMessage');
    
    message.textContent = 'Are you sure you want to delete this user? This action cannot be undone.';
    
    confirmedAction = { type: 'single', action: 'delete', userId: userId };
    modal.style.display = 'flex';
}

async function performSingleDelete(userId) {
    try {
        const formData = new FormData();
        formData.append('user_ids[]', userId);

        const response = await fetch('/accounts/delete-user/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(data.message, 'success');
            location.reload();
        } else {
            showAlert(data.message || 'An error occurred.', 'danger');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('An unexpected error occurred.', 'danger');
    }
}

function bulkDeactivateUsers() {
    if (selectedUsers.length === 0) return;
    
    const modal = document.getElementById('confirmModal');
    const message = document.getElementById('confirmMessage');
    
    message.textContent = `Are you sure you want to deactivate ${selectedUsers.length} user(s)?`;
    confirmedAction = { type: 'bulk', action: 'deactivate', userIds: selectedUsers };
    modal.classList.add('show');
}

function bulkActivateUsers() {
    if (selectedUsers.length === 0) return;
    
    const modal = document.getElementById('confirmModal');
    const message = document.getElementById('confirmMessage');
    
    message.textContent = `Are you sure you want to activate ${selectedUsers.length} user(s)?`;
    confirmedAction = { type: 'bulk', action: 'activate', userIds: selectedUsers };
    modal.classList.add('show');
}

function bulkLockUsers() {
    if (selectedUsers.length === 0) return;
    
    const modal = document.getElementById('confirmModal');
    const message = document.getElementById('confirmMessage');
    
    message.textContent = `Are you sure you want to lock ${selectedUsers.length} user(s)?`;
    confirmedAction = { type: 'bulk', action: 'lock', userIds: selectedUsers };
    modal.classList.add('show');
}

function bulkUnlockUsers() {
    if (selectedUsers.length === 0) return;
    
    const modal = document.getElementById('confirmModal');
    const message = document.getElementById('confirmMessage');
    
    message.textContent = `Are you sure you want to unlock ${selectedUsers.length} user(s)?`;
    confirmedAction = { type: 'bulk', action: 'unlock', userIds: selectedUsers };
    modal.classList.add('show');
}

function bulkDeleteUsers() {
    if (selectedUsers.length === 0) return;
    
    const modal = document.getElementById('confirmModal');
    const message = document.getElementById('confirmMessage');
    
    message.textContent = `Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`;
    confirmedAction = { type: 'bulk', action: 'delete', userIds: selectedUsers };
    modal.classList.add('show');
}

async function performBulkAction(action, userIds) {
    try {
        const formData = new FormData();
        userIds.forEach(id => formData.append('user_ids[]', id));
        formData.append('action', action);

        const url = (action === 'delete') ? '/accounts/delete-user/' : '/accounts/update-account-status/';

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(data.message, 'success');
            location.reload();
        } else {
            showAlert(data.message || 'An error occurred.', 'danger');
        }
    } catch (error) {
        console.error(`Error performing bulk ${action} action:`, error);
        showAlert('An unexpected error occurred.', 'danger');
    }
}

function executeConfirmedAction() {
    if (!confirmedAction) return;

    closeConfirmModal(); // Close the confirm modal immediately

    if (confirmedAction.type === 'single') {
        if (confirmedAction.action === 'delete') {
            performSingleDelete(confirmedAction.userId);
        } else {
            performSingleAction(confirmedAction.action, confirmedAction.userId);
        }
    } else if (confirmedAction.type === 'bulk') {
        performBulkAction(confirmedAction.action, confirmedAction.userIds);
    }
}

function toggleDropdown(button) {
    const dropdown = button.closest('.action-cell');
    
    // Close all other dropdowns
    document.querySelectorAll('.action-cell.open').forEach(d => {
        if (d !== dropdown) d.classList.remove('open');
    });

    dropdown.classList.toggle('open');
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.action-cell')) {
        document.querySelectorAll('.action-cell.open').forEach(d => {
            d.classList.remove('open');
        });
    }
});

// Helper function to get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Debounce function for search input
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

function showAlert(message, type = 'info') {
    let alertContainer = document.getElementById('toastContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'toastContainer';
        alertContainer.style.position = 'fixed';
        alertContainer.style.top = '32px';
        alertContainer.style.right = '32px';
        alertContainer.style.zIndex = '2000';
        alertContainer.style.display = 'flex';
        alertContainer.style.flexDirection = 'column';
        alertContainer.style.gap = '12px';
        alertContainer.style.maxWidth = '420px';
        alertContainer.style.width = 'min(420px, calc(100vw - 40px))';
        alertContainer.style.pointerEvents = 'none';
        document.body.appendChild(alertContainer);
    }

    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.innerHTML = `<i class="fas fa-info-circle"></i> <span>${message}</span>`;
    alert.style.maxWidth = '400px';
    alert.style.margin = '0';
    alert.style.pointerEvents = 'auto';
    
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();

        if (alertContainer && !alertContainer.children.length) {
            alertContainer.remove();
        }
    }, 3000);
}
// This "pairs" your Save Button to your Saving Logic
document.addEventListener('DOMContentLoaded', function() {
    const userForm = document.getElementById('userForm');
    
    if (userForm) {
        // This tells the form: "When Save is clicked, run handleUserFormSubmit"
        userForm.addEventListener('submit', handleUserFormSubmit);
    } else {
        console.error("ERROR: Could not find the form with ID 'userForm'!");
    }
});