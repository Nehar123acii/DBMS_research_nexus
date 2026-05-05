const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;

const connectMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        isConnected = true;
        console.log('MongoDB Connected Successfully');
    } catch (err) {
        isConnected = false;
        console.error('MongoDB Connection Error (Falling back to JSON): ', err.message);
    }
};

const getMongoStatus = () => isConnected;

module.exports = { connectMongo, getMongoStatus };
