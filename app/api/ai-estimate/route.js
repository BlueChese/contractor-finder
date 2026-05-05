import OpenAI from "openai";

export async function POST(req) {
    try {
        const { projectName, category } = await req.json();

        // ✅ Skip AI if no key
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
                        "Estimate contractor project materials and costs. Return JSON with estimateLow, estimateHigh, and materials array.",
                },
                {
                    role: "user",
                    content: `${projectName} (${category})`,
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
        console.error("AI estimate failed:", err);
        return Response.json(null);
    }
}