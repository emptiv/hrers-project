function setupProfileEditPage() {
    const sidebar = document.getElementById('sidebar');
    const logoToggle = document.getElementById('logoToggle');
    const closeBtn = document.getElementById('closeBtn');
    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach((item) => {
        const span = item.querySelector('span');
        if (span) item.setAttribute('data-text', span.innerText);
    });

    if (sidebar && logoToggle) logoToggle.addEventListener('click', () => sidebar.classList.toggle('close'));
    if (sidebar && closeBtn) closeBtn.addEventListener('click', () => sidebar.classList.add('close'));
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
}

function getAuthHeaders() {
    const token = localStorage.getItem('hrers_access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function loadProfileEditData() {
    try {
        const response = await fetch('/api/profile/me', { headers: getAuthHeaders() });
        if (!response.ok) return;
        const profile = await response.json();

        setValue('firstName', profile.firstName || '');
        setValue('lastName', profile.lastName || '');
        setValue('empID', profile.employeeNo || profile.id || '');
        setValue('empStatus', profile.isActive ? 'Active' : 'Inactive');
        setValue('empType', profile.employmentType || 'Full-time');
        setValue('dept', profile.department || '');
        setValue('pos', profile.position || profile.roleLabel || '');
        setValue('dateHired', profile.dateHired || '');

        setValue('email', profile.email || '');
        setValue('contact', profile.contactNumber || '');
        setValue('address', profile.address || '');
        setValue('emergencyName', profile.emergencyName || '');
        setValue('emergencyPhone', profile.emergencyPhone || '');
    } catch (error) {
    }
}

async function submitProfileUpdate() {
    const formData = new FormData();
    formData.set('firstName', document.getElementById('firstName')?.value || '');
    formData.set('lastName', document.getElementById('lastName')?.value || '');
    formData.set('email', document.getElementById('email')?.value || '');
    formData.set('contactNumber', document.getElementById('contact')?.value || '');
    formData.set('address', document.getElementById('address')?.value || '');
    formData.set('emergencyName', document.getElementById('emergencyName')?.value || '');
    formData.set('emergencyPhone', document.getElementById('emergencyPhone')?.value || '');

    const response = await fetch('/api/profile/me', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({ detail: 'Unable to update profile.' }));
        throw new Error(payload.detail || 'Unable to update profile.');
    }
}

function updateHRProfile() {
    submitProfileUpdate()
        .then(() => {
            if (window.Swal) {
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top',
                    showConfirmButton: false,
                    timer: 1800,
                    timerProgressBar: true,
                    width: '450px',
                    background: '#fff',
                    color: '#4a1d1d',
                    iconColor: '#4a1d1d',
                });
                return Toast.fire({ icon: 'success', title: 'Success!', text: 'HR profile has been updated.' });
            }
            return Promise.resolve();
        })
        .then(() => {
            window.location.href = 'hr_profile_view.html';
        })
        .catch((error) => {
            if (window.Swal) {
                Swal.fire({ icon: 'error', title: 'Update failed', text: error.message || 'Unable to update profile.' });
            } else {
                alert(error.message || 'Unable to update profile.');
            }
        });
}

function cancelHREdit() { 
    Swal.fire({
        title: 'Discard changes?',
        text: "Any unsaved information will be lost.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4a1d1d',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, discard',
        cancelButtonText: 'No',
        width: '400px',
        padding: '1rem',
        customClass: {
            title: 'small-swal-title',
            htmlContainer: 'small-swal-text'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = 'hr_profile_view.html';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupProfileEditPage();
    loadProfileEditData();
});