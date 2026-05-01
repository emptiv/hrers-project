document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const logoToggle = document.getElementById('logoToggle');
    const closeBtn = document.getElementById('closeBtn');
    const menuItems = document.querySelectorAll('.menu-item');

    // =========================
    // TOOLTIP
    // =========================
    menuItems.forEach(item => {
        const span = item.querySelector('span');
        if (span) item.setAttribute('data-text', span.innerText.trim());
    });

    // =========================
    // SIDEBAR
    // =========================
    if (logoToggle) logoToggle.onclick = () => sidebar.classList.toggle('close');
    if (closeBtn) closeBtn.onclick = () => sidebar.classList.add('close');

    // =========================
    // TABS
    // =========================
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content-item');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            tabContents.forEach(c => c.classList.remove('active'));
            const target = document.getElementById(tab.dataset.tab);
            if (target) target.classList.add('active');
        });
    });

    // =========================
    // ROLE HELPERS
    // =========================
    function normalizeRole(role) {
        return (role || '').toLowerCase().trim();
    }

    function formatRole(role) {
        if (!role) return '--';
        return role.split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    }

    // =========================
    // 🔥 HARDCODED HISTORY
    // =========================
    function buildHistory(role) {
        const r = normalizeRole(role);

        if (r.includes('admin')) {
            return [
                { year: "2026", title: "Joined as Admin", description: "Account successfully created and assigned role as an Admin." },
                { year: "2026", title: "Account Created", description: "User account was created in the system and assigned role access." }
            ];
        }

        if (r.includes('hr')) {
            return [
                { year: "2026", title: "Joined as HR", description: "Account successfully created and assigned role as HR." },
                { year: "2026", title: "Account Created", description: "User account was created in the system and assigned role access." }
            ];
        }

        if (r.includes('head')) {
            return [
                { year: "2026", title: "Joined as Head", description: "Account successfully created and assigned role as Head." },
                { year: "2026", title: "Account Created", description: "User account was created in the system and assigned role access." }
            ];
        }

        if (r.includes('director')) {
            return [
                { year: "2026", title: "Joined as School Director", description: "Account successfully created and assigned role as School_director." },
                { year: "2026", title: "Account Created", description: "User account was created in the system and assigned role access." }
            ];
        }

        // default (employee)
        return [
            { year: "2026", title: "Hired as Employee", description: "Account successfully created and assigned role as Employee." },
            { year: "2026", title: "Account Created", description: "User account was created in the system and assigned role access." }
        ];
    }

    // =========================
    // LOAD EMPLOYEE
    // =========================
    const params = new URLSearchParams(window.location.search);
    const employeeId = params.get('employee_id') || params.get('id');

    async function loadEmployeeDetail() {
        if (!employeeId) return;

        try {
            const res = await fetch(`/api/users/${encodeURIComponent(employeeId)}`);
            if (!res.ok) return;

            const profile = await res.json();

            // =========================
            // BASIC INFO
            // =========================
            document.querySelector('.profile-info h2').textContent = profile.fullName || '--';
            document.querySelector('.profile-info .role').textContent =
                formatRole(profile.position || profile.roleLabel);

            document.querySelector('.employee-id').textContent =
                `Employee ID: ${profile.employeeNo || profile.id || '--'}`;

            const details = document.querySelectorAll('.employment-details p');
            if (details[0]) {
                details[0].innerHTML = `<strong>Status</strong>
                <span class="status-dot" style="background:${profile.isActive ? '#8ddf9b' : '#f08d8d'}"></span>
                ${profile.isActive ? 'Active' : 'Inactive'}`;
            }

            if (details[1]) details[1].innerHTML = `<strong>Position</strong> ${profile.position || '--'}`;
            if (details[2]) details[2].innerHTML = `<strong>Department</strong> ${profile.department || '--'}`;
            if (details[3]) details[3].innerHTML = `<strong>Employment Type</strong> ${profile.employmentType || '--'}`;
            if (details[4]) details[4].innerHTML = `<strong>Date Hired</strong> ${profile.dateHired || '--'}`;

            // =========================
            // DEPARTMENT TAB
            // =========================
            const deptInfo = profile.departmentInfo || {};
            const setDept = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.textContent = val || '--';
            };
            setDept('departmentName', deptInfo.name || profile.department);
            setDept('departmentId', deptInfo.id);
            setDept('departmentLocation', deptInfo.location);
            setDept('departmentEmail', deptInfo.email);
            setDept('departmentHead', deptInfo.headName);

            // =========================
            // CONTACT
            // =========================
            const contact = document.querySelectorAll('.contact-info p');
            if (contact[0]) contact[0].innerHTML = `<i class="fas fa-envelope"></i> ${profile.email || '--'}`;
            if (contact[1]) contact[1].innerHTML = `<i class="fas fa-phone"></i> ${profile.contactNumber || '--'}`;
            if (contact[2]) contact[2].innerHTML = `<i class="fas fa-location-dot"></i> ${profile.address || '--'}`;

            // =========================
            // 🔥 RENDER HARDCODED HISTORY
            // =========================
            const timeline = document.getElementById('timelineContainer');

            if (timeline) {
                const history = buildHistory(profile.position || profile.roleLabel);

                timeline.innerHTML = history.map(h => `
                    <div class="timeline-item">
                        <div class="timeline-date">${h.year}</div>
                        <div class="timeline-content">
                            <h4>${h.title}</h4>
                            <p>${h.description}</p>
                        </div>
                    </div>
                `).join('');
            }

        } catch (err) {
            console.log(err);
        }
    }

    loadEmployeeDetail();
});