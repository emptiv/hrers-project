document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('closeBtn');
    const logoToggle = document.getElementById('logoToggle');
    const typeButtons = document.querySelectorAll('.type-btn');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const leaveForm = document.getElementById('leaveRequestForm');

    // --- Sidebar Logic ---
    if (closeBtn) closeBtn.onclick = () => sidebar.classList.add('collapsed');
    if (logoToggle) logoToggle.onclick = () => sidebar.classList.remove('collapsed');

    document.querySelectorAll('.menu-item').forEach(item => {
        const span = item.querySelector('span');
        if (span) item.setAttribute('data-text', span.innerText);
    });

    // --- Leave Type Selection ---
    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // --- File Upload UI ---
    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                const fileName = fileInput.files[0].name;
                dropZone.innerHTML = `
                    <i class="fas fa-check-circle" style="color: #28a745; font-size: 24px;"></i>
                    <p>Selected: <b>${fileName}</b></p>
                    <small style="color: #666; cursor: pointer;">Click to change file</small>
                `;
            }
        });
    }

    // --- Submit Logic (Notification with Credits) ---
    if (leaveForm) {
        leaveForm.onsubmit = async (e) => {
            e.preventDefault();

            const TOTAL_SICK_CREDITS = 15;
            let finalMessage = "Leave request submitted successfully";

            // 1. Get Selected Leave Type
            const activeBtn = document.querySelector('.type-btn.active');
            const leaveTypeText = activeBtn ? activeBtn.innerText : "";

            // 2. Get Dates using Name attributes (from your HTML)
            const startDateInput = document.querySelector('input[name="start_date"]');
            const endDateInput = document.querySelector('input[name="end_date"]');
            const reasonInput = document.querySelector('.form-textarea');

            if (!activeBtn || !startDateInput?.value || !endDateInput?.value || !reasonInput?.value.trim()) {
                Swal.fire({
                    icon: "error",
                    title: "Missing fields",
                    text: "Please complete all required fields.",
                    confirmButtonColor: '#4a1d1d'
                });
                return;
            }

            const formData = new FormData();
            formData.set('leave_type', activeBtn.innerText.trim());
            formData.set('start_date', startDateInput.value);
            formData.set('end_date', endDateInput.value);
            formData.set('reason', reasonInput.value.trim());
            formData.set('file_name', fileInput?.files?.[0]?.name || 'No Document Attached');

            const response = await fetch('/api/leave-requests', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ detail: 'Request failed.' }));
                Swal.fire({
                    icon: "error",
                    title: "Submission failed",
                    text: err.detail || 'Unable to submit leave request.',
                    confirmButtonColor: '#4a1d1d'
                });
                return;
            }

            // 3. Calculate Credits if Sick Leave
            if (leaveTypeText.includes("Sick Leave") && startDateInput.value && endDateInput.value) {
                const start = new Date(startDateInput.value);
                const end = new Date(endDateInput.value);
                
                // Difference in days (inclusive)
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                const remaining = TOTAL_SICK_CREDITS - diffDays;
                finalMessage = `Success! You have ${remaining} sick leave credits remaining.`;
            }

            // 4. Trigger SweetAlert (Matching Employee style)
            // Note: Ensure SweetAlert CDN is in your Head HTML
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: "success",
                    title: "Request Sent",
                    text: finalMessage,
                    confirmButtonColor: '#4a1d1d'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = '/templates/head/head_leaverequest.html';
                    }
                });
            } else {
                const toast = document.createElement('div');
                toast.style.position = 'fixed';
                toast.style.top = '20px';
                toast.style.right = '20px';
                toast.style.zIndex = '9999';
                toast.style.background = '#4a1d1d';
                toast.style.color = '#fff';
                toast.style.padding = '10px 14px';
                toast.style.borderRadius = '8px';
                toast.style.fontSize = '0.9rem';
                toast.textContent = finalMessage;
                document.body.appendChild(toast);
                setTimeout(function () {
                    toast.remove();
                    window.location.href = '/templates/head/head_leaverequest.html';
                }, 1200);
            }
        };
    }
});