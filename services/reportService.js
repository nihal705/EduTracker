// services/reportService.js
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Student = require('../models/Student');

class ReportService {
    // Generate student transcript PDF
    static async generateTranscriptPDF(usn) {
        const student = await Student.getCompleteProfile(usn);
        if (!student) return null;
        
        const doc = new PDFDocument({ margin: 50 });
        
        // Header
        doc.fontSize(20).text('ACADEMIC TRANSCRIPT', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Student Name: ${student.name}`);
        doc.text(`USN: ${student.usn}`);
        doc.text(`Department: ${student.department}`);
        doc.text(`CGPA: ${student.cgpa.toFixed(2)}`);
        doc.moveDown();
        
        // Semester table
        student.semesters.forEach(semester => {
            doc.fontSize(14).text(`Semester ${semester.semester_number} (SGPA: ${semester.sgpa.toFixed(2)})`, { underline: true });
            doc.moveDown(0.5);
            
            // Subject table
            const tableTop = doc.y;
            doc.fontSize(10);
            
            semester.subjects.forEach((subject, index) => {
                doc.text(`${index + 1}. ${subject.subject_name}`, 50, tableTop + (index * 20));
                doc.text(`${subject.marks}`, 250, tableTop + (index * 20));
                doc.text(`${subject.credits}`, 350, tableTop + (index * 20));
                doc.text(`${subject.grade_point}`, 430, tableTop + (index * 20));
                doc.text(`${subject.grade}`, 500, tableTop + (index * 20));
            });
            
            doc.moveDown(semester.subjects.length + 1);
        });
        
        doc.end();
        return doc;
    }

    // Generate Excel report
    static async generateExcelReport(institutionId) {
        const students = await Student.findAll(institutionId);
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Student Performance');
        
        worksheet.columns = [
            { header: 'USN', key: 'usn', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Department', key: 'department', width: 15 },
            { header: 'CGPA', key: 'cgpa', width: 10 },
            { header: 'Semesters', key: 'semester_count', width: 10 },
            { header: 'Status', key: 'status', width: 15 }
        ];
        
        students.forEach(student => {
            worksheet.addRow({
                usn: student.usn,
                name: student.name,
                department: student.department,
                cgpa: student.cgpa?.toFixed(2) || 'N/A',
                semester_count: student.semester_count || 0,
                status: student.cgpa >= 8.5 ? 'Distinction' : student.cgpa >= 7 ? 'First Class' : 'Pass'
            });
        });
        
        return workbook;
    }
}

module.exports = ReportService;