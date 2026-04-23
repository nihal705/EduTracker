// utils/formatters.js - Data Formatting Utilities

class Formatters {
    // Format date
    static formatDate(date, format = 'DD/MM/YYYY') {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        
        if (format === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
        if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
        if (format === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
        return `${day}/${month}/${year}`;
    }
    
    // Format time
    static formatTime(date) {
        const d = new Date(date);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Format datetime
    static formatDateTime(date) {
        return `${this.formatDate(date)} ${this.formatTime(date)}`;
    }
    
    // Format SGPA/CGPA
    static formatGrade(grade) {
        if (grade === null || grade === undefined) return 'N/A';
        return parseFloat(grade).toFixed(2);
    }
    
    // Format percentage
    static formatPercentage(value) {
        if (value === null || value === undefined) return 'N/A';
        return `${parseFloat(value).toFixed(1)}%`;
    }
    
    // Format USN for display
    static formatUSN(usn) {
        if (!usn) return '';
        // 1SP23CS001 -> 1SP23CS001
        return usn.toUpperCase();
    }
    
    // Get ordinal suffix for semester
    static getOrdinalSuffix(num) {
        if (num > 3 && num < 21) return 'th';
        switch (num % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }
    
    // Format semester display
    static formatSemester(num) {
        return `${num}${this.getOrdinalSuffix(num)} Semester`;
    }
    
    // Truncate text
    static truncate(text, length = 50) {
        if (!text || text.length <= length) return text;
        return text.substring(0, length) + '...';
    }
    
    // Capitalize first letter
    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    // Format student name
    static formatName(name) {
        if (!name) return '';
        return name.split(' ').map(part => this.capitalize(part)).join(' ');
    }
    
    // Format department code to full name
    static getDepartmentFullName(code) {
        const departments = {
            'CSE': 'Computer Science Engineering',
            'ECE': 'Electronics & Communication Engineering',
            'ISE': 'Information Science Engineering',
            'AIML': 'Artificial Intelligence & Machine Learning',
            'DS': 'Data Science',
            'CE': 'Civil Engineering',
            'ME': 'Mechanical Engineering'
        };
        return departments[code] || code;
    }
    
    // Format grade with color class
    static getGradeColorClass(grade) {
        if (grade >= 9) return 'grade-excellent';
        if (grade >= 8) return 'grade-good';
        if (grade >= 7) return 'grade-average';
        if (grade >= 6) return 'grade-pass';
        return 'grade-fail';
    }
    
    // Format file size
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = Formatters;