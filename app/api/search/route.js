export async function GET(req) {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("q") || "";
    const zip = searchParams.get("zip") || "68154";

    if (!query) {
        return Response.json([]);
    }

    const apiKey = process.env.SERPAPI_KEY;

    if (!apiKey) {
        return Response.json(
            { error: "Missing SERPAPI_KEY in .env.local" },
            { status: 500 }
        );
    }

    const url = new URL("https://serpapi.com/search.json");

    url.searchParams.set("engine", "google_shopping");
    url.searchParams.set("q", query);
    url.searchParams.set("location", zip);
    url.searchParams.set("api_key", apiKey);

    try {
        const response = await fetch(url);
        const data = await response.json();

        const products = (data.shopping_results || []).map((item, index) => ({
            id: item.product_id || index + 1,
            name: item.title || "Unknown product",
            store: item.source || "Unknown store",
            price: item.extracted_price || 0,
            rating: item.rating || 0,
            reviews: item.reviews || 0,

            // Best link available to open the actual product/store page
            link: item.product_link || item.link || item.serpapi_product_api || "#",

            image: item.thumbnail || "",
            delivery: item.delivery || "Check store",
        }));

        return Response.json(products);
    } catch (error) {
        return Response.json(
            { error: "Failed to fetch product data" },
            { status: 500 }
        );
    }
}