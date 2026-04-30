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
    // HELPERS
    // =========================
    function getQueryParam(name) {
        return new URLSearchParams(window.location.search).get(name);
    }

    function normalizeRole(role) {
        return (role || "").toString().trim();
    }

    // =========================
    // HARD CODED HISTORY (FINAL FIX)
    // =========================
    function buildHistory(role) {
        return [
            {
                year: "2026",
                title: `Joined as ${role}`,
                description: `Joined as ${role} in Head Office Department.`
            },
            {
                year: "2026",
                title: "Account Created",
                description: "User account was created in the system and assigned role access."
            }
        ];
    }

    // =========================
    // RENDER HISTORY (FORCE OVERRIDE)
    // =========================
    function renderHistory(role) {
        const timeline = document.getElementById('timelineContainer');

        if (!timeline) return;

        const history = buildHistory(role);

        timeline.innerHTML = ""; // IMPORTANT: wipes HTML fallback completely

        history.forEach(h => {
            const item = document.createElement('div');
            item.className = 'timeline-item';

            item.innerHTML = `
                <div class="timeline-date">${h.year}</div>
                <div class="timeline-content">
                    <h4>${h.title}</h4>
                    <p>${h.description}</p>
                </div>
            `;

            timeline.appendChild(item);
        });
    }

    // =========================
    // POPULATE VIEW (NO FALLBACK UI)
    // =========================
    function populate(profile) {
        if (!profile) return;

        const role = normalizeRole(profile.position || profile.roleLabel || profile.role || "Employee");

        document.getElementById('employeeName').textContent = profile.fullName || "--";
        document.getElementById('employeeRole').textContent = role;

        const empId = document.querySelector('.employee-id');
        if (empId) {
            empId.textContent = `Employee ID: ${profile.employeeNo || profile.id || "--"}`;
        }

        const details = document.querySelectorAll('.employment-details p');

        if (details[0]) {
            details[0].innerHTML =
                `<strong>Status</strong> <span class="status-dot" style="background:${profile.isActive ? '#8ddf9b' : '#ccc'}"></span>
                ${profile.isActive ? 'Active' : 'Inactive'}`;
        }

        if (details[1]) details[1].innerHTML = `<strong>Position</strong> ${role}`;
        if (details[2]) details[2].innerHTML = `<strong>Department</strong> Head Office Department`;
        if (details[3]) details[3].innerHTML = `<strong>Employment Type</strong> ${profile.employmentType || '--'}`;
        if (details[4]) details[4].innerHTML = `<strong>Date Hired</strong> ${profile.dateHired || '--'}`;

        // CONTACT
        const contact = document.querySelectorAll('.contact-info p');
        if (contact[0]) contact[0].innerHTML = `<i class="fas fa-envelope"></i> ${profile.email || '--'}`;
        if (contact[1]) contact[1].innerHTML = `<i class="fas fa-phone"></i> ${profile.contactNumber || '--'}`;
        if (contact[2]) contact[2].innerHTML = `<i class="fas fa-location-dot"></i> ${profile.address || '--'}`;

        // FORCE HISTORY RENDER (IMPORTANT FIX)
        renderHistory(role);
    }

    // =========================
    // LOAD DATA
    // =========================
    async function load() {
        const id = getQueryParam('employee_id') || getQueryParam('id');
        if (!id) return;

        try {
            const res = await fetch(`/api/employees/${encodeURIComponent(id)}`);
            if (!res.ok) return;

            const data = await res.json();
            populate(data);

        } catch (err) {
            console.log(err);
        }
    }

    load();
});