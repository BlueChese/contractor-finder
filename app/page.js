"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

const categories = [
    "Auto Detect",
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
];

const searchSuggestions = [
    "10x12x9 room",
    "bathroom remodel",
    "shippable matte black railing",
    "black door knob",
    "cheap black railing under 200",
    "bulk 2x4x8 lumber in stock",
    "pickup white outlet cover",
];

const materialBreakdowns = {
    "Room / Remodel": [
        "drywall sheets",
        "drywall screws",
        "joint compound",
        "drywall tape",
        "paint primer",
        "interior paint",
        "baseboard trim",
        "flooring",
        "electrical outlet",
        "light fixture",
    ],
    Drywall: [
        "drywall sheets",
        "drywall screws",
        "joint compound",
        "drywall tape",
        "corner bead",
        "sanding sponge",
    ],
    Decking: [
        "deck boards",
        "pressure treated 2x6 joists",
        "4x4 posts",
        "deck screws",
        "joist hangers",
        "concrete mix",
        "deck railing",
        "post caps",
    ],
    Fence: [
        "4x4 fence posts",
        "2x4 rails",
        "fence pickets",
        "concrete mix",
        "deck screws",
        "gate hinges",
        "gate latch",
    ],
    Electrical: [
        "electrical outlet",
        "wall plate",
        "electrical box",
        "12/2 wire",
        "wire nuts",
        "breaker",
    ],
    Plumbing: [
        "pex pipe",
        "pvc pipe",
        "pipe fittings",
        "shut off valve",
        "plumber tape",
        "faucet supply line",
    ],
    Flooring: [
        "flooring planks",
        "underlayment",
        "transition strips",
        "flooring spacers",
        "construction adhesive",
    ],
    Paint: [
        "interior paint",
        "paint primer",
        "paint roller",
        "paint tray",
        "paint brush",
        "painter tape",
    ],
    Doors: [
        "interior door knob",
        "strike plate",
        "door latch",
        "door hinges",
        "wood screws",
    ],
    "Lumber / Framing": [
        "2x4x8 lumber",
        "2x6 lumber",
        "4x4 post",
        "framing nails",
        "joist hangers",
        "construction screws",
    ],
};

function detectCategory(text) {
    const lower = text.toLowerCase();

    if (lower.match(/\d+\s*x\s*\d+\s*x\s*\d+/) || lower.includes("room"))
        return "Room / Remodel";
    if (lower.includes("drywall") || lower.includes("sheetrock"))
        return "Drywall";
    if (
        lower.includes("2x4") ||
        lower.includes("2x6") ||
        lower.includes("4x4") ||
        lower.includes("stud") ||
        lower.includes("joist") ||
        lower.includes("framing")
    )
        return "Lumber / Framing";
    if (lower.includes("deck")) return "Decking";
    if (lower.includes("fence") || lower.includes("gate")) return "Fence";
    if (
        lower.includes("outlet") ||
        lower.includes("breaker") ||
        lower.includes("wire") ||
        lower.includes("electrical")
    )
        return "Electrical";
    if (
        lower.includes("pipe") ||
        lower.includes("faucet") ||
        lower.includes("plumbing") ||
        lower.includes("valve")
    )
        return "Plumbing";
    if (lower.includes("floor") || lower.includes("underlayment"))
        return "Flooring";
    if (lower.includes("paint") || lower.includes("primer")) return "Paint";
    if (lower.includes("door") || lower.includes("knob")) return "Doors";
    if (lower.includes("concrete") || lower.includes("cement"))
        return "Concrete";
    if (lower.includes("tile") || lower.includes("grout")) return "Tile";
    if (lower.includes("roof") || lower.includes("shingle")) return "Roofing";
    if (lower.includes("insulation")) return "Insulation";
    if (lower.includes("light") || lower.includes("fixture")) return "Lighting";
    if (
        lower.includes("hinge") ||
        lower.includes("screw") ||
        lower.includes("bolt")
    )
        return "Hardware";

    return "Auto Detect";
}

function getProjectTemplate(text, type) {
    const detected = type === "Auto Detect" ? detectCategory(text) : type;

    const items = materialBreakdowns[detected] || [
        "lumber",
        "fasteners",
        "hardware",
        "finish material",
        "job supplies",
    ];

    const ranges = {
        "Room / Remodel": [1200, 4500],
        Drywall: [300, 1200],
        "Lumber / Framing": [300, 2500],
        Decking: [900, 2500],
        Fence: [700, 2200],
        Electrical: [150, 900],
        Plumbing: [150, 1200],
        Flooring: [600, 3000],
        Paint: [150, 800],
        Doors: [80, 600],
        Hardware: [50, 400],
        Concrete: [100, 1200],
        Tile: [400, 2500],
        Roofing: [800, 5000],
        Insulation: [300, 2000],
        Lighting: [100, 1000],
    };

    const [low, high] = ranges[detected] || [200, 1000];

    return {
        low,
        high,
        items,
        detected,
    };
}

function getMaterialBreakdown(search, category) {
    const detected =
        category === "Auto Detect" ? detectCategory(search) : category;

    if (materialBreakdowns[detected]) {
        return {
            category: detected,
            items: materialBreakdowns[detected],
            starterSearch: materialBreakdowns[detected][0],
            isProjectSearch: [
                "Room / Remodel",
                "Drywall",
                "Decking",
                "Fence",
                "Electrical",
                "Plumbing",
                "Flooring",
                "Paint",
                "Lumber / Framing",
            ].includes(detected),
        };
    }

    return {
        category: detected,
        items: [],
        starterSearch: search,
        isProjectSearch: false,
    };
}

function buildSmartSearchQuery(search, category, filters) {
    const breakdown = getMaterialBreakdown(search, category);
    let query = breakdown.isProjectSearch ? breakdown.starterSearch : search;

    if (filters.colorFilter) query += ` ${filters.colorFilter}`;
    if (filters.finishFilter) query += ` ${filters.finishFilter}`;
    if (filters.sizeFilter && !filters.sizeFilter.includes("sq ft")) {
        query += ` ${filters.sizeFilter}`;
    }
    if (filters.materialFilter) query += ` ${filters.materialFilter}`;
    if (filters.categorySpecificFilter) {
        query += ` ${filters.categorySpecificFilter}`;
    }

    return query.trim();
}

function makeLocalProject() {
    return {
        id: `local-${Date.now()}`,
        name: "Default Project",
        type: "general",
        estimateLow: 200,
        estimateHigh: 1000,
        suggestedItems: ["lumber", "fasteners", "hardware", "job supplies"],
        items: [],
    };
}

export default function Home() {
    const [activePage, setActivePage] = useState("home");

    const [loggedIn, setLoggedIn] = useState(false);
    const [user, setUser] = useState(null);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [authMode, setAuthMode] = useState("login");
    const [authError, setAuthError] = useState("");
    const [saveStatus, setSaveStatus] = useState("");

    const [suggestionName, setSuggestionName] = useState("");
    const [suggestionEmail, setSuggestionEmail] = useState("");
    const [suggestionMessage, setSuggestionMessage] = useState("");
    const [suggestionStatus, setSuggestionStatus] = useState("");

    const [search, setSearch] = useState("");
    const [zip, setZip] = useState("68154");
    const [category, setCategory] = useState("Auto Detect");
    const [results, setResults] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [materialHelper, setMaterialHelper] = useState(null);

    const [homeCards, setHomeCards] = useState([
        { id: "overview", type: "overview", title: "Overview" },
        { id: "activeProject", type: "activeProject", title: "Active Project" },
        { id: "quickSearch", type: "quickSearch", title: "Quick Search" },
    ]);

    const [trackedItems, setTrackedItems] = useState([]);

    const [projectName, setProjectName] = useState("");
    const [projectType, setProjectType] = useState("Auto Detect");
    const [projectFilterCategory, setProjectFilterCategory] =
        useState("Auto Detect");
    const [projectColorFilter, setProjectColorFilter] = useState("");
    const [projectFinishFilter, setProjectFinishFilter] = useState("");
    const [projectMaterialFilter, setProjectMaterialFilter] = useState("");

    const [projects, setProjects] = useState([makeLocalProject()]);
    const [activeProjectId, setActiveProjectId] = useState(projects[0].id);

    const [maxPrice, setMaxPrice] = useState("");
    const [minRating, setMinRating] = useState("0");
    const [sortBy, setSortBy] = useState("relevance");
    const [colorFilter, setColorFilter] = useState("");
    const [finishFilter, setFinishFilter] = useState("");
    const [sizeFilter, setSizeFilter] = useState("");
    const [storeFilter, setStoreFilter] = useState("");
    const [materialFilter, setMaterialFilter] = useState("");
    const [categorySpecificFilter, setCategorySpecificFilter] = useState("");
    const [inStockOnly, setInStockOnly] = useState(false);
    const [shippableOnly, setShippableOnly] = useState(false);
    const [bulkOnly, setBulkOnly] = useState(false);
    const [pickupOnly, setPickupOnly] = useState(false);

    const activeProject = projects.find((p) => p.id === activeProjectId);
    const savedItems = activeProject?.items || [];

    const activeCategory =
        category === "Auto Detect" ? detectCategory(search) : category;

    const ghostSuggestion =
        search.length > 0
            ? searchSuggestions.find((s) =>
                s.toLowerCase().startsWith(search.toLowerCase())
            )
            : "";
    useEffect(() => {
        async function getUser() {
            const { data } = await supabase.auth.getUser();

            if (data?.user) {
                setUser(data.user);
                setLoggedIn(true);
                await loadProjects(data.user.id);
            }
        }

        getUser();
    }, []);

    async function handleAuth() {
        setAuthError("");

        if (!email || !password) {
            setAuthError("Enter an email and password.");
            return;
        }

        if (authMode === "signup") {
            const { data, error } = await supabase.auth.signUp({ email, password });

            if (error) {
                setAuthError(error.message);
                return;
            }

            if (data?.user) {
                setUser(data.user);
                setLoggedIn(true);
                await loadProjects(data.user.id);
            }
        } else {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setAuthError(error.message);
                return;
            }

            setUser(data.user);
            setLoggedIn(true);
            await loadProjects(data.user.id);
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        setUser(null);
        setLoggedIn(false);
        setProjects([makeLocalProject()]);
        setSaveStatus("");
    }

    async function loadProjects(userId) {
        const { data, error } = await supabase
            .from("projects")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Load projects error:", error);
            return;
        }

        if (data && data.length > 0) {
            const loadedProjects = data.map((project) => ({
                id: project.id,
                name: project.name,
                type: project.type,
                estimateLow: project.estimate_low,
                estimateHigh: project.estimate_high,
                suggestedItems: project.suggested_items || [],
                items: project.items || [],
            }));

            setProjects(loadedProjects);
            setActiveProjectId(loadedProjects[0].id);
        } else {
            const local = makeLocalProject();
            setProjects([local]);
            setActiveProjectId(local.id);
        }
    }

    async function saveProjectToDatabase(project) {
        if (!user || !project) {
            setSaveStatus("Not logged in.");
            return;
        }

        setSaveStatus("Saving...");

        const payload = {
            user_id: user.id,
            name: project.name,
            type: project.type,
            estimate_low: project.estimateLow,
            estimate_high: project.estimateHigh,
            suggested_items: project.suggestedItems,
            items: project.items,
        };

        if (!String(project.id).startsWith("local")) {
            payload.id = project.id;
        }

        const { data, error } = await supabase
            .from("projects")
            .upsert(payload)
            .select()
            .single();

        if (error) {
            console.error("Save project error:", error);
            setSaveStatus("Save failed.");
            return;
        }

        if (data) {
            setProjects((currentProjects) =>
                currentProjects.map((p) =>
                    p.id === project.id ? { ...p, id: data.id } : p
                )
            );

            setActiveProjectId(data.id);
            setSaveStatus("Saved.");
        }
    }

    async function deleteProjectFromDatabase(projectId) {
        if (!user || String(projectId).startsWith("local")) return;

        const { error } = await supabase
            .from("projects")
            .delete()
            .eq("id", projectId)
            .eq("user_id", user.id);

        if (error) {
            console.error("Delete project error:", error);
            alert("Could not delete project.");
        }
    }

    async function sendSuggestion() {
        setSuggestionStatus("");

        if (!suggestionMessage.trim()) {
            setSuggestionStatus("Please type a suggestion first.");
            return;
        }

        setSuggestionStatus("Sending...");

        const res = await fetch("/api/suggestions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: suggestionName,
                email: suggestionEmail,
                message: suggestionMessage,
            }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
            setSuggestionStatus("Could not send suggestion.");
            return;
        }

        setSuggestionName("");
        setSuggestionEmail("");
        setSuggestionMessage("");
        setSuggestionStatus("Suggestion sent. Thank you!");
    }

    function addSuggestedMaterialsToProject(project = activeProject) {
        if (!project) return;

        const breakdown = getMaterialBreakdown(project.name, project.type);
        const materials =
            breakdown.items.length > 0
                ? breakdown.items
                : getProjectTemplate(project.name, project.type).items;

        const suggestedItems = materials.map((material, index) => ({
            id: `suggested-${Date.now()}-${index}`,
            name: material,
            store: "Suggested Material",
            price: 0,
            rating: 0,
            reviews: 0,
            link: "#",
            image: "",
            delivery: "Suggested project material",
            quantity: 1,
            unit: "",
            searchTerm: material,
        }));

        const updatedProjects = projects.map((p) => {
            if (p.id !== project.id) return p;

            return {
                ...p,
                suggestedItems: materials,
                items: suggestedItems,
            };
        });

        setProjects(updatedProjects);
        setSaveStatus("Suggested materials added. Click Save Project.");
    }

    function addCardToHome(card) {
        const exists = homeCards.find((c) => c.id === card.id);
        if (!exists) setHomeCards([...homeCards, card]);
    }

    function removeHomeCard(id) {
        setHomeCards(homeCards.filter((card) => card.id !== id));
    }

    function moveHomeCard(id, direction) {
        const index = homeCards.findIndex((card) => card.id === id);
        if (index === -1) return;

        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= homeCards.length) return;

        const copy = [...homeCards];
        const temp = copy[index];
        copy[index] = copy[newIndex];
        copy[newIndex] = temp;
        setHomeCards(copy);
    }

    function addTrackedItem(product) {
        const exists = trackedItems.find((item) => item.id === product.id);
        if (exists) return;

        setTrackedItems([
            ...trackedItems,
            {
                ...product,
                startPrice: product.price || 0,
                targetPrice: product.price ? Math.max(product.price - 10, 1) : "",
                dateAdded: new Date().toLocaleDateString(),
            },
        ]);
    }

    function removeTrackedItem(id) {
        setTrackedItems(trackedItems.filter((item) => item.id !== id));
    }

    function acceptGhostSuggestion() {
        if (ghostSuggestion) setSearch(ghostSuggestion);
    }

    async function createProject() {
        if (!projectName.trim()) return;

        const finalType =
            projectType === "Auto Detect" ? detectCategory(projectName) : projectType;

        const template = getProjectTemplate(projectName, finalType);

        let suggestedItems = template.items;

        if (projectColorFilter || projectFinishFilter || projectMaterialFilter) {
            suggestedItems = suggestedItems.map((item) =>
                `${projectColorFilter} ${projectFinishFilter} ${projectMaterialFilter} ${item}`
                    .replace(/\s+/g, " ")
                    .trim()
            );
        }

        const newProject = {
            id: `local-${Date.now()}`,
            name: projectName,
            type: finalType,
            estimateLow: template.low,
            estimateHigh: template.high,
            suggestedItems,
            items: [],
        };

        setProjects([...projects, newProject]);
        setActiveProjectId(newProject.id);
        setProjectName("");
        setSaveStatus("Project created. Click Save Project.");
        setActivePage("projects");
    }

    async function deleteProject(id) {
        if (projects.length === 1) return;

        await deleteProjectFromDatabase(id);

        const remaining = projects.filter((p) => p.id !== id);
        setProjects(remaining);
        setActiveProjectId(remaining[0].id);
        setSaveStatus("Project deleted.");
    }

    function updateActiveProjectItems(updater) {
        const updatedProjects = projects.map((project) => {
            if (project.id !== activeProjectId) return project;

            return {
                ...project,
                items: updater(project.items),
            };
        });

        setProjects(updatedProjects);
        setSaveStatus("Unsaved changes.");
    }

    function saveItem(product) {
        updateActiveProjectItems((items) => {
            const existingItem = items.find((item) => item.id === product.id);

            if (existingItem) {
                return items.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [...items, { ...product, quantity: 1 }];
        });
    }

    function increaseQuantity(id) {
        updateActiveProjectItems((items) =>
            items.map((item) =>
                item.id === id ? { ...item, quantity: item.quantity + 1 } : item
            )
        );
    }

    function decreaseQuantity(id) {
        updateActiveProjectItems((items) =>
            items.map((item) =>
                item.id === id
                    ? { ...item, quantity: Math.max(1, item.quantity - 1) }
                    : item
            )
        );
    }

    function removeItem(id) {
        updateActiveProjectItems((items) => items.filter((item) => item.id !== id));
    }
    function autoFillFiltersFromSearch(text) {
        const lowerText = text.toLowerCase();

        const detected = detectCategory(text);
        if (detected !== "Auto Detect") setCategory(detected);

        const colors = [
            "black",
            "white",
            "brown",
            "gray",
            "grey",
            "silver",
            "gold",
            "bronze",
            "brass",
            "nickel",
            "chrome",
            "red",
            "blue",
            "green",
        ];

        const finishes = [
            "matte",
            "brushed",
            "polished",
            "satin",
            "oil rubbed",
            "painted",
            "unfinished",
            "stained",
            "galvanized",
            "powder coated",
        ];

        const sizes = [
            "2x4",
            "2x4x8",
            "2x6",
            "2x6x8",
            "4x4",
            "4x4x8",
            "6 ft",
            "8 ft",
            "10 ft",
            "12 ft",
            "standard",
        ];

        const foundColor = colors.find((c) => lowerText.includes(c));
        const foundFinish = finishes.find((f) => lowerText.includes(f));
        const foundSize = sizes.find((s) => lowerText.includes(s));

        if (foundColor) setColorFilter(foundColor);
        if (foundFinish) setFinishFilter(foundFinish);
        if (foundSize) setSizeFilter(foundSize);

        const roomMatch = lowerText.match(/(\d+)\s*x\s*(\d+)\s*x\s*(\d+)/);

        if (roomMatch && detected === "Room / Remodel") {
            const length = Number(roomMatch[1]);
            const width = Number(roomMatch[2]);
            const height = Number(roomMatch[3]);

            const floorArea = length * width;
            const wallArea = 2 * (length + width) * height;

            setSizeFilter(
                `${floorArea} sq ft floor / ${wallArea} sq ft walls`
            );
        }

        const underMatch = lowerText.match(/under\s*\$?(\d+)/);
        if (underMatch) setMaxPrice(underMatch[1]);

        const ratingMatch = lowerText.match(/(\d)\s*star/);
        if (ratingMatch) setMinRating(ratingMatch[1]);

        if (lowerText.includes("cheap")) setSortBy("priceLow");
        if (lowerText.includes("expensive")) setSortBy("priceHigh");
        if (lowerText.includes("in stock")) setInStockOnly(true);
        if (lowerText.includes("bulk")) setBulkOnly(true);
        if (lowerText.includes("pickup")) setPickupOnly(true);

        if (
            lowerText.includes("ship") ||
            lowerText.includes("delivery") ||
            lowerText.includes("shippable")
        ) {
            setShippableOnly(true);
        }
    }

    async function searchProducts() {
        if (!search) return;

        setLoading(true);

        autoFillFiltersFromSearch(search);

        const helper = getMaterialBreakdown(search, category);
        setMaterialHelper(helper);

        const finalSearchQuery = buildSmartSearchQuery(search, category, {
            colorFilter,
            finishFilter,
            sizeFilter,
            materialFilter,
            categorySpecificFilter,
        });

        try {
            const productRes = await fetch(
                `/api/search?q=${encodeURIComponent(
                    finalSearchQuery
                )}&zip=${encodeURIComponent(zip)}`
            );

            const productData = await productRes.json();

            let storeData = [];

            try {
                const storeRes = await fetch(
                    `/api/stores?q=${encodeURIComponent(
                        finalSearchQuery
                    )}&zip=${encodeURIComponent(zip)}`
                );

                storeData = await storeRes.json();
            } catch (storeError) {
                console.error("Store fetch failed:", storeError);
            }

            setResults(productData || []);
            setStores(storeData || []);
            setLoading(false);
            setActivePage("search");
        } catch (err) {
            console.error("Search failed:", err);
            setLoading(false);
        }
    }

    async function searchMaterial(material) {
        setSearch(material);
        setMaterialHelper(getMaterialBreakdown(material, category));
        setLoading(true);

        try {
            const productRes = await fetch(
                `/api/search?q=${encodeURIComponent(
                    material
                )}&zip=${encodeURIComponent(zip)}`
            );

            const productData = await productRes.json();

            setResults(productData || []);
            setLoading(false);
            setActivePage("search");
        } catch (err) {
            console.error("Material search failed:", err);
            setLoading(false);
        }
    }

    function clearFilters() {
        setMaxPrice("");
        setMinRating("0");
        setSortBy("relevance");
        setColorFilter("");
        setFinishFilter("");
        setSizeFilter("");
        setStoreFilter("");
        setMaterialFilter("");
        setCategorySpecificFilter("");
        setInStockOnly(false);
        setShippableOnly(false);
        setBulkOnly(false);
        setPickupOnly(false);
        setCategory("Auto Detect");
    }

    const filteredResults = results
        .filter((product) => {
            const text = `${product.name} ${product.store} ${product.delivery || ""
                }`.toLowerCase();

            const priceOk = maxPrice
                ? product.price && product.price <= Number(maxPrice)
                : true;

            const ratingOk =
                Number(product.rating || 0) >= Number(minRating);

            const colorOk = colorFilter
                ? text.includes(colorFilter.toLowerCase())
                : true;

            const finishOk = finishFilter
                ? text.includes(finishFilter.toLowerCase())
                : true;

            const materialOk = materialFilter
                ? text.includes(materialFilter.toLowerCase())
                : true;

            const categorySpecificOk = categorySpecificFilter
                ? text.includes(categorySpecificFilter.toLowerCase())
                : true;

            const storeOk = storeFilter
                ? product.store
                    .toLowerCase()
                    .includes(storeFilter.toLowerCase())
                : true;

            const inStockOk = inStockOnly
                ? text.includes("in stock") ||
                text.includes("available")
                : true;

            const shippableOk = shippableOnly
                ? text.includes("shipping") ||
                text.includes("delivery") ||
                text.includes("ship")
                : true;

            const bulkOk = bulkOnly
                ? text.includes("bulk") ||
                text.includes("pallet") ||
                text.includes("case")
                : true;

            const pickupOk = pickupOnly
                ? text.includes("pickup") ||
                text.includes("store pickup")
                : true;

            return (
                priceOk &&
                ratingOk &&
                colorOk &&
                finishOk &&
                materialOk &&
                categorySpecificOk &&
                storeOk &&
                inStockOk &&
                shippableOk &&
                bulkOk &&
                pickupOk
            );
        })
        .sort((a, b) => {
            if (sortBy === "priceLow")
                return (a.price || 0) - (b.price || 0);

            if (sortBy === "priceHigh")
                return (b.price || 0) - (a.price || 0);

            if (sortBy === "ratingHigh")
                return (b.rating || 0) - (a.rating || 0);

            return 0;
        });

    const savedTotal = savedItems.reduce(
        (total, item) =>
            total + Number(item.price || 0) * item.quantity,
        0
    );

    const savedCount = savedItems.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const allProjectsTotal = projects.reduce((total, project) => {
        const projectTotal = project.items.reduce(
            (sum, item) =>
                sum + Number(item.price || 0) * item.quantity,
            0
        );

        return total + projectTotal;
    }, 0);

    if (!loggedIn) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-6">
                <div className="bg-neutral-900 p-8 rounded-2xl w-full max-w-md shadow-xl">
                    <h1 className="text-3xl font-bold mb-2">
                        ContractorFind
                    </h1>

                    <p className="text-neutral-400 mb-6">
                        {authMode === "login"
                            ? "Log in to your contractor workspace."
                            : "Create your contractor account."}
                    </p>

                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 bg-neutral-800 mb-3 rounded-xl outline-none"
                        placeholder="Email"
                    />

                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 bg-neutral-800 mb-4 rounded-xl outline-none"
                        type="password"
                        placeholder="Password"
                    />

                    {authError && (
                        <p className="text-red-400 text-sm mb-3">
                            {authError}
                        </p>
                    )}

                    <button
                        onClick={handleAuth}
                        className="w-full bg-orange-500 hover:bg-orange-600 p-3 rounded-xl font-bold"
                    >
                        {authMode === "login" ? "Login" : "Sign Up"}
                    </button>

                    <button
                        onClick={() =>
                            setAuthMode(
                                authMode === "login" ? "signup" : "login"
                            )
                        }
                        className="w-full mt-3 text-neutral-400 hover:text-white text-sm"
                    >
                        {authMode === "login"
                            ? "Need an account? Sign up"
                            : "Already have an account? Login"}
                    </button>
                </div>
            </main>
        );
    }
    function NavButton({ page, label }) {
        return (
            <button
                onClick={() => setActivePage(page)}
                className={`px-4 py-2 rounded-xl ${activePage === page ? "bg-orange-500" : "bg-neutral-800"
                    }`}
            >
                {label}
            </button>
        );
    }

    function ProjectCart() {
        return (
            <div className="bg-neutral-900 p-4 rounded-2xl">
                <h2 className="text-xl font-bold mb-1">{activeProject?.name}</h2>

                <p className="text-sm text-neutral-400 mb-2">Items: {savedCount}</p>

                <p className="text-orange-400 font-bold mb-3">
                    Total: ${savedTotal.toFixed(2)}
                </p>

                <button
                    onClick={() => saveProjectToDatabase(activeProject)}
                    className="w-full bg-orange-500 hover:bg-orange-600 p-2 rounded-xl font-bold mb-2"
                >
                    Save Project
                </button>

                {saveStatus && (
                    <p className="text-xs text-neutral-400 mb-3">{saveStatus}</p>
                )}

                {savedItems.length === 0 && (
                    <p className="text-neutral-400">No items saved yet.</p>
                )}

                {savedItems.map((item) => (
                    <div key={item.id} className="border-b border-neutral-700 py-3">
                        <p className="font-bold text-sm">{item.name}</p>

                        <p className="text-xs text-neutral-400">
                            {item.store} - ${item.price || "N/A"}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                            <button
                                onClick={() => decreaseQuantity(item.id)}
                                className="bg-neutral-700 px-2 rounded"
                            >
                                -
                            </button>

                            <span className="text-sm">
                                Qty: {item.quantity} {item.unit || ""}
                            </span>

                            <button
                                onClick={() => increaseQuantity(item.id)}
                                className="bg-neutral-700 px-2 rounded"
                            >
                                +
                            </button>

                            <button
                                onClick={() => removeItem(item.id)}
                                className="ml-auto bg-red-600 px-2 py-1 rounded text-xs"
                            >
                                X
                            </button>
                        </div>

                        {item.searchTerm && (
                            <button
                                onClick={() => searchMaterial(item.searchTerm)}
                                className="mt-2 bg-neutral-700 hover:bg-neutral-600 px-2 py-1 rounded text-xs"
                            >
                                Search Item
                            </button>
                        )}

                        <p className="text-xs text-neutral-400 mt-1">
                            Item total: $
                            {(Number(item.price || 0) * item.quantity).toFixed(2)}
                        </p>
                    </div>
                ))}
            </div>
        );
    }

    function AdaptiveFilters() {
        return (
            <section className="bg-neutral-900 p-5 rounded-2xl mb-6">
                <h2 className="text-xl font-bold mb-4">Filters</h2>

                <div className="grid md:grid-cols-4 gap-3 mb-3">
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="bg-neutral-800 p-3 rounded-xl outline-none"
                    >
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>

                    <input
                        placeholder="Max Price"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="bg-neutral-800 p-3 rounded-xl outline-none"
                    />

                    <input
                        placeholder="Store"
                        value={storeFilter}
                        onChange={(e) => setStoreFilter(e.target.value)}
                        className="bg-neutral-800 p-3 rounded-xl outline-none"
                    />

                    <select
                        value={minRating}
                        onChange={(e) => setMinRating(e.target.value)}
                        className="bg-neutral-800 p-3 rounded-xl outline-none"
                    >
                        <option value="0">Any rating</option>
                        <option value="3">3 stars & up</option>
                        <option value="4">4 stars & up</option>
                        <option value="4.5">4.5 stars & up</option>
                    </select>
                </div>

                <div className="grid md:grid-cols-4 gap-3 mb-3">
                    <input
                        placeholder="Color"
                        value={colorFilter}
                        onChange={(e) => setColorFilter(e.target.value)}
                        className="bg-neutral-800 p-3 rounded-xl outline-none"
                    />

                    <input
                        placeholder="Finish"
                        value={finishFilter}
                        onChange={(e) => setFinishFilter(e.target.value)}
                        className="bg-neutral-800 p-3 rounded-xl outline-none"
                    />

                    <input
                        placeholder="Size / Dimensions"
                        value={sizeFilter}
                        onChange={(e) => setSizeFilter(e.target.value)}
                        className="bg-neutral-800 p-3 rounded-xl outline-none"
                    />

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-neutral-800 p-3 rounded-xl outline-none"
                    >
                        <option value="relevance">Relevance</option>
                        <option value="priceLow">Price Low → High</option>
                        <option value="priceHigh">Price High → Low</option>
                        <option value="ratingHigh">Rating High → Low</option>
                    </select>
                </div>

                {activeCategory === "Room / Remodel" && (
                    <div className="grid md:grid-cols-3 gap-3 mb-3">
                        <input
                            placeholder="Room item, ex: drywall, flooring, paint"
                            value={materialFilter}
                            onChange={(e) => setMaterialFilter(e.target.value)}
                            className="bg-neutral-800 p-3 rounded-xl outline-none"
                        />

                        <select
                            value={categorySpecificFilter}
                            onChange={(e) => setCategorySpecificFilter(e.target.value)}
                            className="bg-neutral-800 p-3 rounded-xl outline-none"
                        >
                            <option value="">Any room material</option>
                            <option value="drywall">Drywall</option>
                            <option value="flooring">Flooring</option>
                            <option value="paint">Paint</option>
                            <option value="trim">Trim</option>
                            <option value="outlet">Electrical</option>
                            <option value="light fixture">Lighting</option>
                        </select>

                        <input
                            placeholder="Room dimensions"
                            value={sizeFilter}
                            onChange={(e) => setSizeFilter(e.target.value)}
                            className="bg-neutral-800 p-3 rounded-xl outline-none"
                        />
                    </div>
                )}

                {activeCategory === "Lumber / Framing" && (
                    <div className="grid md:grid-cols-3 gap-3 mb-3">
                        <input
                            placeholder="Board size, ex: 2x4, 4x4"
                            value={categorySpecificFilter}
                            onChange={(e) => setCategorySpecificFilter(e.target.value)}
                            className="bg-neutral-800 p-3 rounded-xl outline-none"
                        />

                        <select
                            value={materialFilter}
                            onChange={(e) => setMaterialFilter(e.target.value)}
                            className="bg-neutral-800 p-3 rounded-xl outline-none"
                        >
                            <option value="">Any material</option>
                            <option value="pressure treated">Pressure treated</option>
                            <option value="cedar">Cedar</option>
                            <option value="pine">Pine</option>
                            <option value="stud">Stud grade</option>
                        </select>

                        <input
                            placeholder="Length, ex: 8 ft"
                            value={sizeFilter}
                            onChange={(e) => setSizeFilter(e.target.value)}
                            className="bg-neutral-800 p-3 rounded-xl outline-none"
                        />
                    </div>
                )}

                {activeCategory === "Electrical" && (
                    <div className="grid md:grid-cols-3 gap-3 mb-3">
                        <select
                            value={categorySpecificFilter}
                            onChange={(e) => setCategorySpecificFilter(e.target.value)}
                            className="bg-neutral-800 p-3 rounded-xl outline-none"
                        >
                            <option value="">Any electrical type</option>
                            <option value="gfci">GFCI</option>
                            <option value="15 amp">15 amp</option>
                            <option value="20 amp">20 amp</option>
                            <option value="12/2 wire">12/2 wire</option>
                            <option value="14/2 wire">14/2 wire</option>
                            <option value="breaker">Breaker</option>
                        </select>

                        <input
                            placeholder="Voltage, ex: 120v"
                            value={materialFilter}
                            onChange={(e) => setMaterialFilter(e.target.value)}
                            className="bg-neutral-800 p-3 rounded-xl outline-none"
                        />

                        <input
                            placeholder="Indoor / outdoor"
                            value={finishFilter}
                            onChange={(e) => setFinishFilter(e.target.value)}
                            className="bg-neutral-800 p-3 rounded-xl outline-none"
                        />
                    </div>
                )}

                {activeCategory === "Drywall" && (
                    <div className="grid md:grid-cols-3 gap-3 mb-3">
                        <select
                            value={categorySpecificFilter}
                            onChange={(e) => setCategorySpecificFilter(e.target.value)}
                            className="bg-neutral-800 p-3 rounded-xl outline-none"
                        >
                            <option value="">Any drywall type</option>
                            <option value="1/2 inch">1/2 inch</option>
                            <option value="5/8 inch">5/8 inch</option>
                            <option value="moisture resistant">Moisture resistant</option>
                            <option value="fire rated">Fire rated</option>
                        </select>

                        <select
                            value={sizeFilter}
                            onChange={(e) => setSizeFilter(e.target.value)}
                            className="bg-neutral-800 p-3 rounded-xl outline-none"
                        >
                            <option value="">Any sheet size</option>
                            <option value="4x8">4x8</option>
                            <option value="4x10">4x10</option>
                            <option value="4x12">4x12</option>
                        </select>

                        <input
                            placeholder="Compound / tape / screws"
                            value={materialFilter}
                            onChange={(e) => setMaterialFilter(e.target.value)}
                            className="bg-neutral-800 p-3 rounded-xl outline-none"
                        />
                    </div>
                )}

                <div className="grid md:grid-cols-5 gap-3">
                    <label className="bg-neutral-800 p-3 rounded-xl flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={inStockOnly}
                            onChange={(e) => setInStockOnly(e.target.checked)}
                        />
                        In stock
                    </label>

                    <label className="bg-neutral-800 p-3 rounded-xl flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={shippableOnly}
                            onChange={(e) => setShippableOnly(e.target.checked)}
                        />
                        Shippable
                    </label>

                    <label className="bg-neutral-800 p-3 rounded-xl flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={bulkOnly}
                            onChange={(e) => setBulkOnly(e.target.checked)}
                        />
                        Bulk
                    </label>

                    <label className="bg-neutral-800 p-3 rounded-xl flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={pickupOnly}
                            onChange={(e) => setPickupOnly(e.target.checked)}
                        />
                        Pickup
                    </label>

                    <button
                        onClick={clearFilters}
                        className="bg-neutral-700 hover:bg-neutral-600 p-3 rounded-xl font-bold"
                    >
                        Clear
                    </button>
                </div>
            </section>
        );
    }
    return (
        <main className="bg-neutral-950 text-white min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col gap-4 mb-6">
                    <div className="flex justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">ContractorFind</h1>
                            <p className="text-neutral-400">
                                Dashboard, projects, price tracking, stores, and smart product search.
                            </p>

                            {user?.email && (
                                <p className="text-xs text-neutral-500 mt-1">
                                    Logged in as {user.email}
                                </p>
                            )}
                        </div>

                        <button
                            onClick={handleLogout}
                            className="bg-neutral-800 px-4 py-2 rounded-xl h-fit"
                        >
                            Logout
                        </button>
                    </div>

                    <nav className="flex flex-wrap gap-2">
                        <NavButton page="home" label="Home" />
                        <NavButton page="search" label="Search" />
                        <NavButton page="projects" label="Projects" />
                        <NavButton page="prices" label="Price Tracker" />
                        <NavButton page="stores" label="Stores" />
                        <NavButton page="settings" label="Settings" />
                        <NavButton page="suggestions" label="Suggestions" />
                    </nav>
                </header>

                {activePage === "home" && (
                    <section>
                        <h2 className="text-2xl font-bold mb-4">Home Dashboard</h2>

                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {homeCards.map((card) => (
                                <div key={card.id} className="bg-neutral-900 p-5 rounded-2xl">
                                    <div className="flex justify-between mb-3">
                                        <h3 className="font-bold">{card.title}</h3>

                                        <div className="flex gap-2 text-xs">
                                            <button onClick={() => moveHomeCard(card.id, "up")}>
                                                ↑
                                            </button>
                                            <button onClick={() => moveHomeCard(card.id, "down")}>
                                                ↓
                                            </button>
                                            <button onClick={() => removeHomeCard(card.id)}>X</button>
                                        </div>
                                    </div>

                                    {card.type === "overview" && (
                                        <div className="space-y-2 text-sm">
                                            <p>Projects: {projects.length}</p>
                                            <p>Tracked Prices: {trackedItems.length}</p>
                                            <p>Total Saved Materials: ${allProjectsTotal.toFixed(2)}</p>
                                        </div>
                                    )}

                                    {card.type === "activeProject" && (
                                        <div className="space-y-2 text-sm">
                                            <p>Project: {activeProject?.name}</p>
                                            <p>Items: {savedCount}</p>
                                            <p>Total: ${savedTotal.toFixed(2)}</p>

                                            <button
                                                onClick={() => setActivePage("projects")}
                                                className="bg-orange-500 px-3 py-2 rounded-xl mt-2"
                                            >
                                                Open Project
                                            </button>
                                        </div>
                                    )}

                                    {card.type === "quickSearch" && (
                                        <div>
                                            <input
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="w-full bg-neutral-800 p-3 rounded-xl outline-none mb-3"
                                                placeholder="Quick search..."
                                            />

                                            <button
                                                onClick={searchProducts}
                                                className="w-full bg-orange-500 p-2 rounded-xl"
                                            >
                                                Search
                                            </button>
                                        </div>
                                    )}

                                    {card.type === "trackedItem" && (
                                        <div className="text-sm">
                                            <p className="font-bold">{card.product.name}</p>
                                            <p>{card.product.store}</p>
                                            <p className="text-orange-400">
                                                ${card.product.price || "N/A"}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {activePage === "projects" && (
                    <>
                        <section className="bg-neutral-900 p-5 rounded-2xl mb-6">
                            <h2 className="text-xl font-bold mb-4">Create Project</h2>

                            <div className="grid md:grid-cols-4 gap-3 mb-4">
                                <input
                                    value={projectName}
                                    onChange={(e) => {
                                        setProjectName(e.target.value);
                                        setProjectFilterCategory(detectCategory(e.target.value));
                                    }}
                                    className="md:col-span-2 bg-neutral-800 p-3 rounded-xl outline-none"
                                    placeholder="Example: 10x12x9 Room, Deck, Fence Job"
                                />

                                <select
                                    value={projectType}
                                    onChange={(e) => setProjectType(e.target.value)}
                                    className="bg-neutral-800 p-3 rounded-xl outline-none"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>

                                <button
                                    onClick={createProject}
                                    className="bg-orange-500 hover:bg-orange-600 p-3 rounded-xl font-bold"
                                >
                                    Create
                                </button>
                            </div>

                            <div className="grid md:grid-cols-4 gap-3 mb-4">
                                <input
                                    value={projectColorFilter}
                                    onChange={(e) => setProjectColorFilter(e.target.value)}
                                    className="bg-neutral-800 p-3 rounded-xl outline-none"
                                    placeholder="Project color preference"
                                />

                                <input
                                    value={projectFinishFilter}
                                    onChange={(e) => setProjectFinishFilter(e.target.value)}
                                    className="bg-neutral-800 p-3 rounded-xl outline-none"
                                    placeholder="Project finish preference"
                                />

                                <input
                                    value={projectMaterialFilter}
                                    onChange={(e) => setProjectMaterialFilter(e.target.value)}
                                    className="bg-neutral-800 p-3 rounded-xl outline-none"
                                    placeholder="Project material preference"
                                />

                                <div className="bg-neutral-800 p-3 rounded-xl text-neutral-400">
                                    Detected: {projectFilterCategory}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {projects.map((project) => (
                                    <button
                                        key={project.id}
                                        onClick={() => setActiveProjectId(project.id)}
                                        className={`px-3 py-2 rounded-xl ${project.id === activeProjectId
                                                ? "bg-orange-500"
                                                : "bg-neutral-800"
                                            }`}
                                    >
                                        {project.name}
                                    </button>
                                ))}

                                {projects.length > 1 && (
                                    <button
                                        onClick={() => deleteProject(activeProjectId)}
                                        className="bg-red-600 px-3 py-2 rounded-xl"
                                    >
                                        Delete Active Project
                                    </button>
                                )}
                            </div>
                        </section>

                        {activeProject && (
                            <section className="bg-neutral-900 p-5 rounded-2xl mb-6">
                                <h2 className="text-xl font-bold mb-2">{activeProject.name}</h2>

                                <p className="text-orange-400 font-bold text-lg mb-4">
                                    Rough Material Range: ${activeProject.estimateLow} – $
                                    {activeProject.estimateHigh}
                                </p>

                                <button
                                    onClick={() => addSuggestedMaterialsToProject(activeProject)}
                                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-bold mb-4"
                                >
                                    Auto Grab Suggested Materials
                                </button>

                                <p className="text-neutral-400 mb-3">Suggested Materials</p>

                                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
                                    {activeProject.suggestedItems.map((item) => (
                                        <button
                                            key={item}
                                            onClick={() => {
                                                setSearch(item);
                                                searchMaterial(item);
                                            }}
                                            className="bg-neutral-800 hover:bg-neutral-700 p-3 rounded-xl text-left"
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        <ProjectCart />
                    </>
                )}\
                {activePage === "search" && (
                    <>
                        <section className="bg-neutral-900 p-5 rounded-2xl mb-6">
                            <div className="relative mb-4">
                                {ghostSuggestion && ghostSuggestion !== search && (
                                    <div className="absolute inset-0 p-4 text-lg text-neutral-500 pointer-events-none">
                                        <span className="invisible">{search}</span>
                                        <span>{ghostSuggestion.slice(search.length)}</span>
                                    </div>
                                )}

                                <input
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        if (category === "Auto Detect") {
                                            const detected = detectCategory(e.target.value);
                                            if (detected !== "Auto Detect") setCategory(detected);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Tab" && ghostSuggestion) {
                                            e.preventDefault();
                                            acceptGhostSuggestion();
                                        }

                                        if (e.key === "Enter") searchProducts();
                                    }}
                                    className="relative w-full p-4 bg-transparent border border-neutral-700 rounded-xl outline-none text-lg"
                                    placeholder="Search: 10x12x9 room, 2x4x8 lumber, 20 amp outlet..."
                                />
                            </div>

                            <p className="text-xs text-neutral-500 mb-4">
                                Auto category: {activeCategory}
                            </p>

                            <div className="grid md:grid-cols-4 gap-3">
                                <select
                                    value={activeProjectId}
                                    onChange={(e) => setActiveProjectId(e.target.value)}
                                    className="bg-neutral-800 p-3 rounded-xl outline-none"
                                >
                                    {projects.map((project) => (
                                        <option key={project.id} value={project.id}>
                                            Save to: {project.name}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    value={zip}
                                    onChange={(e) => setZip(e.target.value)}
                                    className="bg-neutral-800 p-3 rounded-xl outline-none"
                                    placeholder="ZIP code"
                                />

                                <button
                                    onClick={searchProducts}
                                    className="md:col-span-2 bg-orange-500 hover:bg-orange-600 p-3 rounded-xl font-bold"
                                >
                                    {loading ? "Searching..." : "Search Products + Stores"}
                                </button>
                            </div>
                        </section>

                        {materialHelper?.isProjectSearch && (
                            <section className="bg-neutral-900 p-5 rounded-2xl mb-6 border border-orange-500/30">
                                <h2 className="text-xl font-bold mb-2">
                                    This looks like a project.
                                </h2>

                                <p className="text-neutral-400 mb-4">
                                    Showing the closest useful material first:
                                    <span className="text-orange-400 font-bold">
                                        {" "}
                                        {materialHelper.starterSearch}
                                    </span>
                                </p>

                                <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">
                                    {materialHelper.items.map((item) => (
                                        <button
                                            key={item}
                                            onClick={() => {
                                                setSearch(item);
                                                searchMaterial(item);
                                            }}
                                            className="bg-neutral-800 hover:bg-neutral-700 p-3 rounded-xl text-left"
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        <AdaptiveFilters />

                        <div className="grid lg:grid-cols-4 gap-6">
                            <section className="lg:col-span-3">
                                <h2 className="text-2xl font-bold mb-4">
                                    Product Results ({filteredResults.length})
                                </h2>

                                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {results.length === 0 && (
                                        <p className="text-neutral-400">
                                            Search for something like 10x12x9 room, door knob,
                                            railing, or lumber.
                                        </p>
                                    )}

                                    {results.length > 0 && filteredResults.length === 0 && (
                                        <p className="text-neutral-400">
                                            No products match your filters.
                                        </p>
                                    )}

                                    {filteredResults.map((product) => (
                                        <div
                                            key={product.id}
                                            className="bg-neutral-900 rounded-2xl overflow-hidden shadow-lg"
                                        >
                                            {product.image && (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-40 object-cover"
                                                />
                                            )}

                                            <div className="p-4">
                                                <h3 className="font-bold">{product.name}</h3>
                                                <p className="text-sm text-neutral-400">
                                                    {product.store}
                                                </p>

                                                <p className="text-xl font-bold mt-2">
                                                    ${product.price || "N/A"}
                                                </p>

                                                <p className="text-sm">
                                                    ⭐ {product.rating || "N/A"} ({product.reviews || 0})
                                                </p>

                                                <p className="text-sm text-neutral-400">
                                                    {product.delivery}
                                                </p>

                                                <div className="grid grid-cols-2 gap-2 mt-3">
                                                    <button
                                                        onClick={() => saveItem(product)}
                                                        className="bg-orange-500 hover:bg-orange-600 p-2 rounded-xl"
                                                    >
                                                        Save
                                                    </button>

                                                    <button
                                                        onClick={() => addTrackedItem(product)}
                                                        className="bg-blue-600 hover:bg-blue-700 p-2 rounded-xl"
                                                    >
                                                        Track
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            addCardToHome({
                                                                id: `tracked-${product.id}`,
                                                                type: "trackedItem",
                                                                title: product.name.slice(0, 25),
                                                                product,
                                                            })
                                                        }
                                                        className="bg-neutral-700 hover:bg-neutral-600 p-2 rounded-xl"
                                                    >
                                                        Add Home
                                                    </button>

                                                    <a
                                                        href={product.link}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="bg-neutral-700 hover:bg-neutral-600 p-2 rounded-xl text-center"
                                                    >
                                                        View
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <aside className="space-y-6">
                                <ProjectCart />

                                <div>
                                    <h2 className="text-xl font-bold mb-3">Nearby Stores</h2>

                                    {stores.map((store) => (
                                        <div
                                            key={store.id}
                                            className="bg-neutral-900 p-3 rounded-xl mb-3"
                                        >
                                            <p className="font-bold">{store.name}</p>
                                            <p className="text-sm text-neutral-400">
                                                {store.address}
                                            </p>
                                            <p className="text-sm">
                                                ⭐ {store.rating} ({store.reviews})
                                            </p>
                                            <p className="text-sm">{store.phone}</p>
                                        </div>
                                    ))}
                                </div>
                            </aside>
                        </div>
                    </>
                )}

                {activePage === "prices" && (
                    <section>
                        <h2 className="text-2xl font-bold mb-4">Price Tracker</h2>

                        {trackedItems.length === 0 && (
                            <p className="text-neutral-400">
                                No tracked items yet. Go to Search and click Track on a product.
                            </p>
                        )}

                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {trackedItems.map((item) => (
                                <div key={item.id} className="bg-neutral-900 p-5 rounded-2xl">
                                    <h3 className="font-bold mb-2">{item.name}</h3>
                                    <p className="text-sm text-neutral-400">{item.store}</p>

                                    <p className="text-orange-400 font-bold mt-2">
                                        Current: ${item.price || "N/A"}
                                    </p>

                                    <p className="text-sm">
                                        Start price: ${item.startPrice || "N/A"}
                                    </p>

                                    <p className="text-sm">Added: {item.dateAdded}</p>

                                    <input
                                        value={item.targetPrice}
                                        onChange={(e) =>
                                            setTrackedItems(
                                                trackedItems.map((tracked) =>
                                                    tracked.id === item.id
                                                        ? { ...tracked, targetPrice: e.target.value }
                                                        : tracked
                                                )
                                            )
                                        }
                                        className="w-full bg-neutral-800 p-2 rounded-xl mt-3"
                                        placeholder="Target price"
                                    />

                                    <div className="flex gap-2 mt-3">
                                        <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="bg-neutral-700 p-2 rounded-xl w-full text-center"
                                        >
                                            View
                                        </a>

                                        <button
                                            onClick={() => removeTrackedItem(item.id)}
                                            className="bg-red-600 p-2 rounded-xl w-full"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {activePage === "stores" && (
                    <section>
                        <h2 className="text-2xl font-bold mb-4">Stores</h2>

                        {stores.length === 0 && (
                            <p className="text-neutral-400">
                                Search a product first to load nearby stores.
                            </p>
                        )}

                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {stores.map((store) => (
                                <div key={store.id} className="bg-neutral-900 p-5 rounded-2xl">
                                    <h3 className="font-bold">{store.name}</h3>
                                    <p className="text-sm text-neutral-400">{store.address}</p>
                                    <p className="text-sm">
                                        ⭐ {store.rating} ({store.reviews})
                                    </p>
                                    <p className="text-sm">{store.phone}</p>

                                    {store.website && (
                                        <a
                                            href={store.website}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block bg-neutral-700 p-2 rounded-xl text-center mt-3"
                                        >
                                            Website
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {activePage === "suggestions" && (
                    <section className="bg-neutral-900 p-5 rounded-2xl max-w-2xl">
                        <h2 className="text-2xl font-bold mb-4">Suggestion Box</h2>

                        <p className="text-neutral-400 mb-4">
                            Send feedback, feature ideas, bugs, or anything you think
                            ContractorFind should add.
                        </p>

                        <input
                            value={suggestionName}
                            onChange={(e) => setSuggestionName(e.target.value)}
                            className="w-full bg-neutral-800 p-3 rounded-xl outline-none mb-3"
                            placeholder="Your name optional"
                        />

                        <input
                            value={suggestionEmail}
                            onChange={(e) => setSuggestionEmail(e.target.value)}
                            className="w-full bg-neutral-800 p-3 rounded-xl outline-none mb-3"
                            placeholder="Your email optional"
                        />

                        <textarea
                            value={suggestionMessage}
                            onChange={(e) => setSuggestionMessage(e.target.value)}
                            className="w-full bg-neutral-800 p-3 rounded-xl outline-none mb-3 min-h-40"
                            placeholder="Type your suggestion here..."
                        />

                        <button
                            onClick={sendSuggestion}
                            className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xl font-bold"
                        >
                            Send Suggestion
                        </button>

                        {suggestionStatus && (
                            <p className="text-sm text-neutral-400 mt-3">
                                {suggestionStatus}
                            </p>
                        )}
                    </section>
                )}

                {activePage === "settings" && (
                    <section className="bg-neutral-900 p-5 rounded-2xl">
                        <h2 className="text-2xl font-bold mb-4">Settings</h2>

                        <label className="block text-sm text-neutral-400 mb-2">
                            Default ZIP Code
                        </label>

                        <input
                            value={zip}
                            onChange={(e) => setZip(e.target.value)}
                            className="bg-neutral-800 p-3 rounded-xl outline-none mb-4"
                        />

                        <p className="text-sm text-neutral-500">
                            More settings later: preferred stores, alerts, saved dashboard
                            layout, and price notification rules.
                        </p>
                    </section>
                )}
            </div>
        </main>
    );
}