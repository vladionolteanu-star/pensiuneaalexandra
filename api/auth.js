export default function handler(req, res) {
    const clientId = process.env.OAUTH_CLIENT_ID;
    if (!clientId) {
        return res.status(500).json({ error: 'OAUTH_CLIENT_ID not configured' });
    }

    const redirectUri = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/callback`;
    const scope = 'repo,user';
    const state = Math.random().toString(36).substring(2);

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

    res.writeHead(302, { Location: authUrl });
    res.end();
}
