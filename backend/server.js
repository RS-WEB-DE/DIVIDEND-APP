const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Stock = require('./models/Stock'); 
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());


const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
    .then(() => console.log("MongoDB connected!"))
    .catch(err => console.log("DB Error:", err));

// 1. Route for calculation and saving
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

        await newStock.save(); // Save to database
        res.json(newStock);
    } catch (err) {
        res.status(500).json({ error: "Error while saving" });
    }
});

// 2. Route for obtaining all saved shares
app.get('/api/stocks', async (req, res) => {
    const stocks = await Stock.find();
    res.json(stocks);
});

app.delete('/api/stocks/:id', async (req, res) => {
    try {
        const result = await Stock.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ error: "Promotion not found" });
        }
        res.json({ message: "Promotion successfully deleted" });
    } catch (err) {
        res.status(500).json({ error: "Error when deleting from the database" });
    }
});

//app.listen(5000, () => console.log("Сервер на порту 5000"));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
console.log(`Server run on port ${PORT}`);
});