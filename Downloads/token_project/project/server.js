const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
//const bcrypt = require('bcryptjs');//option=argon can be aslo used,or SHA(cryptographic)
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect('', 
  {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Token = mongoose.model('Token', 
  {
  number: Number,
  customerName: String,
  status: { type: String, default: 'waiting' }, 
  createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin',
  {
  username: String,
  password: String
});
async function initAdmin() {
  const admin = await Admin.findOne({ username: 'admin' });
  if (!admin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await Admin.create({
      username: 'admin',
      password: hashedPassword
    });
  }
}
initAdmin();


//errors maybe
// MW to verify admin token
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, 'your-secret-key');
    req.admin = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};


app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });

  if (!admin) return res.status(400).json({ error: "Admin not found" });

  const validPassword = await bcrypt.compare(password, admin.password);
  if (!validPassword)
    return res.status(400).json({ error: "Invalid password" });
  // Routes
  const token = jwt.sign({ id: admin._id }, "your-secret-key");
  res.json({ token });
});

app.post('/api/tokens', async (req, res) => {
  const { customerName } = req.body;
  const lastToken = await Token.findOne().sort({ number: -1 });
  const newNumber = lastToken ? lastToken.number + 1 : 1;
  
  const token = new Token({
    number: newNumber,
    customerName
  });
  
  await token.save();
  res.json(token);
});

app.get('/api/tokens', async (req, res) => {
  const tokens = await Token.find({ status: 'waiting' }).sort({ createdAt: 1 });
  res.json(tokens);
});

app.delete('/api/tokens/:id', verifyAdmin, async (req, res) => {
  await Token.findByIdAndUpdate(req.params.id, { status: 'completed' });
  res.json({ message: 'Token completed' });
});

app.delete('/api/tokens', verifyAdmin, async (req, res) => {
  await Token.updateMany({ status: 'waiting' }, { status: 'completed' });
  res.json({ message: 'Queue cleared' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});