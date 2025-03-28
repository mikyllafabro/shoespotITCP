const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const express = require('express');
const app = express();
const cookieParser = require('cookie-parser')
const cors = require('cors')
const products = require('./routes/product');
const authRoute = require('./routes/authRoute');
const orderListRoutes = require('./routes/orderlist');
// const orderRoutes = require('./routes/order');
const orderRoutes = require('./routes/orderRoutes');
const order = require('./routes/order');
const { admin } = require('./utils/firebaseConfig')

app.use(express.urlencoded({limit: "50mb", extended: true }));
app.use(cors({
    origin: [
        'http://localhost:5000',
        'http://localhost:5173',
        'http://192.168.1.198:5000',
        'http://192.168.1.198:19000', // Expo development server
        'http://192.168.1.198:19001', // Expo development server alternative port
        'http://192.168.1.198:19002', // Expo development server alternative port
        'exp://192.168.1.198:19000', // Expo client
    ],
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Cache-Control",
        "Expires",
        "Pragma",
        "Accept"
    ],
    credentials: true,
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
}));

app.use(cookieParser());
app.use(express.json());

// Firebase Cloud Messaging setup
const messaging = admin.messaging(); // Initialize messaging instance

// Example route to send a push notification
app.post('/api/v1/send-notification', async (req, res) => {
  const { token, title, body } = req.body; // Token sent from the client app
  const message = {
    notification: {
      title: title || 'Default Title',
      body: body || 'Default Body',
    },
    token: token, // FCM device token from the front-end
  };

  try {
    const response = await messaging.send(message); // Send the notification
    console.log('Notification sent successfully:', response);
    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.use('/api/v1', products);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1', orderListRoutes);
// app.use('/api/v1', orderRoutes);

app.use('/api/v1', orderRoutes);

app.use('/api/v1', order);


module.exports = app