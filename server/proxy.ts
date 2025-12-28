import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

router.get('/proxy', async (req, res) => {
  const url = req.query.url as string;
  const stream = req.query.stream === 'true';

  if (!url) {
    return res.status(400).json({ error: 'Missing URL' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': req.headers['user-agent'] || '',
      },
    });

    if (!response.ok) {
      return res.status(response.status).send(`Stream request failed: ${response.statusText}`);
    }

    // Burada content-type'ı koru ama zorunlu olarak HLS türü ata (stream modunda)
    if (stream) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    } else {
      res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
    }

    response.body.pipe(res);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Proxy error');
  }
});

export default router;
