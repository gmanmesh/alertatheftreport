import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';


const supabaseUrl=process.env.SEND_SUPABASE_URL;
const supabaseAnonKey=process.env.SEND_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, html, attachments, userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  // Fetch tokens for user
  const { data: tokenData, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !tokenData) {
    console.error('Token fetch error:', error);
    return res.status(401).json({ error: 'OAuth tokens not found. Please authorize first.' });
  }

  const { access_token, refresh_token, expires_at } = tokenData;

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://alertatheftreport-delta.vercel.app'
  );

  oAuth2Client.setCredentials({
    access_token,
    refresh_token,
    expiry_date: expires_at ? new Date(expires_at).getTime() : undefined,
  });

  try {
    // Refresh token if expired
    if (expires_at && new Date() > new Date(expires_at)) {
      const { credentials } = await oAuth2Client.refreshAccessToken();
      // Save new tokens
      await supabase
        .from('tokens')
        .update({
          access_token: credentials.access_token,
          expiry_date: credentials.expiry_date,
        })
        .eq('user_id', userId);
    }

    const accessTokenResponse = await oAuth2Client.getAccessToken();

    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_SENDER_EMAIL,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: refresh_token,
        accessToken: accessTokenResponse.token,
      },
    });

   // Email options
  const mailOptions = {
    from: process.env.GMAIL_SENDER_EMAIL,
    to: to,
    subject: 'ALERTA - Phone Theft Report',
    html: html,
    attachments: attachments || [],
  };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error sending email:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
