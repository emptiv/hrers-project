/* hr_applicationleave.js */
document.addEventListener('DOMContentLoaded', () => {
    // Selectors
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('closeBtn');
    const logoToggle = document.getElementById('logoToggle');
    const typeButtons = document.querySelectorAll('.type-btn');
    const dropZone = document.getElementById('dropZone');
    const dropZoneContent = document.getElementById('dropZoneContent');
    const fileInput = document.getElementById('fileInput');
    const leaveForm = document.getElementById('leaveRequestForm');
    const menuItems = document.querySelectorAll(".menu-item");

    let selectedFileName = "No Document Attached";
    let sickLeaveCredits = null;

    async function loadLeaveCredits() {
        try {
            const response = await fetch('/api/leave-credits');
            if (!response.ok) return;
            const payload = await response.json();
            sickLeaveCredits = Number(payload.remaining);
        } catch (error) {
        }
    }

    // --- Sidebar & Tooltips ---
    menuItems.forEach(item => {
        const span = item.querySelector("span");
        if (span) item.setAttribute("data-text", span.innerText);
    });

    if (closeBtn) closeBtn.onclick = () => sidebar.classList.add("collapsed");
    if (logoToggle) logoToggle.onclick = () => sidebar.classList.toggle("collapsed");

    // --- Leave Type Selection ---
    typeButtons.forEach(btn => {
        btn.onclick = () => {
            typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
    });

    // --- File Upload Handling ---
    if (dropZone && fileInput) {
        dropZone.onclick = () => fileInput.click();

        fileInput.onchange = () => {
            if (fileInput.files.length > 0) {
                selectedFileName = fileInput.files[0].name;
                if (dropZoneContent) {
                    dropZoneContent.innerHTML = `
                        <i class="fas fa-check-circle" style="color: #28a745; font-size: 24px;"></i>
                        <p style="margin-top: 10px;">Selected: <span style="color: #4a1d1d; font-weight: bold;">${selectedFileName}</span></p>
                        <small style="color: #666;">Click to change file</small>
                    `;
                }
            }
        };
    }

    // --- Form Submission Logic ---
    if (leaveForm) {
        leaveForm.onsubmit = async (e) => {
            e.preventDefault();

            const activeBtn = document.querySelector('.type-btn.active');
            const leaveType = activeBtn ? activeBtn.innerText : "General Leave";
            const startDateVal = document.getElementsByName('start_date')[0].value;
            const endDateVal = document.getElementsByName('end_date')[0].value;
            const reasonVal = (document.querySelector('.form-textarea')?.value || '').trim();

            // Simple validation
            if (!startDateVal || !endDateVal || !reasonVal) {
                Swal.fire({
                    icon: 'error',
                    title: 'Missing Info',
                    text: 'Please fill in all required fields.',
                    confirmButtonColor: '#4a1d1d'
                });
                return;
            }

            const formData = new FormData();
            formData.set('leave_type', leaveType.trim());
            formData.set('start_date', startDateVal);
            formData.set('end_date', endDateVal);
            formData.set('reason', reasonVal);
            formData.set('file_name', fileInput?.files?.[0]?.name || selectedFileName);

            const response = await fetch('/api/leave-requests', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ detail: 'Request failed.' }));
                Swal.fire({
                    icon: 'error',
                    title: 'Submission Failed',
                    text: err.detail || 'Unable to submit leave request.',
                    confirmButtonColor: '#4a1d1d'
                });
                return;
            }

            // Calculate duration (inclusive)
            const start = new Date(startDateVal);
            const end = new Date(endDateVal);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            // Prepare Notification Message
            let finalMessage = "Leave request submitted successfully!";
            if (leaveType.toLowerCase().includes("sick")) {
                const remaining = Math.max(0, Number(sickLeaveCredits ?? 0) - diffDays);
                finalMessage = `Success! You have ${remaining} sick leave credits remaining.`;
            }

            // Fire SweetAlert
            Swal.fire({
                icon: 'success',
                title: 'Request Sent',
                text: finalMessage,
                confirmButtonColor: '#4a1d1d',
                timer: 3500,
                timerProgressBar: true
            }).then(() => {
                window.location.href = 'hr_leaverequest.html';
            });
        };
    }

    loadLeaveCredits();
});