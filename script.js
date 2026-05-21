/**
 * TaskFlow - Modern Task Management Application
 * A single-file task management solution with full CRUD operations,
 * filtering, localStorage persistence, and a beautiful UI.
 */

// ===== APPLICATION STATE =====
const APP_STATE = {
    tasks: [],
    currentFilter: { search: '', priority: '', status: '' },
    editingTaskId: null,
    deleteTaskId: null,
    draggedTaskId: null,
    isDarkMode: false
};

// ===== LOCAL STORAGE KEY =====
const STORAGE_KEY = 'taskflow_tasks';
const THEME_KEY = 'taskflow_theme';

// ===== UTILITY FUNCTIONS =====

/**
 * Generate a unique ID for tasks
 */
const generateId = () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Format date for display
 */
const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

/**
 * Format date for date input
 */
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
};

/**
 * Check if a date is overdue
 */
const isOverdue = (dateString, status) => {
    if (!dateString || status === 'completed') return false;
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
};

// ===== LOCAL STORAGE OPERATIONS =====

/**
 * Save tasks to localStorage
 */
const saveTasks = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(APP_STATE.tasks));
};

/**
 * Load tasks from localStorage
 */
const loadTasks = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        APP_STATE.tasks = JSON.parse(stored);
        
        // Filter out any leftover demo tasks
        const demoTitles = [
            'Review pull requests',
            'Team meeting preparation',
            'Complete project documentation',
            'Update dependencies'
        ];
        const initialLength = APP_STATE.tasks.length;
        APP_STATE.tasks = APP_STATE.tasks.filter(task => !demoTitles.includes(task.title));
        
        if (APP_STATE.tasks.length !== initialLength) {
            saveTasks();
        }
    } else {
        APP_STATE.tasks = [];
        saveTasks();
    }
};




// ===== THEME MANAGEMENT =====

/**
 * Load theme preference
 */
const loadTheme = () => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    APP_STATE.isDarkMode = savedTheme === 'dark';
    applyTheme();
};

/**
 * Apply current theme
 */
const applyTheme = () => {
    document.body.setAttribute('data-theme', APP_STATE.isDarkMode ? 'dark' : 'light');
    document.getElementById('themeToggle').textContent = APP_STATE.isDarkMode ? '☀️' : '🌙';
};

/**
 * Toggle theme
 */
const toggleTheme = () => {
    APP_STATE.isDarkMode = !APP_STATE.isDarkMode;
    localStorage.setItem(THEME_KEY, APP_STATE.isDarkMode ? 'dark' : 'light');
    applyTheme();
    showToast(APP_STATE.isDarkMode ? 'Dark mode enabled' : 'Light mode enabled', 'info');
};

// ===== TOAST NOTIFICATIONS =====

/**
 * Show a toast notification
 */
const showToast = (message, type = 'info') => {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    toast.innerHTML = `
                <span class="toast-icon">${icons[type]}</span>
                <span class="toast-message">${message}</span>
            `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove toast after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// ===== REAL-TIME CLOCK =====

/**
 * Update the clock display
 */
const updateClock = () => {
    const now = new Date();

    // Update time
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    document.getElementById('currentTime').textContent = timeString;

    // Update date
    const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    document.getElementById('currentDate').textContent = dateString;
};

// ===== STATISTICS UPDATE =====

/**
 * Update dashboard statistics
 */
const updateStats = () => {
    const tasks = APP_STATE.tasks;
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const highPriority = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
    document.getElementById('highPriorityTasks').textContent = highPriority;

    // Update progress bar
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById('progressPercent').textContent = `${percentage}%`;
    document.getElementById('progressFill').style.width = `${percentage}%`;
};

// ===== TASK FILTERING =====

/**
 * Get filtered tasks based on current filters
 */
const getFilteredTasks = () => {
    const { search, priority, status } = APP_STATE.currentFilter;

    return APP_STATE.tasks.filter(task => {
        // Search filter
        const matchesSearch = !search ||
            task.title.toLowerCase().includes(search.toLowerCase()) ||
            task.description.toLowerCase().includes(search.toLowerCase());

        // Priority filter
        const matchesPriority = !priority || task.priority === priority;

        // Status filter
        const matchesStatus = !status || task.status === status;

        return matchesSearch && matchesPriority && matchesStatus;
    });
};

// ===== TASK RENDERING =====

/**
 * Render a single task card
 */
const createTaskCard = (task) => {
    const card = document.createElement('div');
    card.className = `task-card ${task.status === 'completed' ? 'completed-task' : ''}`;
    card.setAttribute('data-task-id', task.id);
    card.setAttribute('draggable', 'true');

    const priorityLabels = { high: 'High', medium: 'Medium', low: 'Low' };
    const statusLabels = { 'pending': 'Pending', 'in-progress': 'In Progress', 'completed': 'Completed' };
    const statusIcons = { 'pending': '⏳', 'in-progress': '🔄', 'completed': '✅' };

    const overdueClass = isOverdue(task.dueDate, task.status) ? 'style="color: var(--danger);"' : '';

    card.innerHTML = `
                <div class="task-card-header">
                    <span class="priority-badge priority-${task.priority}">${priorityLabels[task.priority]}</span>
                    <div class="task-actions">
                        <button class="task-action-btn edit" title="Edit task" data-action="edit">✏️</button>
                        <button class="task-action-btn delete" title="Delete task" data-action="delete">🗑️</button>
                    </div>
                </div>
                <h4 class="task-title">${escapeHtml(task.title)}</h4>
                <p class="task-description">${escapeHtml(task.description) || 'No description'}</p>
                <div class="task-meta">
                    <span class="task-meta-item" ${overdueClass}>📅 ${formatDate(task.dueDate)}</span>
                    <span class="task-meta-item">🕐 Created ${formatDate(task.createdAt)}</span>
                </div>
                <div class="task-status">
                    <span class="status-badge status-${task.status}">
                        ${statusIcons[task.status]} ${statusLabels[task.status]}
                    </span>
                    <select class="status-select" data-action="status">
                        <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
            `;

    // Add event listeners
    card.querySelector('[data-action="edit"]').addEventListener('click', () => openEditModal(task.id));
    card.querySelector('[data-action="delete"]').addEventListener('click', () => openDeleteConfirm(task.id));
    card.querySelector('[data-action="status"]').addEventListener('change', (e) => updateTaskStatus(task.id, e.target.value));

    // Drag events
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('drop', handleDrop);

    return card;
};

/**
 * Escape HTML to prevent XSS
 */
const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

/**
 * Render all tasks
 */
const renderTasks = () => {
    const grid = document.getElementById('tasksGrid');
    const filteredTasks = getFilteredTasks();

    // Update task count
    const countText = filteredTasks.length === 1 ? '1 task' : `${filteredTasks.length} tasks`;
    document.getElementById('tasksCount').textContent = countText;

    // Clear grid
    grid.innerHTML = '';

    if (filteredTasks.length === 0) {
        grid.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <div class="empty-icon">📝</div>
                        <h3 class="empty-title">No tasks found</h3>
                        <p class="empty-description">
                            ${APP_STATE.tasks.length === 0
                ? 'Get started by adding your first task!'
                : 'Try adjusting your search or filters.'}
                        </p>
                        ${APP_STATE.tasks.length === 0 ? `
                            <button class="btn btn-primary" onclick="openAddModal()">
                                <span>➕</span>
                                <span>Add Your First Task</span>
                            </button>
                        ` : ''}
                    </div>
                `;
    } else {
        // Sort tasks: pending first, then in-progress, then completed
        // Within each status, sort by priority (high > medium > low)
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const statusOrder = { 'pending': 0, 'in-progress': 1, 'completed': 2 };

        filteredTasks.sort((a, b) => {
            if (statusOrder[a.status] !== statusOrder[b.status]) {
                return statusOrder[a.status] - statusOrder[b.status];
            }
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        filteredTasks.forEach(task => {
            grid.appendChild(createTaskCard(task));
        });
    }

    updateStats();
};

// ===== DRAG AND DROP =====

const handleDragStart = (e) => {
    const taskId = e.target.getAttribute('data-task-id');
    APP_STATE.draggedTaskId = taskId;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
};

const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    APP_STATE.draggedTaskId = null;
};

const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
};

const handleDrop = (e) => {
    e.preventDefault();
    const dropTarget = e.target.closest('.task-card');
    if (!dropTarget || !APP_STATE.draggedTaskId) return;

    const dropTaskId = dropTarget.getAttribute('data-task-id');
    if (dropTaskId === APP_STATE.draggedTaskId) return;

    // Find indices
    const dragIndex = APP_STATE.tasks.findIndex(t => t.id === APP_STATE.draggedTaskId);
    const dropIndex = APP_STATE.tasks.findIndex(t => t.id === dropTaskId);

    // Reorder tasks
    const [draggedTask] = APP_STATE.tasks.splice(dragIndex, 1);
    APP_STATE.tasks.splice(dropIndex, 0, draggedTask);

    saveTasks();
    renderTasks();
    showToast('Task reordered', 'success');
};

// ===== MODAL OPERATIONS =====

/**
 * Open modal for adding new task
 */
const openAddModal = () => {
    APP_STATE.editingTaskId = null;
    document.getElementById('modalTitle').textContent = 'Add New Task';
    document.getElementById('taskForm').reset();
    document.getElementById('taskId').value = '';
    document.getElementById('taskStatus').value = 'pending';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskModal').classList.add('active');
};

/**
 * Open modal for editing existing task
 */
const openEditModal = (taskId) => {
    const task = APP_STATE.tasks.find(t => t.id === taskId);
    if (!task) return;

    APP_STATE.editingTaskId = taskId;
    document.getElementById('modalTitle').textContent = 'Edit Task';
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description;
    document.getElementById('taskDueDate').value = task.dueDate;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskStatus').value = task.status;
    document.getElementById('taskModal').classList.add('active');
};

/**
 * Close task modal
 */
const closeTaskModal = () => {
    document.getElementById('taskModal').classList.remove('active');
    APP_STATE.editingTaskId = null;
};

/**
 * Open delete confirmation modal
 */
const openDeleteConfirm = (taskId) => {
    APP_STATE.deleteTaskId = taskId;
    document.getElementById('confirmModal').classList.add('active');
};

/**
 * Close delete confirmation modal
 */
const closeDeleteConfirm = () => {
    document.getElementById('confirmModal').classList.remove('active');
    APP_STATE.deleteTaskId = null;
};

// ===== CRUD OPERATIONS =====

/**
 * Save task (create or update)
 */
const saveTask = () => {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const dueDate = document.getElementById('taskDueDate').value;
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value;

    if (!title) {
        showToast('Please enter a task title', 'error');
        return;
    }

    if (APP_STATE.editingTaskId) {
        // Update existing task
        const taskIndex = APP_STATE.tasks.findIndex(t => t.id === APP_STATE.editingTaskId);
        if (taskIndex !== -1) {
            APP_STATE.tasks[taskIndex] = {
                ...APP_STATE.tasks[taskIndex],
                title,
                description,
                dueDate,
                priority,
                status
            };
            showToast('Task updated successfully!', 'success');
        }
    } else {
        // Create new task
        const newTask = {
            id: generateId(),
            title,
            description,
            dueDate,
            priority,
            status,
            createdAt: new Date().toISOString()
        };
        APP_STATE.tasks.unshift(newTask);
        showToast('Task created successfully!', 'success');
    }

    saveTasks();
    renderTasks();
    closeTaskModal();
};

/**
 * Delete task
 */
const deleteTask = () => {
    if (!APP_STATE.deleteTaskId) return;

    APP_STATE.tasks = APP_STATE.tasks.filter(t => t.id !== APP_STATE.deleteTaskId);
    saveTasks();
    renderTasks();
    closeDeleteConfirm();
    showToast('Task deleted successfully!', 'success');
};

/**
 * Update task status
 */
const updateTaskStatus = (taskId, newStatus) => {
    const task = APP_STATE.tasks.find(t => t.id === taskId);
    if (!task) return;

    const oldStatus = task.status;
    task.status = newStatus;
    saveTasks();

    // Show completion animation
    if (newStatus === 'completed' && oldStatus !== 'completed') {
        const card = document.querySelector(`[data-task-id="${taskId}"]`);
        if (card) {
            card.classList.add('completion-animation');
            setTimeout(() => card.classList.remove('completion-animation'), 400);
        }
        showToast('Task completed! 🎉', 'success');
    } else {
        showToast('Status updated', 'info');
    }

    renderTasks();
};

// ===== EVENT LISTENERS =====

/**
 * Initialize event listeners
 */
const initEventListeners = () => {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Add task button
    document.getElementById('addTaskBtn').addEventListener('click', openAddModal);

    // Modal controls
    document.getElementById('closeModal').addEventListener('click', closeTaskModal);
    document.getElementById('cancelTask').addEventListener('click', closeTaskModal);
    document.getElementById('saveTask').addEventListener('click', saveTask);

    // Delete confirmation
    document.getElementById('cancelDelete').addEventListener('click', closeDeleteConfirm);
    document.getElementById('confirmDelete').addEventListener('click', deleteTask);

    // Close modals on overlay click
    document.getElementById('taskModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeTaskModal();
    });
    document.getElementById('confirmModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeDeleteConfirm();
    });

    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTaskModal();
            closeDeleteConfirm();
        }
    });

    // Search and filter
    document.getElementById('searchInput').addEventListener('input', (e) => {
        APP_STATE.currentFilter.search = e.target.value;
        renderTasks();
    });

    document.getElementById('priorityFilter').addEventListener('change', (e) => {
        APP_STATE.currentFilter.priority = e.target.value;
        renderTasks();
    });

    document.getElementById('statusFilter').addEventListener('change', (e) => {
        APP_STATE.currentFilter.status = e.target.value;
        renderTasks();
    });

    // Form submission
    document.getElementById('taskForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveTask();
    });
};

// ===== INITIALIZATION =====

/**
 * Initialize the application
 */
const init = () => {
    loadTheme();
    loadTasks();
    initEventListeners();
    renderTasks();
    updateClock();

    // Update clock every second
    setInterval(updateClock, 1000);

    console.log('TaskFlow initialized successfully! 🚀');
};

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);