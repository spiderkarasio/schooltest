const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const API_KEY = process.env.API_KEY; 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    try {
        const response = await fetch('https://api.intelligence.io.solutions/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gemma-4-26b-a4b-it", 
                messages: [{ role: "user", content: req.body.message }]
            })
        });

        const data = await response.json();
        res.json({ reply: data.choices?.[0]?.message?.content || "Ошибка: " + JSON.stringify(data) });
    } catch (err) {
        res.json({ reply: "Ошибка сервера: " + err.message });
    }
});

app.listen(process.env.PORT || 3000, '0.0.0.0');
