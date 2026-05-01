function setupProfileViewPage() {
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('closeBtn');
    const logoToggle = document.getElementById('logoToggle');
    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach((item) => {
        const span = item.querySelector('span');
        if (span) item.setAttribute('data-text', span.innerText);
    });

    if (sidebar && closeBtn) {
        closeBtn.onclick = () => sidebar.classList.toggle('close');
    }

    if (sidebar && logoToggle) {
        logoToggle.onclick = () => sidebar.classList.toggle('close');
    }

    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content-item');

    tabs.forEach((btn) => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');

            tabs.forEach((t) => t.classList.remove('active'));
            tabContents.forEach((c) => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(targetId)?.classList.add('active');
        });
    });
}

/* =========================
   PROFILE FILL (FIXED IDs)
   ========================= */
function applyProfileToView(profile) {
    document.getElementById('employeeName').textContent =
        profile.fullName || 'School Director';

    document.getElementById('employeeRole').textContent =
        profile.position || profile.roleLabel || 'School Director';

    document.getElementById('employeeId').textContent =
        `Employee ID: ${profile.employeeNo || profile.id || '--'}`;

    document.getElementById('employeeStatus').textContent =
        profile.isActive ? 'Active' : 'Inactive';

    document.getElementById('statusDot').style.background =
        profile.isActive ? '#8ddf9b' : '#f08d8d';

    document.getElementById('employeePosition').textContent =
        profile.position || '--';

    document.getElementById('employeeDepartment').textContent =
        profile.department || '--';

    document.getElementById('employeeType').textContent =
        profile.employmentType || '--';

    document.getElementById('employeeDateHired').textContent =
        profile.dateHired || '--';

    document.getElementById('contactEmail').textContent =
        profile.email || '--';

    document.getElementById('contactPhone').textContent =
        profile.contactNumber || '--';

    document.getElementById('contactLocation').textContent =
        profile.address || '--';

    document.getElementById('deptName').textContent =
        profile.department || '--';

    // =========================
    // RENDER DOCUMENTS
    // =========================
    const docBody = document.querySelector('.doc-table tbody');
    if (docBody) {
        const documents = profile.documents || [];
        
        if (!documents.length) {
            docBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:#999;">No documents uploaded yet.</td></tr>';
        } else {
            docBody.innerHTML = documents.map((doc) => {
                const statusClass = doc.status && doc.status.toLowerCase() === 'approved' ? 'valid' : 
                                   (doc.status && doc.status.toLowerCase() === 'rejected' ? 'missing' : 'update');
                return `
                    <tr>
                        <td>${doc.name || 'Document'}</td>
                        <td>${doc.type || 'FILE'}</td>
                        <td class="${statusClass}">${doc.status || 'Submitted'}</td>
                        <td>${doc.dateUploaded || '--'}</td>
                        <td class="actions">
                            ${doc.url ? `<a href="${doc.url}?mode=inline" target="_blank" title="View"><i class="fas fa-eye action-icon"></i></a>
                                        <a href="${doc.url}?mode=attachment" download title="Download"><i class="fas fa-download action-icon"></i></a>` : '---'}
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
}

/* =========================
   LOAD PROFILE (WITH HISTORY AND DOCUMENTS)
   ========================= */
async function loadProfileViewData() {
    try {
        const response = await fetch('/api/profile/me', {
            credentials: 'include'
        });

        if (!response.ok) return;

        const profile = await response.json();

        // Load employment history
        try {
            const historyResponse = await fetch('/api/employment-history');
            if (historyResponse.ok) {
                const historyData = await historyResponse.json();
                profile.history = historyData.items || [];
            }
        } catch (err) {
            console.log(err);
        }

        applyProfileToView(profile);
        
        // Load employment history into timeline
        const container = document.getElementById('timelineContainer');
        if (container) {
            const history = profile.history || [];
            if (history.length === 0) {
                container.innerHTML = `
                    <div class="timeline-item">
                        <div class="timeline-date">--</div>
                        <div class="timeline-content">
                            <h4>No history available</h4>
                            <p>Employment history has not been recorded yet.</p>
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = history.map(item => `
                    <div class="timeline-item">
                        <div class="timeline-date">${item.event_date || '--'}</div>
                        <div class="timeline-content">
                            <h4>${item.event_title || 'History Event'}</h4>
                            <p>${item.event_description || '--'}</p>
                        </div>
                    </div>
                `).join('');
            }
        }

    } catch (err) {
        console.error(err);
    }
}

/* =========================
   INIT
   ========================= */
document.addEventListener('DOMContentLoaded', () => {
    setupProfileViewPage();
    loadProfileViewData();
}); 
