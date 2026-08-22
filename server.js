import express from "express";
import cors from "cors";
import multer from "multer";
import Replicate from "replicate";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

app.post("/api/animate", upload.single("image"), async (req, res) => {
  try {
    const { script } = req.body;
    const file = req.file;

    if (!file || !script) {
      return res.status(400).json({ error: "Falta la imagen o el guion." });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return res.status(500).json({ error: "Falta configurar REPLICATE_API_TOKEN en el servidor." });
    }

    const imageBase64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

    // Llamada directa al slug del modelo activo en Replicate
    const output = await replicate.run(
      "cjwbw/sadtalker",
      {
        input: {
          source_image: imageBase64,
          driven_audio: script,
          preprocess: "full",
          still: true
        }
      }
    );

    res.json({ videoUrl: output });
  } catch (error) {
    console.error("Error al generar avatar:", error);
    res.status(500).json({ error: "Error en el servidor de animación: " + error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
