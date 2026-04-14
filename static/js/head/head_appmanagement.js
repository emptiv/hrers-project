/* ============================================================
   head_appmanagement.js
   Department Head - New Employee Applications only
   ============================================================ */

const headName = 'Department Head';
const HEAD_STAGE = 'pending-head';
let activeAppId = null;
let activeAppFilter = '';
let activeAppFilterLabel = '';
let activeDocPage = 1;

let appData = [];

function mapStatusForHead(status) {
    if (status === 'approved' || status === 'rejected') {
        return status;
    }
    return 'pending-head';
}

function mapLeaveToHeadApp(item) {
    const normalizedStatus = mapStatusForHead((item.status || '').toLowerCase());
    return {
        id: 'LR-' + item.id,
        sourceType: 'leave',
        sourceId: item.id,
        name: item.name || 'N/A',
        email: 'N/A',
        phoneNumber: 'N/A',
        dept: (item.role || 'N/A').replace(/_/g, ' '),
        applyingTo: (item.role || 'N/A').replace(/_/g, ' '),
        position: item.leaveType || 'Leave Request',
        applyingFor: item.leaveType || 'Leave Request',
        submitted: item.dateFiled || '---',
        progress: normalizedStatus === 'pending-head' ? 'In Review' : 'Completed',
        status: normalizedStatus,
        statusLabel: normalizedStatus === 'pending-head' ? 'Pending - Dept. Head' : (normalizedStatus === 'approved' ? 'Approved' : 'Rejected'),
        hrReviewedBy: item.reviewedBy || '---',
        hrReviewedAt: item.submitTime || '---',
        headReviewedBy: item.reviewedBy || '---',
        headReviewedAt: item.submitTime || '---',
        hrHeadReviewedBy: '---',
        hrHeadReviewedAt: '---',
        finalReviewedBy: item.reviewedBy || '---',
        finalReviewedAt: item.submitTime || '---',
        pendingWith: normalizedStatus === 'pending-head' ? 'Department Head' : 'Completed',
        remarks: item.reviewRemarks || 'Awaiting review.',
        headRemarks: item.reason || '---',
        fileName: item.fileName || 'No Document Attached'
    };
}

async function refreshHeadApplications() {
    try {
        const response = await fetch('/api/leave-requests?mode=all');
        if (!response.ok) {
            throw new Error('Failed to load applications');
        }
        const payload = await response.json();
        appData = (payload.items || []).map(mapLeaveToHeadApp);
    } catch (error) {
        appData = [];
    }
}

function isFinalStatus(status) {
    return status === 'approved' || status === 'rejected';
}

function canActOnApp(status) {
    return status === HEAD_STAGE;
}

function getStatusFilterLabel(status) {
    const labels = {
        'pending-hr': 'Status: Pending - HR Evaluator',
        'pending-head': 'Status: Pending - Dept. Head',
        'pending-hrhead': 'Status: Pending - HR Head',
        'pending-sd': 'Status: Pending - SD',
        approved: 'Status: Approved',
        rejected: 'Status: Rejected'
    };
    return labels[status] || '';
}

function matchesSearch(app, query) {
    if (!query) return true;
    const haystack = [
        app.id,
        app.name,
        app.dept,
        app.position,
        app.progress,
        app.statusLabel,
        app.pendingWith,
        app.remarks
    ].join(' ').toLowerCase();
    return haystack.indexOf(query) !== -1;
}

function syncFilterChip() {
    const row = document.getElementById('activeFilterRow');
    const label = document.getElementById('activeFilterLabel');
    if (!row || !label) return;

    if (!activeAppFilter) {
        row.hidden = true;
        row.style.display = 'none';
        label.innerText = '';
        return;
    }

    label.innerText = activeAppFilterLabel;
    row.hidden = false;
    row.style.display = 'flex';
}

function closeFilterMenu() {
    const menu = document.getElementById('filterMenu');
    const btn = document.getElementById('filterBtn');
    if (!menu || !btn) return;
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
}

function toggleFilterMenu() {
    const menu = document.getElementById('filterMenu');
    const btn = document.getElementById('filterBtn');
    if (!menu || !btn) return;

    const isOpen = menu.classList.contains('open');
    menu.classList.toggle('open', !isOpen);
    menu.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
    btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
}

function applyAppFilter(filterValue, filterLabel) {
    activeAppFilter = filterValue;
    activeAppFilterLabel = filterLabel || '';
    syncFilterChip();
    closeFilterMenu();
    renderTable();
}

function clearAppFilter() {
    activeAppFilter = '';
    activeAppFilterLabel = '';
    syncFilterChip();
    closeFilterMenu();
    renderTable();
}

function renderTable() {
    const body = document.getElementById('applicationTableBody');
    const template = document.getElementById('appRowTemplate');
    const query = document.getElementById('tableSearch').value.trim().toLowerCase();

    let filtered = appData.slice();

    if (activeAppFilter) {
        filtered = filtered.filter(function (app) { return app.status === activeAppFilter; });
    }

    if (query) {
        filtered = filtered.filter(function (app) { return matchesSearch(app, query); });
    }

    body.innerHTML = '';

    if (filtered.length === 0) {
        body.innerHTML = '<tr><td colspan="8" class="no-records">No records found.</td></tr>';
        return;
    }

    filtered.forEach(function (app) {
        const clone = template.content.cloneNode(true);
        const isFinal = isFinalStatus(app.status);
        const canAct = canActOnApp(app.status);

        clone.querySelector('.col-id').innerText = app.id;
        clone.querySelector('.col-name').innerText = app.name;
        clone.querySelector('.col-dept').innerText = app.dept;
        clone.querySelector('.col-position').innerText = app.position;
        clone.querySelector('.col-submitted').innerText = app.submitted;
        clone.querySelector('.col-progress').innerText = app.progress;
        clone.querySelector('.col-status').innerHTML = '<span class="status-pill ' + app.status + '">' + app.statusLabel + '</span>';

        const actionsCell = clone.querySelector('.col-actions');

        if (isFinal || !canAct) {
            actionsCell.innerHTML = '<span class="action-link view-link-btn">View Details</span>';
            actionsCell.querySelector('.view-link-btn').addEventListener('click', function () {
                openModal(app.id);
            });
        } else {
            actionsCell.innerHTML =
                '<div class="actions-cell">' +
                    '<span class="action-link view-link-btn">View Details</span>' +
                    '<div class="dropdown">' +
                        '<button class="update-link">Update <i class="fas fa-caret-down"></i></button>' +
                        '<div class="dropdown-content">' +
                            '<a href="#" class="approve-option">Approve</a>' +
                            '<a href="#" class="reject-option">Reject</a>' +
                        '</div>' +
                    '</div>' +
                '</div>';

            actionsCell.querySelector('.view-link-btn').addEventListener('click', function () {
                openModal(app.id);
            });
            actionsCell.querySelector('.approve-option').addEventListener('click', function (e) {
                e.preventDefault();
                processApp(app.id, 'Approved');
            });
            actionsCell.querySelector('.reject-option').addEventListener('click', function (e) {
                e.preventDefault();
                processApp(app.id, 'Rejected');
            });
        }

        body.appendChild(clone);
    });
}

function updateModalDocPage() {
    const page1 = document.getElementById('modalDocPage1');
    const page2 = document.getElementById('modalDocPage2');
    const pageName = document.getElementById('docPageName');
    const prevBtn = document.getElementById('docPrevBtn');
    const nextBtn = document.getElementById('docNextBtn');

    page1.hidden = activeDocPage !== 1;
    page2.hidden = activeDocPage !== 2;
    pageName.innerText = activeDocPage === 1 ? 'Page 1 - Application Details' : 'Page 2 - PDF View';
    prevBtn.disabled = activeDocPage === 1;
    nextBtn.disabled = activeDocPage === 2;
}

function setModalDocPage(pageNumber) {
    activeDocPage = pageNumber === 2 ? 2 : 1;
    updateModalDocPage();
}

function renderStatusHistory(app) {
    const container = document.getElementById('modalStatusHistory');
    const entries = [
        { title: 'Submitted', meta: app.name + ' on ' + (app.submitted || '---') }
    ];

    if (app.hrReviewedBy && app.hrReviewedBy !== '---') {
        entries.push({ title: 'Approved', meta: 'by ' + app.hrReviewedBy + ' on ' + (app.hrReviewedAt || '---') });
    }

    if (app.status === 'pending-head') {
        entries.push({ title: 'Pending', meta: 'with Department Head' });
    } else if (app.headReviewedBy && app.headReviewedBy !== '---') {
        entries.push({ title: 'Approved', meta: 'by ' + app.headReviewedBy + ' on ' + (app.headReviewedAt || '---') });
    }

    if (app.status === 'pending-hrhead') {
        entries.push({ title: 'Pending', meta: 'with HR Head' });
    } else if (app.hrHeadReviewedBy && app.hrHeadReviewedBy !== '---') {
        entries.push({ title: 'Approved', meta: 'by ' + app.hrHeadReviewedBy + ' on ' + (app.hrHeadReviewedAt || '---') });
    }

    if (app.status === 'pending-sd') {
        entries.push({ title: 'Pending', meta: 'with School Director' });
    } else if (app.status === 'approved') {
        entries.push({ title: 'Approved', meta: 'by ' + (app.finalReviewedBy || 'School Director') + ' on ' + (app.finalReviewedAt || '---') });
    } else if (app.status === 'rejected') {
        entries.push({ title: 'Rejected', meta: 'by ' + (app.finalReviewedBy || 'School Director') + ' on ' + (app.finalReviewedAt || '---') });
    }

    container.innerHTML = entries.map(function (entry, index) {
        const markerClass = index === entries.length - 1 ? ' current' : '';
        return '<div class="status-history-entry' + markerClass + '">' +
            '<span class="status-history-dot"></span>' +
            '<div class="status-history-copy">' +
                '<div class="status-history-title">' + entry.title + '</div>' +
                '<div class="status-history-meta">' + entry.meta + '</div>' +
            '</div>' +
        '</div>';
    }).join('');
}

function openModal(id) {
    activeAppId = id;
    activeDocPage = 1;

    const app = appData.find(function (a) { return a.id === id; });
    if (!app) return;

    document.getElementById('modalApplicantName').innerText = app.name || 'Application Detail';
    document.getElementById('modalApplicationId').innerText = app.id || '---';
    document.getElementById('modalApplicantEmail').innerText = app.email || '---';
    document.getElementById('modalApplicantPhone').innerText = app.phoneNumber || '---';
    document.getElementById('modalApplyingDepartment').innerText = app.applyingTo || app.dept || '---';
    document.getElementById('modalApplyingPosition').innerText = app.applyingFor || app.position || '---';
    document.getElementById('modalHeadRemarks').innerText = app.headRemarks || '---';
    document.getElementById('modalAddRemarks').value = app.remarks || '';
    document.getElementById('modalFileName').innerText = app.fileName || 'Document.pdf';
    document.getElementById('modalSubmitDate').innerText = app.submitted || '---';
    document.getElementById('modalDepartment').innerText = app.dept || '---';
    document.getElementById('modalPosition').innerText = app.position || '---';
    document.getElementById('modalProgress').innerText = app.progress || '---';
    document.getElementById('modalRemarks').innerText = app.remarks || 'Awaiting review.';
    document.getElementById('modalStatusContainer').innerHTML = '<span class="status-pill ' + app.status + '">' + app.statusLabel + '</span>';
    document.getElementById('pdfPlaceholder').innerHTML = '<i class="fas fa-file-pdf"></i><p>Preview for ' + (app.fileName || 'Document.pdf') + '</p>';

    renderStatusHistory(app);
    updateModalDocPage();

    document.getElementById('modalActions').style.display = (!isFinalStatus(app.status) && canActOnApp(app.status)) ? 'flex' : 'none';
    document.getElementById('viewModal').style.display = 'flex';
}

function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
}

async function processApp(id, decision) {
    const app = appData.find(function (a) { return a.id === id; });
    if (!app) return;

    if (!canActOnApp(app.status)) {
        return;
    }

    const formData = new FormData();
    formData.append('decision', decision.toLowerCase());
    formData.append('remarks', document.getElementById('modalAddRemarks').value.trim());

    try {
        const response = await fetch('/api/leave-requests/' + app.sourceId + '/decision', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            throw new Error('Failed to update application');
        }

        await refreshHeadApplications();
        renderTable();
        closeViewModal();
    } catch (error) {
        // Keep current UI state if request fails.
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const logoToggle = document.getElementById('logoToggle');
    const closeBtn = document.getElementById('closeBtn');
    const viewModal = document.getElementById('viewModal');
    const filterBtn = document.getElementById('filterBtn');
    const filterMenu = document.getElementById('filterMenu');
    const clearBtn = document.getElementById('clearFilterBtn');
    const prevDocBtn = document.getElementById('docPrevBtn');
    const nextDocBtn = document.getElementById('docNextBtn');

    document.querySelectorAll('.menu-item').forEach(function (item) {
        const span = item.querySelector('span');
        if (span) item.setAttribute('data-text', span.textContent.trim());
    });

    if (closeBtn) closeBtn.onclick = function () { sidebar.classList.add('collapsed'); };
    if (logoToggle) logoToggle.onclick = function () { sidebar.classList.toggle('collapsed'); };

    if (filterBtn) {
        filterBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleFilterMenu();
        });
    }

    if (filterMenu) {
        filterMenu.querySelectorAll('.filter-option').forEach(function (option) {
            option.addEventListener('click', function () {
                if (option.dataset.filterClear === 'true') {
                    clearAppFilter();
                    return;
                }
                applyAppFilter(option.dataset.filterValue, getStatusFilterLabel(option.dataset.filterValue));
            });
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            clearAppFilter();
        });
    }

    if (prevDocBtn) {
        prevDocBtn.addEventListener('click', function () {
            setModalDocPage(activeDocPage - 1);
        });
    }

    if (nextDocBtn) {
        nextDocBtn.addEventListener('click', function () {
            setModalDocPage(activeDocPage + 1);
        });
    }

    document.getElementById('tableSearch').addEventListener('input', renderTable);

    document.getElementById('modalApproveBtn').addEventListener('click', function () {
        processApp(activeAppId, 'Approved');
    });

    document.getElementById('modalRejectBtn').addEventListener('click', function () {
        processApp(activeAppId, 'Rejected');
    });

    document.getElementById('modalCloseBtn').addEventListener('click', closeViewModal);

    window.addEventListener('click', function (e) {
        if (!e.target.closest('.filter-dropdown')) {
            closeFilterMenu();
        }
        if (e.target === viewModal) {
            closeViewModal();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeFilterMenu();
            closeViewModal();
        }
    });

    syncFilterChip();
    refreshHeadApplications().then(function () {
        renderTable();
    });
});
