/**
 * Document Management System
 * Handles upload, download, delete, and review of profile documents
 * Works across all roles: Employee, HR, Head, SD
 */

let currentDocumentId = null;
let targetEmployeeId = null; // For HR viewing employee documents
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['pdf', 'docx', 'doc', 'jpg', 'jpeg', 'png'];

// Initialize modals and event listeners on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Extract employee_id from URL if viewing from HR employee view
    const params = new URLSearchParams(window.location.search);
    targetEmployeeId = params.get('employee_id') || params.get('id');
    
    initializeDocumentManagement();
});

function initializeDocumentManagement() {
    setupUploadModal();
    setupDeleteModal();
    setupReviewModal();
    loadDocuments();
}

/**
 * UPLOAD MODAL SETUP
 */
function setupUploadModal() {
    const uploadBtn = document.getElementById('uploadDocBtn');
    const uploadModal = document.getElementById('uploadDocumentModal');
    const closeUploadModal = document.getElementById('closeUploadModal');
    const cancelUploadBtn = document.getElementById('cancelUploadBtn');
    const uploadForm = document.getElementById('uploadDocumentForm');

    if (!uploadBtn || !uploadModal) return;

    uploadBtn.addEventListener('click', () => {
        uploadModal.style.display = 'flex';
        uploadModal.classList.add('show');
    });

    closeUploadModal?.addEventListener('click', () => {
        uploadModal.style.display = 'none';
        uploadModal.classList.remove('show');
        uploadForm.reset();
    });

    cancelUploadBtn?.addEventListener('click', () => {
        uploadModal.style.display = 'none';
        uploadModal.classList.remove('show');
        uploadForm.reset();
    });

    uploadForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleDocumentUpload(uploadForm, uploadModal);
    });

    // Close modal when clicking outside
    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            uploadModal.style.display = 'none';
            uploadModal.classList.remove('show');
            uploadForm.reset();
        }
    });
}

/**
 * DELETE MODAL SETUP
 */
function setupDeleteModal() {
    const deleteModal = document.getElementById('deleteDocumentModal');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    if (!deleteModal) return;

    closeDeleteModal?.addEventListener('click', () => {
        deleteModal.style.display = 'none';
        deleteModal.classList.remove('show');
        currentDocumentId = null;
    });

    cancelDeleteBtn?.addEventListener('click', () => {
        deleteModal.style.display = 'none';
        deleteModal.classList.remove('show');
        currentDocumentId = null;
    });

    confirmDeleteBtn?.addEventListener('click', async () => {
        if (currentDocumentId) {
            await handleDocumentDelete(currentDocumentId, deleteModal);
        }
    });

    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            deleteModal.style.display = 'none';
            deleteModal.classList.remove('show');
            currentDocumentId = null;
        }
    });
}

/**
 * REVIEW MODAL SETUP (for HR/Head/SD)
 */
function setupReviewModal() {
    const reviewModal = document.getElementById('reviewDocumentModal');
    if (!reviewModal) return;

    const closeReviewModal = document.getElementById('closeReviewModal');
    const cancelReviewBtn = document.getElementById('cancelReviewBtn');
    const reviewForm = document.getElementById('reviewDocumentForm');

    closeReviewModal?.addEventListener('click', () => {
        reviewModal.style.display = 'none';
        reviewModal.classList.remove('show');
        currentDocumentId = null;
    });

    cancelReviewBtn?.addEventListener('click', () => {
        reviewModal.style.display = 'none';
        reviewModal.classList.remove('show');
        currentDocumentId = null;
    });

    reviewForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (currentDocumentId) {
            await handleDocumentReview(currentDocumentId, reviewForm, reviewModal);
        }
    });

    reviewModal.addEventListener('click', (e) => {
        if (e.target === reviewModal) {
            reviewModal.style.display = 'none';
            reviewModal.classList.remove('show');
            currentDocumentId = null;
        }
    });
}

/**
 * UPLOAD DOCUMENT
 */
async function handleDocumentUpload(form, modal) {
    const fileInput = form.querySelector('input[name="document_file"]');
    const file = fileInput.files[0];

    if (!file) {
        showNotification('Please select a file', 'error');
        return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        showNotification(`File size exceeds 10MB limit`, 'error');
        return;
    }

    // Validate file type
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_TYPES.includes(fileExt)) {
        showNotification(`File type not allowed. Supported: ${ALLOWED_TYPES.join(', ')}`, 'error');
        return;
    }

    const formData = new FormData(form);

    try {
        const response = await fetch('/api/profile/documents', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            showNotification(error.detail || 'Upload failed', 'error');
            return;
        }

        const result = await response.json();
        showNotification('Document uploaded successfully!', 'success');
        
        // Close modal and reload documents
        modal.style.display = 'none';
        modal.classList.remove('show');
        form.reset();
        await loadDocuments();

    } catch (error) {
        console.error('Upload error:', error);
        showNotification('An error occurred during upload', 'error');
    }
}

/**
 * LOAD DOCUMENTS
 */
async function loadDocuments() {
    try {
        // Build URL with optional employee_id parameter
        const url = new URL('/api/profile/documents', window.location.origin);
        if (targetEmployeeId) {
            url.searchParams.append('user_id', targetEmployeeId);
        }
        
        const response = await fetch(url.toString());
        if (!response.ok) {
            console.error('Failed to load documents');
            return;
        }

        const data = await response.json();
        const documents = data.documents || [];
        renderDocuments(documents);

    } catch (error) {
        console.error('Error loading documents:', error);
    }
}

/**
 * RENDER DOCUMENTS IN TABLE
 */
function renderDocuments(documents) {
    const tbody = document.querySelector('.doc-table tbody');
    const docHeader = document.querySelector('.doc-header span');
    
    if (!tbody) return;

    if (!documents || documents.length === 0) {
        if (docHeader) docHeader.textContent = '0 documents uploaded';
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:32px 16px; color:#999;">
                    <i class="fas fa-file-import" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
                    No documents uploaded yet. Click "Upload Document" to get started.
                </td>
            </tr>
        `;
        return;
    }

    if (docHeader) docHeader.textContent = `${documents.length} document(s) uploaded`;

    tbody.innerHTML = documents.map((doc) => {
        const statusClass = getStatusClass(doc.status);
        const viewUrl = doc.url ? `${doc.url}?mode=inline` : '';
        const downloadUrl = doc.url ? `${doc.url}?mode=attachment` : '';
        const viewBtn = viewUrl ? `<a href="${viewUrl}" target="_blank" title="View"><i class="fas fa-eye action-icon"></i></a>` : '';
        const downloadBtn = downloadUrl ? `<a href="${downloadUrl}" download title="Download"><i class="fas fa-download action-icon"></i></a>` : '';
        const deleteBtn = `<i class="fas fa-trash-alt action-icon delete" onclick="openDeleteModal(${doc.id}, '${doc.name}')" title="Delete" style="cursor: pointer;"></i>`;
        const reviewBtn = shouldShowReviewOption(doc) ? `<i class="fas fa-edit action-icon" onclick="openReviewModal(${doc.id})" title="Review" style="cursor: pointer;"></i>` : '';

        return `
            <tr>
                <td>${doc.name || 'Document'}</td>
                <td>${doc.type || 'FILE'}</td>
                <td class="${statusClass}">${doc.status || 'Submitted'}</td>
                <td>${doc.dateUploaded || '--'}</td>
                <td class="actions">
                    ${viewBtn}
                    ${downloadBtn}
                    ${deleteBtn}
                    ${reviewBtn}
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * GET STATUS CLASS FOR COLOR CODING
 */
function getStatusClass(status) {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'approved') return 'valid';
    if (statusLower === 'rejected' || statusLower === 'missing') return 'missing';
    return 'update';
}

/**
 * CHECK IF REVIEW OPTION SHOULD SHOW
 */
function shouldShowReviewOption(doc) {
    // Check if current user is HR/Head/Admin/SD
    // This is determined by checking the role from the profile or by checking if review modal exists
    return document.getElementById('reviewDocumentModal') !== null;
}

/**
 * OPEN DELETE MODAL
 */
function openDeleteModal(documentId, documentName) {
    currentDocumentId = documentId;
    const deleteModal = document.getElementById('deleteDocumentModal');
    const deleteDocName = document.getElementById('deleteDocName');
    
    if (!deleteModal) return;
    
    if (deleteDocName) {
        deleteDocName.textContent = documentName;
    }
    
    deleteModal.style.display = 'flex';
    deleteModal.classList.add('show');
}

/**
 * DELETE DOCUMENT
 */
async function handleDocumentDelete(documentId, modal) {
    try {
        const response = await fetch(`/api/profile/documents/${documentId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const error = await response.json();
            showNotification(error.detail || 'Delete failed', 'error');
            return;
        }

        showNotification('Document deleted successfully!', 'success');
        
        // Close modal and reload documents
        modal.style.display = 'none';
        modal.classList.remove('show');
        currentDocumentId = null;
        await loadDocuments();

    } catch (error) {
        console.error('Delete error:', error);
        showNotification('An error occurred during deletion', 'error');
    }
}

/**
 * OPEN REVIEW MODAL (for HR/Head/Admin/SD)
 */
function openReviewModal(documentId) {
    currentDocumentId = documentId;
    const reviewModal = document.getElementById('reviewDocumentModal');
    
    if (!reviewModal) return;
    
    reviewModal.style.display = 'flex';
    reviewModal.classList.add('show');
}

/**
 * REVIEW DOCUMENT (HR/Head/Admin/SD)
 */
async function handleDocumentReview(documentId, form, modal) {
    const formData = new FormData(form);

    try {
        const response = await fetch(`/api/profile/documents/${documentId}`, {
            method: 'PATCH',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            showNotification(error.detail || 'Review submission failed', 'error');
            return;
        }

        showNotification('Document review submitted successfully!', 'success');
        
        // Close modal and reload documents
        modal.style.display = 'none';
        modal.classList.remove('show');
        form.reset();
        currentDocumentId = null;
        await loadDocuments();

    } catch (error) {
        console.error('Review error:', error);
        showNotification('An error occurred during review submission', 'error');
    }
}

/**
 * SHOW NOTIFICATION
 */
function showNotification(message, type = 'info') {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
        color: white;
        border-radius: 4px;
        z-index: 2000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
