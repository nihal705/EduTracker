// public/js/socket.js - Socket.IO Client
let socketClient = null;

function initSocketClient(userType, identifier) {
    if (socketClient) {
        socketClient.disconnect();
    }
    
    socketClient = io();
    
    socketClient.on('connect', () => {
        console.log('Socket connected');
        
        if (userType === 'student') {
            socketClient.emit('join_notifications', identifier);
        }
    });
    
    socketClient.on('new_notification', (data) => {
        showNotification(data.message, data.type);
        if (window.updateNotificationBadge) {
            window.updateNotificationBadge();
        }
    });
    
    socketClient.on('new_result', (data) => {
        showNotification(`Semester ${data.semester} results published! SGPA: ${data.sgpa}`, 'success');
        if (window.loadStudentDashboard) {
            window.loadStudentDashboard(currentUser?.usn);
        }
    });
    
    socketClient.on('disconnect', () => {
        console.log('Socket disconnected');
    });
    
    return socketClient;
}

function disconnectSocket() {
    if (socketClient) {
        socketClient.disconnect();
        socketClient = null;
    }
}