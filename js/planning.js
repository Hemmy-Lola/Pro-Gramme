const INITIAL_SCROLL_HOUR = 6
const DRAG_THRESHOLD = 5

const grid = document.getElementById("grid")
const weekLabel = document.getElementById("weekLabel")
const prevWeek = document.getElementById("prevWeek")
const nextWeek = document.getElementById("nextWeek")
const mask = document.getElementById("mask")
const evtTitle = document.getElementById("evtTitle")
const evtDesc = document.getElementById("evtDesc")
const startDateIn = document.getElementById("startDate")
const endDateIn = document.getElementById("endDate")
const colorPicker = document.getElementById("colorPicker")
const usersList = document.getElementById("usersList")
const saveBtn = document.getElementById("saveEvt")
const cancelBtn = document.getElementById("cancel")
const delBtn = document.getElementById("deleteEvt")

let users = []
let events = []
let editingEvent = null
let currentWeekStart = getWeekStart(new Date())
let didInitialScroll = false

const rowHeight = 24
const headerHeight = 28

init()

function init() {
    fetch("/api/users").then(r => r.json()).then(d => { users = d; renderUserList() })
    fetch("/api/planning").then(r => r.json()).then(d => { events = d; renderWeek() }).catch(() => { events = []; renderWeek() })

    prevWeek.onclick = () => { currentWeekStart = addDays(currentWeekStart, -7); renderWeek() }
    nextWeek.onclick = () => { currentWeekStart = addDays(currentWeekStart, 7); renderWeek() }

    cancelBtn.onclick = () => mask.style.display = "none"
    mask.onclick = e => { if (e.target === mask) mask.style.display = "none" }

    saveBtn.onclick = saveEvent
    delBtn.onclick = deleteEvent
}

function renderUserList() {
    usersList.innerHTML = ""
    const allLab = document.createElement("label")
    const allChk = document.createElement("input")
    allChk.type = "checkbox"
    allChk.onchange = e => [...usersList.querySelectorAll('[data-user]')].forEach(c => c.checked = e.target.checked)
    allLab.append(allChk, document.createTextNode("Tout le monde"))
    usersList.append(allLab)

    users.forEach(u => {
        const lab = document.createElement("label")
        const chk = document.createElement("input")
        chk.type = "checkbox"
        chk.dataset.user = "y"
        chk.value = u.id || u
        lab.append(chk, document.createTextNode(u.name || u))
        usersList.append(lab)
    })
}

function renderWeek() {
    grid.innerHTML = ""
    weekLabel.textContent = formatWeekRange(currentWeekStart)

    grid.append(document.createElement("div"))
        ;["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].forEach(d => {
            const h = document.createElement("div")
            h.className = "dayHeader"
            h.textContent = d
            grid.append(h)
        })

    for (let r = 0; r < 96; r++) {
        const hour = Math.floor(r / 4)
        const minute = (r % 4) * 15
        const label = minute === 0 ? hour.toString().padStart(2, "0") + ":00" : ""
        const hourCell = document.createElement("div")
        hourCell.className = "hourCell"
        hourCell.textContent = label
        grid.append(hourCell)

        for (let c = 0; c < 7; c++) {
            const cell = document.createElement("div")
            cell.className = "dayColumn"
            cell.dataset.col = c
            cell.dataset.row = r
            cell.onmousedown = cellMouseDown
            grid.append(cell)
        }
    }

    const rendered = []
    events.filter(ev => isSameWeek(new Date(ev.start), currentWeekStart)).forEach(ev => {
        const obj = drawEvent(ev)
        rendered.push(obj)
    })
    applyOverlapSegments(rendered)

    if (!didInitialScroll) {
        window.scrollTo(0, headerHeight + rowHeight * INITIAL_SCROLL_HOUR * 3)
        didInitialScroll = true
    }
}

let dragSelect = null
function cellMouseDown(e) {
    if (e.button !== 0) return
    const startCol = +e.currentTarget.dataset.col
    const startRow = +e.currentTarget.dataset.row
    dragSelect = { col: startCol, startRow, preview: null }
    const rect = grid.getBoundingClientRect()

    function move(m) {
        const y = m.clientY - rect.top - headerHeight
        let rows = Math.round(y / rowHeight) - startRow
        if (rows < 1) rows = 1
        const endRow = startRow + rows
        if (!dragSelect.preview) {
            dragSelect.preview = document.createElement("div")
            dragSelect.preview.className = "event"
            dragSelect.preview.style.background = colorPicker.value
            grid.append(dragSelect.preview)
        }
        positionEventDiv(dragSelect.preview, startCol, startRow, endRow - startRow, colorPicker.value)
    }
    function up(u) {
        document.removeEventListener("mousemove", move)
        document.removeEventListener("mouseup", up)
        const y = u.clientY - rect.top - headerHeight
        let rows = Math.round(y / rowHeight) - startRow
        if (rows < 1) rows = 1
        openModalFromDrag(startCol, startRow, startRow + rows)
        if (dragSelect.preview) grid.removeChild(dragSelect.preview)
        dragSelect = null
    }
    document.addEventListener("mousemove", move)
    document.addEventListener("mouseup", up)
}

function openModalFromDrag(col, startRow, endRow) {
    const base = addDays(currentWeekStart, col)
    const start = new Date(base); start.setHours(0, 0, 0, 0); start.setMinutes(startRow * 15)
    const end = new Date(base); end.setHours(0, 0, 0, 0); end.setMinutes(endRow * 15)

    evtTitle.value = ""; evtDesc.value = ""
    startDateIn.value = toLocalISO(start)
    endDateIn.value = toLocalISO(end)
    colorPicker.value = getRandomColor()
    usersList.querySelectorAll('[data-user]').forEach(c => c.checked = false)
    editingEvent = null
    delBtn.style.display = "none"
    mask.style.display = "flex"
}
function openModalForEdit(ev) {
    evtTitle.value = ev.title; evtDesc.value = ev.desc
    startDateIn.value = toLocalISO(new Date(ev.start))
    endDateIn.value = toLocalISO(new Date(ev.end))
    colorPicker.value = ev.color
    usersList.querySelectorAll('[data-user]').forEach(c => c.checked = ev.users.includes(c.value))
    editingEvent = ev
    delBtn.style.display = "inline-block"
    mask.style.display = "flex"
}
function saveEvent() {
    const obj = editingEvent || { id: crypto.randomUUID() }
    obj.title = evtTitle.value.trim()
    obj.desc = evtDesc.value.trim()
    obj.start = new Date(startDateIn.value).toISOString()
    obj.end = new Date(endDateIn.value).toISOString()
    obj.color = colorPicker.value
    obj.users = [...usersList.querySelectorAll('[data-user]')].filter(c => c.checked).map(c => c.value)

    if (!editingEvent) events.push(obj)
    persistEvents()
    mask.style.display = "none"
    renderWeek()
}
function deleteEvent() {
    if (!editingEvent) return
    events = events.filter(e => e.id !== editingEvent.id)
    persistEvents(); mask.style.display = "none"; renderWeek()
}

function drawEvent(ev) {
    const d0 = new Date(ev.start)
    const col = (d0.getDay() + 6) % 7
    const sRow = (d0.getHours() * 60 + d0.getMinutes()) / 15
    const d1 = new Date(ev.end)
    const eRow = (d1.getHours() * 60 + d1.getMinutes()) / 15
    const span = eRow - sRow

    const div = document.createElement("div")
    div.className = "event"
    div.style.background = ev.color
    div.innerHTML = `<span>${ev.title}</span>`
    addResizeHandles(div)
    positionEventDiv(div, col, sRow, span, ev.color)
    attachClickDrag(div, ev)

    grid.append(div)
    return { ev, div, col, sRow, eRow }
}
function addResizeHandles(div) {
    const t = document.createElement("div"); t.className = "resizeHandle resizeTop"
    const b = document.createElement("div"); b.className = "resizeHandle resizeBottom"
    div.append(t, b)
}

function attachClickDrag(div, ev) {
    div.onmousedown = e => {
        if (e.target.classList.contains("resizeHandle")) return
        const sx = e.clientX, sy = e.clientY; let moved = false
        function mv(m) {
            if (!moved && (Math.abs(m.clientX - sx) > DRAG_THRESHOLD || Math.abs(m.clientY - sy) > DRAG_THRESHOLD)) {
                moved = true; document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up)
                startMove(e, ev, div)
            }
        }
        function up() {
            document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up)
            if (!moved) openModalForEdit(ev)
        }
        document.addEventListener("mousemove", mv)
        document.addEventListener("mouseup", up)
    }
    div.querySelector(".resizeTop").onmousedown = r => startResize(r, ev, div, "top")
    div.querySelector(".resizeBottom").onmousedown = r => startResize(r, ev, div, "bottom")
}

function startMove(e, ev, div) {
    e.preventDefault(); div.classList.add("dragging")
    const gridRect = grid.getBoundingClientRect()
    const offX = e.clientX - div.getBoundingClientRect().left
    const offY = e.clientY - div.getBoundingClientRect().top
    const spanRows = (new Date(ev.end) - new Date(ev.start)) / 900000

    function mv(m) {
        const dayW = (gridRect.width - 80) / 7
        let x = m.clientX - gridRect.left - offX; x = Math.max(x, 80)
        let col = Math.min(6, Math.floor((x - 80) / dayW))
        let y = m.clientY - gridRect.top - offY - headerHeight
        let row = Math.round(y / rowHeight); row = Math.max(0, Math.min(96 - spanRows, row))
        positionEventDiv(div, col, row, spanRows, ev.color)
    }
    function up(u) {
        document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up)
        div.classList.remove("dragging")
        const gridRect = grid.getBoundingClientRect()
        const dayW = (gridRect.width - 80) / 7
        let x = u.clientX - gridRect.left - offX; x = Math.max(x, 80)
        let col = Math.min(6, Math.floor((x - 80) / dayW))
        let y = u.clientY - gridRect.top - offY - headerHeight
        let row = Math.round(y / rowHeight); row = Math.max(0, Math.min(96 - spanRows, row))

        const base = addDays(currentWeekStart, col)
        const ns = new Date(base); ns.setHours(0, 0, 0, 0); ns.setMinutes(row * 15)
        const ne = new Date(ns.getTime() + spanRows * 900000)
        ev.start = ns.toISOString(); ev.end = ne.toISOString()
        persistEvents(); renderWeek()
    }
    document.addEventListener("mousemove", mv); document.addEventListener("mouseup", up)
}

function startResize(e, ev, div, side) {
    e.preventDefault(); e.stopPropagation()
    const gridRect = grid.getBoundingClientRect()
    const col = (new Date(ev.start).getDay() + 6) % 7
    let sRow = (new Date(ev.start).getHours() * 60 + new Date(ev.start).getMinutes()) / 15
    let eRow = (new Date(ev.end).getHours() * 60 + new Date(ev.end).getMinutes()) / 15

    function mv(m) {
        let y = m.clientY - gridRect.top - headerHeight
        let row = Math.round(y / rowHeight); row = Math.max(0, Math.min(95, row))
        if (side === "top") { row = Math.min(row, eRow - 1); sRow = row } else { row = Math.max(row, sRow + 1); eRow = row }
        positionEventDiv(div, col, sRow, eRow - sRow, ev.color)
    }
    function up() {
        document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up)
        const base = addDays(currentWeekStart, col)
        const ns = new Date(base); ns.setHours(0, 0, 0, 0); ns.setMinutes(sRow * 15)
        const ne = new Date(base); ne.setHours(0, 0, 0, 0); ne.setMinutes(eRow * 15)
        ev.start = ns.toISOString(); ev.end = ne.toISOString()
        persistEvents(); renderWeek()
    }
    document.addEventListener("mousemove", mv); document.addEventListener("mouseup", up)
}

function positionEventDiv(div, col, startRow, spanRows, color) {
    const gRect = grid.getBoundingClientRect()
    const dayW = (gRect.width - 80) / 7
    div.style.background = color
    div.style.left = 80 + col * dayW + "px"
    div.style.width = dayW + "px"
    div.style.top = headerHeight + startRow * rowHeight + "px"
    div.style.height = spanRows * rowHeight + "px"
}

function applyOverlapSegments(rendered) {
    const byCol = []
    rendered.forEach(o => {
        if (!byCol[o.col]) byCol[o.col] = []
        byCol[o.col].push(o)
    })
    byCol.forEach(list => {
        list.forEach(curr => {
            list.forEach(other => {
                if (curr === other) return
                const ovS = Math.max(curr.sRow, other.sRow)
                const ovE = Math.min(curr.eRow, other.eRow)
                if (ovS < ovE) {
                    addOverlapSegment(curr, ovS, ovE)
                }
            })
        })
    })
}
function addOverlapSegment(obj, ovStartRow, ovEndRow) {
    const seg = document.createElement("div")
    seg.className = "overlapSegment"
    seg.style.top = (ovStartRow - obj.sRow) * rowHeight + "px"
    seg.style.height = (ovEndRow - obj.sRow) * rowHeight - (ovStartRow - obj.sRow) * rowHeight + "px"
    obj.div.append(seg)
}

function persistEvents() {
    fetch("/api/planning", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(events) })
}

function getWeekStart(d) { const n = (d.getDay() + 6) % 7; return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -n) }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function isSameWeek(d, s) { return getWeekStart(d).getTime() === s.getTime() }
function formatWeekRange(s) { const e = addDays(s, 6); return `${s.getDate()}/${s.getMonth() + 1} - ${e.getDate()}/${e.getMonth() + 1}` }
function toLocalISO(d) { return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }
function getRandomColor() { return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0") }
