(function () {
    'use strict';

    /* ---------- Constantes ---------- */
    const ROW_H = 24,    // hauteur d’une tranche de 15 min
        HDR_H = 28,    // hauteur header + entêtes
        DRAG_T = 5;     // seuil px avant drag

    /* ---------- DOM ---------- */
    const grid = document.getElementById('grid'),
        weekLabel = document.getElementById('weekLabel'),
        prevBtn = document.getElementById('prevWeek'),
        nextBtn = document.getElementById('nextWeek'),
        addBtn = document.getElementById('addEvt'),
        mask = document.getElementById('mask'),
        modal = document.getElementById('modal'),
        titleIn = document.getElementById('evtTitle'),
        descIn = document.getElementById('evtDesc'),
        startIn = document.getElementById('startDate'),
        endIn = document.getElementById('endDate'),
        colorIn = document.getElementById('colorPicker'),
        usersField = document.getElementById('usersList'),
        saveBtn = document.getElementById('saveEvt'),
        cancelBtn = document.getElementById('cancel'),
        delBtn = document.getElementById('deleteEvt'),
        newUserIn = document.getElementById('newUserName'),
        addUserBtn = document.getElementById('addUser'),
        userListUl = document.getElementById('userList');

    /* ---------- Données ---------- */
    let weekStart = getMonday(new Date()),
        users = JSON.parse(localStorage.getItem('plannerUsers') || '[]'),
        events = JSON.parse(localStorage.getItem('plannerEvents') || '[]'),
        editing = null;

    /* ---------- Initialisation ---------- */
    initUsers();
    renderWeek();

    /* navigation semaine */
    prevBtn.addEventListener('click', () => { weekStart = addDays(weekStart, -7); renderWeek(); });
    nextBtn.addEventListener('click', () => { weekStart = addDays(weekStart, 7); renderWeek(); });
    addBtn.addEventListener('click', () => openModalNow());

    /* modal */
    cancelBtn.addEventListener('click', () => mask.hidden = true);
    mask.addEventListener('click', e => { if (e.target === mask) mask.hidden = true; });

    saveBtn.addEventListener('click', onSave);
    delBtn.addEventListener('click', onDelete);

    /* gestion utilisateurs */
    addUserBtn.addEventListener('click', onAddUser);

    // ferme la modale quand on appuie sur Échap
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !mask.hidden) {
            mask.hidden = true;
        }
    });

    /* ---------- Fonctions Utilisateurs ---------- */
    function initUsers() {
        renderUserManager();
        renderUserField();
    }
    function persistUsers() {
        localStorage.setItem('plannerUsers', JSON.stringify(users));
    }
    function onAddUser() {
        const name = newUserIn.value.trim();
        if (!name) return;
        users.push({ id: uuid(), name });
        newUserIn.value = '';
        persistUsers();
        renderUserManager();
        renderUserField();
    }
    function onDelUser(id) {
        users = users.filter(u => u.id !== id);
        persistUsers();
        events.forEach(ev => { ev.users = ev.users.filter(u => u !== id); });
        localStorage.setItem('plannerEvents', JSON.stringify(events));
        renderUserManager();
        renderUserField();
        renderWeek();
    }
    function renderUserManager() {
        userListUl.innerHTML = '';
        users.forEach(u => {
            const li = document.createElement('li');
            li.textContent = u.name + ' ';
            const btn = document.createElement('button');
            btn.textContent = '×';
            btn.addEventListener('click', () => onDelUser(u.id));
            li.append(btn);
            userListUl.append(li);
        });
    }
    function renderUserField() {
        usersField.innerHTML = '<legend>Participants</legend>';
        users.forEach(u => {
            const lab = document.createElement('label');
            const chk = document.createElement('input');
            chk.type = 'checkbox'; chk.value = u.id; chk.dataset.user = '';
            lab.append(chk, u.name);
            usersField.append(lab);
        });
    }

    /* ---------- Semaine & Grille ---------- */
    function renderWeek() {
        grid.innerHTML = '';
        weekLabel.textContent = fmtRange(weekStart);

        // entêtes jours
        grid.append(document.createElement('div'));
        ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].forEach(d => {
            const h = document.createElement('div');
            h.className = 'dayHeader'; h.textContent = d;
            grid.append(h);
        });

        // lignes horaires + colonnes (non-focusables)
        for (let r = 0; r < 96; r++) {
            const hc = document.createElement('div');
            hc.className = 'hourCell';
            const h = Math.floor(r / 4), m = (r % 4) * 15;
            hc.textContent = m === 0 ? String(h).padStart(2, '0') + ':00' : '';
            grid.append(hc);
            for (let c = 0; c < 7; c++) {
                const cell = document.createElement('div');
                cell.className = 'dayColumn';
                cell.dataset.c = c; cell.dataset.r = r;
                cell.addEventListener('pointerdown', cellStart);
                grid.append(cell);
            }
        }

        // événements
        const list = [];
        events.filter(ev => sameWeek(new Date(ev.start))).forEach(ev => {
            list.push(drawEvent(ev));
        });
        applyOverlap(list);
    }

    /* --- drag sur case pour créer --- */
    let sel = null;
    function cellStart(e) {
        if (e.button !== 0) return;
        const c = +e.currentTarget.dataset.c,
            r0 = +e.currentTarget.dataset.r,
            rect = grid.getBoundingClientRect();
        sel = { c, r0, ghost: null };
        function mv(m) {
            const len = Math.max(1, Math.round((m.clientY - rect.top - HDR_H) / ROW_H) - r0);
            if (!sel.ghost) {
                sel.ghost = document.createElement('div');
                sel.ghost.className = 'event';
                sel.ghost.style.background = colorIn.value;
                grid.append(sel.ghost);
            }
            place(sel.ghost, c, r0, len, colorIn.value);
        }
        function up(u) {
            document.removeEventListener('pointermove', mv);
            document.removeEventListener('pointerup', up);
            const len = Math.max(1, Math.round((u.clientY - rect.top - HDR_H) / ROW_H) - r0);
            openModalAt(addDays(weekStart, c), null, null, r0, r0 + len);
            if (sel.ghost) grid.removeChild(sel.ghost);
            sel = null;
        }
        document.addEventListener('pointermove', mv);
        document.addEventListener('pointerup', up);
    }

    /* ---------- Modal Création/Édition ---------- */
    function openModalNow() {
        const now = new Date();
        now.setMinutes(Math.floor(now.getMinutes() / 15) * 15, 0, 0);
        const later = new Date(now.getTime() + 3600000);
        openModalAt(now, later);
    }
    function openModalAt(base, startDate, endDate, sr, er) {
        const s = startDate || new Date(base),
            e = endDate || new Date(base);
        if (sr != null && er != null) {
            s.setMinutes(sr * 15);
            e.setMinutes(er * 15);
        }
        titleIn.value = ''; descIn.value = '';
        startIn.value = toISO(s);
        endIn.value = toISO(e);
        colorIn.value = randColor();
        usersField.querySelectorAll('[data-user]').forEach(c => c.checked = false);
        editing = null;
        delBtn.hidden = true;
        mask.hidden = false;
        titleIn.focus();
    }
    function openEdit(ev) {
        titleIn.value = ev.title;
        descIn.value = ev.desc;
        startIn.value = toISO(new Date(ev.start));
        endIn.value = toISO(new Date(ev.end));
        colorIn.value = ev.color;
        usersField.querySelectorAll('[data-user]').forEach(c => {
            c.checked = ev.users.includes(c.value);
        });
        editing = ev;
        delBtn.hidden = false;
        mask.hidden = false;
        titleIn.focus();
    }

    /* ---------- Enregistrer / Supprimer ---------- */
    function onSave(evt) {
        evt.preventDefault();
        const o = editing || { id: uuid() };
        o.title = titleIn.value.trim() || 'Sans titre';
        o.desc = descIn.value.trim();
        o.start = new Date(startIn.value).toISOString();
        o.end = new Date(endIn.value).toISOString();
        o.color = colorIn.value;
        o.users = [...usersField.querySelectorAll('[data-user]')]
            .filter(c => c.checked).map(c => c.value);
        if (!editing) events.push(o);
        persistEvents();
        mask.hidden = true;
        renderWeek();
    }
    function onDelete() {
        if (!editing) return;
        events = events.filter(e => e.id !== editing.id);
        persistEvents();
        mask.hidden = true;
        renderWeek();
    }

    /* ---------- Dessiner un événement ---------- */
    function drawEvent(ev) {
        const d0 = new Date(ev.start),
            c = (d0.getDay() + 6) % 7,
            sr = (d0.getHours() * 60 + d0.getMinutes()) / 15,
            span = (new Date(ev.end) - d0) / 900000;
        const div = document.createElement('div');
        div.className = 'event';
        div.tabIndex = 0;              // seuls les events sont focusables
        div.style.background = ev.color;
        div.textContent = ev.title;

        // handles de resize
        ['Top', 'Bottom'].forEach(pos => {
            const h = document.createElement('div');
            h.className = 'resizeHandle resize' + pos;
            div.append(h);
            h.addEventListener('pointerdown', e => startResize(e, ev, div, pos.toLowerCase()));
        });

        place(div, c, sr, span, ev.color);
        grid.append(div);

        // interaction clavier & pointer
        attachInteraction(div, ev, span);

        return { div, ev, c, sr, er: sr + span };
    }

    /* ---------- Interaction événement ---------- */
    function attachInteraction(div, ev, span) {
        // clavier : Enter/Espace pour éditer, flèches pour déplacer, Delete pour supprimer
        div.addEventListener('keydown', e => {
            const dur = span;
            let moved = false;
            switch (e.key) {
                case 'Enter': case ' ':
                    e.preventDefault(); openEdit(ev);
                    return;
                case 'ArrowUp':
                    moved = true; updateBy(ev, 0, -1); break;
                case 'ArrowDown':
                    moved = true; updateBy(ev, 0, 1); break;
                case 'ArrowLeft':
                    moved = true; updateBy(ev, -1, 0); break;
                case 'ArrowRight':
                    moved = true; updateBy(ev, 1, 0); break;
                case 'Delete': case 'Backspace':
                    onDelete(); return;
            }
            if (moved) {
                persistEvents();
                renderWeek();
                div.focus();  // garder le focus sur l’event
            }
        });

        // pointer : click court vs glisser
        let sx, sy, drag = false;
        div.addEventListener('pointerdown', e => {
            if (e.target !== div) return;
            sx = e.clientX; sy = e.clientY; drag = false;
            function mv(m) {
                if (!drag && (Math.abs(m.clientX - sx) > DRAG_T || Math.abs(m.clientY - sy) > DRAG_T)) {
                    drag = true;
                    startMove(e, ev, div, span);
                    cleanup();
                }
            }
            function up() { cleanup(); if (!drag) openEdit(ev); }
            function cleanup() {
                document.removeEventListener('pointermove', mv);
                document.removeEventListener('pointerup', up);
            }
            document.addEventListener('pointermove', mv);
            document.addEventListener('pointerup', up);
        });
    }

    /* ---------- Déplacement ---------- */
    function startMove(e, ev, div, span) {
        e.preventDefault(); div.classList.add('dragging');
        const rect = grid.getBoundingClientRect(),
            offX = e.clientX - div.getBoundingClientRect().left,
            offY = e.clientY - div.getBoundingClientRect().top;
        function mv(m) {
            const dayW = (rect.width - 80) / 7;
            let x = m.clientX - rect.left - offX; x = Math.max(x, 80);
            let c = Math.min(6, Math.floor((x - 80) / dayW));
            let y = m.clientY - rect.top - offY - HDR_H;
            let r = Math.max(0, Math.min(96 - span, Math.round(y / ROW_H)));
            place(div, c, r, span, ev.color);
        }
        function up(u) {
            document.removeEventListener('pointermove', mv);
            document.removeEventListener('pointerup', up);
            div.classList.remove('dragging');
            const dayW = (rect.width - 80) / 7;
            let x = u.clientX - rect.left - offX; x = Math.max(x, 80);
            let c = Math.min(6, Math.floor((x - 80) / dayW));
            let y = u.clientY - rect.top - offY - HDR_H;
            let r = Math.max(0, Math.min(96 - span, Math.round(y / ROW_H)));
            // mise à jour des dates
            const base = addDays(weekStart, c),
                ns = new Date(base), ne = new Date(base);
            ns.setMinutes(r * 15);
            ne.setTime(ns.getTime() + span * 900000);
            ev.start = ns.toISOString();
            ev.end = ne.toISOString();
            persistEvents();
            renderWeek();
        }
        document.addEventListener('pointermove', mv);
        document.addEventListener('pointerup', up);
    }

    /* ---------- Redimensionnement ---------- */
    function startResize(e, ev, div, side) {
        e.stopPropagation(); e.preventDefault();
        const rect = grid.getBoundingClientRect(),
            c = (new Date(ev.start).getDay() + 6) % 7;
        let sr = (new Date(ev.start).getHours() * 60 + new Date(ev.start).getMinutes()) / 15,
            er = (new Date(ev.end).getHours() * 60 + new Date(ev.end).getMinutes()) / 15;
        function mv(m) {
            let r = Math.round((m.clientY - rect.top - HDR_H) / ROW_H);
            r = Math.max(0, Math.min(95, r));
            if (side === 'top') { sr = Math.min(r, er - 1); }
            else { er = Math.max(r, sr + 1); }
            place(div, c, sr, er - sr, ev.color);
        }
        function up() {
            document.removeEventListener('pointermove', mv);
            document.removeEventListener('pointerup', up);
            const base = addDays(weekStart, c),
                ns = new Date(base), ne = new Date(base);
            ns.setMinutes(sr * 15);
            ne.setMinutes(er * 15);
            ev.start = ns.toISOString();
            ev.end = ne.toISOString();
            persistEvents();
            renderWeek();
        }
        document.addEventListener('pointermove', mv);
        document.addEventListener('pointerup', up);
    }

    /* ---------- Chevauchements ---------- */
    function applyOverlap(arr) {
        arr.forEach(a => {
            arr.forEach(b => {
                if (a === b || a.c !== b.c) return;
                const s = Math.max(a.sr, b.sr);
                const e = Math.min(a.er, b.er);
                if (s < e) {
                    const seg = document.createElement('div');
                    seg.className = 'overlapSegment';
                    seg.style.top = (s - a.sr) * ROW_H + 'px';
                    seg.style.height = (e - s) * ROW_H + 'px';
                    a.div.append(seg);
                }
            });
        });
    }


    /* ---------- Helpers ---------- */
    function place(div, c, r, span, color) {
        const rect = grid.getBoundingClientRect(),
            w = (rect.width - 80) / 7;
        div.style.left = 80 + c * w + 'px';
        div.style.top = HDR_H + r * ROW_H + 'px';
        div.style.width = w + 'px';
        div.style.height = span * ROW_H + 'px';
        div.style.background = color;
    }
    function fmtRange(d0) {
        const d1 = addDays(d0, 6);
        return `${d0.getDate()}/${d0.getMonth() + 1} – ${d1.getDate()}/${d1.getMonth() + 1}`;
    }
    function sameWeek(d) { return getMonday(d).getTime() === weekStart.getTime(); }
    function getMonday(d) {
        const n = (d.getDay() + 6) % 7;
        return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -n);
    }
    function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
    function toISO(d) { return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
    function persistEvents() { localStorage.setItem('plannerEvents', JSON.stringify(events)); }
    function uuid() { return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2); }
    function randColor() { return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0'); }

})();
