// controllers/analyticsController.js
const Student = require('../models/Student');
const Semester = require('../models/Semester');
const Subject = require('../models/Subject');

class AnalyticsController {
    // Get comprehensive dashboard analytics
    static async getDashboardAnalytics(req, res) {
        try {
            const institutionId = req.user.institutionId;
            
            const studentStats = await Student.getStats(institutionId);
            const subjectStats = await Subject.getStats(institutionId);
            const topStudents = await Student.findAll(institutionId);
            
            // Performance distribution
            const distribution = {
                excellent: topStudents.filter(s => s.cgpa >= 8.5).length,
                good: topStudents.filter(s => s.cgpa >= 7 && s.cgpa < 8.5).length,
                average: topStudents.filter(s => s.cgpa >= 6 && s.cgpa < 7).length,
                needsImprovement: topStudents.filter(s => s.cgpa < 6).length
            };
            
            res.json({
                success: true,
                data: {
                    studentStats,
                    subjectStats: subjectStats.slice(0, 10),
                    topStudents: topStudents.slice(0, 10),
                    distribution
                }
            });
        } catch (error) {
            console.error('Dashboard analytics error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Get semester-wise performance trend
    static async getSemesterTrend(req, res) {
        try {
            const institutionId = req.user.institutionId;
            
            const trend = await Semester.getInstitutionTrend(institutionId);
            res.json({ success: true, data: trend });
        } catch (error) {
            console.error('Semester trend error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Get department comparison
    static async getDepartmentComparison(req, res) {
        try {
            const institutionId = req.user.institutionId;
            
            const departments = await Student.getDepartmentStats(institutionId);
            res.json({ success: true, data: departments });
        } catch (error) {
            console.error('Department comparison error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = AnalyticsController;