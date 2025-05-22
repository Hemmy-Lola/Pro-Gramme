const list = document.getElementById("userList")
const addBtn = document.getElementById("addUser")
const input = document.getElementById("newUserName")
let users = []
init()
function init() { fetch("/api/users").then(r => r.json()).then(d => { users = d; render() }) }
function render() {
    list.innerHTML = ""
    users.forEach(u => {
        const li = document.createElement("li")
        li.style.display = "flex"
        li.style.justifyContent = "space-between"
        li.style.alignItems = "center"
        li.style.padding = ".3rem .4rem"
        li.style.border = "1px solid #e4e4e7"
        li.style.borderRadius = "6px"
        li.style.marginBottom = ".4rem"
        li.textContent = u.name || u
        const del = document.createElement("button")
        del.textContent = "×"
        del.style.border = "none"
        del.style.background = "transparent"
        del.style.fontSize = "1rem"
        del.style.cursor = "pointer"
        del.onclick = () => { users = users.filter(x => x !== u); save() }
        li.append(del)
        list.append(li)
    })
}
function save() { fetch("/api/users", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(users) }).then(render) }
addBtn.onclick = () => { const name = input.value.trim(); if (!name) return; users.push({ id: crypto.randomUUID(), name }); input.value = ""; save() }
