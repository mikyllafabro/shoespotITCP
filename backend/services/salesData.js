// services/salesData.js

const SalesModel = require('../models/Sale'); // Assuming you have a model for Sales data

// Function to fetch sales data
const fetchSalesData = async () => {
    try {
        // Aggregate sales data by date and sum the amount
        const salesData = await SalesModel.aggregate([
            { $group: { _id: "$date", totalSales: { $sum: "$amount" } } }
        ]);
        return salesData;
    } catch (error) {
        console.error("Error fetching sales data:", error);
        throw new Error('Database query failed');
    }
};

module.exports = { fetchSalesData };