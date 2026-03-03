const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Stock = require('./models/Stock'); // Импортируем модель
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());


const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
    .then(() => console.log("MongoDB подключена!"))
    .catch(err => console.log("Ошибка БД:", err));

// 1. Маршрут для расчета И сохранения
app.post('/api/save-stock', async (req, res) => {
    const { ticker, price, dividend } = req.body;
    
    const yieldPercentage = ((dividend / price) * 100).toFixed(2) + "%";

    try {
        const newStock = new Stock({
            ticker,
            price,
            dividend,
            yield: yieldPercentage
        });

        await newStock.save(); // Сохраняем в базу
        res.json(newStock);
    } catch (err) {
        res.status(500).json({ error: "Ошибка при сохранении" });
    }
});

// 2. Маршрут для получения всех сохраненных акций
app.get('/api/stocks', async (req, res) => {
    const stocks = await Stock.find();
    res.json(stocks);
});

app.delete('/api/stocks/:id', async (req, res) => {
    try {
        const result = await Stock.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ error: "Акция не найдена" });
        }
        res.json({ message: "Акция успешно удалена" });
    } catch (err) {
        res.status(500).json({ error: "Ошибка при удалении из базы" });
    }
});

app.listen(5000, () => console.log("Сервер на порту 5000"));