require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const meRoutes = require('./routes/me');
const listeningTracker = require('./services/listeningTracker');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/me', meRoutes);

app.get('/', (req, res) => res.send('Spotify Listening Tracker API'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // start background tracker
  listeningTracker.start();
});
