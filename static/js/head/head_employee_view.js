document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const logoToggle = document.getElementById('logoToggle');
    const closeBtn = document.getElementById('closeBtn');
    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach((item) => {
        const span = item.querySelector('span');
        if (span) {
            item.setAttribute('data-text', span.innerText.trim());
        }
    });

    if (logoToggle && sidebar) {
        logoToggle.onclick = () => sidebar.classList.toggle('close');
    }

    if (closeBtn && sidebar) {
        closeBtn.onclick = () => sidebar.classList.add('close');
    }

    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content-item');

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((currentTab) => currentTab.classList.remove('active'));
            tab.classList.add('active');
            tabContents.forEach((content) => content.classList.remove('active'));

            const targetId = tab.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    function getQueryParam(name) {
        return new URLSearchParams(window.location.search).get(name);
    }

    function normalizeText(value) {
        return (value || '').toString().trim();
    }

    function escapeHtml(value) {
        return (value || '')
            .toString()
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function setText(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = value || '--';
        }
    }

    function renderDepartment(profile) {
        const departmentInfo = profile.departmentInfo || {};
        const departmentName = departmentInfo.name || profile.department || '--';

        setText('#departmentName', departmentName);
        setText('#departmentId', departmentInfo.id ? String(departmentInfo.id) : '--');
        setText('#departmentLocation', departmentInfo.location || '--');
        setText('#departmentEmail', departmentInfo.email || '--');
        setText('#departmentHead', departmentInfo.headName || '--');
    }

    function renderDocuments(profile) {
        const docHeader = document.getElementById('documentHeader');
        const tbody = document.querySelector('.doc-table tbody');
        const documents = Array.isArray(profile.documents) ? profile.documents : [];

        if (!tbody) {
            return;
        }

        if (docHeader) {
            docHeader.textContent = documents.length
                ? `${documents.length} document(s) available`
                : 'No documents uploaded yet';
        }

        if (!documents.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:2rem; color:#777;">No documents uploaded yet.</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = documents.map((doc) => {
            const status = normalizeText(doc.status || 'Submitted');
            const statusClass = status.toLowerCase() === 'approved'
                ? 'valid'
                : (status.toLowerCase() === 'rejected' ? 'missing' : 'update');
            const viewUrl = doc.url ? `${doc.url}?mode=inline` : '';

            return `
                <tr>
                    <td>${escapeHtml(doc.name || 'Document')}</td>
                    <td>${escapeHtml(doc.type || 'FILE')}</td>
                    <td class="${statusClass}">${escapeHtml(status)}</td>
                    <td>${escapeHtml(doc.dateUploaded || '--')}</td>
                    <td class="actions">
                        ${viewUrl ? `<a href="${escapeHtml(viewUrl)}" target="_blank" rel="noopener noreferrer" title="View"><i class="fas fa-eye action-icon"></i></a>` : '--'}
                    </td>
                </tr>
            `;
        }).join('');
    }

    function renderHistory(profile) {
        const timeline = document.getElementById('timelineContainer');
        const history = Array.isArray(profile.history) ? profile.history : [];

        if (!timeline) {
            return;
        }

        if (!history.length) {
            timeline.innerHTML = `
                <div class="timeline-item">
                    <div class="timeline-date">--</div>
                    <div class="timeline-content">
                        <h4>No history available</h4>
                        <p>Employment history has not been recorded yet.</p>
                    </div>
                </div>
            `;
            return;
        }

        timeline.innerHTML = history.map((item) => `
            <div class="timeline-item">
                <div class="timeline-date">${escapeHtml(item.date || '--')}</div>
                <div class="timeline-content">
                    <h4>${escapeHtml(item.title || 'History Event')}</h4>
                    <p>${escapeHtml(item.description || '--')}</p>
                </div>
            </div>
        `).join('');
    }

    function populate(profile) {
        if (!profile) {
            return;
        }

        const role = normalizeText(profile.position || profile.roleLabel || profile.role || 'Employee');

        setText('#employeeName', profile.fullName || profile.name || '--');
        setText('#employeeRole', role);

        const empId = document.querySelector('.employee-id');
        if (empId) {
            empId.textContent = `Employee ID: ${profile.employeeNo || profile.id || '--'}`;
        }

        const details = document.querySelectorAll('.employment-details p');
        if (details[0]) {
            details[0].innerHTML = `<strong>Status</strong> <span class="status-dot" style="background:${profile.isActive ? '#8ddf9b' : '#ccc'}"></span> ${profile.isActive ? 'Active' : 'Inactive'}`;
        }
        if (details[1]) {
            details[1].innerHTML = `<strong>Position</strong> ${escapeHtml(role)}`;
        }
        if (details[2]) {
            details[2].innerHTML = `<strong>Department</strong> ${escapeHtml((profile.departmentInfo && profile.departmentInfo.name) || profile.department || '--')}`;
        }
        if (details[3]) {
            details[3].innerHTML = `<strong>Employment Type</strong> ${escapeHtml(profile.employmentType || '--')}`;
        }
        if (details[4]) {
            details[4].innerHTML = `<strong>Date Hired</strong> ${escapeHtml(profile.dateHired || '--')}`;
        }

        const contact = document.querySelectorAll('.contact-info p');
        if (contact[0]) {
            contact[0].innerHTML = `<i class="fas fa-envelope"></i> ${escapeHtml(profile.email || '--')}`;
        }
        if (contact[1]) {
            contact[1].innerHTML = `<i class="fas fa-phone"></i> ${escapeHtml(profile.contactNumber || '--')}`;
        }
        if (contact[2]) {
            contact[2].innerHTML = `<i class="fas fa-location-dot"></i> ${escapeHtml(profile.address || '--')}`;
        }

        renderDepartment(profile);
        renderDocuments(profile);
        renderHistory(profile);
    }

    async function load() {
        const id = getQueryParam('employee_id') || getQueryParam('id');
        if (!id) {
            return;
        }

        try {
            const [employeeResponse, documentsResponse] = await Promise.all([
                fetch(`/api/employees/${encodeURIComponent(id)}`),
                fetch(`/api/profile/documents?user_id=${encodeURIComponent(id)}`),
            ]);

            if (!employeeResponse.ok) {
                throw new Error('Failed to load employee details');
            }

            const data = await employeeResponse.json();

            if (documentsResponse.ok) {
                const documentsPayload = await documentsResponse.json();
                data.documents = Array.isArray(documentsPayload.documents) ? documentsPayload.documents : [];
            }

            populate(data);
        } catch (error) {
            console.error(error);
            const docHeader = document.getElementById('documentHeader');
            if (docHeader) {
                docHeader.textContent = 'Unable to load employee records';
            }
        }
    }

    load();
});