const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

const API_KEY = process.env.API_KEY;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    try {
        if (!API_KEY) {
            return res.status(500).json({ reply: "Нет API_KEY (проверь Render env)" });
        }

        const { message, imageBase64 } = req.body;

        if (!message && !imageBase64) {
            return res.status(400).json({ reply: "Пустой запрос" });
        }

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

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("HTTP Error:", text);
            return res.status(response.status).json({
                reply: "Ошибка API: " + text
            });
        }

        const result = await response.json();

        const answer =
            result?.candidates?.[0]?.content?.parts
                ?.map(p => p.text || "")
                .join(" ")
                .trim();

        if (!answer) {
            console.error("Empty Gemini response:", result);
            return res.json({ reply: "Модель не вернула текст" });
        }

        res.json({ reply: answer });

    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ reply: "Ошибка сервера: " + err.message });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
