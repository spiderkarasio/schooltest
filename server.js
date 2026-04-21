const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();

// Настройки для обработки больших запросов (нужно для передачи фото)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

// Берем ключ, который ты вставил в Render (убедись, что имя совпадает!)
const GOOGLE_API_KEY = process.env.API_KEY; 

// Главная страница сайта
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Основной эндпоинт чата
app.post('/api/chat', async (req, res) => {
    try {
        const { message, imageBase64, imageType } = req.body;

        if (!GOOGLE_API_KEY) {
            return res.status(500).json({ reply: "Ошибка: API_KEY не найден в настройках сервера." });
        }

        // Формируем структуру запроса под Google Gemini 1.5 Flash
        const requestBody = {
            contents: [{
                parts: []
            }]
        };

        // Добавляем текст, если он есть
        if (message) {
            requestBody.contents[0].parts.push({ text: message });
        }

        // Добавляем картинку, если она была прикреплена
        if (imageBase64) {
            // Очищаем строку base64 от префикса (если он есть)
            const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
            requestBody.contents[0].parts.push({
                inline_data: {
                    mime_type: imageType || "image/jpeg",
                    data: cleanBase64
                }
            });
        }

        // Вызов API Google
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (data.error) {
            console.error("Детали ошибки от Google:", data.error);
            return res.status(500).json({ reply: `Ошибка Google API: ${data.error.message}` });
        }

        // Извлекаем текстовый ответ
        const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Не удалось получить ответ от модели.";
        
        res.json({ reply: botReply });

    } catch (err) {
        console.error("Ошибка сервера:", err);
        res.status(500).json({ reply: "Произошла ошибка на сервере: " + err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
