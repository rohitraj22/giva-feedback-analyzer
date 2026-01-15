const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// [Task A1] In-Memory Database (Simple List)
let feedbackDB = [];

// ---------------------------------------------------------
// [Task A2 & A3] Analysis Logic
// ---------------------------------------------------------
const POSITIVE_WORDS = ["shiny", "elegant", "comfortable", "premium", "beautiful", "love", "great", "good", "lustrous"];
const NEGATIVE_WORDS = ["tarnish", "dull", "broke", "uncomfortable", "heavy", "bad", "fragile", "impurities"];

const THEMES = {
    "Comfort": ["light", "heavy", "fit", "wearable", "size", "comfortable"],
    "Durability": ["broke", "strong", "quality", "fragile", "tarnish", "dull", "impurities"],
    "Appearance": ["shiny", "design", "polish", "beautiful", "look", "color", "lustrous"]
};

function analyzeReview(text) {
    const textLower = text.toLowerCase();
    const words = textLower.split(/\s+/);

    // Sentiment Logic
    let posCount = 0;
    let negCount = 0;

    words.forEach(word => {
        if (POSITIVE_WORDS.includes(word)) posCount++;
        if (NEGATIVE_WORDS.includes(word)) negCount++;
    });

    // Logic: If positive >= negative -> Positive
    const sentiment = posCount >= negCount ? "Positive" : "Negative";

    // Theme Logic
    let detectedThemes = [];
    for (const [theme, keywords] of Object.entries(THEMES)) {
        if (keywords.some(keyword => textLower.includes(keyword))) {
            detectedThemes.push(theme);
        }
    }
    if (detectedThemes.length === 0) detectedThemes.push("General");

    return { sentiment, themes: detectedThemes };
}

// ---------------------------------------------------------
// API Endpoints
// ---------------------------------------------------------

// 1. Submit Feedback
app.post('/api/submit', (req, res) => {
    try {
        const { product, rating, review } = req.body;
        
        // Analyze
        const analysis = analyzeReview(review);

        // Create Entry
        const newEntry = {
            id: feedbackDB.length + 1,
            product,
            rating,
            review,
            sentiment: analysis.sentiment,
            themes: analysis.themes,
            date: new Date()
        };

        // Save to In-Memory List
        feedbackDB.push(newEntry);
        console.log("Feedback Saved:", newEntry);

        res.json({ message: "Feedback Saved!", data: newEntry });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 2. Fetch Feedback
app.get('/api/feedback', (req, res) => {
    res.json(feedbackDB);
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Node.js Server running on http://localhost:${PORT}`);
    console.log("Storing data in-memory");
});