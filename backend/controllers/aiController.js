const axios = require('axios');

// POST /api/ai/assist
const aiAssist = async (req, res) => {
  try {
    const { prompt, code, language, action } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Add GEMINI_API_KEY to your .env file. Get a free key at https://aistudio.google.com/app/apikey',
      });
    }

    const actionPrompts = {
      explain:  `Explain what this ${language} code does in simple terms`,
      fix:      `Find and fix any bugs in this ${language} code`,
      optimize: `Suggest optimizations for this ${language} code`,
      test:     `Write unit tests for this ${language} code`,
    };

    let userMessage = prompt || 'Help me with this code';
    if (action && actionPrompts[action]) {
      userMessage = actionPrompts[action];
    }

    const fullPrompt = code
      ? `You are an expert coding assistant. ${userMessage}:\n\n\`\`\`${language || ''}\n${code.substring(0, 3000)}\n\`\`\``
      : `You are an expert coding assistant. ${userMessage}`;

    const { data } = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: fullPrompt }],
          },
        ],
        generationConfig: {
          temperature:     0.3,
          maxOutputTokens: 8192,  // increased from 1000 — prevents cut-off
        },
      },
      {
        headers:  { 'Content-Type': 'application/json' },
        timeout:  60000, // increased timeout for longer responses
      }
    );

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(500).json({ error: 'No response from Gemini.' });
    }

    res.json({ reply });

  } catch (err) {
    console.error('AI error:', err.message);
    if (err.response) {
      console.error('Gemini response:', err.response.status, JSON.stringify(err.response.data));
    }

    if (err.response?.status === 400) {
      return res.status(403).json({ error: 'Invalid GEMINI_API_KEY. Check your .env file.' });
    }
    if (err.response?.status === 403) {
      return res.status(403).json({ error: 'Invalid GEMINI_API_KEY. Check your .env file.' });
    }
    if (err.response?.status === 429) {
      return res.status(429).json({ error: 'Gemini rate limit hit. Wait a moment and try again.' });
    }

    res.status(500).json({
      error: '⚠️ AI request failed: ' + (err.response?.data?.error?.message || err.message),
    });
  }
};

module.exports = { aiAssist };
