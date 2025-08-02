import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code, userId } = req.body;

  if (!code || !userId) {
    return res.status(400).json({ error: 'Missing code or userId' });
  }

  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'https://alertatheftreport-delta.vercel.app' // redirect URI
    );

    const { tokens } = await oAuth2Client.getToken(code);

    // Optional: Calculate expiry date
    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    // Store tokens in Supabase
    const { data, error } = await supabase
      .from('tokens')
      .upsert({ 
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
      }, { onConflict: 'user_id' }); // update if exists

    if (error) {
      console.error('Supabase insert/update error:', error);
      return res.status(500).json({ error: 'Failed to store tokens' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error exchanging code:', err);
    return res.status(500).json({ error: 'Failed to exchange code' });
  }
}
