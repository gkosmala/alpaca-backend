const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

const ALPACA_KEY = (process.env.ALPACA_KEY || "").trim();
const ALPACA_SECRET = (process.env.ALPACA_SECRET || "").trim();

console.log("🔥 NEW VERSION DEPLOYED - DYNAMIC STOCK ROUTE ACTIVE 🔥");

app.get("/", (req, res) => {
  res.send("Backend is running - dynamic stock route active");
});

app.get("/debug/env", (req, res) => {
  res.json({
    alpacaKeyLoaded: Boolean(ALPACA_KEY),
    alpacaSecretLoaded: Boolean(ALPACA_SECRET),
    keyPreview: ALPACA_KEY ? `${ALPACA_KEY.slice(0, 4)}...${ALPACA_KEY.slice(-4)}` : null,
  });
});

app.get("/api/stock/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    const url = `https://data.alpaca.markets/v2/stocks/${symbol}/snapshot?feed=iex`;

    const response = await fetch(url, {
      headers: {
        "APCA-API-KEY-ID": ALPACA_KEY,
        "APCA-API-SECRET-KEY": ALPACA_SECRET,
        Accept: "application/json",
      },
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Alpaca request failed",
        status: response.status,
        detail: text,
      });
    }

    const data = JSON.parse(text);

    return res.json({
      symbol,
      last: data.latestTrade?.p ?? null,
      bid: data.latestQuote?.bp ?? null,
      ask: data.latestQuote?.ap ?? null,
      volume: data.dailyBar?.v ?? null,
      open: data.dailyBar?.o ?? null,
      high: data.dailyBar?.h ?? null,
      low: data.dailyBar?.l ?? null,
      close: data.dailyBar?.c ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      message: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});