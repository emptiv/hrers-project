document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("changePasswordForm");
    const currentPassword = document.getElementById("currentPassword");
    const newPassword = document.getElementById("newPassword");
    const confirmPassword = document.getElementById("confirmPassword");
    const passwordError = document.getElementById("passwordError");

    if (!form || !newPassword || !confirmPassword || !passwordError) {
        return;
    }

    function showError(message) {
        passwordError.textContent = message;
        passwordError.style.display = "block";
    }

    function clearError() {
        passwordError.textContent = "";
        passwordError.style.display = "none";
    }

    function updateRequirements() {
        const hasLength = newPassword.value.length >= 8;
        const hasUpper = /[A-Z]/.test(newPassword.value);
        const hasLower = /[a-z]/.test(newPassword.value);
        const hasNumber = /\d/.test(newPassword.value);
        const hasSpecial = /[^A-Za-z0-9]/.test(newPassword.value);
        const isDifferent = newPassword.value !== currentPassword.value;

        document.getElementById("length").className = hasLength ? "valid" : "invalid";
        document.getElementById("upper").className = hasUpper && hasLower && hasNumber ? "valid" : "invalid";
        document.getElementById("special").className = hasSpecial ? "valid" : "invalid";
        document.getElementById("match").className = isDifferent ? "valid" : "invalid";
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!currentPassword.value.trim()) {
            showError("Current password is required.");
            return;
        }

        if (newPassword.value.length < 8) {
            showError("New password must be at least 8 characters long.");
            return;
        }

        if (newPassword.value !== confirmPassword.value) {
            showError("New password and confirmation do not match.");
            return;
        }

        updateRequirements();
        clearError();
        form.reset();
        alert("Password updated successfully.");
    });

    [currentPassword, newPassword, confirmPassword].forEach(function (field) {
        field.addEventListener("input", function () {
            clearError();
            updateRequirements();
        });
    });
});