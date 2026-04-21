const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();

// Настройки для приема больших данных (фотографий)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

// Ключ берется из Environment Variables в Render
const API_KEY = process.env.API_KEY; 

// Отдача главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Обработка чата
app.post('/api/chat', async (req, res) => {
    try {
        const { message, imageBase64 } = req.body;

        if (!API_KEY) {
            return res.status(500).json({ reply: "Ошибка: API_KEY не настроен в Render!" });
        }

        // Формируем запрос для Google Gemini
        const requestBody = {
            contents: [{
                parts: []
            }]
        };

        if (message) {
            requestBody.contents[0].parts.push({ text: message });
        }

        if (imageBase64) {
            const base64Data = imageBase64.split(',')[1] || imageBase64;
            requestBody.contents[0].parts.push({
                inline_data: {
                    mime_type: "image/jpeg",
                    data: base64Data
                }
            });
        }

        // Используем v1beta, так как она лучше всего дружит с Gemini 1.5 Flash
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        // Проверка ошибок от Google
        if (data.error) {
            console.error("Детали ошибки:", data.error);
            return res.json({ reply: "Ошибка API: " + data.error.message });
        }

        // Вывод ответа
        const botAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text || "Модель не смогла дать ответ.";
        res.json({ reply: botAnswer });

    } catch (err) {
        console.error("Ошибка сервера:", err);
        res.status(500).json({ reply: "Критическая ошибка сервера: " + err.message });
    }
});

// Запуск на порту Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
