document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const logoToggle = document.getElementById('logoToggle');
    const closeBtn = document.getElementById('closeBtn');
    const menuItems = document.querySelectorAll('.menu-item');
    const form = document.getElementById('addEmployeeForm');

    menuItems.forEach(item => {
        const span = item.querySelector('span');
        if (span) item.setAttribute('data-text', span.textContent.trim());
    });

    if (closeBtn) closeBtn.onclick = () => sidebar.classList.add('collapsed');
    if (logoToggle) logoToggle.onclick = () => sidebar.classList.toggle('collapsed');

    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const response = await fetch('/api/employees', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const payload = await response.json().catch(() => ({ detail: 'Unable to add employee.' }));
            Swal.fire({
                icon: 'error',
                title: 'Save failed',
                text: payload.detail || 'Unable to add employee.',
                confirmButtonColor: '#4a1d1d',
            });
            return;
        }

        Swal.fire({
            icon: 'success',
            title: 'Employee Added',
            text: 'Employee record was saved to the database.',
            confirmButtonColor: '#4a1d1d',
        }).then(() => {
            window.location.href = 'hr_employeelist.html';
        });
    });
});