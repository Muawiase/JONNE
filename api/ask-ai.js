// Vercel Serverless Function – /api/ask-ai.js
// Securely proxies OpenRouter API calls with automatic model fallback.

const FREE_MODELS = [
  "deepseek/deepseek-r1:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "inclusionai/ling-3.0-flash:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "openrouter/free",
];

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is not set in environment variables.");
    return res.status(500).json({ error: "Server configuration error: API key missing." });
  }

  const { question, history } = req.body || {};

  // Validate input
  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return res.status(400).json({ error: "Please provide a valid question." });
  }
  if (question.trim().length > 4000) {
    return res.status(400).json({ error: "Question is too long. Please keep it under 4000 characters." });
  }

  const systemInstruction = `You are an academic tutor helping university students.
Provide accurate, educational, and easy-to-understand answers.

If the question is programming:
- explain the concept
- include code examples when appropriate

If the question is mathematics:
- solve it step by step

If the question is science:
- explain clearly with examples

Keep answers concise, helpful, and suitable for university students.`;

  const messages = [
    { role: "system", content: systemInstruction },
  ];

  // Add prior turns if provided
  if (Array.isArray(history)) {
    for (const turn of history) {
      if (turn.role === "user" || turn.role === "assistant" || turn.role === "model") {
        messages.push({
          role: turn.role === "user" ? "user" : "assistant",
          content: turn.text || turn.content || "",
        });
      }
    }
  }

  // Add current user question
  messages.push({
    role: "user",
    content: question.trim(),
  });

  let lastError = null;

  for (const model of FREE_MODELS) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data?.error?.message || `OpenRouter API error (status ${response.status})`;
        lastError = errMsg;
        console.warn(`OpenRouter serverless model ${model} failed:`, errMsg);
        continue;
      }

      const text = data?.choices?.[0]?.message?.content;
      if (!text) {
        lastError = `No response generated from model ${model}.`;
        continue;
      }

      return res.status(200).json({ answer: text, modelUsed: model });
    } catch (err) {
      console.error(`Error calling model ${model}:`, err);
      lastError = err.message;
    }
  }

  return res.status(500).json({ error: lastError || "Failed to reach any free AI service. Please check your connection and try again." });
}
