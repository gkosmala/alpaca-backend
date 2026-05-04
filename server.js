const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());

const PORT = 4000;

const ALPACA_KEY = (process.env.ALPACA_KEY || "").trim();
const ALPACA_SECRET = (process.env.ALPACA_SECRET || "").trim();

const headers = {
  "APCA-API-KEY-ID": ALPACA_KEY,
  "APCA-API-SECRET-KEY": ALPACA_SECRET,
  Accept: "application/json",
};

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/debug/env", (req, res) => {
  res.json({
    alpacaKeyLoaded: Boolean(ALPACA_KEY),
    alpacaSecretLoaded: Boolean(ALPACA_SECRET),
    keyPreview: ALPACA_KEY ? `${ALPACA_KEY.slice(0, 4)}...${ALPACA_KEY.slice(-4)}` : null,
  });
});

app.get("/debug/account", async (req, res) => {
  const response = await fetch("https://paper-api.alpaca.markets/v2/account", {
    headers,
  });

  const text = await response.text();

  res.status(response.status).send(text);
});

app.get("/api/stock/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  const response = await fetch(
    `https://data.alpaca.markets/v2/stocks/${symbol}/snapshot?feed=iex`,
    { headers }
  );

  const text = await response.text();

  if (!response.ok) {
    return res.status(response.status).json({
      error: "Alpaca market data request failed",
      status: response.status,
      detail: text,
    });
  }

  const data = JSON.parse(text);

  res.json({
    symbol,
    last: data.latestTrade?.p ?? null,
    bid: data.latestQuote?.bp ?? null,
    ask: data.latestQuote?.ap ?? null,
    volume: data.dailyBar?.v ?? null,
    open: data.dailyBar?.o ?? null,
    high: data.dailyBar?.h ?? null,
    low: data.dailyBar?.l ?? null,
    close: data.dailyBar?.c ?? null,
    raw: data,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Alpaca key loaded: ${Boolean(ALPACA_KEY)}`);
  console.log(`Alpaca secret loaded: ${Boolean(ALPACA_SECRET)}`);
});