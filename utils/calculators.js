// utils/calculators.js - SGPA/CGPA Calculation Utilities

class Calculators {
    // Calculate SGPA from subjects
    static calculateSGPA(subjects) {
        let totalCredits = 0;
        let totalGradePoints = 0;
        
        subjects.forEach(subject => {
            totalCredits += subject.credits;
            totalGradePoints += subject.credits * subject.gradePoint;
        });
        
        return totalCredits > 0 ? totalGradePoints / totalCredits : 0;
    }
    
    // Calculate CGPA from semesters
    static calculateCGPA(semesters) {
        if (!semesters || semesters.length === 0) return 0;
        
        let totalSgpa = 0;
        semesters.forEach(semester => {
            totalSgpa += semester.sgpa;
        });
        
        return totalSgpa / semesters.length;
    }
    
    // Convert marks to grade point
    static marksToGradePoint(marks) {
        if (marks >= 90) return 10;
        if (marks >= 80) return 9;
        if (marks >= 70) return 8;
        if (marks >= 60) return 7;
        if (marks >= 50) return 6;
        if (marks >= 45) return 5;
        return 0;
    }
    
    // Convert marks to grade letter
    static marksToGrade(marks) {
        if (marks >= 90) return 'S';
        if (marks >= 80) return 'A';
        if (marks >= 70) return 'B';
        if (marks >= 60) return 'C';
        if (marks >= 50) return 'D';
        if (marks >= 45) return 'E';
        return 'F';
    }
    
    // Convert grade point to grade letter
    static gradePointToGrade(gradePoint) {
        if (gradePoint >= 9.5) return 'S';
        if (gradePoint >= 8.5) return 'A';
        if (gradePoint >= 7.5) return 'B';
        if (gradePoint >= 6.5) return 'C';
        if (gradePoint >= 5.5) return 'D';
        if (gradePoint >= 5.0) return 'E';
        return 'F';
    }
    
    // Calculate performance trend
    static calculateTrend(sgpas) {
        if (sgpas.length < 2) return 'stable';
        
        const first = sgpas[0];
        const last = sgpas[sgpas.length - 1];
        
        if (last > first) return 'improving';
        if (last < first) return 'declining';
        return 'stable';
    }
    
    // Calculate improvement percentage
    static calculateImprovement(sgpas) {
        if (sgpas.length < 2) return 0;
        
        const first = sgpas[0];
        const last = sgpas[sgpas.length - 1];
        
        if (first === 0) return 0;
        return ((last - first) / first) * 100;
    }
    
    // Predict next SGPA based on trend
    static predictNextSGPA(sgpas) {
        if (sgpas.length < 2) return sgpas[0] || 0;
        
        let sum = 0;
        let weights = 0;
        
        for (let i = 0; i < sgpas.length; i++) {
            const weight = i + 1;
            sum += sgpas[i] * weight;
            weights += weight;
        }
        
        const weightedAvg = sum / weights;
        const trend = this.calculateImprovement(sgpas) / 100;
        
        let prediction = weightedAvg * (1 + trend * 0.5);
        prediction = Math.min(10, Math.max(0, prediction));
        
        return parseFloat(prediction.toFixed(2));
    }
    
    // Calculate class rank
    static calculateRank(students, usn) {
        const sorted = [...students].sort((a, b) => b.cgpa - a.cgpa);
        const rank = sorted.findIndex(s => s.usn === usn) + 1;
        return rank;
    }
    
    // Calculate percentile
    static calculatePercentile(students, cgpa) {
        const below = students.filter(s => s.cgpa < cgpa).length;
        return (below / students.length) * 100;
    }
    
    // Validate USN format
    static validateUSN(usn) {
        // Typical engineering USN format: 1SP23CS001
        const pattern = /^[0-9]{1}[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$/;
        return pattern.test(usn);
    }
    
    // Generate semester range
    static getSemesterRange(totalSemesters = 8) {
        return Array.from({ length: totalSemesters }, (_, i) => i + 1);
    }
}

module.exports = Calculators;