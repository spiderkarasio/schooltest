const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();

// 1. РАЗРЕШАЕМ CORS (чтобы браузер не блокировал запросы)
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Увеличиваем лимит для картинок
app.use(express.static(__dirname)); // Отдает index.html из корня

const API_KEY = process.env.API_KEY; 
const BASE_URL = "https://api.io.net/v1";

// ГЛАВНАЯ СТРАНИЦА
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ОБРАБОТКА ЧАТА
app.post('/api/chat', async (req, res) => {
    try {
        const { message, imageBase64, imageType } = req.body;

        // Если есть картинка, io.net может требовать специфический формат. 
        // Но для начала запустим просто текстовый чат, как в твоем примере.
        const response = await fetch(`${BASE_URL}/private/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "meta-llama/Llama-3.3-70B-Instruct",
                messages: [
                    { role: "system", content: "You are a helpful AI." },
                    { role: "user", content: message }
                ],
                max_tokens: 500
            })
        });

        const data = await response.json();
        
        if (data.error) {
            return res.status(500).json({ reply: "Ошибка API: " + data.error.message });
        }

        const reply = data.choices[0].message.content;
        res.json({ reply: reply });

    } catch (err) {
        res.status(500).json({ reply: "Ошибка сервера: " + err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
