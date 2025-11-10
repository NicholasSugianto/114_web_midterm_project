
// ============================ script.js ============================
(() => {
  // Seed events (normally from server). Each has capacity and registered count.
  const events = [
    { id: 'bball-3v3', title: '3v3 Basketball Night', date: '2025-11-20 19:00', loc: 'Gym A', capacity: 40, registered: 12, tags: ['sports','basketball'] },
    { id: 'ai101', title: 'AI 101: Prompting Basics', date: '2025-11-22 14:00', loc: 'Lab 305', capacity: 30, registered: 18, tags: ['tech','ai'] },
    { id: 'music-open', title: 'Acoustic Open‑Mic', date: '2025-11-25 18:30', loc: 'Student Hall', capacity: 50, registered: 27, tags: ['music','social'] },
    { id: 'eco-walk', title: 'Tamsui Eco Walk', date: '2025-11-29 09:00', loc: 'Riverside Park', capacity: 25, registered: 9, tags: ['outdoor','health'] },
  ];

  // LocalStorage keys
  const KEY_REGS = 'tku_regs_v1';
  const KEY_THEME = 'tku_theme_v1';

  // DOM shortcuts
  const $ = (sel, el=document) => el.querySelector(sel);
  const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];

  const eventGrid = $('#eventGrid');
  const eventCount = $('#eventCount');
  const searchInput = $('#searchInput');
  const eventSelect = $('#eventSelect');
  const ticketsInput = $('#tickets');
  const seatHint = $('#seatHint');
  const regForm = $('#regForm');
  const pwdInput = $('#password');
  const pwdMsg = $('#pwdMsg');
  const formAlert = $('#formAlert');
  const regTableBody = $('#regTableBody');
  const exportBtn = $('#exportBtn');
  const resetBtn = $('#resetBtn');
  const modeSwitch = $('#modeSwitch');

  function loadRegs() { try { return JSON.parse(localStorage.getItem(KEY_REGS)) || []; } catch { return []; } }
  function saveRegs(list) { localStorage.setItem(KEY_REGS, JSON.stringify(list)); }

  // ---------- THEME ----------
  function initTheme() {
    const saved = localStorage.getItem(KEY_THEME);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const useDark = saved ? saved === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', useDark);
    modeSwitch.checked = useDark;
  }
  modeSwitch?.addEventListener('change', () => {
    const dark = modeSwitch.checked;
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(KEY_THEME, dark ? 'dark' : 'light');
  });

  // ---------- EVENT RENDER ----------
  function seatsLeft(ev) { return ev.capacity - ev.registered - totalTicketsForEvent(ev.id); }
  function totalTicketsForEvent(evId) {
    return loadRegs().filter(r => r.eventId === evId).reduce((sum, r) => sum + r.tickets, 0);
  }

  function makeEventCard(ev) {
    const left = seatsLeft(ev);
    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-lg-4 col-xl-3';
    col.innerHTML = `
      <div class="card h-100 event-card">
        <div class="card-body d-flex flex-column">
          <div class="d-flex align-items-center justify-content-between">
            <h3 class="h6 m-0">${ev.title}</h3>
            <span class="tag">${ev.tags.join(' · ')}</span>
          </div>
          <div class="small text-secondary mt-2">${ev.date} · ${ev.loc}</div>
          <div class="mt-3"><strong>${left}</strong> seats left</div>
          <div class="mt-auto d-grid">
            <button class="btn btn-outline-primary btn-sm mt-3" data-ev="${ev.id}">Choose</button>
          </div>
        </div>
      </div>`;
    $('button', col).addEventListener('click', () => {
      eventSelect.value = ev.id;
      updateSeatHint();
      window.location.hash = '#register';
      $('#fullName').focus();
    });
    return col;
  }

  function renderEvents(list) {
    eventGrid.innerHTML = '';
    list.forEach(ev => eventGrid.appendChild(makeEventCard(ev)));
    eventCount.textContent = `${list.length} events`;
  }

  function filterEvents(q) {
    const term = q.trim().toLowerCase();
    if (!term) return events;
    return events.filter(ev => ev.title.toLowerCase().includes(term) || ev.tags.some(t => t.includes(term)));
  }

  searchInput?.addEventListener('input', () => renderEvents(filterEvents(searchInput.value)));

  // ---------- SELECT OPTIONS + SEAT HINT ----------
  function fillEventSelect() {
    eventSelect.innerHTML = '<option value="" disabled selected>Choose…</option>' +
      events.map(ev => `<option value="${ev.id}">${ev.title}</option>`).join('');
  }

  function updateSeatHint() {
    const id = eventSelect.value;
    const ev = events.find(e => e.id === id);
    if (!ev) { seatHint.textContent = 'Select an event to see remaining seats.'; return; }
    const left = seatsLeft(ev);
    seatHint.textContent = `${left} seats left for ${ev.title}`;
    ticketsInput.max = Math.min(4, Math.max(0, left));
    if (+ticketsInput.value > +ticketsInput.max) ticketsInput.value = ticketsInput.max || 1;
  }

  eventSelect?.addEventListener('change', updateSeatHint);
  ticketsInput?.addEventListener('input', () => { if (+ticketsInput.value < 1) ticketsInput.value = 1; });

  // ---------- PASSWORD STRENGTH ----------
  function strength(pw) {
    let score = 0;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[~@#$%^&*()_+=\-]/.test(pw)) score++;
    return score;
  }
  function updatePwdMsg() {
    const s = strength(pwdInput.value);
    pwdMsg.className = '';
    if (!pwdInput.value) { pwdMsg.textContent = 'Strength: —'; return; }
    if (s <= 1) { pwdMsg.textContent = 'Strength: weak'; pwdMsg.classList.add('weak'); }
    else if (s === 2 || s === 3) { pwdMsg.textContent = 'Strength: medium'; pwdMsg.classList.add('medium'); }
    else { pwdMsg.textContent = 'Strength: strong'; pwdMsg.classList.add('strong'); }
  }
  pwdInput?.addEventListener('input', updatePwdMsg);

  // ---------- CUSTOM VALIDATION RULE (password policy) ----------
  function validPasswordPolicy(pw) {
    // Must be 8–16, include at least 3 of 4 classes: upper, lower, digit, symbol
    if (pw.length < 8 || pw.length > 16) return false;
    const classes = [/[A-Z]/, /[a-z]/, /[0-9]/, /[~@#$%^&*()_+=\-]/].reduce((n, rx) => n + (rx.test(pw) ? 1 : 0), 0);
    return classes >= 3;
  }

  // ---------- FORM SUBMIT ----------
  regForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    // Built‑in Constraint API first
    if (!regForm.checkValidity()) {
      e.stopPropagation();
      regForm.classList.add('was-validated');
      showAlert('Please fix the highlighted fields.', 'danger');
      return;
    }
    // Custom password rule
    if (!validPasswordPolicy(pwdInput.value)) {
      pwdInput.setCustomValidity('Invalid');
      regForm.classList.add('was-validated');
      showAlert('Password must be 8–16 chars and include 3 of: upper/lower/digit/symbol.', 'danger');
      pwdInput.addEventListener('input', () => pwdInput.setCustomValidity(''), { once: true });
      return;
    }

    const id = eventSelect.value;
    const ev = events.find(e => e.id === id);
    const left = seatsLeft(ev);
    const want = +ticketsInput.value;
    if (want > left) {
      showAlert(`Only ${left} seats left for ${ev.title}.`, 'warning');
      return;
    }

    const entry = {
      ts: new Date().toISOString(),
      name: $('#fullName').value.trim(),
      sid: $('#studentId').value.trim(),
      email: $('#email').value.trim().toLowerCase(),
      eventId: id,
      eventTitle: ev.title,
      tickets: want
    };

    // Prevent duplicate (same email + event)
    const regs = loadRegs();
    const dup = regs.find(r => r.email === entry.email && r.eventId === entry.eventId);
    if (dup) {
      showAlert('You already registered for this event. Edit or delete the old one below.', 'warning');
      return;
    }

    regs.push(entry);
    saveRegs(regs);
    renderTable();
    updateSeatHint();
    regForm.reset();
    regForm.classList.remove('was-validated');
    updatePwdMsg();
    showAlert('Registered successfully! See your record below.', 'success');
  });

  resetBtn?.addEventListener('click', () => {
    regForm.reset();
    regForm.classList.remove('was-validated');
    updatePwdMsg();
    updateSeatHint();
  });

  function showAlert(msg, type='info') {
    formAlert.className = `alert alert-${type} fade-in mt-3`;
    formAlert.textContent = msg;
    formAlert.classList.remove('d-none');
    setTimeout(() => formAlert.classList.add('d-none'), 3500);
  }

  // ---------- TABLE RENDER + ROW ACTIONS ----------
  function renderTable() {
    const regs = loadRegs();
    regTableBody.innerHTML = '';
    regs.forEach((r, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i+1}</td>
        <td>${r.name}</td>
        <td>${r.email}</td>
        <td>${r.eventTitle}</td>
        <td>${r.tickets}</td>
        <td>${new Date(r.ts).toLocaleString()}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-secondary me-1" data-act="edit" data-i="${i}">Edit</button>
          <button class="btn btn-sm btn-outline-danger" data-act="del" data-i="${i}">Delete</button>
        </td>`;
      regTableBody.appendChild(tr);
    });
  }

  regTableBody?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const idx = +btn.dataset.i;
    const act = btn.dataset.act;
    const regs = loadRegs();
    const row = regs[idx];

    if (act === 'del') {
      if (confirm(`Delete registration for ${row.eventTitle}?`)) {
        regs.splice(idx, 1);
        saveRegs(regs);
        renderTable();
        updateSeatHint();
      }
      return;
    }

    if (act === 'edit') {
      // Simple inline edit: bump tickets within remaining limit
      const ev = events.find(e => e.id === row.eventId);
      const left = seatsLeft(ev) + row.tickets; // include own tickets back
      const newT = +prompt(`Update tickets for ${row.eventTitle} (max ${Math.min(4,left)}):`, row.tickets);
      if (!Number.isFinite(newT)) return;
      if (newT < 1 || newT > Math.min(4, left)) { alert('Invalid tickets.'); return; }
      row.tickets = newT;
      regs[idx] = row;
      saveRegs(regs);
      renderTable();
      updateSeatHint();
    }
  });

  // ---------- EXPORT ----------
  exportBtn?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(loadRegs(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'registrations.json'; a.click();
    URL.revokeObjectURL(url);
  });

  // ---------- INIT ----------
  function init() {
    initTheme();
    fillEventSelect();
    renderEvents(events);
    renderTable();
    updateSeatHint();
    updatePwdMsg();
  }
  document.addEventListener('DOMContentLoaded', init);
})();


