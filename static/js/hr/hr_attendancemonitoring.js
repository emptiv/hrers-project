(function () {
    function stripTime(value) {
        const d = new Date(value);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function formatDateLabel(value) {
        return value.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    }

    function getSelectedColumnIndex(weekStartDate, selectedDate) {
        const basis = selectedDate || new Date();
        const diffDays = Math.floor((stripTime(basis) - stripTime(weekStartDate)) / (24 * 3600 * 1000));
        if (diffDays < 0 || diffDays > 6) return 2;
        return 1 + diffDays;
    }

    function normalizeStatus(status) {
        return String(status || '').toLowerCase().trim().replace(/\s+/g, '-');
    }

    function getStatusMeta(status, fallbackDate) {
        const normalized = normalizeStatus(status);
        const day = fallbackDate ? new Date(fallbackDate).getDay() : null;
        const isWeekend = day === 0 || day === 6;

        if (normalized === 'present') return { label: 'Present', className: 'pill-green' };
        if (normalized === 'late') return { label: 'Late', className: 'pill-tan' };
        if (normalized === 'active') return { label: 'Active', className: 'pill-green' };
        if (normalized === 'leave') return { label: 'Leave', className: 'pill-purple' };
        if (normalized === 'holiday') return { label: 'Holiday', className: 'pill-purple' };
        if (normalized === 'absent') return { label: 'Absent', className: 'pill-red' };
        if (normalized === 'day-off' || normalized === 'dayoff') return { label: 'Day Off', className: 'pill-neutral' };
        if (normalized === 'none' || normalized === '') {
            return isWeekend
                ? { label: 'Day Off', className: 'pill-neutral' }
                : { label: 'No Record', className: 'pill-neutral' };
        }

        return {
            label: normalized.replace(/-/g, ' ').replace(/\b\w/g, function (char) { return char.toUpperCase(); }),
            className: 'pill-neutral'
        };
    }

    document.addEventListener('DOMContentLoaded', function () {
        const sidebar = document.getElementById('sidebar');
        const logoToggle = document.getElementById('logoToggle');
        const closeBtn = document.getElementById('closeBtn');
        const menuItems = document.querySelectorAll('.menu-item');

        if (closeBtn) closeBtn.addEventListener('click', function () { sidebar.classList.add('collapsed'); });
        if (logoToggle) logoToggle.addEventListener('click', function () { sidebar.classList.toggle('collapsed'); });
        menuItems.forEach(function (item) {
            const span = item.querySelector('span');
            if (span) item.setAttribute('data-text', span.innerText.trim());
        });

        const searchInput = document.getElementById('tableSearch');
        const statCards = Array.from(document.querySelectorAll('.stats-container .stat-card'));
        const activeFiltersWrap = document.querySelector('.active-filters');
        const actionButtons = Array.from(document.querySelectorAll('.action-buttons .btn-action'));
        const filterBtn = actionButtons[0] || null;
        const dateBtn = actionButtons[1] || null;
        const dateInput = document.getElementById('sampleDateInput');

        const pager = document.querySelector('.action-buttons .pagination');
        const pagerPrev = pager ? pager.querySelector('.fa-chevron-left') : null;
        const pagerNext = pager ? pager.querySelector('.fa-chevron-right') : null;
        const pagerLabel = pager ? pager.querySelector('span') : null;

        const table = document.querySelector('.attendance-table');
        const tbody = table ? table.querySelector('tbody') : null;
        const employeeModal = document.getElementById('employeeModal');
        const closeModalBtn = employeeModal ? employeeModal.querySelector('.close-modal') : null;
        const modalTableBody = document.getElementById('modalTableBody');
        const weeklyViewBtn = document.getElementById('weeklyViewBtn');
        const monthlyViewBtn = document.getElementById('monthlyViewBtn');
        const dateRangeText = document.getElementById('dateRangeText');
        const periodText = document.getElementById('periodText');
        const totalHoursValue = document.getElementById('totalHoursValue');
        const detID = document.getElementById('detID');
        const modalEmployeeName = document.getElementById('modalEmployeeName');
        const detPos = document.getElementById('detPos');
        const detDept = document.getElementById('detDept');
        const modalEmploymentType = employeeModal ? employeeModal.querySelector('.modal-sidebar .info-group:last-of-type span') : null;

        let weekOffset = 0;
        let weekStartDate = new Date();
        let monitoringRows = [];
        let modalEmployeeId = null;
        let modalView = 'weekly';
        let modalOffset = 0;
        const filterState = { dept: 'All', status: 'All', date: null };

        const filterPopover = document.createElement('div');
        filterPopover.className = 'head-filter-popover';
        filterPopover.style.display = 'none';
        filterPopover.innerHTML = `
            <div class="head-filter-title">Filters</div>
            <div class="head-filter-grid">
                <label class="head-filter-label">Department</label>
                <select id="hfDept" class="head-filter-select">
                    <option>All</option>
                </select>
                <label class="head-filter-label">Status (Selected day)</label>
                <select id="hfStatus" class="head-filter-select">
                    <option>All</option>
                    <option>Present</option>
                    <option>Late</option>
                    <option>Absent</option>
                    <option>Leave</option>
                    <option>Active</option>
                </select>
            </div>
            <div class="head-filter-actions">
                <button type="button" class="head-filter-btn head-filter-btn-ghost" id="hfClear">Clear</button>
                <button type="button" class="head-filter-btn head-filter-btn-primary" id="hfApply">Apply</button>
            </div>
        `;

        const controlsRow = document.querySelector('.controls-row');
        if (controlsRow) {
            controlsRow.style.position = 'relative';
            controlsRow.appendChild(filterPopover);
        }

        function toggleFilterPopover(forceOpen) {
            const open = typeof forceOpen === 'boolean' ? forceOpen : filterPopover.style.display !== 'block';
            filterPopover.style.display = open ? 'block' : 'none';
        }

        function setDateButtonLabel() {
            if (!dateBtn) return;
            if (!filterState.date) {
                dateBtn.innerHTML = '<i class="fas fa-calendar-alt"></i> Select Date';
                return;
            }
            dateBtn.innerHTML = '<i class="fas fa-calendar-alt"></i> ' + formatDateLabel(filterState.date);
        }

        function createFilterTag(label, onRemove) {
            if (!activeFiltersWrap) return;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'filter-tag';
            btn.innerHTML = label + ' <i class="fas fa-times"></i>';
            btn.querySelector('.fa-times').addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
            });
            activeFiltersWrap.appendChild(btn);
        }

        function syncFilterTags() {
            if (!activeFiltersWrap) return;
            activeFiltersWrap.innerHTML = '';

            if (filterState.dept !== 'All') {
                createFilterTag('Dept: ' + filterState.dept, function () {
                    filterState.dept = 'All';
                    applyFilters();
                });
            }
            if (filterState.status !== 'All') {
                createFilterTag('Status: ' + filterState.status, function () {
                    filterState.status = 'All';
                    applyFilters();
                });
            }
            if (filterState.date) {
                createFilterTag('Date: ' + formatDateLabel(filterState.date), function () {
                    filterState.date = null;
                    if (dateInput) dateInput.value = '';
                    setDateButtonLabel();
                    applyFilters();
                });
            }
        }

        function rowMatchesFilters(row) {
            const dept = row.dataset.dept || '';
            const name = row.dataset.name || '';
            const title = row.dataset.title || '';
            const q = (searchInput && searchInput.value ? searchInput.value : '').trim().toLowerCase();

            if (q) {
                const combined = (name + ' ' + dept + ' ' + title).toLowerCase();
                if (combined.indexOf(q) === -1) return false;
            }

            if (filterState.dept !== 'All' && dept !== filterState.dept) return false;

            if (filterState.status !== 'All') {
                const selectedCol = getSelectedColumnIndex(weekStartDate, filterState.date);
                const dayStatuses = (row.dataset.dayStatuses || '').split(',');
                const dayStatus = dayStatuses[selectedCol - 1] || 'none';
                const normalized = dayStatus.toLowerCase();
                if (normalized !== filterState.status.toLowerCase()) return false;
            }

            return true;
        }

        function setStatValue(index, value) {
            const card = statCards[index];
            const el = card ? card.querySelector('.value') : null;
            if (el) el.textContent = String(value);
        }

        function updateStats() {
            const rows = tbody ? Array.from(tbody.querySelectorAll('tr')) : [];
            const visible = rows.filter(function (row) { return row.style.display !== 'none'; });
            const selectedCol = getSelectedColumnIndex(weekStartDate, filterState.date);

            let present = 0;
            let absent = 0;
            let leave = 0;
            let late = 0;

            visible.forEach(function (row) {
                const statuses = (row.dataset.dayStatuses || '').split(',');
                const status = (statuses[selectedCol - 1] || 'none').toLowerCase();
                if (status === 'present' || status === 'active') present++;
                else if (status === 'absent') absent++;
                else if (status === 'leave' || status === 'holiday') leave++;
                else if (status === 'late') late++;
            });

            setStatValue(0, visible.length);
            setStatValue(1, present);
            setStatValue(2, absent);
            setStatValue(3, leave);
            setStatValue(4, late);
        }

        function applyFilters() {
            if (!tbody) return;
            const rows = Array.from(tbody.querySelectorAll('tr'));
            rows.forEach(function (row) {
                row.style.display = rowMatchesFilters(row) ? '' : 'none';
            });
            syncFilterTags();
            updateStats();
        }

        function renderRows() {
            if (!tbody) return;
            tbody.innerHTML = '';

            monitoringRows.forEach(function (item) {
                const tr = document.createElement('tr');
                tr.dataset.employeeId = String(item.userId || '');
                tr.dataset.dept = item.department || 'General';
                tr.dataset.name = item.name || '';
                tr.dataset.title = item.title || '';
                tr.dataset.dayStatuses = (item.days || []).map(function (d) { return d.status || 'none'; }).join(',');
                tr.style.cursor = 'pointer';

                const employeeCell = document.createElement('td');
                employeeCell.innerHTML = `
                    <div class="user-cell">
                        <div class="avatar"><i class="fas fa-user"></i></div>
                        <div class="user-info">
                            <span class="name">${item.name || '--'}</span>
                            <span class="title">${item.title || 'Employee'}</span>
                            <span class="dept-badge">${item.department || 'General'}</span>
                        </div>
                    </div>
                `;
                tr.appendChild(employeeCell);

                (item.days || []).forEach(function (day) {
                    const td = document.createElement('td');
                    const dayNum = document.createElement('span');
                    dayNum.className = 'day-num';
                    dayNum.textContent = String(day.dayNum || '');
                    td.appendChild(dayNum);

                    const statusMeta = getStatusMeta(day.status, day.date);
                    const pillLabel = day.label || statusMeta.label;
                    if (pillLabel) {
                        const pill = document.createElement('div');
                        pill.className = 'pill ' + (day.pillClass || statusMeta.className);
                        pill.textContent = pillLabel;
                        td.appendChild(pill);
                    }

                    tr.appendChild(td);
                });

                tbody.appendChild(tr);

                tr.addEventListener('click', function () {
                    openEmployeeModal(item);
                });
            });

            applyFilters();
        }

        function showModal() {
            if (employeeModal) employeeModal.style.display = 'block';
        }

        function hideModal() {
            if (employeeModal) employeeModal.style.display = 'none';
        }

        function setModalEmployeeDetails(item) {
            if (detID) detID.textContent = item.employeeNo || item.employeeId || '--';
            if (modalEmployeeName) modalEmployeeName.textContent = item.fullName || item.name || '--';
            if (detPos) detPos.textContent = item.position || item.title || '--';
            if (detDept) detDept.textContent = item.department || 'General';
            if (modalEmploymentType) modalEmploymentType.textContent = item.employmentType || '--';
        }

        function renderModalRows(rows) {
            if (!modalTableBody) return;
            if (!rows || !rows.length) {
                modalTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:1.5rem;">No attendance records found.</td></tr>';
                return;
            }

            modalTableBody.innerHTML = rows.map(function (row) {
                const statusMeta = getStatusMeta(row.status, row.date);
                const rowDataStr = encodeURIComponent(JSON.stringify(row));
                return '<tr>' +
                    '<td>' + (row.date || '--') + '</td>' +
                    '<td>' + (row.day || '--') + '</td>' +
                    '<td>' + (row.timeIn || '--') + '</td>' +
                    '<td>' + (row.timeOut || '--') + '</td>' +
                    '<td>' + (row.hours || '--') + 
                    (row.overtime ? '<br><small style="color: #059669; font-weight: 600;">+' + row.overtime + ' OT</small>' : '') +
                    (row.undertime ? '<br><small style="color: #dc2626; font-weight: 600;">-' + row.undertime + ' UT</small>' : '') +
                    '</td>' +
                    '<td><span class="pill ' + statusMeta.className + '">' + statusMeta.label + '</span></td>' +
                    '<td>' +
                        '<button class="btn-edit-record" data-row="' + rowDataStr + '" style="background:none; border:none; color:var(--primary-color); cursor:pointer; margin-right: 0.5rem;"><i class="fas fa-edit"></i></button>' +
                        '<button class="btn-delete-record" data-date="' + (row.isoDate || row.date) + '" style="background:none; border:none; color:#dc3545; cursor:pointer;"><i class="fas fa-trash-alt"></i></button>' +
                    '</td>' +
                '</tr>';
            }).join('');
            
            const editBtns = modalTableBody.querySelectorAll('.btn-edit-record');
            editBtns.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const rowData = JSON.parse(decodeURIComponent(this.getAttribute('data-row')));
                    openEditRecordModal(rowData);
                });
            });

            const deleteBtns = modalTableBody.querySelectorAll('.btn-delete-record');
            deleteBtns.forEach(btn => {
                btn.addEventListener('click', async function(e) {
                    e.stopPropagation();
                    const dateStr = this.getAttribute('data-date');
                    if (!confirm('Are you sure you want to delete the attendance record for ' + dateStr + '?')) return;
                    
                    try {
                        const response = await fetch('/api/attendance/employee/' + modalEmployeeId + '/record/' + dateStr, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            loadModalAttendance();
                            loadWeekData();
                        } else {
                            const err = await response.json();
                            alert('Error deleting record: ' + (err.detail || 'Unknown error'));
                        }
                    } catch (error) {
                        alert('Network error deleting record.');
                    }
                });
            });
        }

        async function loadModalAttendance() {
            if (!modalEmployeeId) return;
            if (modalTableBody) {
                modalTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1.5rem;">Loading attendance record...</td></tr>';
            }

            try {
                const response = await fetch('/api/attendance/employee/' + encodeURIComponent(modalEmployeeId) + '?view=' + encodeURIComponent(modalView) + '&offset=' + encodeURIComponent(modalOffset));
                if (!response.ok) {
                    renderModalRows([]);
                    if (dateRangeText) dateRangeText.textContent = '--';
                    if (totalHoursValue) totalHoursValue.textContent = '0h 00m';
                    if (periodText) periodText.textContent = modalView === 'monthly' ? 'Month' : 'Week';
                    return;
                }

                const payload = await response.json();
                if (payload.employee) setModalEmployeeDetails(payload.employee);
                if (dateRangeText) dateRangeText.textContent = payload.label || '--';
                if (periodText) periodText.textContent = payload.periodText || (modalView === 'monthly' ? 'Month' : 'Week');
                if (totalHoursValue) totalHoursValue.textContent = payload.total || '0h 00m';
                renderModalRows(payload.rows || []);
            } catch (error) {
                renderModalRows([]);
            }
        }

        function openEmployeeModal(item) {
            modalEmployeeId = item.userId || null;
            modalView = 'weekly';
            modalOffset = 0;
            setModalEmployeeDetails({
                employeeNo: item.employeeId,
                fullName: item.name,
                position: item.title,
                department: item.department,
                employmentType: 'Full-time'
            });
            if (weeklyViewBtn) weeklyViewBtn.classList.add('active');
            if (monthlyViewBtn) monthlyViewBtn.classList.remove('active');
            showModal();
            loadModalAttendance();
        }

        function populateDepartmentOptions() {
            const deptSel = filterPopover.querySelector('#hfDept');
            if (!deptSel) return;

            const existing = new Set();
            deptSel.innerHTML = '<option>All</option>';

            monitoringRows.forEach(function (item) {
                const dept = item.department || 'General';
                if (existing.has(dept)) return;
                existing.add(dept);
                const opt = document.createElement('option');
                opt.value = dept;
                opt.textContent = dept;
                deptSel.appendChild(opt);
            });
        }

        async function loadWeekData() {
            try {
                const response = await fetch('/api/attendance/monitoring?offset=' + encodeURIComponent(weekOffset));
                if (!response.ok) {
                    monitoringRows = [];
                    renderRows();
                    return;
                }

                const payload = await response.json();
                monitoringRows = payload.rows || [];
                weekStartDate = payload.weekStart ? new Date(payload.weekStart) : new Date();
                if (pagerLabel) pagerLabel.textContent = payload.weekLabel || 'Week';

                populateDepartmentOptions();
                renderRows();
            } catch (error) {
                monitoringRows = [];
                renderRows();
            }
        }

        if (searchInput) searchInput.addEventListener('input', applyFilters);

        if (filterBtn) {
            filterBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const deptSel = filterPopover.querySelector('#hfDept');
                const statusSel = filterPopover.querySelector('#hfStatus');
                if (deptSel) deptSel.value = filterState.dept;
                if (statusSel) statusSel.value = filterState.status;
                toggleFilterPopover();
            });
        }

        document.addEventListener('click', function (e) {
            if (filterPopover.style.display !== 'block') return;
            if (filterPopover.contains(e.target)) return;
            if (filterBtn && filterBtn.contains(e.target)) return;
            toggleFilterPopover(false);
        });

        const applyBtn = filterPopover.querySelector('#hfApply');
        const clearBtnPopover = filterPopover.querySelector('#hfClear');
        if (applyBtn) {
            applyBtn.addEventListener('click', function () {
                const deptSel = filterPopover.querySelector('#hfDept');
                const statusSel = filterPopover.querySelector('#hfStatus');
                filterState.dept = deptSel ? deptSel.value : 'All';
                filterState.status = statusSel ? statusSel.value : 'All';
                toggleFilterPopover(false);
                applyFilters();
            });
        }
        if (clearBtnPopover) {
            clearBtnPopover.addEventListener('click', function () {
                filterState.dept = 'All';
                filterState.status = 'All';
                filterState.date = null;
                if (searchInput) searchInput.value = '';
                if (dateInput) dateInput.value = '';
                setDateButtonLabel();
                toggleFilterPopover(false);
                applyFilters();
            });
        }

        if (dateBtn && dateInput) {
            dateBtn.addEventListener('click', function (e) {
                e.preventDefault();
                if (filterState.date) {
                    const y = filterState.date.getFullYear();
                    const m = String(filterState.date.getMonth() + 1).padStart(2, '0');
                    const d = String(filterState.date.getDate()).padStart(2, '0');
                    dateInput.value = y + '-' + m + '-' + d;
                } else {
                    dateInput.value = '';
                }
                dateInput.showPicker ? dateInput.showPicker() : dateInput.click();
            });

            dateInput.addEventListener('change', function () {
                filterState.date = dateInput.value ? stripTime(new Date(dateInput.value)) : null;
                setDateButtonLabel();
                applyFilters();
            });
        }

        if (pagerPrev) {
            pagerPrev.addEventListener('click', function () {
                weekOffset += 1;
                loadWeekData();
            });
        }

        if (pagerNext) {
            pagerNext.addEventListener('click', function () {
                weekOffset -= 1;
                loadWeekData();
            });
        }

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', hideModal);
        }

        if (employeeModal) {
            employeeModal.addEventListener('click', function (e) {
                if (e.target === employeeModal) hideModal();
            });
        }

        if (weeklyViewBtn) {
            weeklyViewBtn.addEventListener('click', function () {
                if (!modalEmployeeId) return;
                modalView = 'weekly';
                modalOffset = 0;
                weeklyViewBtn.classList.add('active');
                if (monthlyViewBtn) monthlyViewBtn.classList.remove('active');
                loadModalAttendance();
            });
        }

        if (monthlyViewBtn) {
            monthlyViewBtn.addEventListener('click', function () {
                if (!modalEmployeeId) return;
                modalView = 'monthly';
                modalOffset = 0;
                monthlyViewBtn.classList.add('active');
                if (weeklyViewBtn) weeklyViewBtn.classList.remove('active');
                loadModalAttendance();
            });
        }

        const modalPager = employeeModal ? employeeModal.querySelector('.date-pager') : null;
        const modalPagerPrev = modalPager ? modalPager.querySelector('.fa-chevron-left') : null;
        const modalPagerNext = modalPager ? modalPager.querySelector('.fa-chevron-right') : null;

        if (modalPagerPrev) {
            modalPagerPrev.addEventListener('click', function () {
                if (!modalEmployeeId) return;
                modalOffset += 1;
                loadModalAttendance();
            });
        }

        if (modalPagerNext) {
            modalPagerNext.addEventListener('click', function () {
                if (!modalEmployeeId) return;
                if (modalOffset > 0) {
                    modalOffset -= 1;
                    loadModalAttendance();
                }
            });
        }

        setDateButtonLabel();
        loadWeekData();

        // Edit Record Modal Logic
        const editRecordModal = document.getElementById('editRecordModal');
        const closeEditModalBtn = document.querySelector('.close-edit-modal');
        const editRecordForm = document.getElementById('editRecordForm');
        const editRecordDate = document.getElementById('editRecordDate');
        const editRecordDisplayDate = document.getElementById('editRecordDisplayDate');
        const editTimeIn = document.getElementById('editTimeIn');
        const editTimeOut = document.getElementById('editTimeOut');
        const editStatus = document.getElementById('editStatus');

        function parseTimeStr(tStr) {
            if (!tStr || tStr === '--') return '';
            // Example: "8:00 AM" or "08:00" -> convert to "HH:MM" for input type="time"
            const match = tStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
            if (!match) return '';
            let h = parseInt(match[1]);
            const m = parseInt(match[2]);
            const ampm = match[3];
            if (ampm) {
                if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
                if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
            }
            return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
        }

        function openEditRecordModal(row) {
            editRecordDate.value = row.isoDate || row.date; // backend will use isoDate or date
            editRecordDisplayDate.textContent = row.date;
            editTimeIn.value = parseTimeStr(row.timeIn);
            editTimeOut.value = parseTimeStr(row.timeOut);
            
            // Map status to dropdown value
            const stat = (row.status || '').toLowerCase();
            if (stat === 'present' || stat === 'active') editStatus.value = 'Present';
            else if (stat === 'late') editStatus.value = 'Late';
            else if (stat === 'absent' || stat === 'day-off') editStatus.value = 'Absent';
            else if (stat === 'leave') editStatus.value = 'Leave';
            else if (stat === 'holiday') editStatus.value = 'Holiday';
            else editStatus.value = 'Present';
            
            editRecordModal.style.display = 'block';
        }

        if (closeEditModalBtn) {
            closeEditModalBtn.addEventListener('click', function() {
                editRecordModal.style.display = 'none';
            });
        }
        
        window.addEventListener('click', function(e) {
            if (e.target === editRecordModal) {
                editRecordModal.style.display = 'none';
            }
        });

        if (editRecordForm) {
            editRecordForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                if (!modalEmployeeId) return;

                const payload = {
                    isoDate: editRecordDate.value,
                    timeIn: editTimeIn.value ? editTimeIn.value : '--',
                    timeOut: editTimeOut.value ? editTimeOut.value : '--',
                    status: editStatus.value
                };

                try {
                    const response = await fetch('/api/attendance/employee/' + modalEmployeeId + '/record', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        editRecordModal.style.display = 'none';
                        loadModalAttendance(); // reload the modal table
                        loadWeekData(); // reload the main table
                    } else {
                        const err = await response.json();
                        alert('Error updating record: ' + (err.detail || 'Unknown error'));
                    }
                } catch (error) {
                    alert('Network error updating record.');
                }
            });
        }
    });
})();
