// public/js/notifications.js - Real-time Notifications
let notificationSocket = null;
let notificationList = [];

// Initialize notifications
function initNotifications(usn) {
    if (notificationSocket) notificationSocket.disconnect();
    
    notificationSocket = io();
    notificationSocket.emit('join_notifications', usn);
    
    notificationSocket.on('new_notification', (notification) => {
        addNotificationToUI(notification);
        showNotification(notification.message, notification.type);
        updateNotificationBadge();
    });
    
    loadNotifications(usn);
}

// Load notifications
async function loadNotifications(usn) {
    try {
        const response = await fetch(`${API_URL}/notifications/student/${usn}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        
        if (data.success) {
            notificationList = data.data;
            displayNotifications();
            updateNotificationBadge(data.unreadCount);
        }
    } catch (error) {
        console.error('Load notifications error:', error);
    }
}

// Display notifications
function displayNotifications() {
    const container = document.getElementById('notificationList');
    if (!container) return;
    
    if (notificationList.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-3">No notifications</div>';
        return;
    }
    
    container.innerHTML = notificationList.map(notif => `
        <div class="notification-item ${notif.is_read ? 'read' : 'unread'}" data-id="${notif.id}">
            <div class="notification-icon ${notif.type}">
                <i class="fas ${getNotificationIcon(notif.type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notif.title}</div>
                <div class="notification-message">${notif.message}</div>
                <div class="notification-time">${formatTimeAgo(notif.created_at)}</div>
            </div>
            <div class="notification-actions">
                <button class="btn btn-sm btn-link" onclick="markNotificationRead(${notif.id})">
                    <i class="fas fa-check"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Add notification to UI
function addNotificationToUI(notification) {
    const container = document.getElementById('notificationList');
    if (!container) return;
    
    const newNotif = document.createElement('div');
    newNotif.className = 'notification-item unread';
    newNotif.innerHTML = `
        <div class="notification-icon ${notification.type}">
            <i class="fas ${getNotificationIcon(notification.type)}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${notification.title}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">Just now</div>
        </div>
    `;
    
    container.insertBefore(newNotif, container.firstChild);
    notificationList.unshift(notification);
    updateNotificationBadge();
}

// Mark notification as read
async function markNotificationRead(id) {
    try {
        await fetch(`${API_URL}/notifications/${id}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        const notif = notificationList.find(n => n.id === id);
        if (notif) notif.is_read = true;
        
        displayNotifications();
        updateNotificationBadge();
    } catch (error) {
        console.error('Mark read error:', error);
    }
}

// Mark all as read
async function markAllRead(usn) {
    try {
        await fetch(`${API_URL}/notifications/student/${usn}/read-all`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        notificationList.forEach(n => n.is_read = true);
        displayNotifications();
        updateNotificationBadge();
    } catch (error) {
        console.error('Mark all read error:', error);
    }
}

// Update notification badge
function updateNotificationBadge(unreadCount = null) {
    const count = unreadCount !== null ? unreadCount : notificationList.filter(n => !n.is_read).length;
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

// Get notification icon
function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'danger': return 'fa-times-circle';
        default: return 'fa-info-circle';
    }
}

// Format time ago
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
}