import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, html, attachments } = req.body;

  // Load environment variables
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN,
    SENDER_EMAIL,
  } = process.env;

  // Create OAuth2 transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: SENDER_EMAIL,
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      refreshToken: GOOGLE_REFRESH_TOKEN,
    },
  });

  // Email details
  const mailOptions = {
    from: SENDER_EMAIL,
    to: to, // default recipient
    subject: 'ALERTA: Phone Theft Report',
    html: html,
    attachments: attachments || [],
  };

  try {
    await transporter.verify();
    const info = await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Theft report sent', messageId: info.messageId });
  } catch (err) {
    console.error('Error sending theft alert:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
}
