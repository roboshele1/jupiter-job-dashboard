import axios from 'axios';

const API_KEY = 'jyA2YblY5AP7pkvNtyBhpfTNQcSczcAS';

export async function getQuote(symbol) {
    try {
        const res = await axios.get(`https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${API_KEY}`);
        const last = res.data.results[0];
        return {
            symbol,
            price: last.c,
            change: ((last.c - last.o)/last.o) * 100,
            plPercent: ((last.c - last.o)/last.o) * 100
        };
    } catch (e) {
        console.error(e);
        return { symbol, price: 0, change: 0, plPercent: 0 };
    }
}

