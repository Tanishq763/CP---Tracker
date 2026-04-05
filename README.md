# ⚡ CP Problem Tracker

A full-stack web app to analyze your Codeforces profile, discover weak topics, and get smart problem recommendations.

---

## 🚀 Features

- 📊 **Dashboard** — rating, solved count, tag breakdown, rating history chart
- 📉 **Weak Tag Detection** — finds topics you've solved least
- 🎯 **Smart Recommendations** — unsolved problems filtered by your weak tags + rating range
- ⚡ **Caching** — avoids repeated API hits
- 🌙 **Dark UI** — built for CP guys

---

## 🛠️ Tech Stack

| Layer     | Tech                          |
|-----------|-------------------------------|
| Frontend  | React + Vite + Tailwind CSS   |
| Charts    | Recharts                      |
| Backend   | Node.js + Express             |
| API       | Codeforces Public API         |
| Cache     | node-cache (in-memory)        |

---

## 📁 Project Structure

```
cp-tracker/
├── server/                   # Express backend
│   ├── index.js
│   ├── cache/cache.js
│   ├── routes/codeforces.js
│   └── controllers/
│       ├── statsController.js
│       └── recommender.js
│
└── client/                   # React frontend
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── pages/
        │   ├── Dashboard.jsx
        │   └── Recommendations.jsx
        └── components/
            ├── Navbar.jsx
            ├── SearchBar.jsx
            ├── StatCard.jsx
            ├── TagChart.jsx
            └── RatingGraph.jsx
```

---

## ⚙️ Setup & Run

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/cp-tracker.git
cd cp-tracker
```

### 2. Start the backend
```bash
cd server
npm install
npm run dev
# Runs on http://localhost:5000
```

### 3. Start the frontend
```bash
cd client
npm install
npm run dev
# Open http://localhost:5173
```

### 4. Use it
- Enter any Codeforces handle (e.g. `tourist`, `jiangly`, or yours)
- Click **Analyze →**
- Switch to **Recommendations** tab to see suggested problems

---

## 🌐 Deploy for Free

| Service  | Platform                                      |
|----------|-----------------------------------------------|
| Frontend | [Vercel](https://vercel.com) (root: `client`) |
| Backend  | [Render](https://render.com) (root: `server`) |

Set `VITE_API_URL` in Vercel to your Render backend URL if deploying separately.

---

## 📌 API Endpoints

```
GET /api/user/:handle/stats       → profile, rating, solved count, tags, history
GET /api/user/:handle/recommend   → weak tags + recommended unsolved problems
```

---

## 🔮 Future Ideas

- [ ] LeetCode integration
- [ ] Contest countdown timer
- [ ] Compare two CF users side by side
- [ ] Export stats as a shareable card
- [ ] Streak tracker (daily solve streak)

---

Made with ❤️ for the CP community.
