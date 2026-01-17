require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');


const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected 🔥'))
  .catch(err => console.error('MongoDB error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use('/api', authRoutes);
app.use('/api', eventRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Server running 👀');
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});