// public/js/dashboard.js - Advanced Dashboard Logic
let trendChart = null;
let deptChart = null;
let semesterChart = null;

// Load student dashboard charts
async function loadStudentCharts(usn) {
    try {
        const response = await fetch(`${API_URL}/analytics/trends/${usn}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            const ctx = document.getElementById('trendChart')?.getContext('2d');
            if (ctx) {
                if (trendChart) trendChart.destroy();
                trendChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.data.map(d => `Sem ${d.semester}`),
                        datasets: [{
                            label: 'SGPA',
                            data: data.data.map(d => d.sgpa),
                            borderColor: '#3b71ca',
                            backgroundColor: 'rgba(59,113,202,0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { position: 'top' }, title: { display: true, text: 'Academic Performance Trend' } },
                        scales: { y: { min: 0, max: 10, title: { display: true, text: 'SGPA' } } }
                    }
                });
            }
        }
    } catch (error) {
        console.error('Load student charts error:', error);
    }
}

// Load institution dashboard charts
async function loadInstitutionCharts() {
    try {
        const token = localStorage.getItem('token');
        
        // Department stats
        const deptResponse = await fetch(`${API_URL}/analytics/department-stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const deptData = await deptResponse.json();
        
        if (deptData.success && deptData.data.length > 0) {
            const ctx = document.getElementById('deptChart')?.getContext('2d');
            if (ctx) {
                if (deptChart) deptChart.destroy();
                deptChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: deptData.data.map(d => d.department),
                        datasets: [{
                            label: 'Number of Students',
                            data: deptData.data.map(d => d.student_count),
                            backgroundColor: '#3b71ca',
                            borderRadius: 8
                        }]
                    },
                    options: { responsive: true, plugins: { legend: { position: 'top' } } }
                });
            }
        }
        
        // Semester performance
        const semResponse = await fetch(`${API_URL}/analytics/semester-performance`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const semData = await semResponse.json();
        
        if (semData.success && semData.data.length > 0) {
            const ctx = document.getElementById('semesterChart')?.getContext('2d');
            if (ctx) {
                if (semesterChart) semesterChart.destroy();
                semesterChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: semData.data.map(d => `Sem ${d.semester_number}`),
                        datasets: [{
                            label: 'Average SGPA',
                            data: semData.data.map(d => d.avg_sgpa),
                            borderColor: '#14a44d',
                            backgroundColor: 'rgba(20,164,77,0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: { responsive: true, scales: { y: { min: 0, max: 10 } } }
                });
            }
        }
    } catch (error) {
        console.error('Load institution charts error:', error);
    }
}

// Export report
async function exportReport(type = 'pdf') {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/reports/export?type=${type}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `student_report_${new Date().toISOString().slice(0,10)}.${type}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Export failed', 'error');
    }
}