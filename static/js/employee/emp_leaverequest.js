/* emp_leaverequest.js */
let leaveItems = [];

document.addEventListener('DOMContentLoaded', async () => {
    const sidebar = document.getElementById("sidebar");
    const logoToggle = document.getElementById("logoToggle");
    const closeBtn = document.getElementById("closeBtn");
    const tabRequests = document.getElementById('tab-requests');
    const tabHistory = document.getElementById('tab-history');
    const menuItems = document.querySelectorAll(".menu-item");

    menuItems.forEach(item => {
        const span = item.querySelector("span");
        if (span) item.setAttribute("data-text", span.innerText);
    });

    if (closeBtn) closeBtn.onclick = () => sidebar.classList.add("collapsed");
    if (logoToggle) logoToggle.onclick = () => sidebar.classList.toggle("collapsed");

    tabRequests.onclick = async () => {
        tabRequests.classList.add('active');
        tabHistory.classList.remove('active');
        await fetchAndRender("active");
    };
    tabHistory.onclick = async () => {
        tabHistory.classList.add('active');
        tabRequests.classList.remove('active');
        await fetchAndRender("history");
    };

    document.getElementById('tableSearch').addEventListener('keyup', (e) => {
        const val = e.target.value.toLowerCase();
        document.querySelectorAll('tbody tr').forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(val) ? "" : "none";
        });
    });

    await fetchAndRender("active");
});

async function fetchAndRender(mode) {
    const response = await fetch(`/api/leave-requests?mode=${mode}`);
    if (!response.ok) {
        document.getElementById('leaveTableBody').innerHTML = '<tr><td colspan="8" style="text-align:center; color:#888; padding:40px;">Failed to load records.</td></tr>';
        return;
    }

    const payload = await response.json();
    leaveItems = payload.items || [];
    renderLeaveTable();
}

function renderLeaveTable() {
    const body = document.getElementById('leaveTableBody');
    const template = document.getElementById('leaveRowTemplate');
    body.innerHTML = "";

    leaveItems.forEach((leave) => {
        const clone = template.content.cloneNode(true);
        const statusClass = leave.status.toLowerCase();

        clone.querySelector('.col-filed').innerText = leave.dateFiled;
        clone.querySelector('.col-type').innerHTML = `<strong>${leave.leaveType}</strong>`;
        clone.querySelector('.col-start').innerText = leave.startDate;
        clone.querySelector('.col-end').innerText = leave.endDate;
        clone.querySelector('.col-days').innerText = leave.numDays;
        clone.querySelector('.col-status').innerHTML = `<span class="status-pill ${statusClass}">${leave.status}</span>`;
        clone.querySelector('.col-reviewer').innerText = leave.reviewedBy;
        clone.querySelector('.action-link').onclick = () => openViewModalByID(leave.id);

        body.appendChild(clone);
    });

    if (body.innerHTML === "") {
        body.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#888; padding:40px;">No leave records found.</td></tr>';
    }
}

function openViewModalByID(id) {
    const data = leaveItems.find(l => l.id === id);
    if (!data) return;

    document.getElementById('modalFileName').innerText = data.fileName;
    document.getElementById('modalSubmitDate').innerText = `${data.dateFiled} at ${data.submitTime}`;
    document.getElementById('modalReason').innerText = data.reason;
    document.getElementById('modalRemarks').innerText = data.reviewRemarks;

    const statusClass = data.status.toLowerCase();
    document.getElementById('modalStatusContainer').innerHTML = `<span class="status-pill ${statusClass}">${data.status}</span>`;

    const preview = document.querySelector('.pdf-placeholder');
    preview.innerHTML = `<i class="fas fa-file-pdf"></i><p>Preview for ${data.fileName}</p>`;

    document.getElementById('viewModal').style.display = 'flex';
}

function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
}
