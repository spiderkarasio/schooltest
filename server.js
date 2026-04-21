const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

const GOOGLE_API_KEY = process.env.API_KEY; 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message, imageBase64, imageType } = req.body;

        if (!GOOGLE_API_KEY) {
            return res.status(500).json({ reply: "Ошибка: API_KEY не найден." });
        }

        const requestBody = {
            contents: [{
                parts: []
            }]
        };

        if (message) {
            requestBody.contents[0].parts.push({ text: message });
        }

        if (imageBase64) {
            const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
            requestBody.contents[0].parts.push({
                inline_data: {
                    mime_type: imageType || "image/jpeg",
                    data: cleanBase64
                }
            });
        }

        // Исправленная ссылка (v1 и gemini-1.5-flash)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ reply: "Ошибка Google API: " + data.error.message });
        }

        const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Не удалось получить ответ.";
        res.json({ reply: botReply });

    } catch (err) {
        console.error(err);
        res.status(500).json({ reply: "Ошибка сервера: " + err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер работает на порту ${PORT}`);
});
