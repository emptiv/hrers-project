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

function getBasicInputs() {
    return document.querySelectorAll('#editEmployeeForm .form-section-box:first-child .input-item input');
}

function setBasicValue(index, value) {
    const inputs = getBasicInputs();
    if (inputs[index]) inputs[index].value = value || '';
}

async function loadProfileEditData() {
    try {
        const response = await fetch('/api/profile/me');
        if (!response.ok) return;
        const profile = await response.json();

        setBasicValue(0, profile.firstName || '');
        setBasicValue(1, profile.lastName || '');
        setBasicValue(2, profile.employeeNo || profile.id || '');
        setBasicValue(3, profile.isActive ? 'Active' : 'Inactive');
        setBasicValue(4, profile.employmentType || 'Full-time');
        setBasicValue(5, profile.department || '');
        setBasicValue(6, profile.position || profile.roleLabel || '');
        setBasicValue(7, profile.dateHired || '');

        const email = document.getElementById('email');
        const contact = document.getElementById('contact');
        const address = document.getElementById('address');
        const emergencyName = document.getElementById('emergencyName');
        const emergencyPhone = document.getElementById('emergencyPhone');

        if (email) email.value = profile.email || '';
        if (contact) contact.value = profile.contactNumber || '';
        if (address) address.value = profile.address || '';
        if (emergencyName) emergencyName.value = profile.emergencyName || '';
        if (emergencyPhone) emergencyPhone.value = profile.emergencyPhone || '';
    } catch (error) {
    }
}

async function submitProfileUpdate() {
    const inputs = getBasicInputs();
    const formData = new FormData();
    formData.set('firstName', inputs[0]?.value || '');
    formData.set('lastName', inputs[1]?.value || '');
    formData.set('email', document.getElementById('email')?.value || '');

    const response = await fetch('/api/profile/me', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({ detail: 'Unable to update profile.' }));
        throw new Error(payload.detail || 'Unable to update profile.');
    }
}

function updateSDProfile() {
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
                return Toast.fire({ icon: 'success', title: 'Success!', text: 'School Director profile has been updated.' });
            }
            return Promise.resolve();
        })
        .then(() => {
            window.location.href = 'sd_profile_view.html';
        })
        .catch((error) => {
            if (window.Swal) {
                Swal.fire({ icon: 'error', title: 'Update failed', text: error.message || 'Unable to update profile.' });
            } else {
                alert(error.message || 'Unable to update profile.');
            }
        });
}

function cancelSDEdit() {
    if (window.Swal) {
        Swal.fire({
            title: 'Discard changes?',
            text: 'Any unsaved information will be lost.',
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
                htmlContainer: 'small-swal-text',
            },
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = 'sd_profile_view.html';
            }
        });
        return;
    }
    window.location.href = 'sd_profile_view.html';
}

document.addEventListener('DOMContentLoaded', () => {
    setupProfileEditPage();
    loadProfileEditData();
});