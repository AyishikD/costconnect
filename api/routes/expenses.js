const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// Get all expenses for a specific month and year
router.get('/', async (req, res) => {
    try {
        const { month, year } = req.query;
        console.log(`[Expenses] Fetching for month=${month}, year=${year}`);

        if (!month || !year) {
            console.warn('[Expenses] Missing month or year');
            return res.status(400).json({ message: 'Month and year are required' });
        }

        // Use UTC boundaries to avoid timezone shifts
        // We widen the range by 12 hours on each side to catch records
        // saved in local timezones (like IST) that might fall just outside
        // a strict UTC month boundary.
        const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
        startDate.setHours(startDate.getHours() - 12);

        const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
        endDate.setHours(endDate.getHours() + 12);

        console.log(`[Expenses] Widened UTC Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

        const expenses = await Expense.find({
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        console.log(`[Expenses] Found ${expenses.length} records in range`);
        res.json(expenses);
    } catch (err) {
        console.error('[Expenses] Error fetching:', err.message);
        res.status(500).json({ message: err.message });
    }
});

// Add a new expense
router.post('/', async (req, res) => {
    const expense = new Expense({
        date: req.body.date,
        description: req.body.description,
        category: req.body.category,
        amount: req.body.amount
    });

    try {
        const newExpense = await expense.save();
        res.status(201).json(newExpense);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update an expense
router.put('/:id', async (req, res) => {
    try {
        const updatedExpense = await Expense.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedExpense);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete an expense
router.delete('/:id', async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
