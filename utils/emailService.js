const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

async function sendOTP(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email - QR Menu Pro',
    html: `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background:#f4f6fb; padding:40px 20px;">
      
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; padding:40px; box-shadow:0 10px 25px rgba(0,0,0,0.08); text-align:center;">
        
        <h2 style="color:#4F46E5; margin-bottom:10px;">Verify Your Email</h2>
        
        <p style="color:#555; font-size:15px; margin-bottom:25px;">
          Use the verification code below to complete your signup.
        </p>
    
        <div style="
          display:inline-block;
          padding:18px 28px;
          font-size:34px;
          letter-spacing:10px;
          font-weight:bold;
          color:#4F46E5;
          background:#f3f4ff;
          border-radius:8px;
          border:2px dashed #4F46E5;
          margin-bottom:25px;
        ">
          ${otp}
        </div>
    
        <p style="color:#555; font-size:14px;">
          This code will expire in <b>10 minutes</b>.
        </p>
    
        <hr style="border:none; border-top:1px solid #eee; margin:30px 0;" />
    
        <p style="color:#888; font-size:12px; line-height:1.6;">
          If you didn't request this verification code, you can safely ignore this email.
        </p>
    
      </div>
    
    </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOTP };
