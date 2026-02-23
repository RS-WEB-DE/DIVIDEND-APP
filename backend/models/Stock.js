const mongoose = require('mongoose');

// Описываем структуру документа в базе
const StockSchema = new mongoose.Schema({
    ticker: String,      // Название акции
    price: Number,       
    dividend: Number,    
    yield: String,       // Процент доходности
    date: { type: Date, default: Date.now } // Дата добавления
});

module.exports = mongoose.model('Stock', StockSchema);