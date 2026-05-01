/* sd_leaverequest.js */
let activeRowId = null;
let leaveItems = [];

document.addEventListener('DOMContentLoaded', async () => {
    const sidebar = document.getElementById("sidebar");
    const logoToggle = document.getElementById("logoToggle");
    const closeBtn = document.getElementById("closeBtn");
    const tabRequests = document.getElementById('tab-requests');
    const tabHistory = document.getElementById('tab-history');

    document.querySelectorAll(".menu-item").forEach(item => {
        const span = item.querySelector("span");
        if (span) item.setAttribute("data-text", span.innerText);
    });

    if (closeBtn) closeBtn.onclick = () => sidebar.classList.add("collapsed");
    if (logoToggle) logoToggle.onclick = () => sidebar.classList.toggle("collapsed");

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

    document.getElementById('tableSearch').addEventListener('keyup', (e) => {
        const val = e.target.value.toLowerCase();
        document.querySelectorAll('tbody tr').forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(val) ? "" : "none";
        });
    });

    await fetchAndRender('active');
});

async function fetchAndRender(mode) {
    const response = await fetch(`/api/leave-requests?mode=${mode}`);
    if (!response.ok) return;
    const payload = await response.json();
    leaveItems = payload.items || [];
    renderLeaveTable();
}

function renderLeaveTable() {
    const body = document.getElementById('leaveTableBody');
    const template = document.getElementById('sdRowTemplate');
    if (!body || !template) return;
    body.innerHTML = "";

    leaveItems.forEach((leave) => {
        const clone = template.content.cloneNode(true);
        const statusClass = leave.status.toLowerCase().replace(/\s+/g, '-');
        const displayStatus = leave.displayStatus || leave.status;

        clone.querySelector('.col-emp').innerHTML = `<strong>${leave.name}</strong><br><small>${leave.role}</small>`;
        clone.querySelector('.col-type').innerText = leave.leaveType;
        clone.querySelector('.col-start').innerText = leave.startDate;
        clone.querySelector('.col-end').innerText = leave.endDate;
        clone.querySelector('.col-days').innerText = leave.numDays;
        clone.querySelector('.col-status').innerHTML = `<span class="status-pill ${statusClass}">${displayStatus}</span>`;
        clone.querySelector('.col-reviewer').innerText = leave.reviewedBy || '---';
        clone.querySelector('.action-link').onclick = () => openViewModalByID(leave.id);
        body.appendChild(clone);
    });

    if (body.innerHTML === "") {
        body.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#888; padding:40px;">No leave records found.</td></tr>`;
    }
}

function openViewModalByID(id) {
    activeRowId = id;
    const data = leaveItems.find(l => l.id === id);
    if (!data) return;

    const isFinal = (data.status === "Approved" || data.status === "Rejected");
    const statusClass = data.status.toLowerCase().replace(/\s+/g, '-');
    const displayStatus = data.displayStatus || data.status;

    document.getElementById('modalFileName').innerText = data.fileName;
    document.getElementById('modalSubmitDate').innerText = `${data.dateFiled} at ${data.submitTime}`;
    document.getElementById('modalReason').innerText = data.reason;
    document.getElementById('modalRemarks').innerText = data.reviewRemarks || 'Awaiting Department Head review.';
    document.getElementById('modalReviewerText').innerText = `Reviewed by: ${data.reviewedBy}`;
    document.getElementById('modalStatusContainer').innerHTML = `<span class="status-pill ${statusClass}">${displayStatus}</span>`;

    document.getElementById('modalActions').style.display = isFinal ? "none" : "flex";

    const preview = document.querySelector('.pdf-placeholder');
    preview.innerHTML = `<i class="fas fa-file-pdf"></i><p>Preview for ${data.fileName}</p>`;
    document.getElementById('viewModal').style.display = 'flex';
}

async function processSDDecision(decision) {
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
        text: `Decision finalized and recorded instantly.`,
        confirmButtonColor: '#4a1d1d',
        timer: 2000
    });
    closeViewModal();
}

function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
}
