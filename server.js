const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

const API_KEY = process.env.API_KEY;

// 👉 список моделей (будет пробовать по очереди)
const MODELS = [
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-pro"
];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    try {
        if (!API_KEY) {
            return res.status(500).json({ reply: "❌ Нет API_KEY (Render env)" });
        }

        const { message, imageBase64 } = req.body;

        if (!message && !imageBase64) {
            return res.status(400).json({ reply: "❌ Пустой запрос" });
        }

        // 📦 собираем parts
        const parts = [];

        if (message) {
            parts.push({ text: message });
        }

        if (imageBase64) {
            const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);

            let mime = "image/jpeg";
            let data = imageBase64;

            if (match) {
                mime = match[1];
                data = match[2];
            }

            parts.push({
                inline_data: {
                    mime_type: mime,
                    data: data
                }
            });
        }

        const requestBody = {
            contents: [{ parts }]
        };

        let lastError = null;

        // 🔁 пробуем модели по очереди
        for (const model of MODELS) {
            const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${API_KEY}`;

            try {
                console.log(`Trying model: ${model}`);

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const text = await response.text();
                    console.log(`❌ ${model} failed:`, text);
                    continue;
                }

                const result = await response.json();

                const answer =
                    result?.candidates?.[0]?.content?.parts
                        ?.map(p => p.text || "")
                        .join(" ")
                        .trim();

                if (answer) {
                    console.log(`✅ Success with: ${model}`);
                    return res.json({ reply: answer });
                }

            } catch (err) {
                console.log(`⚠️ Error with ${model}:`, err.message);
                lastError = err;
            }
        }

        // ❌ если ни одна модель не сработала
        return res.status(500).json({
            reply: "❌ Ни одна модель не доступна (проверь API_KEY)"
        });

    } catch (err) {
        console.error("🔥 Server Error:", err);
        res.status(500).json({ reply: "Ошибка сервера: " + err.message });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
