const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();

// Лимиты для того, чтобы фото пролезали без ошибок
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
            return res.json({ reply: "Ошибка: Забыл добавить API_KEY в настройки Render!" });
        }

        const { message, imageBase64 } = req.body;

        // Формируем запрос
        const requestBody = {
            contents: [{
                parts: []
            }]
        };

        if (message) requestBody.contents[0].parts.push({ text: message });
        
        if (imageBase64) {
            const data = imageBase64.split(',')[1] || imageBase64;
            requestBody.contents[0].parts.push({
                inline_data: {
                    mime_type: "image/jpeg",
                    data: data
                }
            });
        }

        // Самая стабильная ссылка для ключей AIza...
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();

        if (result.error) {
            console.error("Gemini Error:", result.error);
            return res.json({ reply: "Ошибка от Google: " + result.error.message });
        }

        const answer = result.candidates?.[0]?.content?.parts?.[0]?.text || "Модель промолчала...";
        res.json({ reply: answer });

    } catch (err) {
        console.error("Server Error:", err);
        res.json({ reply: "Ошибка сервера: " + err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Бот пашет на порту ${PORT}`));
