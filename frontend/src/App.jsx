import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [ticker, setTicker] = useState('');
  const [price, setPrice] = useState('');
  const [dividend, setDividend] = useState('');
  const [stocks, setStocks] = useState([]); // Список акций из БД

  // Функция для загрузки списка акций
  const fetchStocks = async () => {
    const response = await axios.get('https://dividend-app-7fgd.onrender.com/api/stocks');
    setStocks(response.data);
  };

  // Загружаем данные при первом запуске страницы
  useEffect(() => {
    fetchStocks();
  }, []);

  const saveStock = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://dividend-app-7fgd.onrender.com/api/save-stock', {
        ticker,
        price: Number(price),
        dividend: Number(dividend)
      });
      // Очищаем форму и обновляем список
      setTicker('');
      setPrice('');
      setDividend('');
      fetchStocks(); 
    } catch (err) {
      alert("Ошибка при сохранении");
    }
  };

  const deleteStock = async (id) => {
    if (window.confirm("Удалить эту акцию?")) {
      try {
        await axios.delete(`https://dividend-app-7fgd.onrender.com/api/stocks/${id}`);
        // Фильтруем список в стейте, чтобы не делать лишний запрос к базе
        setStocks(stocks.filter(stock => stock._id !== id));
      } catch (err) {
        alert("Ошибка при удалении");
      }
    }
  };

  return (
    <div className="App">
      <h1>My Dividend Portfolio</h1>
      
      <form onSubmit={saveStock} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input placeholder="Тикер" value={ticker} onChange={(e) => setTicker(e.target.value)} />
        <input placeholder="Цена" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        <input placeholder="Дивиденд" type="number" value={dividend} onChange={(e) => setDividend(e.target.value)} />
        <button type="submit">Добавить в базу</button>
      </form>

      <table border="1" style={{ width: '100%', textAlign: 'left' }}>
        <thead>
          <tr>
            <th>Тикер</th>
            <th>Цена</th>
            <th>Дивиденд</th>
            <th>Доходность (%)</th>
				<th>Действие</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => (
            <tr key={stock._id}>
              <td>{stock.ticker}</td>
              <td>${stock.price}</td>
              <td>${stock.dividend}</td>
              <td>{stock.yield}</td>
				  <td>
          <button 
            onClick={() => deleteStock(stock._id)}
            style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', cursor: 'pointer', padding: '5px 10px' }}
          >
            Удалить
          </button>
        </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;