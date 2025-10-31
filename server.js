import express from "express";
import Replicate from "replicate";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import transactionRoutes from "./routes/transactionsRoute.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- Vérification des variables d'environnement ---
console.log("🔑 Vérification des clés :", {
  REPLICATE: !!process.env.REPLICATE_API,
  MURF: !!process.env.MURF_API,
  PI_APP: !!process.env.PI_APP,
  MONGO: !!process.env.MONGO_URI
});

// --- Connexion MongoDB ---
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connecté avec succès"))
    .catch((err) => console.error("❌ Erreur MongoDB :", err.message));
}

// --- Routes GAP Studio ---
const router = express.Router();
const replicate = new Replicate({ auth: process.env.REPLICATE_API });

router.get("/", (req, res) => {
  res.send("🚀 API GAP Studio est connectée et opérationnelle !");
});

router.get("/test", (req, res) => {
  res.json({ message: "Backend OK" });
});

router.post("/generate", async (req, res) => {
  const { prompt, type } = req.body;

  try {
    if (!prompt) return res.status(400).json({ error: "Prompt manquant" });

    // --- Génération d'image avec Replicate ---
    if (type === "replicate-image") {
      if (!process.env.REPLICATE_API)
        return res.status(401).json({ error: "Clé Replicate manquante" });

      const output = await replicate.run(
        "stability-ai/stable-diffusion",
        { input: { prompt } }
      );
      res.json({ imageUrl: output[0] });

    // --- Voix avec Murf ---
    } else if (type === "murf-tts") {
      if (!process.env.MURF_API)
        return res.status(401).json({ error: "Clé Murf manquante" });

      const murfRes = await axios.post(
        "https://api.murf.ai/v1/speech/generate",
        { text: prompt, voice: "en-US-WilliamNeural" },
        { headers: { "Authorization": `Bearer ${process.env.MURF_API}` } }
      );
      res.json({ audioUrl: murfRes.data.audio_url });

    // --- Musique de démonstration ---
    } else if (type === "musique") {
      res.json({
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      });

    } else {
      res.status(400).json({ error: "Type de création non supporté." });
    }

  } catch (error) {
    console.error("Erreur /generate :", error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- Paiement Pi Network ---
router.post("/pi-payment", async (req, res) => {
  try {
    const { amount, userWallet, itemName } = req.body;

    if (!amount || !userWallet || !itemName) {
      return res.status(400).json({ success: false, message: "Champs manquants" });
    }

    const transaction = {
      from: userWallet,
      to: process.env.PI_APP,
      amount,
      itemName,
      status: "pending",
      date: new Date(),
    };

    console.log("💰 Nouvelle transaction Pi :", transaction);

    res.json({
      success: true,
      message: "Paiement Pi en cours...",
      transaction,
    });
  } catch (error) {
    console.error("Erreur de paiement :", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// --- Utilisation des routes ---
app.use("/api/gapstudio", router);
app.use("/api/transactions", transactionRoutes);

// --- Lancement du serveur ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur backend lancé sur le port ${PORT}`);
});