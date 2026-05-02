exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt, imageBase64, mimeType } = JSON.parse(event.body);
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Gemini API key not configured" })
      };
    }

    // Build content parts
    const parts = [];

    // Add image if provided
    if (imageBase64 && mimeType) {
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: imageBase64
        }
      });
    }

    // Add text prompt
    parts.push({ text: prompt });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1200
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || "Gemini API error" })
      };
    }

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
