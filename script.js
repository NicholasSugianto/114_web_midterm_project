(() => {


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
