import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const SYSTEM_PROMPT = `You are an expert curator of inspirational wisdom with deep knowledge of philosophy, literature, science, and human achievement. Your task is to generate a diverse collection of genuinely inspiring quotes.

Rules:
- Each quote must be real and accurately attributed (do not fabricate quotes)
- Vary the categories: philosophy, science, literature, leadership, creativity, resilience, etc.
- Vary the time periods and cultural backgrounds of authors
- Make each quote genuinely thought-provoking and uplifting
- Return ONLY a valid JSON array — no markdown, no code fences, no extra text

Each object in the array must have exactly these fields:
  "text"     — the quote text (without surrounding quotation marks)
  "author"   — the person's name as commonly known
  "category" — one of: Philosophy, Science, Literature, Leadership, Creativity, Resilience, Mindfulness, Success, Humanity, Nature
  "era"      — one of: ancient, medieval, renaissance, enlightenment, victorian, modern, contemporary
  "culture"  — one of: greek, roman, european, american, eastasian, southasian, middleeastern, african, latinamerican

Choose era and culture to accurately reflect the author's historical period and background.`;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/quotes", async (req, res) => {
  try {
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content:
            "Generate exactly 10 unique inspirational quotes from diverse thinkers across history. Return only the JSON array.",
        },
      ],
    });

    // Find the text block (thinking blocks may appear first)
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock) throw new Error("No text block in response");

    const quotes = JSON.parse(textBlock.text);
    if (!Array.isArray(quotes) || quotes.length === 0) {
      throw new Error("Response did not contain a valid quotes array");
    }

    res.json(quotes);
  } catch (err) {
    console.error("Error generating quotes:", err);
    res.status(500).json({ error: "Failed to generate quotes. Please try again." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Daily Wisdom server running → http://localhost:${PORT}`);
});
