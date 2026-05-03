exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt, imageBase64, mimeType } = JSON.parse(event.body);

    const API_KEY = process.env.GROQ_API_KEY;

    if (!API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "GROQ_API_KEY is not set in Netlify environment variables."
        })
      };
    }

    if (!imageBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No image provided." })
      };
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "system",
            content: "You are AgriSmart, an expert agricultural AI for Pakistani farmers. Analyze crop images to diagnose diseases, pests, and deficiencies. Prioritize organic solutions. Respond in both English and Urdu. No markdown — use CAPITAL LETTERS for headings and numbered lists."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt || "Analyze this crop image and diagnose any diseases, pests, or deficiencies."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 1024
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || "Groq Vision API error" })
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
