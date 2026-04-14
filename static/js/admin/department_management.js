/* =================================
   Department Management JavaScript
   ================================= */

let currentEditingDeptId = null;
let departmentsData = [];
let headCandidates = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeDepartmentManagement();
});

function initializeDepartmentManagement() {
    loadDepartmentManagementData();
    setupEventListeners();
    setupViewToggle();
    setupSearchAndFilters();
}

async function loadDepartmentManagementData() {
    try {
        const [departmentsResponse, headsResponse] = await Promise.all([
            fetch('/accounts/departments'),
            fetch('/accounts/department-head-candidates'),
        ]);

        const departmentsPayload = departmentsResponse.ok ? await departmentsResponse.json() : { items: [] };
        const headsPayload = headsResponse.ok ? await headsResponse.json() : { items: [] };

        departmentsData = Array.isArray(departmentsPayload.items) ? departmentsPayload.items : [];
        headCandidates = Array.isArray(headsPayload.items) ? headsPayload.items : [];

        renderDepartments(departmentsData);
        renderHeadCandidates(headCandidates);
    } catch (error) {
        departmentsData = [];
        renderDepartments([]);
    }
}

function formatCreatedDate(isoString) {
    if (!isoString) return '--';
    const value = new Date(isoString);
    if (Number.isNaN(value.getTime())) return '--';
    return value.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
}

function renderDepartments(items) {
    const grid = document.getElementById('departmentsGrid');
    const tableBody = document.getElementById('departmentsTableBody');
    if (!grid || !tableBody) return;

    if (!items.length) {
        grid.innerHTML = '<p style="padding:16px;">No departments found.</p>';
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">No departments found.</td></tr>';
        return;
    }

    grid.innerHTML = items.map((dept) => {
        const headLabel = dept.headName
            ? `<p class="info-value"><i class="fas fa-user-circle"></i> ${dept.headName}</p>`
            : '<p class="info-value unassigned"><i class="fas fa-user-slash"></i> Not Assigned</p>';

        return `
            <div class="department-card" data-dept-id="${dept.id}">
                <div class="card-header">
                    <h3>${dept.name}</h3>
                    <button class="action-btn" onclick="toggleCardDropdown(this)">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="dropdown-menu">
                        <a href="#" class="dropdown-item edit-dept" data-dept-id="${dept.id}"><i class="fas fa-edit"></i> Edit</a>
                        <a href="#" class="dropdown-item assign-head" data-dept-id="${dept.id}"><i class="fas fa-user-tie"></i> Assign Head</a>
                        <hr>
                        <a href="#" class="dropdown-item delete-dept" data-dept-id="${dept.id}"><i class="fas fa-trash"></i> Delete</a>
                    </div>
                </div>
                <div class="card-body">
                    <div class="dept-info">
                        <div class="info-group">
                            <span class="info-label">Department Head</span>
                            ${headLabel}
                        </div>
                        <div class="info-group">
                            <span class="info-label">Total Employees</span>
                            <p class="info-value">${Number(dept.employeeCount || 0)}</p>
                        </div>
                        <div class="info-group">
                            <span class="info-label">Email</span>
                            <p class="info-value">${dept.email || '--'}</p>
                        </div>
                        <div class="info-group">
                            <span class="info-label">Location</span>
                            <p class="info-value">${dept.location || '--'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    tableBody.innerHTML = items.map((dept) => `
        <tr class="dept-row" data-dept-id="${dept.id}">
            <td><strong>${dept.name}</strong></td>
            <td>${dept.headName || '<span class="unassigned">Not Assigned</span>'}</td>
            <td>${Number(dept.employeeCount || 0)}</td>
            <td>${dept.email || '--'}</td>
            <td>${dept.location || '--'}</td>
            <td>${formatCreatedDate(dept.createdAt)}</td>
            <td class="action-cell">
                <button class="action-btn" onclick="toggleDropdown(this)">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="dropdown-menu">
                    <a href="#" class="dropdown-item edit-dept" data-dept-id="${dept.id}"><i class="fas fa-edit"></i> Edit</a>
                    <a href="#" class="dropdown-item assign-head" data-dept-id="${dept.id}"><i class="fas fa-user-tie"></i> Assign Head</a>
                    <hr>
                    <a href="#" class="dropdown-item delete-dept" data-dept-id="${dept.id}"><i class="fas fa-trash"></i> Delete</a>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderHeadCandidates(items) {
    const list = document.getElementById('headList');
    if (!list) return;

    if (!items.length) {
        list.innerHTML = '<div class="head-option">No eligible users found.</div>';
        return;
    }

    list.innerHTML = items.map((item) => {
        const candidateId = Number(item.id || 0);
        const safeName = String(item.name || 'Unknown').replace(/"/g, '&quot;');
        return `
            <div class="head-option" data-user-id="${candidateId}">
                <input type="radio" name="head_id" value="${candidateId}" id="head_${candidateId}">
                <label for="head_${candidateId}">
                    <span class="head-name">${safeName}</span>
                    <span class="head-email">${item.email || '--'}</span>
                </label>
            </div>
        `;
    }).join('');
}

function setupEventListeners() {
    document.body.addEventListener('click', function(e) {
        const editBtn = e.target.closest('.edit-dept');
        if (editBtn) {
            e.preventDefault();
            editDepartment(editBtn.dataset.deptId);
        }

        const assignBtn = e.target.closest('.assign-head');
        if (assignBtn) {
            e.preventDefault();
            openAssignHeadModal(assignBtn.dataset.deptId);
        }

        const deleteBtn = e.target.closest('.delete-dept');
        if (deleteBtn) {
            e.preventDefault();
            confirmDeleteDepartment(deleteBtn.dataset.deptId);
        }
    });

    // Add Department Button
    document.getElementById('addDepartmentBtn')?.addEventListener('click', openDepartmentModal);

    // Edit Department Links
    document.querySelectorAll('.edit-dept').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const deptId = this.dataset.deptId;
            editDepartment(deptId);
        });
    });

    // Assign Head Links
    document.querySelectorAll('.assign-head').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const deptId = this.dataset.deptId;
            openAssignHeadModal(deptId);
        });
    });

    // Delete Department
    document.querySelectorAll('.delete-dept').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const deptId = this.dataset.deptId;
            confirmDeleteDepartment(deptId);
        });
    });

    // Modal Close Buttons
    document.querySelectorAll('.modal .close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('show');
        });
    });

    // Form Submissions
    document.getElementById('departmentForm')?.addEventListener('submit', handleDepartmentFormSubmit);
    document.getElementById('assignHeadForm')?.addEventListener('submit', handleAssignHeadSubmit);

    // Head search floating menu behavior
    const headSearch = document.getElementById('headSearch');
    const headList = document.getElementById('headList');
    
    if (headSearch) {
        headSearch.addEventListener('keyup', searchHeads);
        headSearch.addEventListener('focus', function() {
            if (headList) headList.style.display = 'block';
        });
    }

    // Update search input when an option is selected
    headList?.addEventListener('change', function(e) {
        const radio = e.target;
        if (!(radio instanceof HTMLInputElement) || radio.type !== 'radio') return;
        if (!radio.checked || !headSearch) return;

        const label = headList.querySelector(`label[for="${radio.id}"]`);
        const nameSpan = label?.querySelector('.head-name');
        if (nameSpan) {
            headSearch.value = nameSpan.textContent;
        }
        headList.style.display = 'none';
    });

    // Confirm Modal Button
    document.getElementById('confirmBtn')?.addEventListener('click', executeConfirmedAction);
}

function setupViewToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;
            
            // Update active state
            toggleButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Toggle views
            if (view === 'grid') {
                document.getElementById('departmentsGrid').style.display = 'grid';
                document.getElementById('departmentsTable').style.display = 'none';
            } else {
                document.getElementById('departmentsGrid').style.display = 'none';
                document.getElementById('departmentsTable').style.display = 'block';
            }
        });
    });
}

function setupSearchAndFilters() {
    document.getElementById('departmentSearch')?.addEventListener('keyup', function() {
        const searchTerm = this.value.toLowerCase();
        filterDepartments(searchTerm);
    });

    document.getElementById('headFilter')?.addEventListener('change', function() {
        const filterValue = this.value;
        filterDepartmentsByHead(filterValue);
    });
}

function openDepartmentModal() {
    const modal = document.getElementById('departmentModal');
    const form = document.getElementById('departmentForm');
    
    document.getElementById('deptModalTitle').textContent = 'Add Department';
    document.getElementById('deptId').value = '';
    form.reset();
    currentEditingDeptId = null;
    
    modal.classList.add('show');
}

function closeDepartmentModal() {
    document.getElementById('departmentModal').classList.remove('show');
}

async function editDepartment(deptId) {
    currentEditingDeptId = deptId;
    try {
        const response = await fetch(`/accounts/get-department-data/${deptId}/`);
        if (!response.ok) throw new Error('Failed to fetch department data.');
        const data = await response.json();

        document.getElementById('deptModalTitle').textContent = 'Edit Department';
        document.getElementById('deptId').value = deptId;
        document.getElementById('deptName').value = data.name;
        document.getElementById('deptEmail').value = data.email || '';
        document.getElementById('deptLocation').value = data.location || '';
        document.getElementById('deptBudget').value = data.budget ?? '';

        document.getElementById('departmentModal').classList.add('show');
    } catch (error) {
        showAlert('Error fetching department details.', 'danger');
    }
}

function openAssignHeadModal(deptId) {
    const card = document.querySelector(`[data-dept-id="${deptId}"]`);
    const deptName = card?.querySelector('h3')?.textContent || 'this department';
    
    document.getElementById('assignHeadDeptId').value = deptId;
    document.getElementById('deptNameDisplay').textContent = `Department: ${deptName}`;
    document.getElementById('assignHeadForm').reset();
    document.getElementById('headSearch').value = '';
    
    document.getElementById('assignHeadModal').classList.add('show');
}

function closeAssignHeadModal() {
    document.getElementById('assignHeadModal').classList.remove('show');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('show');
}

function searchHeads(e) {
    const searchTerm = e.target.value.toLowerCase();
    const headList = document.getElementById('headList');
    
    if (headList) headList.style.display = 'block';
    
    document.querySelectorAll('.head-option').forEach(option => {
        const text = (option.textContent || '').toLowerCase();
        option.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

async function handleDepartmentFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const deptId = document.getElementById('deptId').value;
    const url = deptId ? `/accounts/edit-department/${deptId}/` : '/accounts/create-department/';

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: { 'X-CSRFToken': getCookie('csrftoken') }
        });
        const data = await response.json();
        if (response.ok) {
            showAlert(data.message, 'success');
            location.reload();
        } else {
            showAlert(data.message || 'Error saving department.', 'danger');
        }
    } catch (error) {
        showAlert('An unexpected error occurred.', 'danger');
    }
}

async function handleAssignHeadSubmit(e) {
    e.preventDefault();
    const deptId = document.getElementById('assignHeadDeptId').value;
    const headId = document.querySelector('input[name="head_id"]:checked')?.value;

    if (!headId) {
        showAlert('Please select a department head!', 'danger');
        return;
    }

    const formData = new FormData();
    formData.append('head', headId);
    const deptInfo = departmentsData.find((item) => Number(item.id) === Number(deptId));
    formData.append('name', deptInfo ? deptInfo.name : '');

    try {
        const response = await fetch(`/accounts/edit-department/${deptId}/`, {
            method: 'POST',
            body: formData,
            headers: { 'X-CSRFToken': getCookie('csrftoken') }
        });
        const data = await response.json();
        if (response.ok) {
            showAlert('Head assigned successfully!', 'success');
            location.reload();
        } else {
            showAlert('Error assigning head.', 'danger');
        }
    } catch (error) {
        showAlert('An unexpected error occurred.', 'danger');
    }
}

function filterDepartments(searchTerm) {
    // Filter Grid View
    document.querySelectorAll('#departmentsGrid .department-card[data-dept-id]').forEach(card => {
        const deptName = card.querySelector('h3')?.textContent.toLowerCase() || '';
        card.style.display = deptName.includes(searchTerm) ? '' : 'none';
    });

    // Filter Table View
    document.querySelectorAll('.dept-row').forEach(row => {
        const rowText = row.textContent.toLowerCase();
        row.style.display = rowText.includes(searchTerm) ? '' : 'none';
    });
}

function filterDepartmentsByHead(filterValue) {
    if (filterValue === '') {
        // Show all
        document.querySelectorAll('#departmentsGrid .department-card[data-dept-id], .dept-row').forEach(el => {
            el.style.display = '';
        });
        return;
    }

    // Filter Grid View
    document.querySelectorAll('#departmentsGrid .department-card[data-dept-id]').forEach(card => {
        const hasHead = !card.querySelector('.unassigned');
        const show = (filterValue === 'assigned' && hasHead) || 
                     (filterValue === 'unassigned' && !hasHead);
        card.style.display = show ? '' : 'none';
    });

    // Filter Table View
    document.querySelectorAll('.dept-row').forEach(row => {
        const hasUnassigned = row.textContent.includes('Not Assigned');
        const show = (filterValue === 'assigned' && !hasUnassigned) || 
                     (filterValue === 'unassigned' && hasUnassigned);
        row.style.display = show ? '' : 'none';
    });
}

function confirmDeleteDepartment(deptId) {
    const modal = document.getElementById('confirmModal');
    const message = document.getElementById('confirmMessage');
    
    message.textContent = 'Are you sure you want to deactivate this department? This will preserve existing records but prevent new assignments.';
    
    document.getElementById('confirmBtn').onclick = function() {
        deactivateDepartment(deptId);
        closeConfirmModal();
    };

    modal.classList.add('show');
}

async function deactivateDepartment(deptId) {
    try {
        const response = await fetch(`/accounts/deactivate-department/${deptId}/`, {
            method: 'POST',
            headers: { 'X-CSRFToken': getCookie('csrftoken') }
        });
        const data = await response.json();
        if (response.ok) {
            showAlert(data.message, 'success');
            location.reload();
        } else {
            showAlert('Error deactivating department.', 'danger');
        }
    } catch (error) {
        showAlert('An unexpected error occurred.', 'danger');
    }
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function executeConfirmedAction() {
    if (typeof confirmedAction !== 'undefined' && confirmedAction) {
        // Implementation logic if needed for this specific page
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

function toggleCardDropdown(button) {
    const card = button.closest('.department-card');
    const dropdown = card?.querySelector('.dropdown-menu');
    
    // Close all other dropdowns
    document.querySelectorAll('.department-card .dropdown-menu').forEach(d => {
        if (d !== dropdown) d.style.display = 'none';
    });

    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.action-cell') && 
        !e.target.closest('.department-card')) {
        document.querySelectorAll('.action-cell.open').forEach(d => d.classList.remove('open'));
        document.querySelectorAll('.department-card .dropdown-menu').forEach(d => {
            d.style.display = 'none';
        });
    }

    // Also close the custom head search dropdown when clicking outside
    const headList = document.getElementById('headList');
    if (headList && !e.target.closest('.head-selection')) {
        headList.style.display = 'none';
    }
});

function showAlert(message, type = 'info') {
    // Create a simple alert (in real app, would use a toast notification library)
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.innerHTML = `<i class="fas fa-info-circle"></i> <span>${message}</span>`;
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '2000';
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}
