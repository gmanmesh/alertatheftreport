const BREVO_API_KEY=process.env.BREVO_API_KEY;

export default async function handler(req, res) {
    console.log('Handler start');
  try {
    console.log('Method:', req.method);
    if (req.method !== 'POST') {
      console.log('Invalid method');
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const { to, subject, html, attachments } = req.body;

    if (!to) {
      console.log('Email missing');
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    // Send email
    console.log('Sending email...');
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Alerta App', email: 'ethiodigitalacademy@gmail.com' },
        to: [{ email: to, name: 'Ethiopian Federal Police' }],
        subject: subject,
        htmlContent: html,
        attachments: attachments,
      }),
    });
    console.log('Email API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Email sending error:', errorData);
      res.status(500).json({ error: 'Failed to send theft report' });
      return;
    }
    console.log('Email sent successfully');

    res.status(200).json({ success: true, message: 'Theft report has been sent successfully' });
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
