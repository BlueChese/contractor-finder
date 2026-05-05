import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const schema = {
    name: "contractor_parse",
    strict: true,
    schema: {
        type: "object",
        additionalProperties: false,
        properties: {
            originalText: { type: "string" },
            intent: {
                type: "string",
                enum: ["single_product", "project", "store_lookup", "unknown"],
            },
            category: {
                type: "string",
                enum: [
                    "Room / Remodel",
                    "Drywall",
                    "Lumber / Framing",
                    "Decking",
                    "Fence",
                    "Electrical",
                    "Plumbing",
                    "Flooring",
                    "Paint",
                    "Doors",
                    "Hardware",
                    "Concrete",
                    "Tile",
                    "Roofing",
                    "Insulation",
                    "Lighting",
                    "Auto Detect",
                ],
            },
            searchQuery: { type: "string" },
            starterSearch: { type: "string" },
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
            filters: {
                type: "object",
                additionalProperties: false,
                properties: {
                    color: { type: ["string", "null"] },
                    finish: { type: ["string", "null"] },
                    size: { type: ["string", "null"] },
                    material: { type: ["string", "null"] },
                    maxPrice: { type: ["number", "null"] },
                    minRating: { type: ["number", "null"] },
                    inStock: { type: "boolean" },
                    shippable: { type: "boolean" },
                    bulk: { type: "boolean" },
                    pickup: { type: "boolean" },
                },
                required: [
                    "color",
                    "finish",
                    "size",
                    "material",
                    "maxPrice",
                    "minRating",
                    "inStock",
                    "shippable",
                    "bulk",
                    "pickup",
                ],
            },
            suggestedMaterials: {
                type: "array",
                items: { type: "string" },
            },
            notes: { type: "string" },
        },
        required: [
            "originalText",
            "intent",
            "category",
            "searchQuery",
            "starterSearch",
            "dimensions",
            "filters",
            "suggestedMaterials",
            "notes",
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

        const { text } = await req.json();

        if (!text) {
            return Response.json({ error: "Missing text." }, { status: 400 });
        }

        const response = await client.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You parse contractor/construction searches into JSON. If the user describes a project like a room, deck, remodel, fence, or drywall job, return intent project and useful material suggestions.",
                },
                {
                    role: "user",
                    content: text,
                },
            ],
            response_format: {
                type: "json_schema",
                json_schema: schema,
            },
        });

        const content = response.choices?.[0]?.message?.content;

        if (!content) {
            return Response.json({ error: "No AI response content." }, { status: 500 });
        }

        return Response.json(JSON.parse(content));
    } catch (error) {
        console.error("AI parse route error:", error);
        return Response.json(
            { error: error.message || "AI parse failed." },
            { status: 500 }
        );
    }
}