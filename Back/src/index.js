require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const meRoutes = require('./routes/me');
const listeningTracker = require('./services/listeningTracker');
const searchRoutes = require('./routes/search');
const tracksRoutes = require('./routes/tracks');
const spotifyRoutes = require('./routes/spotify.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/me', meRoutes);
app.use('/search', searchRoutes);   
app.use('/tracks', tracksRoutes);
app.use('/spotify', spotifyRoutes);
app.use(express.static(path.join(__dirname, '../public'))); 

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // start background tracker
  listeningTracker.start();
});
