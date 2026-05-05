import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const schema = {
    name: "contractor_project_estimate",
    strict: true,
    schema: {
        type: "object",
        additionalProperties: false,
        properties: {
            projectName: { type: "string" },
            category: { type: "string" },
            summary: { type: "string" },
            estimateLow: { type: "number" },
            estimateHigh: { type: "number" },
            dimensions: {
                type: "object",
                additionalProperties: false,
                properties: {
                    length: { type: ["number", "null"] },
                    width: { type: ["number", "null"] },
                    height: { type: ["number", "null"] },
                    unit: { type: "string" },
                    floorAreaSqFt: { type: ["number", "null"] },
                    wallAreaSqFt: { type: ["number", "null"] },
                },
                required: [
                    "length",
                    "width",
                    "height",
                    "unit",
                    "floorAreaSqFt",
                    "wallAreaSqFt",
                ],
            },
            materials: {
                type: "array",
                items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        name: { type: "string" },
                        quantity: { type: "number" },
                        unit: { type: "string" },
                        estimatedUnitCost: { type: "number" },
                        searchTerm: { type: "string" },
                        notes: { type: "string" },
                    },
                    required: [
                        "name",
                        "quantity",
                        "unit",
                        "estimatedUnitCost",
                        "searchTerm",
                        "notes",
                    ],
                },
            },
        },
        required: [
            "projectName",
            "category",
            "summary",
            "estimateLow",
            "estimateHigh",
            "dimensions",
            "materials",
        ],
    },
};

export async function POST(req) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return Response.json(
                { error: "Missing OPENAI_API_KEY in .env.local" },
                { status: 500 }
            );
        }

        const body = await req.json();

        const response = await client.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You are an estimating assistant for general contractors. Create practical material estimates. Use rough but realistic quantities. Do not include labor. Return only JSON.",
                },
                {
                    role: "user",
                    content: `
Project: ${body.projectName}
Category: ${body.category}
Color preference: ${body.color || ""}
Finish preference: ${body.finish || ""}
Material preference: ${body.material || ""}

Create a contractor material estimate with quantities, search terms, and rough material cost range.
          `,
                },
            ],
            response_format: {
                type: "json_schema",
                json_schema: schema,
            },
        });

        const content = response.choices?.[0]?.message?.content;

        if (!content) {
            return Response.json({ error: "No AI estimate content." }, { status: 500 });
        }

        return Response.json(JSON.parse(content));
    } catch (error) {
        console.error("AI estimate route error:", error);
        return Response.json(
            { error: error.message || "AI estimate failed." },
            { status: 500 }
        );
    }
}