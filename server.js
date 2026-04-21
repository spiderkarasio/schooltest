app.post('/api/chat', async (req, res) => {
    try {
        const { message, imageBase64 } = req.body;
        
        // Официальный эндпоинт io.net
        const targetUrl = `https://api.intelligence.io.solutions/api/v1/chat/completions`;

        console.log("==> Запрос к Gemma-4-26b...");

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // Если io.net не примет точное имя gemma-4-26b-a4b-it, 
                // попробуй заменить на "google/gemma-2-27b-it"
                model: "gemma-4-26b-a4b-it", 
                messages: [
                    { role: "system", content: "You are a helpful and concise school assistant." },
                    { role: "user", content: message }
                ],
                max_tokens: 1000,
                temperature: 0.6 // Для школы лучше поменьше креатива, побольше точности
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Детали ошибки:", data);
            return res.status(response.status).json({ 
                reply: `Ошибка: ${data.error?.message || 'Модель не ответила'}` 
            });
        }

        const reply = data.choices[0].message.content;
        res.json({ reply: reply });

    } catch (err) {
        console.error("Ошибка сервера:", err.message);
        res.status(500).json({ reply: "Технические шоколадки: " + err.message });
    }
});
