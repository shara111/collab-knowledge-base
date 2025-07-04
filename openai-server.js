// gemini-server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in environment variables.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.get("/", (req, res) => {
  res.send("🚀 Gemini API server running on http://localhost:5001");
});

app.post("/summarize", async (req, res) => {
  try {
    const { content } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Read the following content and respond in JSON format like this:
{
  "summary": "...",
  "action_items": ["...", "..."]
}

Content:
${content}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    // Try to parse JSON
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      // If Gemini wraps it in markdown or adds "```json"
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Gemini did not return valid JSON.");
      }
    }

    const summary = parsed.summary || "⚠️ No summary found.";
    const actions = parsed.action_items || [];

    res.json({ summary, actions });

  } catch (error) {
    console.error("❌ Gemini API error:", error);
    res.status(500).json({ error: "Failed to generate summary or extract actions." });
  }
});


app.listen(5001, () => {
  console.log("🚀 Gemini API server running on http://localhost:5001");
});
