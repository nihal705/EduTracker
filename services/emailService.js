// services/emailService.js - Email Notification Service
const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
    constructor() {
        this.transporter = null;
        this.init();
    }
    
    init() {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.EMAIL_PORT) || 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            console.log('✅ Email service initialized');
        } else {
            console.log('⚠️ Email service not configured');
        }
    }
    
    async sendEmail(to, subject, html, text = null) {
        if (!this.transporter) {
            console.log('Email service not configured, skipping send');
            return false;
        }
        
        try {
            const info = await this.transporter.sendMail({
                from: `"EduTracker" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                text: text || html.replace(/<[^>]*>/g, ''),
                html
            });
            console.log('Email sent:', info.messageId);
            return true;
        } catch (error) {
            console.error('Email send error:', error);
            return false;
        }
    }
    
    async sendWelcomeEmail(student) {
        const subject = 'Welcome to EduTracker!';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Welcome to EduTracker, ${student.name}!</h2>
                <p>Your academic performance tracking account has been created successfully.</p>
                <p><strong>USN:</strong> ${student.usn}</p>
                <p>You can now log in to track your SGPA, CGPA, and academic progress.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">EduTracker - Student Academic Performance Tracker</p>
            </div>
        `;
        return this.sendEmail(student.email, subject, html);
    }
    
    async sendResultPublished(student, semester, sgpa) {
        const subject = `Semester ${semester} Results Published!`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Your Semester ${semester} Results are Ready!</h2>
                <p>Dear ${student.name},</p>
                <p>Your academic results for semester ${semester} have been published.</p>
                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center;">
                    <h3 style="margin: 0; color: #059669;">SGPA: ${sgpa.toFixed(2)}</h3>
                </div>
                <p>Log in to your EduTracker account to view detailed marks.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">EduTracker - Student Academic Performance Tracker</p>
            </div>
        `;
        return this.sendEmail(student.email, subject, html);
    }
    
    async sendCGPAlert(student, oldCgpa, newCgpa) {
        if (newCgpa >= oldCgpa) return false;
        
        const drop = ((oldCgpa - newCgpa) / oldCgpa * 100).toFixed(1);
        const subject = '⚠️ Academic Performance Alert';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Academic Performance Alert</h2>
                <p>Dear ${student.name},</p>
                <p>Your CGPA has dropped from <strong>${oldCgpa.toFixed(2)}</strong> to <strong>${newCgpa.toFixed(2)}</strong> (${drop}% decrease).</p>
                <p>We recommend reviewing your performance and seeking academic support if needed.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">EduTracker - Student Academic Performance Tracker</p>
            </div>
        `;
        return this.sendEmail(student.email, subject, html);
    }
}

module.exports = new EmailService();