/* --- REFERÊNCIAS DE ELEMENTOS (DOM) --- */
const sensor = document.getElementById('sidebar-sensor');
const sidebar = document.getElementById('main-sidebar');
const sidebarNav = document.getElementById('sidebar-nav');

// Elementos do Modal de Tarefas
const modal = document.getElementById('modal-overlay');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal');
const saveTaskBtn = document.getElementById('save-task');
const taskInput = document.getElementById('task-name');
const firstColumn = document.getElementById('col-todo');

// Elementos do Modal de Eventos (Sidebar)
const modalEvent = document.getElementById('modal-event-overlay');
const addEventBtn = document.getElementById('add-event-btn');
const closeEventModal = document.getElementById('close-event-modal');
const saveEventBtn = document.getElementById('save-event-btn');
const eventInput = document.getElementById('event-name-input');

/* --- FUNÇÕES GLOBAIS --- */

// Estado da Aplicação: Centraliza eventos e tarefas
let currentEvent = null;
let appData = { events: [], tasks: [] };
let notifications = [];

// Atualiza o texto "Nenhuma tarefa" nas colunas
function checkEmptyColumns() {
    const columns = document.querySelectorAll('.column');
    columns.forEach(column => {
        const cards = column.querySelectorAll('.task-card');
        const noTasksText = column.querySelector('.no-tasks-text');
        if (noTasksText) {
            noTasksText.style.display = (cards.length === 0) ? 'block' : 'none';
        }
    });
}

function saveData() {
    const savedUser = localStorage.getItem('lumina_user');
    const dataToSave = { events: appData.events, tasks: appData.tasks, lastEvent: currentEvent };

    if (savedUser) {
        const user = JSON.parse(savedUser);
        UserDB.saveUserData(user.email, dataToSave);
    } else {
        localStorage.setItem('lumina_guest_data', JSON.stringify(dataToSave));
    }
}

// Renderiza as tarefas do evento selecionado
function renderBoard() {
    // Limpar cards atuais (mantendo os headers e textos de vazio)
    document.querySelectorAll('.task-card').forEach(card => card.remove());

    if (!currentEvent) {
        checkEmptyColumns();
        return;
    }

    // Filtrar tarefas do evento atual
    const filteredTasks = appData.tasks.filter(t => t.eventName === currentEvent);

    filteredTasks.forEach(task => {
        const taskCard = createTaskElement(task);
        const column = document.getElementById(task.status);
        if (column) column.appendChild(taskCard);
    });

    checkEmptyColumns();
}

// Cria o elemento visual do Card
function createTaskElement(task) {
    const { name, priority, id, status } = task;
    const taskCard = document.createElement('div');
    taskCard.setAttribute('draggable', 'true');
    taskCard.setAttribute('data-id', id);
    
    // Adiciona classe de concluído se necessário
    const isDone = status === 'col-done';
    taskCard.className = `task-card ${priority} ${isDone ? 'done-status' : ''}`;
    
    // Rótulos formatados para exibição na Badge
    const labels = { 'minima': 'Mínima', 'media': 'Média', 'dificil': 'Difícil' };
    const priorityLabel = labels[priority] || priority;

    let deleteHtml = '';
    if (isDone) {
        deleteHtml = `<button class="delete-btn" onclick="deleteTask(${id})">&times;</button>`;
    }

    taskCard.innerHTML = `<strong>${name}</strong>
                          <span class="priority-badge ${priority}">${priorityLabel}</span>
                          ${deleteHtml}`;
    
    addDragEvents(taskCard);
    return taskCard;
}

function deleteTask(id) {
    appData.tasks = appData.tasks.filter(t => t.id !== id);
    saveData();
    renderBoard();
}

function deleteEvent(e, eventName) {
    e.stopPropagation(); // Impede que o clique no X selecione o evento
    
    const confirmacao = confirm(`Tem certeza que deseja apagar o evento "${eventName}"? Todas as tarefas vinculadas a ele serão excluídas.`);
    
    if (confirmacao) {
        // Remove o evento
        appData.events = appData.events.filter(ev => ev !== eventName);
        // Remove as tarefas vinculadas
        appData.tasks = appData.tasks.filter(t => t.eventName !== eventName);
        
        // Se o evento apagado era o atual, resetamos
        if (currentEvent === eventName) {
            currentEvent = appData.events.length > 0 ? appData.events[0] : null;
        }
        
        saveData();
        renderSidebar();
        renderBoard();
    }
}

// Expor funções para o HTML (onclick)
window.deleteTask = deleteTask;
window.deleteEvent = deleteEvent;

function selectEvent(eventName) {
    currentEvent = eventName;
    renderSidebar();
    renderBoard();
    saveData();
}

// Ativa o Drag & Drop nos cards
function addDragEvents(card) {
    card.addEventListener('dragstart', () => card.classList.add('dragging'));
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
}

/* --- LOGICA DA SIDEBAR --- */

sensor.addEventListener('mouseenter', () => {
    sidebar.classList.add('active');
});

sidebar.addEventListener('mouseleave', () => {
    sidebar.classList.remove('active');
});

/* --- LOGICA MODAL TAREFAS --- */

openModalBtn.onclick = () => { modal.style.display = 'flex'; };
closeModalBtn.onclick = () => { modal.style.display = 'none'; taskInput.value = ''; };

saveTaskBtn.onclick = () => {
    if (!currentEvent) {
        alert("Crie ou selecione um evento na barra lateral primeiro!");
        return;
    }

    const name = taskInput.value.trim();
    const priorityElement = document.querySelector('input[name="priority"]:checked');
    const priority = priorityElement ? priorityElement.value : 'minima';

    if (name === "") {
        alert("Por favor, digite um nome!");
        return;
    }

    const newTask = {
        id: Date.now(),
        name: name,
        priority: priority,
        status: 'col-todo',
        eventName: currentEvent
    };

    appData.tasks.push(newTask);
    saveData();
    renderBoard();
    
    modal.style.display = 'none';
    taskInput.value = '';
};

/* --- LOGICA MODAL EVENTOS (SIDEBAR) --- */

addEventBtn.onclick = () => {
    modalEvent.style.display = 'flex';
    eventInput.focus();
};

closeEventModal.onclick = () => {
    modalEvent.style.display = 'none';
    eventInput.value = '';
};

saveEventBtn.onclick = () => {
    const eventName = eventInput.value.trim();

    if (eventName === "") {
        alert("Digite um nome para o evento!");
        return;
    }

    if (!appData.events.includes(eventName)) {
        appData.events.push(eventName);
        saveData();
        renderSidebar();
        selectEvent(eventName);
    }

    modalEvent.style.display = 'none';
    eventInput.value = '';
};

function renderSidebar() {
    sidebarNav.innerHTML = '';
    appData.events.forEach(eventName => {
        const newItem = document.createElement('div');
        newItem.className = `nav-item ${currentEvent === eventName ? 'active' : ''}`;
        newItem.innerHTML = `<span>${eventName}</span>
                             <button class="delete-event-btn" onclick="deleteEvent(event, '${eventName}')">&times;</button>`;
        newItem.onclick = () => selectEvent(eventName);
        sidebarNav.appendChild(newItem);
    });
}

/* --- LÓGICA DRAG & DROP COLUNAS --- */

const allColumns = document.querySelectorAll('.column');
allColumns.forEach(column => {
    column.addEventListener('dragover', (e) => {
        e.preventDefault();
        column.classList.add('drag-over');
    });

    column.addEventListener('dragleave', () => column.classList.remove('drag-over'));

    column.addEventListener('drop', (e) => {
        e.preventDefault();
        const draggingCard = document.querySelector('.dragging');
        column.classList.remove('drag-over');
        
        if (draggingCard && currentEvent) {
            const taskId = draggingCard.getAttribute('data-id');
            const taskIndex = appData.tasks.findIndex(t => t.id == taskId);
            
            if (taskIndex !== -1) {
                appData.tasks[taskIndex].status = column.id;
                
                // Se moveu para concluído, gera notificação
                if (column.id === 'col-done') {
                    addNotification(`Você concluiu a tarefa "${appData.tasks[taskIndex].name}"`);
                }
                saveData();
            }

            renderBoard(); // Redesenha o quadro para aplicar as cores e botões de exclusão
        }
    });
});

/* --- LÓGICA DE NOTIFICAÇÕES --- */
const notificationControl = document.getElementById('notification-control');
const notificationDropdown = document.getElementById('notification-dropdown');
const notificationBadge = document.getElementById('notification-badge');
const notificationList = document.getElementById('notification-list');

function addNotification(message) {
    notifications.unshift({ text: message, read: false });
    updateNotificationUI();
}

function updateNotificationUI() {
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Atualiza o Badge
    notificationBadge.innerText = unreadCount;
    notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';

    // Atualiza a Lista
    if (notifications.length === 0) {
        notificationList.innerHTML = '<li class="empty-msg" style="font-size: 12px; color: #94a3b8; text-align: center; list-style: none;">Nenhuma notificação</li>';
    } else {
        notificationList.innerHTML = notifications.map(n => `
            <li style="font-size: 13px; color: #475569; padding: 10px 0; border-bottom: 1px solid #f8fafc; list-style: none;">
                ${n.text}
            </li>
        `).join('');
    }
}

// Referências
const userProfile = document.getElementById('user-control');
const userDropdown = document.getElementById('user-dropdown');
const avatar = document.getElementById('avatar'); // Agora coincide com o HTML
const btnOpenLogin = document.getElementById('btn-open-login');
const saveUserBtn = document.getElementById('save-user-btn');
const loginModal = document.getElementById('modal-login-overlay');
const closeLoginModal = document.getElementById('close-login-modal');
const loginNameInput = document.getElementById('login-name');
const loginEmailInput = document.getElementById('login-email-input');
const logoutBtn = document.getElementById('logout-btn');

// 1. Abrir/Fechar Dropdown ao clicar no círculo
userProfile.onclick = (e) => {
    e.stopPropagation(); // Impede de fechar ao clicar nele mesmo
    notificationDropdown.classList.remove('active');
    userDropdown.classList.toggle('active');
};

notificationControl.onclick = (e) => {
    e.stopPropagation();
    userDropdown.classList.remove('active');
    notificationDropdown.classList.toggle('active');
    
    // Ao abrir, marca todas como lidas
    notifications.forEach(n => n.read = true);
    updateNotificationUI();
};

// Fechar se clicar fora
window.onclick = () => {
    userDropdown.classList.remove('active');
    notificationDropdown.classList.remove('active');
};

// 2. Abrir Modal de Login pelo Dropdown
btnOpenLogin.onclick = () => {
    if (loginModal) loginModal.style.display = 'flex';
};

// Fechar Modal de Login
if (closeLoginModal) {
    closeLoginModal.onclick = () => { loginModal.style.display = 'none'; };
}

// 3. Salvar Usuário
if (saveUserBtn) {
    saveUserBtn.onclick = () => {
        const user = {
            name: loginNameInput.value,
            email: loginEmailInput.value
        };
        localStorage.setItem('lumina_user', JSON.stringify(user));
        loginModal.style.display = 'none';
        updateUI();
    };
};

// 3.1 Lógica de Logout (Sair)
if (logoutBtn) {
    logoutBtn.onclick = () => {
        localStorage.removeItem('lumina_user'); // Apaga os dados salvos
        updateUI(); // Reseta a interface para "Visitante"
        userDropdown.classList.remove('active'); // Fecha o menu
    };
}

// 4. Atualizar interface (Letra no círculo)
function updateUI() {
    if (!avatar) return; // Evita erro se o elemento não existir
    const savedUser = localStorage.getItem('lumina_user');
    let data;

    if (savedUser) {
        const user = JSON.parse(savedUser);
        avatar.innerText = user.name.charAt(0).toUpperCase();
        document.getElementById('dropdown-user-name').innerText = user.name;
        document.getElementById('dropdown-user-email').innerText = user.email || "E-mail não cadastrado";
        btnOpenLogin.innerText = "Editar Perfil";

        // Carrega dados da conta logada
        data = UserDB.getUserData(user.email);
    } else {
        // Resetar para o estado inicial de Visitante
        avatar.innerText = "?";
        document.getElementById('dropdown-user-name').innerText = "Visitante";
        document.getElementById('dropdown-user-email').innerText = "fazer login";
        btnOpenLogin.innerText = "Minha Conta";

        // Carrega dados locais de visitante
        const guestData = localStorage.getItem('lumina_guest_data');
        data = guestData ? JSON.parse(guestData) : { events: [], tasks: [], lastEvent: null };
    }

    // Sincroniza o estado global e atualiza a tela
    appData = { events: data.events, tasks: data.tasks };
    currentEvent = data.lastEvent;
    renderSidebar();
    renderBoard();
}

// Chamar ao carregar
updateUI();

// No seu saveUserBtn.onclick (dentro do código que já tínhamos), 
// lembre-se de chamar o updateUI() no final para a letra mudar na hora!
