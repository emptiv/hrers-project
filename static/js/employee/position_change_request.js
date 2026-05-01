/* position_change_request.js */

document.addEventListener('DOMContentLoaded', () => {
    const sidebar        = document.getElementById('sidebar');
    const logoToggle     = document.getElementById('logoToggle');
    const closeBtn       = document.getElementById('closeBtn');
    const menuItems      = document.querySelectorAll('.menu-item');
    const positionForm   = document.getElementById('positionForm');
    const empNameInput   = document.getElementById('empName');
    const cancelBtn      = document.getElementById('cancelBtn');
    const submitBtn      = document.getElementById('submitBtn');
    const recordsBtn     = document.getElementById('recordsBtn');

    // ── Static modal elements (defined in HTML) ──
    const cancelModal      = document.getElementById('cancelModal');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    const stayBtn          = document.getElementById('stayBtn');

    async function autoFillEmployeeDetails() {
        const empIdEl = document.getElementById('empId');
        const currentPosEl = document.getElementById('currentPos');
        const currentDeptEl = document.getElementById('currentDept');

        try {
            const response = await fetch('/api/profile/me');
            if (response.ok) {
                const payload = await response.json();
                empNameInput.value = payload.fullName || '';
                empIdEl.value = payload.employeeNo || payload.id || '';
                currentPosEl.value = payload.position || payload.roleLabel || '';
                currentDeptEl.value = payload.department || '';
                return;
            }
        } catch (error) {
        }

        empIdEl.value = '';
        currentPosEl.value = '';
        currentDeptEl.value = '';
    }

    // Initialize tooltip labels for collapsed sidebar
    menuItems.forEach(item => {
        const span = item.querySelector('span');
        if (span) item.setAttribute('data-text', span.innerText);
    });

    // Sidebar toggle
    if (closeBtn)   closeBtn.onclick   = () => sidebar.classList.add('collapsed');
    if (logoToggle) logoToggle.onclick = () => sidebar.classList.toggle('collapsed');

    autoFillEmployeeDetails();

    // ── Cancel button → show static modal ──
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            cancelModal.classList.add('active');
        });
    }

    // "YES, CANCEL" → reset form and close modal
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', () => {
            cancelModal.classList.remove('active');
            resetForm();
        });
    }

    // "NO, STAY" → just close modal
    if (stayBtn) {
        stayBtn.addEventListener('click', () => {
            cancelModal.classList.remove('active');
        });
    }

    if (recordsBtn) {
        recordsBtn.addEventListener('click', async () => {
            // Show inline records view and load user's position requests
            showRecordsView();
        });
    }

    const recordsView = document.getElementById('recordsView');
    const recordsContainer = document.getElementById('recordsContainer');
    const tabNew = document.getElementById('tabNewRequest');

    if (tabNew) {
        tabNew.addEventListener('click', () => {
            // show form, hide records
            tabNew.classList.add('active');
            if (recordsBtn) recordsBtn.classList.remove('active');
            if (recordsView) recordsView.style.display = 'none';
            if (positionForm) positionForm.style.display = '';
        });
    }

    async function showRecordsView() {
        if (tabNew) tabNew.classList.remove('active');
        if (recordsBtn) recordsBtn.classList.add('active');
        if (positionForm) positionForm.style.display = 'none';
        if (recordsView) recordsView.style.display = '';
        if (recordsContainer) {
            recordsContainer.innerHTML = '<p class="muted">Loading...</p>';
        }
        await fetchAndRenderRecords();
    }

    async function fetchAndRenderRecords() {
        try {
            const res = await fetch('/api/position-requests');
            if (!res.ok) throw new Error('Unable to load records');
            const payload = await res.json();
            const items = Array.isArray(payload.items) ? payload.items : [];
            renderRecords(items);
        } catch (err) {
            if (recordsContainer) recordsContainer.innerHTML = `<p class="muted">${err.message}</p>`;
        }
    }

    function renderRecords(items) {
        if (!recordsContainer) return;
        if (!items || items.length === 0) {
            recordsContainer.innerHTML = '<p class="muted">You have no position change requests.</p>';
            return;
        }

        // Stage order for the progress pipeline display
        const STAGES = [
            { key: 'hr_evaluator',    label: 'HR Evaluator' },
            { key: 'hr_head',         label: 'HR Head'      },
            { key: 'school_director', label: 'School Director' }
        ];

        function buildPipeline(item) {
            if (item.status === 'Approved') {
                return '<span style="color:#16a34a;font-weight:600;">&#10003; Fully Approved</span>';
            }
            if (item.status === 'Rejected') {
                return '<span style="color:#dc2626;font-weight:600;">&#10007; Rejected</span>';
            }
            var stage = (item.approvalStage || 'hr_evaluator').toLowerCase();
            return STAGES.map(function(s) {
                var done    = false;
                var current = false;
                if (stage === 'hr_head')         { done = s.key === 'hr_evaluator'; current = s.key === 'hr_head'; }
                else if (stage === 'school_director') { done = s.key === 'hr_evaluator' || s.key === 'hr_head'; current = s.key === 'school_director'; }
                else { current = s.key === 'hr_evaluator'; }
                var color  = done ? '#16a34a' : (current ? '#2563eb' : '#9ca3af');
                var weight = current ? '700' : '400';
                var dot    = done ? '&#10003;' : (current ? '&#9679;' : '&#9675;');
                return '<span style="color:' + color + ';font-weight:' + weight + ';margin-right:6px;">' + dot + ' ' + s.label + '</span>';
            }).join('<span style="color:#d1d5db;margin-right:6px;">&rsaquo;</span>');
        }

        let html = `
            <table class="records-table" style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="text-align:left; border-bottom:1px solid #ddd;">
                        <th style="padding:8px;">Request ID</th>
                        <th style="padding:8px;">Submitted</th>
                        <th style="padding:8px;">Requested Position</th>
                        <th style="padding:8px;">Effective Date</th>
                        <th style="padding:8px;">Approval Progress</th>
                        <th style="padding:8px;">Remarks</th>
                    </tr>
                </thead>
                <tbody>`;

        items.forEach(item => {
            const requestId = 'PCR-' + (item.id || '---');
            const submitted = item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '';
            const eff       = item.effectiveDate ? new Date(item.effectiveDate).toLocaleDateString() : '';
            const remarks   = item.reviewRemarks || '';
            html += `<tr style="border-bottom:1px solid #f2f2f2;">
                <td style="padding:8px; vertical-align:top; font-weight:600;">${escapeHtml(requestId)}</td>
                <td style="padding:8px; vertical-align:top;">${submitted}</td>
                <td style="padding:8px; vertical-align:top;">${escapeHtml(item.requestedPosition || '')}</td>
                <td style="padding:8px; vertical-align:top;">${eff}</td>
                <td style="padding:8px; vertical-align:top; font-size:0.85em;">${buildPipeline(item)}</td>
                <td style="padding:8px; vertical-align:top; font-size:0.85em;">${escapeHtml(remarks)}</td>
            </tr>`;
        });

        html += '</tbody></table>';
        recordsContainer.innerHTML = html;
    }

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"]/g, function (s) {
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]);
        });
    }

    // Close modal on backdrop click
    cancelModal.addEventListener('click', (e) => {
        if (e.target === cancelModal) {
            cancelModal.classList.remove('active');
        }
    });

    // ── Submit form ──
    if (positionForm) {
        positionForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const empName      = document.getElementById('empName').value.trim();
            const currentPos   = document.getElementById('currentPos').value.trim();
            const currentDept  = document.getElementById('currentDept').value.trim();
            const requestedPos = document.getElementById('requestedPos').value;
            const effectiveDate = document.getElementById('effectiveDate').value;
            const reason       = document.getElementById('reason').value.trim();

            if (!empName || !requestedPos || !effectiveDate || !reason) {
                showToast('Please fill in all required fields.');
                return;
            }

            // Prepare form data — employee_no is not sent; backend reads it from session
            const formData = new FormData();
            formData.append('current_position',   currentPos);
            formData.append('current_department', currentDept);
            formData.append('requested_position', requestedPos);
            formData.append('effective_date',     effectiveDate);
            formData.append('reason',             reason);

            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            try {
                const response = await fetch('/api/position-requests', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    showSuccessNotification('Request successfully submitted. Awaiting HR Evaluator review.');
                    resetForm();
                    setTimeout(() => { showRecordsView(); }, 2000);
                } else {
                    const error = await response.json();
                    // Surface specific backend error messages (e.g., already has pending request)
                    showToast(error.detail || 'Failed to submit request. Please try again.');
                }
            } catch (error) {
                showToast('An error occurred while submitting your request. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit';
            }
        });
    }

    function resetForm() {
        document.getElementById('positionForm').reset();
        document.getElementById('empId').value       = '';
        document.getElementById('currentPos').value  = '';
        document.getElementById('currentDept').value = '';
    }
});

// ── Success Notification (toast) ──
function showSuccessNotification(message) {
    const container = getToastContainer();

    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.innerHTML = `
        <i class="fas fa-check-circle toast-icon"></i>
        <div class="toast-content">
            <h4>Request Submitted</h4>
            <p>${message}</p>
        </div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;

    attachToastClose(toast);
    container.appendChild(toast);
    autoRemoveToast(toast);
}

// ── Error Toast ──
function showToast(message) {
    const container = getToastContainer();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeftColor = '#ef4444';
    toast.innerHTML = `
        <i class="fas fa-exclamation-circle toast-icon" style="color:#ef4444;"></i>
        <div class="toast-content">
            <h4>Validation Error</h4>
            <p>${message}</p>
        </div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;

    attachToastClose(toast);
    container.appendChild(toast);
    autoRemoveToast(toast);
}

function getToastContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toast-container';
        document.body.appendChild(c);
    }
    return c;
}

function attachToastClose(toast) {
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'toastExit 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    });
}

function autoRemoveToast(toast) {
    setTimeout(() => {
        toast.style.animation = 'toastExit 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}