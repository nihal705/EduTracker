// controllers/institutionController.js
const Institution = require('../models/Institution');
const Student = require('../models/Student');
const Semester = require('../models/Semester');
const Notification = require('../models/Notification');

class InstitutionController {
    // Get institution profile
    static async getProfile(req, res) {
        try {
            const institution = await Institution.findById(req.user.institutionId);
            res.json({ success: true, data: institution });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Update institution profile
    static async updateProfile(req, res) {
        try {
            const { name, email, adminName, phone, address } = req.body;
            const updated = await Institution.update(req.user.institutionId, {
                name, email, admin_name: adminName, phone, address
            });
            res.json({ success: true, data: updated });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Get all students
    static async getStudents(req, res) {
        try {
            const students = await Student.findAll(req.user.institutionId);
            res.json({ success: true, data: students });
        } catch (error) {
            console.error('Get students error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Get student details
    static async getStudent(req, res) {
        try {
            const { usn } = req.params;
            const student = await Student.getCompleteProfile(usn);
            
            if (!student || student.institution_id !== req.user.institutionId) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            
            res.json({ success: true, data: student });
        } catch (error) {
            console.error('Get student error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Add student record
    static async addStudentRecord(req, res) {
        try {
            const { usn, name, department, semester, subjects } = req.body;
            
            const semesterResult = await Semester.create(usn, semester, subjects);
            
            // Send notification
            await Notification.create({
                student_usn: usn,
                institution_id: req.user.institutionId,
                title: 'New Results Published',
                message: `Your Semester ${semester} results have been published. SGPA: ${semesterResult.sgpa.toFixed(2)}`,
                type: 'success'
            });
            
            // Emit socket event
            const io = req.app.get('io');
            io.to(`student_${usn}`).emit('new_result', {
                semester,
                sgpa: semesterResult.sgpa.toFixed(2)
            });
            
            res.json({ success: true, data: semesterResult });
        } catch (error) {
            console.error('Add record error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Get dashboard stats
    static async getDashboardStats(req, res) {
        try {
            const stats = await Institution.getDashboardStats(req.user.institutionId);
            res.json({ success: true, data: stats });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // Search students
    static async searchStudents(req, res) {
        try {
            const { q } = req.query;
            const students = await Student.search(req.user.institutionId, q);
            res.json({ success: true, data: students });
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}

module.exports = InstitutionController;