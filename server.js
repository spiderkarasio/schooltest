const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();

// Берем токен из переменных окружения Render
const TOKEN = process.env.API_KEY; 

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    try {
        if (!TOKEN) {
            return res.status(500).json({ reply: "Ошибка: Токен (API_KEY) не настроен в Render!" });
        }

        // URL для Google Cloud / AI Studio через Bearer токен
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                // Используем Bearer, как ты просил
                'Authorization': `Bearer ${TOKEN}` 
            },
            body: JSON.stringify({
                contents: [{ 
                    parts: [{ text: req.body.message }] 
                }]
            })
            // Агент убран, так как на Render он вызовет ошибку подключения
        });

        const data = await response.json();

        if (data.error) {
            console.error("GOOGLE ERROR:", data.error);
            // Если будет 404, значит путь /models/gemini-1.5-flash через Bearer не подходит
            return res.status(500).json({ reply: `Ошибка: ${data.error.message}` });
        }

        if (!data.candidates || !data.candidates[0]) {
            return res.json({ reply: "Модель не прислала текст. Проверь логи." });
        }

        res.json({ reply: data.candidates[0].content.parts[0].text });

    } catch (err) {
        console.error("SERVER ERROR:", err.message);
        res.status(500).json({ reply: "Ошибка на сервере: " + err.message });
    }
});

// Используем порт, который дает Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
