/* head_leaverequest.js */
let activeRowId = null;
let leaveItems = [];

document.addEventListener('DOMContentLoaded', async () => {
    const tabRequests = document.getElementById('tab-requests');
    const tabHistory = document.getElementById('tab-history');
    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach(item => {
        const span = item.querySelector('span');
        if (span) item.setAttribute('data-text', span.innerText);
    });

    document.getElementById('closeBtn').onclick = () => document.getElementById('sidebar').classList.add("collapsed");
    document.getElementById('logoToggle').onclick = () => document.getElementById('sidebar').classList.toggle("collapsed");

    tabRequests.onclick = async () => {
        tabRequests.classList.add('active');
        tabHistory.classList.remove('active');
        await fetchAndRender('active');
    };
    tabHistory.onclick = async () => {
        tabHistory.classList.add('active');
        tabRequests.classList.remove('active');
        await fetchAndRender('history');
    };

    await fetchAndRender('active');
});

async function fetchAndRender(mode) {
    const response = await fetch(`/api/leave-requests?mode=${mode}`);
    if (!response.ok) return;
    const payload = await response.json();
    leaveItems = payload.items || [];
    renderHeadTable();
}

function renderHeadTable() {
    const body = document.getElementById('leaveTableBody');
    const template = document.getElementById('headRowTemplate');
    body.innerHTML = "";

    leaveItems.forEach((leave) => {
        const clone = template.content.cloneNode(true);
        const statusClass = leave.status.toLowerCase().replace(/\s+/g, '-');

        clone.querySelector('.col-emp').innerHTML = `<strong>${leave.name}</strong><br><small>${leave.role}</small>`;
        clone.querySelector('.col-type').innerText = leave.leaveType;
        clone.querySelector('.col-start').innerText = leave.startDate;
        clone.querySelector('.col-end').innerText = leave.endDate;
        clone.querySelector('.col-days').innerText = leave.numDays;
        clone.querySelector('.col-status').innerHTML = `<span class="status-pill ${statusClass}">${leave.status}</span>`;
        clone.querySelector('.col-reviewer').innerText = leave.reviewedBy || '---';
        clone.querySelector('.action-link').onclick = () => openHeadModal(leave.id);
        body.appendChild(clone);
    });
}

function openHeadModal(id) {
    activeRowId = id;
    const data = leaveItems.find(l => l.id === id);
    if (!data) return;

    const isFinal = (data.status === "Approved" || data.status === "Rejected");
    const statusClass = data.status.toLowerCase().replace(/\s+/g, '-');

    document.getElementById('modalFileName').innerText = data.fileName;
    document.getElementById('modalSubmitDate').innerText = `${data.dateFiled} at ${data.submitTime}`;
    document.getElementById('modalReason').innerText = data.reason;
    document.getElementById('modalRemarks').innerText = data.reviewRemarks;
    document.getElementById('modalStatusContainer').innerHTML = `<span class="status-pill ${statusClass}">${data.status}</span>`;
    document.getElementById('modalReviewerText').innerHTML = `<small>Reviewed by: ${data.reviewedBy}</small>`;
    document.getElementById('modalActions').style.display = isFinal ? "none" : "flex";
    document.getElementById('viewModal').style.display = 'flex';
}

async function processHeadRequest(decision) {
    if (!activeRowId) return;

    const formData = new FormData();
    formData.set('decision', decision.toLowerCase());

    const response = await fetch(`/api/leave-requests/${activeRowId}/decision`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Unable to process request.' }));
        Swal.fire({ icon: 'error', title: 'Action failed', text: err.detail || 'Unable to process request.' });
        return;
    }

    await fetchAndRender(document.getElementById('tab-requests').classList.contains('active') ? 'active' : 'history');
    Swal.fire({
        icon: 'success',
        title: `Request ${decision}`,
        text: `The status was updated and recorded.`,
        confirmButtonColor: '#4a1d1d',
        timer: 2000
    });
    closeViewModal();
}

function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
}
