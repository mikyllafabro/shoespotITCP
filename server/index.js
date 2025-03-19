const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

require('dotenv').config();
// Add this after dotenv.config()
console.log('MongoDB URI:', process.env.MONGO_URI ? 'Defined (hidden for security)' : 'Undefined');
console.log('PORT:', process.env.PORT || '(using default)');

const app = express();
const authRoutes = require('./routes/authRoutes');

// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import morgan from "morgan";

// import dotenv from "dotenv";
// import authRoutes from "./routes/authRoutes.js";

const ports = [
    process.env.PORT || 5000,  // First try the .env PORT or default to 5000
    3000,                      // Then try 3000
    8080,                      // Then try 8080 (avoiding 8081 which is used by Expo)
    0                          // Finally try any available port
  ];

const IP = process.env.IP || "localhost";

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.log('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*', // During development - allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
});

// Function to try starting server on different ports
async function startServer(portIndex = 0) {
    try {
      const port = ports[portIndex];
      
      app.listen(port, IP, () => {
        console.log(`✅ Server running on http://${IP}:${port}`);
        console.log(`API available at http://${IP}:${port}/api`);
      });
    } catch (error) {
      if (error.code === 'EADDRINUSE' && portIndex < ports.length - 1) {
        console.log(`Port ${ports[portIndex]} is busy, trying next port...`);
        startServer(portIndex + 1);
      } else {
        console.error('Failed to start server:', error);
      }
    }
  }
  
  // Start the server
  startServer();