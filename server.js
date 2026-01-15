require("dotenv").config(); // Load env variables

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

/* -------------------------------------------------
   MongoDB Connection
------------------------------------------------- */
mongoose
    .connect(process.env.MONGO_URI) 
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error("MongoDB Error:", err));


/* -------------------------------------------------
   MongoDB Schema & Model
------------------------------------------------- */
const feedbackSchema = new mongoose.Schema({
    product: String,
    rating: Number,
    review: String,
    sentiment: String,
    themes: [String],
    date: {
        type: Date,
        default: Date.now
    }
});

const Feedback = mongoose.model("Feedback", feedbackSchema);

/* -------------------------------------------------
   Analysis Logic
------------------------------------------------- */
const POSITIVE_WORDS = [
    "shiny", "elegant", "comfortable", "premium",
    "beautiful", "love", "great", "good", "lustrous"
];

const NEGATIVE_WORDS = [
    "tarnish", "dull", "broke", "uncomfortable",
    "heavy", "bad", "fragile", "impurities"
];

const THEMES = {
    Comfort: ["light", "heavy", "fit", "wearable", "comfortable"],
    Durability: ["broke", "strong", "quality", "fragile", "tarnish", "dull", "impurities"],
    Appearance: ["shiny", "design", "polish", "beautiful", "look", "color", "lustrous"]
};

function analyzeReview(text) {
    const textLower = text.toLowerCase();
    const words = textLower.split(/\s+/);

    let pos = 0, neg = 0;

    words.forEach(w => {
        if (POSITIVE_WORDS.includes(w)) pos++;
        if (NEGATIVE_WORDS.includes(w)) neg++;
    });

    const sentiment = pos >= neg ? "Positive" : "Negative";

    let detectedThemes = [];
    for (const [theme, keywords] of Object.entries(THEMES)) {
        if (keywords.some(k => textLower.includes(k))) {
            detectedThemes.push(theme);
        }
    }

    if (detectedThemes.length === 0) detectedThemes.push("General");

    return { sentiment, themes: detectedThemes };
}

/* -------------------------------------------------
   API ROUTES (MongoDB)
------------------------------------------------- */

// Submit Feedback
app.post("/api/submit", async (req, res) => {
    try {
        const { product, rating, review } = req.body;

        const analysis = analyzeReview(review);

        const feedback = new Feedback({
            product,
            rating,
            review,
            sentiment: analysis.sentiment,
            themes: analysis.themes
        });

        await feedback.save();

        res.json({
            message: "Feedback saved to MongoDB",
            data: feedback
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Fetch All Feedback
app.get("/api/feedback", async (req, res) => {
    try {
        const data = await Feedback.find().sort({ date: -1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

/* -------------------------------------------------
   Start Server
------------------------------------------------- */
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});