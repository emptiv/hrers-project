document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const logoToggle = document.getElementById('logoToggle');
    const closeBtn = document.getElementById('closeBtn');
    const menuItems = document.querySelectorAll('.menu-item');

    // =========================
    // TOOLTIP FIX
    // =========================
    menuItems.forEach(item => {
        const span = item.querySelector('span');
        if (span) {
            item.setAttribute('data-text', span.innerText.trim());
        }
    });

    // =========================
    // SIDEBAR TOGGLE
    // =========================
    if (logoToggle) {
        logoToggle.onclick = () => sidebar.classList.toggle('close');
    }
    if (closeBtn) {
        closeBtn.onclick = () => sidebar.classList.add('close');
    }

    // =========================
    // TAB SYSTEM
    // =========================
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content-item');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            tabContents.forEach(c => c.classList.remove('active'));

            const targetId = tab.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.add('active');
        });
    });

    // =========================
    // ROLE NORMALIZATION (IMPORTANT FIX)
    // =========================
    function normalizeRole(role) {
        return (role || "")
            .toString()
            .trim()
            .toLowerCase();
    }

    function formatRole(role) {
        if (!role) return "";
        return role
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    }

    // =========================
    // ROLE UI CONTROL
    // =========================
    const ROLE_UI_RULES = {
        "employee": { hide: [] },
        "hr head": { hide: [] },
        "department head": { hide: [] },
        "school director": { hide: [] },
        "admin": { hide: [] }
    };

    function applyRoleUI(role) {
        const key = normalizeRole(role);
        const rules = ROLE_UI_RULES[key];
        if (!rules) return;

        (rules.hide || []).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = "none";
        });
    }

    function getQueryParam(name) {
        return new URLSearchParams(window.location.search).get(name);
    }

    function safeSet(id, value) {
        const el = document.getElementById(id);
        if (!el) return;
        if (value !== undefined && value !== null && value !== '') {
            el.textContent = value;
        }
    }

    // =========================
    // 🔥 FIXED EMPLOYMENT HISTORY (JOINED FIRST, CREATED SECOND)
    // =========================
    function buildHistory(role) {
        const formattedRole = formatRole(role);

        return [
            {
                year: "2026",
                title: `Joined as a ${formattedRole}`,
                description: `Account successfully created and assigned role as ${formattedRole}.`
            },
            {
                year: "2026",
                title: "Account Created",
                description: "User account was created in the system."
            }
        ];
    }

    // =========================
    // ACTION CELL SAFETY
    // =========================
    function isPlaceholderHref(hrefValue) {
        if (!hrefValue) return true;
        const normalized = hrefValue.trim().toLowerCase();
        return ['#', 'javascript:void(0)', 'javascript:;'].includes(normalized);
    }

    document.addEventListener('click', (e) => {
        const link = e.target.closest('.action-cell a');
        if (!link) return;

        const row = link.closest('tr');
        const docName = row?.cells?.[0]?.innerText?.trim() || "Document";
        const href = link.getAttribute('href') || '';

        const isDownload = link.hasAttribute('download') || link.querySelector('.fa-download');
        const isView = link.querySelector('.fa-eye');

        if ((isDownload || isView) && isPlaceholderHref(href)) {
            e.preventDefault();
            alert(`No uploaded file for "${docName}".`);
        }
    });

    // =========================
    // LOAD EMPLOYEE
    // =========================
    async function loadEmployeeDetail(employeeId) {
        if (!employeeId) return;

        try {
            const resp = await fetch(`/api/users/${encodeURIComponent(employeeId)}`);
            if (!resp.ok) return;

            const data = await resp.json();
            populateEmployeeView(data);

        } catch (err) {
            console.log(err);
        }
    }

    // =========================
    // POPULATE VIEW
    // =========================
    function populateEmployeeView(data) {
        if (!data) return;

        const roleRaw = data.role || data.roleLabel || data.position || data.currentPosition;
        const roleKey = normalizeRole(roleRaw);

        applyRoleUI(roleRaw);

        safeSet('employeeName', data.fullName || data.name);
        safeSet('employeeRole', formatRole(roleRaw));
        safeSet('employeeId', data.employeeNo || data.id);
        safeSet('employeeStatus', data.isActive ? 'Active' : 'Inactive');
        safeSet('employeePosition', formatRole(roleRaw));
        safeSet('employeeDepartment', data.department);
        safeSet('employeeType', data.employmentType);
        safeSet('employeeDateHired', data.dateHired);

        safeSet('contactEmail', data.email);
        safeSet('contactPhone', data.contactNumber);
        safeSet('contactLocation', data.address);

        const statusDot = document.getElementById('statusDot');
        if (statusDot) {
            statusDot.style.background = data.isActive ? '#8ddf9b' : '#ccc';
        }

        // =========================
        // DOCUMENTS (UNCHANGED)
        // =========================
        const docsBody = document.getElementById('docsTableBody');
        const docsCount = document.getElementById('docsCount');

        if (docsBody) {
            const docs = data.documents || [];
            docsBody.innerHTML = '';

            if (!docs.length) {
                docsBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No documents available.</td></tr>`;
                if (docsCount) docsCount.textContent = '0 documents';
            } else {
                if (docsCount) docsCount.textContent = `${docs.length} document(s)`;

                docs.forEach(d => {
                    const tr = document.createElement('tr');

                    tr.innerHTML = `
                        <td>${d.name || 'Document'}</td>
                        <td>${d.type || '-'}</td>
                        <td>${d.status || '-'}</td>
                        <td>${d.uploadedAt || '-'}</td>
                        <td class="action-cell">
                            ${
                                d.url
                                    ? `<a href="${d.url}" target="_blank"><i class="fas fa-eye"></i></a>
                                       <a href="${d.url}" download><i class="fas fa-download"></i></a>`
                                    : '---'
                            }
                        </td>
                    `;

                    docsBody.appendChild(tr);
                });
            }
        }

        // =========================
        // EMPLOYMENT HISTORY (FIXED)
        // =========================
        const timelineContainer = document.getElementById('timelineContainer');
        const timelineTpl = document.getElementById('timelineItemTemplate');

        if (timelineContainer && timelineTpl) {
            timelineContainer.innerHTML = '';

            const history = buildHistory(roleKey);

            history.forEach(h => {
                const item = timelineTpl.content.cloneNode(true);
                const node = item.querySelector('.timeline-item');

                node.querySelector('.timeline-date').textContent = h.year;
                node.querySelector('.timeline-title').textContent = h.title;
                node.querySelector('.timeline-desc').textContent = h.description;

                timelineContainer.appendChild(node);
            });
        }
    }

    // =========================
    // INIT
    // =========================
    const employeeId =
        getQueryParam('employee_id') || getQueryParam('id');

    if (employeeId) {
        loadEmployeeDetail(employeeId);
    }
});