import OpenAI from "openai";

export async function POST(req) {
    try {
        const { query } = await req.json();

        // ✅ If no API key, skip AI safely
        if (!process.env.OPENAI_API_KEY) {
            return Response.json(null);
        }

        const client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "Extract search intent, filters, and materials from contractor-style queries. Return JSON only.",
                },
                {
                    role: "user",
                    content: query,
                },
            ],
        });

        const text = completion.choices[0]?.message?.content;

        try {
            const parsed = JSON.parse(text);
            return Response.json(parsed);
        } catch {
            return Response.json(null);
        }
    } catch (err) {
        console.error("AI parse failed:", err);
        return Response.json(null);
    }
}