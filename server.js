const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

const IO_API_KEY = "io-v2-eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJvd25lciI6IjBmYmRmZmY1LTVlMmYtNDlmNy04MjM1LWRkN2IyZjgwM2U0NSIsImV4cCI6NDkzMDM0MTIyM30.Y8nsd8pje7KHQO4NySsbWLQYRT2S6Sj1QgWlWmrd0ORa5glDyi8wNn000WHlAkh-G8lLM_9znUMr4ATIPwhyvA";

// 👉 ВАЖНО: нужна vision-модель
const MODEL = "llava-hf/llava-1.5-7b-hf"; 
// если не работает — поменяем

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    try {
        if (!IO_API_KEY) {
            return res.status(500).json({ reply: "❌ Нет IO_API_KEY" });
        }

        const { message, imageBase64 } = req.body;

        if (!message && !imageBase64) {
            return res.status(400).json({ reply: "❌ Пустой запрос" });
        }

        // 👉 формируем content (text + image)
        const content = [];

        if (message) {
            content.push({
                type: "text",
                text: message
            });
        }

        if (imageBase64) {
            const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);

            let mime = "image/jpeg";
            let data = imageBase64;

            if (match) {
                mime = match[1];
                data = match[2];
            }

            content.push({
                type: "image_url",
                image_url: {
                    url: `data:${mime};base64,${data}`
                }
            });
        }

        const requestBody = {
            model: MODEL,
            messages: [
                {
                    role: "user",
                    content: content
                }
            ],
            temperature: 0.7
        };

        const response = await fetch("https://api.io.net/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${IO_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("❌ io.net error:", text);

            return res.status(response.status).json({
                reply: "Ошибка io.net: " + text
            });
        }

        const data = await response.json();

        const answer =
            data?.choices?.[0]?.message?.content ||
            "Модель не ответила";

        res.json({ reply: answer });

    } catch (err) {
        console.error("🔥 Server Error:", err);
        res.status(500).json({ reply: "Ошибка сервера: " + err.message });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Vision сервер запущен на порту ${PORT}`);
});
