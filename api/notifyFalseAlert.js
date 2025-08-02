import { google } from 'googleapis';
import nodemailer from 'nodemailer';

async function sendEmailWithOAuth2({ to, subject, html }) {
  // Initialize OAuth2 client with your credentials
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://alertatheftreport.vercel.app/api' // Redirect URL, can be anything if not used
  );

  // Set the refresh token
  oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

  // Obtain a new access token
  const { token: accessToken } = await oAuth2Client.getAccessToken();

  // Create Nodemailer transporter with the fresh access token
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.SENDER_EMAIL,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: accessToken,
    },
  });

  // Email options
  const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to: to,
    subject: subject,
    html: html,
  };

  // Send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Error sending email:', err);
    throw err; // Or handle error as needed
  }
}