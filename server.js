const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ключ берем из настроек Render (Environment Variables)
const API_KEY = process.env.API_KEY; 
const BASE_URL = "https://api.intelligence.io.net/v1";

app.post('/api/chat', async (req, res) => {
    try {
        console.log("==> Запрос к io.net пошел...");
        
        const response = await fetch(`${BASE_URL}/private/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "meta-llama/Llama-3.3-70B-Instruct", // Модель из твоего примера
                messages: [
                    { role: "system", content: "You are a helpful AI." },
                    { role: "user", content: req.body.message }
                ],
                max_tokens: 500
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Ошибка io.net:", data.error);
            return res.status(500).json({ reply: "Ошибка API: " + (data.error.message || "Unknown error") });
        }

        // Извлекаем ответ
        const reply = data.choices[0].message.content;
        
        // Логируем подписи (как в твоем примере), если они есть
        if (response.headers.get("signature")) {
            console.log("Signature Verified:", response.headers.get("signature"));
        }

        res.json({ reply: reply });

    } catch (err) {
        console.error("Ошибка сервера:", err.message);
        res.status(500).json({ reply: "Ошибка связи с сервером" });
    }
});

// Настройка порта для Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер взлетел на порту ${PORT}`);
});
