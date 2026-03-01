// SMS Service - Ready for Twilio integration
// Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env to enable real SMS
// Without these, falls back to console logging (mock mode)

const sendSMS = async (toPhone, message) => {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    return await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toPhone
    });
  } else {
    console.log(`📱 SMS [MOCK] To: ${toPhone} | Message: ${message}`);
    return { sid: 'MOCK_SMS_' + Date.now(), status: 'sent_mock' };
  }
};

const sendAppointmentReminderSMS = async (ownerPhone, ownerName, petName, appointmentDate, appointmentTime) => {
  const message = `PetCare Plus: Hi ${ownerName}, reminder for ${petName}'s appointment on ${appointmentDate} at ${appointmentTime}. Reply CANCEL to cancel. Call 0112345678 for help.`;
  return sendSMS(ownerPhone, message);
};

const sendVaccinationReminderSMS = async (ownerPhone, ownerName, petName, vaccineName, dueDate) => {
  const message = `PetCare Plus: Hi ${ownerName}, ${petName}'s ${vaccineName} vaccination is due on ${dueDate}. Book now at PetCare Plus.`;
  return sendSMS(ownerPhone, message);
};

const sendPaymentReminderSMS = async (ownerPhone, ownerName, invoiceNumber, amount) => {
  const message = `PetCare Plus: Hi ${ownerName}, Invoice #${invoiceNumber} for LKR ${amount} is pending. Please visit clinic or call 0112345678.`;
  return sendSMS(ownerPhone, message);
};

module.exports = { sendSMS, sendAppointmentReminderSMS, sendVaccinationReminderSMS, sendPaymentReminderSMS };
