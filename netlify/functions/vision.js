exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt, imageBase64, mimeType } = JSON.parse(event.body);
    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

    // Build message content
    const messageContent = [];

    // Add image if provided
    if (imageBase64 && mimeType) {
      messageContent.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${imageBase64}`
        }
      });
    }

    // Add text prompt
    messageContent.push({ type: "text", text: prompt });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "HTTP-Referer": "https://agrismart-pk.netlify.app",
        "X-Title": "AgriSmart"
      },
      body: JSON.stringify({
        model: "google/gemma-4-26b-a4b-it:free",
        messages: [{ role: "user", content: messageContent }],
        temperature: 0.7,
        max_tokens: 1200
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || "Vision API error" })
      };
    }

    const result = data.choices?.[0]?.message?.content || "No response.";

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
