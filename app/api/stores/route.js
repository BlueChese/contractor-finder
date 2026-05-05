export async function GET(req) {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("q") || "hardware store";
    const zip = searchParams.get("zip") || "68154";

    const apiKey = process.env.GOOGLE_MAPS_KEY;

    if (!apiKey) {
        return Response.json(
            { error: "Missing GOOGLE_MAPS_KEY in .env.local" },
            { status: 500 }
        );
    }

    const url = "https://places.googleapis.com/v1/places:searchText";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask":
                    "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.regularOpeningHours,places.websiteUri",
            },
            body: JSON.stringify({
                textQuery: `${query} near ${zip}`,
                maxResultCount: 8,
            }),
        });

        const data = await response.json();

        const stores = (data.places || []).map((place) => ({
            id: place.id,
            name: place.displayName?.text || "Unknown store",
            address: place.formattedAddress || "No address listed",
            phone: place.nationalPhoneNumber || "No phone listed",
            rating: place.rating || "N/A",
            reviews: place.userRatingCount || 0,
            website: place.websiteUri || "#",
            hours:
                place.regularOpeningHours?.weekdayDescriptions || [
                    "Hours not listed",
                ],
        }));

        return Response.json(stores);
    } catch (error) {
        return Response.json(
            { error: "Failed to fetch store data" },
            { status: 500 }
        );
    }
}