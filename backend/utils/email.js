import nodemailer from 'nodemailer';

/**
 * Email Service Utility
 * Handles sending emails using Nodemailer with a fallback for development.
 */
class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.firstName;
        this.url = url;
        this.from = `Skillvyn <${process.env.EMAIL_FROM || 'no-reply@skillvyn.com'}>`;
    }

    newTransport() {
        // Use a real transport in production, but something like Mailtrap in dev
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
            port: process.env.EMAIL_PORT || 2525,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    // Send the actual email
    async send(template, subject, textContent) {
        // 🚀 SMART DEV MODE: If No Credentials OR DEBUB_MODE is on, just log to console
        if (!process.env.EMAIL_USER || process.env.DEBUG_MODE === 'True') {
            console.log('\n--- 📧 VIRTUAL EMAIL START ---');
            console.log(`To:      ${this.to}`);
            console.log(`From:    ${this.from}`);
            console.log(`Subject: ${subject}`);
            console.log(`Content: ${textContent}`);
            console.log('--- 📧 VIRTUAL EMAIL END ---\n');
            return;
        }

        // 1. Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            text: textContent,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 10px;">
                    <h2 style="color: #2563eb; margin-bottom: 20px;">Skillvyn</h2>
                    <p>Hi ${this.firstName},</p>
                    <p>${textContent}</p>
                    ${this.url ? `<a href="${this.url}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Take Action</a>` : ''}
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="font-size: 12px; color: #999;">If you didn't expect this email, please ignore it.</p>
                </div>
            `
        };

        // 2. Create transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    /**
     * Welcome Email
     * Sent when a student or mentor registers.
     */
    async sendWelcome() {
        await this.send(
            'welcome', 
            'Welcome to Skillvyn!', 
            'We are so excited to have you join our learning community. Get started by exploring our courses!'
        );
    }

    /**
     * Staff/Admin Welcome Email
     * Sent when an admin manually creates a user.
     */
    async sendStaffWelcome(password) {
        await this.send(
            'staff-welcome',
            'Your Skillvyn Account is Ready',
            `An administrator has created an account for you. <br><br> <strong>Email:</strong> ${this.to} <br> <strong>Temporary Password:</strong> ${password} <br><br> Please log in and change your password immediately.`
        );
    }

    /**
     * Enrollment Confirmation
     * Sent when a student enrolls in a course.
     */
    async sendEnrollmentConfirmation(courseTitle, invoiceNumber, amount) {
        let content = `You have successfully enrolled in "${courseTitle}". Happy learning!`;
        if (invoiceNumber) {
            content += `<br><br><strong>Order Details:</strong><br>Invoice: ${invoiceNumber}<br>Amount Paid: ₹${amount}`;
        }
        
        await this.send(
            'enrollment', 
            'Course Enrollment Successful', 
            content
        );
    }

    /**
     * Batch Enrollment Confirmation
     * Sent when a student enrolls in multiple courses (from cart).
     */
    async sendBatchEnrollmentConfirmation(courseTitles, totalAmount) {
        const list = courseTitles.map(t => `<li>${t}</li>`).join('');
        let content = `You have successfully enrolled in the following courses: <ul style="margin-top: 10px;">${list}</ul>`;
        
        if (totalAmount) {
            content += `<br><strong>Total Paid:</strong> ₹${totalAmount}`;
        }

        await this.send(
            'batch-enrollment',
            'Multiple Course Enrollments Successful',
            content
        );
    }

    /**
     * Order Confirmation
     * Sent after a successful purchase.
     */
    async sendOrderConfirmation(orderId, amount) {
        await this.send(
            'order', 
            'Purchase Receipt: Skillvyn', 
            `Your payment for ₹${amount} was successful. Order ID: ${orderId}.`
        );
    }

    /**
     * Mentor Enrollment Notification
     * Sent to a mentor when a new student enrolls in their course.
     */
    async sendMentorEnrollmentNotification(studentName, courseTitle) {
        await this.send(
            'mentor-enrollment',
            'New Student Enrolled!',
            `Great news! <strong>${studentName}</strong> has just enrolled in your course: <strong>"${courseTitle}"</strong>. Check your dashboard for student details.`
        );
    }

    /**
     * Certification Email
     * Sent when a student completes all requirements and is certified.
     */
    async sendCertificationEmail(courseTitle, certificateId) {
        await this.send(
            'certification',
            'Congratulations! You are Certified!',
            `Fantastic work! You have successfully completed all requirements for <strong>"${courseTitle}"</strong>.<br><br> Your Certificate ID is: <strong>${certificateId}</strong>. You can view and download your professional certificate from your learning dashboard.`
        );
    }
}

export default Email;
