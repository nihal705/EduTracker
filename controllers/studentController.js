// controllers/studentController.js
const Student = require('../models/Student');
const Semester = require('../models/Semester');

class StudentController {
    // Get student profile
    static async getProfile(req, res) {
        try {
            const { usn } = req.params;
            const student = await Student.getCompleteProfile(usn);
            
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            
            res.json({ success: true, data: student });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Get student performance
    static async getPerformance(req, res) {
        try {
            const { usn } = req.params;
            
            const student = await Student.findByUsn(usn);
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            
            const semesters = await Semester.findByStudent(usn);
            const summary = await Semester.getSummary(usn);
            
            res.json({
                success: true,
                data: {
                    student,
                    semesters,
                    summary
                }
            });
        } catch (error) {
            console.error('Get performance error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Get performance trends
    static async getTrends(req, res) {
        try {
            const { usn } = req.params;
            
            const semesters = await Semester.findByStudent(usn);
            const trends = semesters.map(s => ({
                semester: s.semester_number,
                sgpa: s.sgpa
            }));
            
            res.json({ success: true, data: trends });
        } catch (error) {
            console.error('Get trends error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Get student rank
    static async getRank(req, res) {
        try {
            const { usn } = req.params;
            
            const student = await Student.findByUsn(usn);
            if (!student) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            
            const allStudents = await Student.findAll(student.institution_id);
            const rank = allStudents.findIndex(s => s.usn === usn) + 1;
            
            res.json({
                success: true,
                data: {
                    rank,
                    total: allStudents.length,
                    percentile: ((allStudents.length - rank) / allStudents.length * 100).toFixed(1)
                }
            });
        } catch (error) {
            console.error('Get rank error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Update student profile
    static async updateProfile(req, res) {
        try {
            const { usn } = req.params;
            const { name, email, phone } = req.body;
            
            const updated = await Student.update(usn, { name, email, phone });
            res.json({ success: true, data: updated });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = StudentController;