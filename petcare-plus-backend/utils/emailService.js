const nodemailer = require('nodemailer');
require('dotenv').config();

// ── Transporter ───────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error('❌ Email service error:', error.message);
  } else {
    console.log('✅ Email service ready!');
  }
});

// ── Send QR Code Email ────────────────────────────────────
const sendQRCodeEmail = async ({
  ownerEmail, ownerName, petName,
  petSpecies, petBreed, qrCodeBase64, petId,
}) => {
  try {
    const qrBuffer = Buffer.from(
      qrCodeBase64.replace(/^data:image\/png;base64,/, ''),
      'base64'
    );

    const downloadUrl = `${process.env.BACKEND_URL  || 'http://localhost:5000'}/api/pets/${petId}/qr-download`;
    const appUrl      = `${process.env.FRONTEND_URL || 'http://localhost:3000'}`;

    const petIcon = petSpecies === 'Dog'    ? '🐕'
                  : petSpecies === 'Cat'    ? '🐈'
                  : petSpecies === 'Bird'   ? '🦜'
                  : petSpecies === 'Rabbit' ? '🐇'
                  : '🐾';

    const mailOptions = {
      from:    process.env.EMAIL_FROM || `PetCare Plus <${process.env.EMAIL_USER}>`,
      to:      ownerEmail,
      subject: `🐾 ${petName}'s QR Code — PetCare Plus`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;
  font-family:'Segoe UI',Arial,sans-serif;">

  <div style="max-width:560px;margin:32px auto;
    background:#fff;border-radius:20px;overflow:hidden;
    box-shadow:0 4px 24px rgba(0,0,0,0.10);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0d1526,#1a3a6b);
      padding:36px 40px;text-align:center;">
      <div style="font-size:44px;margin-bottom:12px;">🐾</div>
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">
        PetCare Plus
      </h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.55);font-size:13px;">
        Veterinary Management System
      </p>
    </div>

    <!-- Greeting -->
    <div style="padding:36px 40px 0;">
      <h2 style="margin:0 0 10px;color:#0d1526;font-size:20px;font-weight:700;">
        Hello, ${ownerName}! 👋
      </h2>
      <p style="margin:0;color:#64748b;font-size:15px;line-height:1.7;">
        Your pet <strong style="color:#0d1526;">${petName}</strong>
        has been successfully registered at PetCare Plus.
        Below is the QR code to access ${petName}'s full profile
        on our mobile app.
      </p>
    </div>

    <!-- Pet Info Card -->
    <div style="margin:24px 40px;padding:20px 24px;
      background:#f8faff;border-radius:14px;
      border:1px solid #e2e8f0;">
      <div style="display:flex;align-items:center;gap:16px;">
        <div style="width:54px;height:54px;
          background:linear-gradient(135deg,#0d1526,#1a3a6b);
          border-radius:14px;display:flex;
          align-items:center;justify-content:center;font-size:28px;">
          ${petIcon}
        </div>
        <div>
          <div style="font-size:18px;font-weight:800;
            color:#0d1526;margin-bottom:3px;">
            ${petName}
          </div>
          <div style="font-size:13px;color:#64748b;">
            ${petSpecies}${petBreed ? ` &middot; ${petBreed}` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- QR Code Preview -->
    <div style="text-align:center;padding:0 40px;">
      <div style="display:inline-block;padding:16px;
        background:#f8faff;border-radius:16px;
        border:2px solid #e2e8f0;">
        <img src="cid:qrcode"
          alt="QR Code for ${petName}"
          style="width:180px;height:180px;display:block;" />
      </div>
      <p style="margin:12px 0 0;color:#94a3b8;font-size:13px;">
        Scan with the PetCare Plus mobile app
      </p>
    </div>

    <!-- Download Button -->
    <div style="text-align:center;padding:28px 40px 0;">
      <a href="${downloadUrl}"
        style="display:inline-block;
          background:linear-gradient(135deg,#0d1526,#1a3a6b);
          color:#fff;text-decoration:none;
          padding:15px 40px;border-radius:12px;
          font-size:15px;font-weight:700;
          letter-spacing:0.3px;">
        ⬇️ Download QR Code
      </a>
      <p style="margin:10px 0 0;color:#94a3b8;font-size:12px;">
        Click the button to download your pet's QR code as PNG
      </p>
    </div>

    <!-- Instructions -->
    <div style="margin:28px 40px 0;padding:20px 24px;
      background:#eff6ff;border-radius:14px;
      border:1px solid #bfdbfe;">
      <h3 style="margin:0 0 12px;color:#1d4ed8;
        font-size:14px;font-weight:700;">
        📱 How to use your QR Code:
      </h3>
      <ol style="margin:0;padding-left:20px;
        color:#1e40af;font-size:13px;line-height:1.9;">
        <li>Download and install the <strong>PetCare Plus</strong> mobile app</li>
        <li>Log in with your registered email and password</li>
        <li>Go to <strong>My Pets</strong> section</li>
        <li>Tap <strong>Scan QR</strong> to view pet details instantly</li>
        <li>Show the QR at the clinic counter for quick check-in</li>
      </ol>
    </div>

    <!-- Login Info -->
    <div style="margin:20px 40px 0;padding:16px 20px;
      background:#ecfdf5;border-radius:12px;
      border:1px solid #a7f3d0;">
      <p style="margin:0 0 6px;font-size:13px;
        font-weight:700;color:#065f46;">
        🔐 Your App Login Details:
      </p>
      <p style="margin:0;font-size:13px;
        color:#047857;line-height:1.8;">
        <strong>Email:</strong> ${ownerEmail}<br/>
        <strong>Portal:</strong>
        <a href="${appUrl}" style="color:#059669;font-weight:600;">
          ${appUrl}
        </a>
      </p>
    </div>

    <!-- Divider -->
    <div style="height:1px;background:#e2e8f0;margin:28px 40px 0;"></div>

    <!-- Footer -->
    <div style="padding:24px 40px;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;">
        Questions? Contact us at
        <a href="mailto:${process.env.EMAIL_USER}"
          style="color:#0d1526;font-weight:600;">
          ${process.env.EMAIL_USER}
        </a>
      </p>
      <p style="margin:0;font-size:12px;color:#cbd5e1;">
        © 2025 PetCare Plus · All rights reserved
      </p>
    </div>

  </div>
</body>
</html>
      `,
      attachments: [
        {
          filename: `${petName}_QR_Code.png`,
          content:  qrBuffer,
          encoding: 'base64',
          cid:      'qrcode',
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ QR email sent to ${ownerEmail} for pet ${petName}`);
    return true;

  } catch (error) {
    console.error('❌ Failed to send QR email:', error.message);
    return false;
  }
};

// ── Send Welcome Email ────────────────────────────────────
const sendWelcomeEmail = async ({ ownerEmail, ownerName, password }) => {
  try {
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const mailOptions = {
      from:    process.env.EMAIL_FROM || `PetCare Plus <${process.env.EMAIL_USER}>`,
      to:      ownerEmail,
      subject: '🐾 Welcome to PetCare Plus!',
      html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;
  font-family:'Segoe UI',Arial,sans-serif;">

  <div style="max-width:520px;margin:32px auto;
    background:#fff;border-radius:20px;overflow:hidden;
    box-shadow:0 4px 24px rgba(0,0,0,0.10);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0d1526,#1a3a6b);
      padding:36px 40px;text-align:center;">
      <div style="font-size:44px;margin-bottom:12px;">🐾</div>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">
        Welcome to PetCare Plus!
      </h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.55);font-size:13px;">
        Your pet care journey starts here
      </p>
    </div>

    <!-- Body -->
    <div style="padding:36px 40px;">
      <h2 style="margin:0 0 12px;color:#0d1526;font-size:18px;font-weight:700;">
        Hello, ${ownerName}! 👋
      </h2>
      <p style="margin:0 0 24px;color:#64748b;
        font-size:14px;line-height:1.7;">
        Your account has been successfully created at PetCare Plus.
        You can now log in to view your pets, appointments,
        vaccinations, medical records and invoices.
      </p>

      <!-- Credentials Box -->
      <div style="background:#f8faff;border-radius:12px;
        padding:20px 24px;border:1px solid #e2e8f0;margin-bottom:28px;">
        <p style="margin:0 0 10px;font-size:13px;
          font-weight:700;color:#0d1526;">
          🔐 Your Login Details:
        </p>
        <table style="width:100%;font-size:13px;
          color:#475569;line-height:1.9;border-collapse:collapse;">
          <tr>
            <td style="font-weight:600;width:90px;">Email:</td>
            <td>${ownerEmail}</td>
          </tr>
          <tr>
            <td style="font-weight:600;">Password:</td>
            <td>
              <code style="background:#e2e8f0;padding:2px 8px;
                border-radius:6px;font-size:13px;">
                ${password}
              </code>
            </td>
          </tr>
        </table>
        <p style="margin:10px 0 0;font-size:12px;color:#94a3b8;">
          ⚠️ Please change your password after first login.
        </p>
      </div>

      <!-- Login Button -->
      <div style="text-align:center;">
        <a href="${appUrl}"
          style="display:inline-block;
            background:linear-gradient(135deg,#0d1526,#1a3a6b);
            color:#fff;text-decoration:none;
            padding:14px 36px;border-radius:12px;
            font-size:14px;font-weight:700;">
          🚀 Login to Portal
        </a>
      </div>
    </div>

    <!-- What's Next -->
    <div style="margin:0 40px;padding:20px 24px;
      background:#eff6ff;border-radius:14px;
      border:1px solid #bfdbfe;">
      <h3 style="margin:0 0 12px;color:#1d4ed8;
        font-size:13px;font-weight:700;">
        🌟 What you can do:
      </h3>
      <ul style="margin:0;padding-left:18px;
        color:#1e40af;font-size:13px;line-height:1.9;">
        <li>View your pet's complete medical history</li>
        <li>Check upcoming appointments</li>
        <li>Download vaccination records</li>
        <li>View and pay invoices</li>
        <li>Scan QR code for quick pet check-in</li>
      </ul>
    </div>

    <!-- Footer -->
    <div style="padding:24px 40px;text-align:center;
      border-top:1px solid #e2e8f0;margin-top:28px;">
      <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;">
        Questions? Contact us at
        <a href="mailto:${process.env.EMAIL_USER}"
          style="color:#0d1526;font-weight:600;">
          ${process.env.EMAIL_USER}
        </a>
      </p>
      <p style="margin:0;font-size:12px;color:#cbd5e1;">
        © 2025 PetCare Plus · All rights reserved
      </p>
    </div>

  </div>
</body>
</html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${ownerEmail}`);
    return true;

  } catch (error) {
    console.error('❌ Failed to send welcome email:', error.message);
    return false;
  }
};

module.exports = { sendQRCodeEmail, sendWelcomeEmail };