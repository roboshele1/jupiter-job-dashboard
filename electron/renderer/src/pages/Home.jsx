import React, { useEffect, useState } from "react";
import TickerGrid from "../components/TickerGrid";
import { fetchLastQuote } from "../../../api/marketDataServiceNew";

const POLYGON_API_KEY = import.meta.env.VITE_POLYGON_API_KEY || "";

export default function Home() {
    const [portfolio, setPortfolio] = useState([
        { symbol: "AAPL", price: 0, dailyChange: 0, PL: 0 },
        { symbol: "MSFT", price: 0, dailyChange: 0, PL: 0 },
        { symbol: "NVDA", price: 0, dailyChange: 0, PL: 0 },
        { symbol: "AMZN", price: 0, dailyChange: 0, PL: 0 },
    ]);

    useEffect(() => {
        async function updateQuotes() {
            const updated = await Promise.all(
                portfolio.map(async (stock) => {
                    const quote = await fetchLastQuote(stock.symbol, POLYGON_API_KEY);
                    return { ...stock, price: quote.price, dailyChange: quote.change, PL: quote.PL };
                })
            );
            setPortfolio(updated);
        }
        updateQuotes();
    }, []);

    return <TickerGrid portfolio={portfolio} />;
}

