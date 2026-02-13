const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Verify email configuration
 */
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service configured successfully');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error.message);
    return false;
  }
};

/**
 * Send email
 * @param {object} options - Email options (to, subject, html, text)
 * @returns {Promise<object>} - Send result
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"PetCare Plus" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || stripHtml(html)
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`📧 Email sent to ${to}: ${subject}`);
    
    return {
      success: true,
      messageId: info.messageId
    };
    
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send appointment reminder email
 */
const sendAppointmentReminder = async (ownerEmail, ownerName, petName, appointmentDate, appointmentTime, vetName) => {
  const subject = `Appointment Reminder - ${petName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Appointment Reminder</h2>
      <p>Dear ${ownerName},</p>
      <p>This is a friendly reminder about your upcoming appointment:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Pet:</strong> ${petName}</p>
        <p><strong>Date:</strong> ${appointmentDate}</p>
        <p><strong>Time:</strong> ${appointmentTime}</p>
        <p><strong>Veterinarian:</strong> ${vetName}</p>
      </div>
      <p>Please arrive 10 minutes early. If you need to reschedule, please contact us as soon as possible.</p>
      <p>Best regards,<br>PetCare Plus Team</p>
    </div>
  `;
  
  return await sendEmail({ to: ownerEmail, subject, html });
};

/**
 * Send vaccination reminder email
 */
const sendVaccinationReminder = async (ownerEmail, ownerName, petName, vaccineName, dueDate) => {
  const subject = `Vaccination Reminder - ${petName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Vaccination Reminder</h2>
      <p>Dear ${ownerName},</p>
      <p>${petName}'s vaccination is due soon:</p>
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <p><strong>Vaccine:</strong> ${vaccineName}</p>
        <p><strong>Due Date:</strong> ${dueDate}</p>
      </div>
      <p>Please schedule an appointment to ensure ${petName} stays protected.</p>
      <p>Best regards,<br>PetCare Plus Team</p>
    </div>
  `;
  
  return await sendEmail({ to: ownerEmail, subject, html });
};

/**
 * Send welcome email to new users
 */
const sendWelcomeEmail = async (userEmail, userName, userRole) => {
  const subject = 'Welcome to PetCare Plus!';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Welcome to PetCare Plus!</h2>
      <p>Dear ${userName},</p>
      <p>Thank you for joining PetCare Plus Management System.</p>
      <p>Your account has been successfully created with the role: <strong>${userRole}</strong></p>
      <p>You can now log in and access all features available to you.</p>
      <p>If you have any questions, feel free to contact our support team.</p>
      <p>Best regards,<br>PetCare Plus Team</p>
    </div>
  `;
  
  return await sendEmail({ to: userEmail, subject, html });
};

/**
 * Strip HTML tags (fallback for plain text)
 */
const stripHtml = (html) => {
  return html.replace(/<[^>]*>/g, '');
};

module.exports = {
  verifyEmailConfig,
  sendEmail,
  sendAppointmentReminder,
  sendVaccinationReminder,
  sendWelcomeEmail
};