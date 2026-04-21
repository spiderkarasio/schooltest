const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
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
        const { message, imageBase64 } = req.body;

        if (!API_KEY) {
            return res.json({ reply: "Ошибка: В Render не добавлен API_KEY!" });
        }

        // Мы используем gemini-pro, так как твой ключ Cloud её точно увидит
        // Если хочешь именно Flash, поменяй обратно, но сначала проверь на этой!
        const MODEL = "gemini-pro"; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

        const requestBody = {
            contents: [{
                parts: [{ text: message || "Привет!" }]
            }]
        };

        // Картинки gemini-pro (текстовая версия) не всегда ест, 
        // поэтому для фото лучше использовать gemini-pro-vision
        if (imageBase64) {
            const data = imageBase64.split(',')[1] || imageBase64;
            requestBody.contents[0].parts.push({
                inline_data: {
                    mime_type: "image/jpeg",
                    data: data
                }
            });
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();

        if (result.error) {
            // Если он снова пишет "not found", значит API не включен в консоли
            return res.json({ 
                reply: `Ошибка: ${result.error.message}. СОВЕТ: Зайди в Google Cloud Console и ВКЛЮЧИ 'Generative Language API'.` 
            });
        }

        const answer = result.candidates?.[0]?.content?.parts?.[0]?.text || "Пустой ответ.";
        res.json({ reply: answer });

    } catch (err) {
        res.json({ reply: "Ошибка: " + err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server live on ${PORT}`));
