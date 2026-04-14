/* ============================================================
   head_training.js
   Path: static/js/training_management/head_training.js
   ============================================================ */

let myTrainings = [];
let trainingSessions = [];
let activeCardData = null;

const sidebar = document.getElementById('sidebar');
const logoToggle = document.getElementById('logoToggle');
const closeBtn = document.getElementById('closeBtn');
const menuItems = document.querySelectorAll('.menu-item');
const modalOverlay = document.getElementById('modalOverlay');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnRegister = document.getElementById('btnRegisterModal');
const myTrainingsList = document.getElementById('myTrainingsList');

function normalizeTitle(title) {
    return String(title || '').trim().toLowerCase();
}

function getSessionForCard(card) {
    const title = normalizeTitle(card.dataset.title);
    return trainingSessions.find(function (session) {
        return normalizeTitle(session.title) === title;
    }) || null;
}

function getMyTrainingTitleSet() {
    return new Set(myTrainings.map(function (training) {
        return normalizeTitle(training.title);
    }));
}

function toDisplayDate(value) {
    if (!value) return '';
    if (value.includes('/')) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString();
}

async function refreshTrainingState() {
    try {
        const sessionsResponse = await fetch('/api/trainings');
        if (sessionsResponse.ok) {
            const sessionsPayload = await sessionsResponse.json();
            trainingSessions = sessionsPayload.items || [];
        }
    } catch (error) {
        trainingSessions = [];
    }

    try {
        const myResponse = await fetch('/api/trainings/me');
        if (myResponse.ok) {
            const myPayload = await myResponse.json();
            myTrainings = myPayload.items || [];
        }
    } catch (error) {
        myTrainings = [];
    }

    syncTrainingCards();
    renderMyTrainings();
    syncModalRegisterState();
}

function syncTrainingCards() {
    const registeredTitles = getMyTrainingTitleSet();

    document.querySelectorAll('.training-card').forEach(function (card) {
        const session = getSessionForCard(card);
        if (!session) return;

        const slots = card.querySelector('.slots');
        const badge = card.querySelector('.badge');
        const registerBtn = card.querySelector('.register-btn');
        const isRegistered = registeredTitles.has(normalizeTitle(session.title));
        const isDisabled = session.status === 'completed' || session.status === 'cancelled' || session.status === 'full';

        if (slots) {
            slots.textContent = `${session.filled} / ${session.total} slots`;
        }

        if (badge) {
            badge.textContent = session.type || card.dataset.type || '';
        }

        if (registerBtn) {
            if (isRegistered) {
                registerBtn.textContent = 'Registered ✓';
                registerBtn.classList.add('registered');
                registerBtn.disabled = true;
            } else if (isDisabled) {
                registerBtn.textContent = session.status === 'full' ? 'Full' : 'Closed';
                registerBtn.classList.add('registered');
                registerBtn.disabled = true;
            } else {
                registerBtn.textContent = 'Register';
                registerBtn.classList.remove('registered');
                registerBtn.disabled = false;
            }
        }

        card.dataset.sessionId = String(session.id);
        card.dataset.sessionStatus = session.status;
    });
}

function syncModalRegisterState() {
    if (!activeCardData || !btnRegister) return;

    const session = activeCardData.session;
    const registeredTitles = getMyTrainingTitleSet();
    const isRegistered = registeredTitles.has(normalizeTitle(session.title));
    const isDisabled = session.status === 'completed' || session.status === 'cancelled' || session.status === 'full';

    if (isRegistered) {
        btnRegister.textContent = 'Registered ✓';
        btnRegister.classList.add('registered');
        btnRegister.disabled = true;
    } else if (isDisabled) {
        btnRegister.textContent = session.status === 'full' ? 'Full' : 'Closed';
        btnRegister.classList.add('registered');
        btnRegister.disabled = true;
    } else {
        btnRegister.textContent = 'Register';
        btnRegister.classList.remove('registered');
        btnRegister.disabled = false;
    }
}

function showNotification(message) {
    if (window.Swal && typeof window.Swal.fire === 'function') {
        window.Swal.fire({
            icon: 'info',
            title: 'Training Update',
            text: message,
            confirmButtonColor: '#4a1d1d',
        });
        return;
    }
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
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () {
        toast.remove();
    }, 2200);
}

function openModal(data, card) {
    const session = getSessionForCard(card) || {
        title: data.title,
        category: data.category,
        type: data.type,
        date: data.date,
        status: data.status,
        description: data.description,
        provider: data.provider,
        location: data.location,
        contact: data.contact,
        slotsText: data.slots,
        id: card.dataset.sessionId || '',
    };

    activeCardData = { data, card, session };

    document.getElementById('modal-title').textContent = session.title;
    document.getElementById('modal-meta').innerHTML =
        `${session.category} <span>|</span> ${session.type} <span>|</span> ${toDisplayDate(session.date)}`;
    document.getElementById('modal-status').textContent = String(session.status || 'Open').replace(/^./, function (char) { return char.toUpperCase(); });
    document.getElementById('modal-description').textContent = session.description || data.description || '';
    document.getElementById('modal-provider').textContent = session.provider || data.provider || '';
    document.getElementById('modal-location').textContent = session.location || data.location || '';
    document.getElementById('modal-contact').textContent = session.contact || data.contact || '';
    document.getElementById('modal-slots').textContent = session.slotsText || data.slots || '';

    syncModalRegisterState();
    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
    activeCardData = null;
}

async function handleRegister(data, card) {
    const session = getSessionForCard(card) || (activeCardData && activeCardData.session);
    if (!session) return;

    const response = await fetch('/api/trainings/' + session.id + '/register', {
        method: 'POST',
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unable to register.' }));
        showNotification(error.detail || 'Unable to register.');
        return;
    }

    await refreshTrainingState();
    showNotification('Training registration saved.');
}

function renderMyTrainings() {
    if (!myTrainingsList) return;

    if (myTrainings.length === 0) {
        myTrainingsList.innerHTML = '<div class="empty-state">No registered trainings yet.</div>';
        return;
    }

    myTrainingsList.innerHTML = '';
    myTrainings.forEach(function (training) {
        const item = document.createElement('div');
        item.className = 'my-training-item';
        item.innerHTML =
            '<div class="t-name">' + training.title + '</div>' +
            '<div class="t-date">' + training.date + '</div>' +
            '<span class="status-badge registered">' + training.status + '</span>';
        myTrainingsList.appendChild(item);
    });
}

menuItems.forEach(function (item) {
    const text = item.querySelector('span') && item.querySelector('span').innerText;
    if (text) item.setAttribute('data-text', text);

    item.addEventListener('click', function () {
        document.querySelector('.menu-item.active')?.classList.remove('active');
        item.classList.add('active');

        const targetUrl = item.getAttribute('href');
        if (targetUrl === '#' || !targetUrl) {
            const dataTargetUrl = item.dataset.targetUrl;
            if (dataTargetUrl) {
                window.location.href = dataTargetUrl;
            }
        } else {
            window.location.href = targetUrl;
        }
    });
});

document.querySelectorAll('.training-card').forEach(function (card) {
    card.addEventListener('click', function (e) {
        if (e.target.classList.contains('register-btn')) {
            handleRegister(card.dataset, card);
            return;
        }
        openModal(card.dataset, card);
    });
});

btnCloseModal.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
});

btnRegister.addEventListener('click', function () {
    if (!activeCardData) return;
    handleRegister(activeCardData.data, activeCardData.card);
});

document.addEventListener('DOMContentLoaded', function () {
    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            sidebar.classList.add('collapsed');
        });
    }

    if (logoToggle) {
        logoToggle.addEventListener('click', function () {
            sidebar.classList.toggle('collapsed');
        });
    }

    refreshTrainingState();
});