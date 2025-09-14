export default async function handler(req, res) {
  // ✅ CORS setup
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const question = req.body?.question?.toString().trim();
    if (!question) {
      return res.status(400).json({ error: "Missing 'question' in body." });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY not set on server." });
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a brutally honest life coach. Keep answers short, blunt, and practical." },
          { role: "user", content: question }
        ],
        max_tokens: 220,
        temperature: 0.4
      })
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || "Upstream error" });
    }

    const answer = data?.choices?.[0]?.message?.content || null;
    if (!answer) {
      return res.status(502).json({ error: "No answer from model." });
    }

    return res.status(200).json({ answer });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
