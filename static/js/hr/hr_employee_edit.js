document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const logoToggle = document.getElementById('logoToggle');
    const closeBtn = document.getElementById('closeBtn');
    const deleteUserBtn = document.getElementById('deleteUserBtn');
    const form = document.getElementById('editEmployeeForm');
    const menuItems = document.querySelectorAll('.menu-item');
    const params = new URLSearchParams(window.location.search);
    const employeeId = params.get('employee_id') || params.get('id');

    menuItems.forEach(item => {
        const span = item.querySelector('span');
        if (span) item.setAttribute('data-text', span.innerText.trim());
    });

    if (logoToggle) logoToggle.addEventListener('click', () => sidebar.classList.toggle('close'));
    if (closeBtn) closeBtn.addEventListener('click', () => sidebar.classList.add('close'));

    function setBasicValue(index, value) {
        const inputs = form.querySelectorAll('.form-section-box:first-child .input-item input');
        if (inputs[index]) inputs[index].value = value || '';
    }

    function getInput(name) {
        return form.querySelector(`[name="${name}"]`);
    }

    async function loadEmployee() {
        if (!employeeId) return;
        const response = await fetch(`/api/employees/${encodeURIComponent(employeeId)}`);
        if (!response.ok) return;
        const employee = await response.json();

        const parts = String(employee.fullName || '').trim().split(/\s+/);
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ');

        setBasicValue(0, firstName);
        setBasicValue(1, lastName);
        setBasicValue(2, employee.username || '');
        setBasicValue(3, employee.employeeNo || '');
        const employmentSelect = form.querySelector('select[name="employment_type"]');
        if (employmentSelect && employee.employmentType) employmentSelect.value = employee.employmentType;
        setBasicValue(4, employee.department || '--');
        setBasicValue(5, employee.dateHired || '--');

        const email = getInput('email');
        if (email) email.value = employee.email || '';
        const contact = getInput('contact_number');
        if (contact) contact.value = employee.contactNumber || '';
        const address = getInput('address');
        if (address) address.value = employee.address || '';
        const emergencyName = getInput('emergency_contact_name');
        if (emergencyName) emergencyName.value = employee.emergencyName || '';
        const emergencyPhone = getInput('emergency_contact_num');
        if (emergencyPhone) emergencyPhone.value = employee.emergencyPhone || '';
    }

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!employeeId) return;

            const payload = new FormData(form);
            const response = await fetch(`/api/employees/${encodeURIComponent(employeeId)}`, {
                method: 'PUT',
                body: payload,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ detail: 'Unable to update employee.' }));
                Swal.fire({ icon: 'error', title: 'Update failed', text: err.detail || 'Unable to update employee.' });
                return;
            }

            Swal.fire({
                icon: 'success',
                title: 'Profile Updated',
                text: 'Employee record has been updated in the database.',
                confirmButtonColor: '#4a1d1d',
            }).then(() => {
                window.location.href = `hr_employee_view.html?employee_id=${encodeURIComponent(employeeId)}`;
            });
        });
    }

    if (deleteUserBtn) {
        deleteUserBtn.addEventListener('click', async function () {
            if (!employeeId) return;
            const confirmation = await Swal.fire({
                title: 'Delete employee?',
                text: 'This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#800000',
                confirmButtonText: 'Yes, delete user',
            });

            if (!confirmation.isConfirmed) return;

            const response = await fetch(`/api/employees/${encodeURIComponent(employeeId)}`, { method: 'DELETE' });
            if (!response.ok) {
                const err = await response.json().catch(() => ({ detail: 'Unable to delete employee.' }));
                Swal.fire({ icon: 'error', title: 'Delete failed', text: err.detail || 'Unable to delete employee.' });
                return;
            }

            Swal.fire({ icon: 'success', title: 'Deleted', text: 'Employee record has been deleted.' }).then(() => {
                window.location.href = 'hr_employeelist.html';
            });
        });
    }

    loadEmployee();
});