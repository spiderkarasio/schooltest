const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();

// Настройки
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

const API_KEY = process.env.API_KEY; 
const BASE_URL = "https://api.intelligence.io.solutions/api/v1";

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Сам чат
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const targetUrl = `${BASE_URL}/chat/completions`;

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gemma-4-26b-a4b-it", 
                messages: [
                    { role: "system", content: "You are a helpful school assistant." },
                    { role: "user", content: message }
                ],
                max_tokens: 1000
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            return res.status(response.status).json({ reply: `Ошибка API: ${data.error?.message || 'Неизвестно'}` });
        }

        const reply = data.choices[0].message.content;
        res.json({ reply: reply });

    } catch (err) {
        res.status(500).json({ reply: "Ошибка сервера: " + err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);
});
