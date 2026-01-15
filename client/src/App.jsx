import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Plus, Trash2, Save, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = '/api/expenses';

function App() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ amount: '', description: '', category: 'General' });

    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const days = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
    });

    useEffect(() => {
        fetchExpenses();
    }, [currentDate]);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}?month=${month}&year=${year}`);
            setExpenses(response.data);
        } catch (err) {
            console.error('Error fetching expenses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (date) => {
        try {
            const payload = {
                date,
                amount: parseFloat(editForm.amount) || 0,
                description: editForm.description || 'No description',
                category: editForm.category
            };

            if (editingId && !editingId.startsWith('new-')) {
                await axios.put(`${API_URL}/${editingId}`, payload);
            } else {
                await axios.post(API_URL, payload);
            }

            setEditingId(null);
            setEditForm({ amount: '', description: '', category: 'General' });
            fetchExpenses();
        } catch (err) {
            console.error('Error saving expense:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchExpenses();
        } catch (err) {
            console.error('Error deleting expense:', err);
        }
    };

    const startEditing = (expense, date) => {
        if (expense) {
            setEditingId(expense._id);
            setEditForm({
                amount: expense.amount.toString(),
                description: expense.description,
                category: expense.category
            });
        } else {
            setEditingId(`new-${date.toISOString()}`);
            setEditForm({ amount: '', description: '', category: 'General' });
        }
    };

    const totalCost = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return (
        <div className="app-container">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
            >
                <header className="header">
                    <h1>CostConnect</h1>
                    <div className="month-selector">
                        <Calendar size={18} />
                        <select
                            value={currentDate.getMonth()}
                            onChange={(e) => {
                                const newDate = new Date(currentDate);
                                newDate.setMonth(parseInt(e.target.value));
                                setCurrentDate(newDate);
                            }}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={i}>{format(new Date(currentDate.getFullYear(), i, 1), 'MMMM')}</option>
                            ))}
                        </select>
                        <select
                            value={currentDate.getFullYear()}
                            onChange={(e) => {
                                const newDate = new Date(currentDate);
                                newDate.setFullYear(parseInt(e.target.value));
                                setCurrentDate(newDate);
                            }}
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </header>

                <div className="summary-grid">
                    <div className="summary-item">
                        <div className="summary-label">Monthly Spending</div>
                        <div className="summary-value" style={{ color: 'var(--accent)' }}>
                            ₹{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="summary-item">
                        <div className="summary-label">Daily Average</div>
                        <div className="summary-value">
                            ₹{(totalCost / days.length).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="summary-item">
                        <div className="summary-label">Days Logged</div>
                        <div className="summary-value">
                            {new Set(expenses.map(e => format(new Date(e.date), 'yyyy-MM-dd'))).size} / {days.length}
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    {loading ? (
                        <div className="loader">Loading your finances...</div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>Amount (₹)</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {days.map((date) => {
                                        const dayExpenses = expenses.filter(e => isSameDay(new Date(e.date), date));
                                        const isAddingNew = editingId === `new-${date.toISOString()}`;

                                        return (
                                            <React.Fragment key={date.toISOString()}>
                                                {/* Day Header Row */}
                                                <tr className="date-header">
                                                    <td colSpan="5" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                        {format(date, 'MMM dd, EEE')}
                                                    </td>
                                                </tr>

                                                {/* Existing Entries for this Day */}
                                                {dayExpenses.map((exp) => (
                                                    <motion.tr
                                                        key={exp._id}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="date-row"
                                                    >
                                                        <td></td> {/* Empty date cell, header handles it */}
                                                        {editingId === exp._id ? (
                                                            <EditRow
                                                                editForm={editForm}
                                                                setEditForm={setEditForm}
                                                                onSave={() => handleSave(date)}
                                                                onCancel={() => setEditingId(null)}
                                                            />
                                                        ) : (
                                                            <>
                                                                <td>{exp.description}</td>
                                                                <td><span className="badge">{exp.category}</span></td>
                                                                <td><strong>₹{exp.amount.toFixed(2)}</strong></td>
                                                                <td>
                                                                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                                                                        <button className="btn-icon save" onClick={() => startEditing(exp, date)}><Save size={16} title="Edit" /></button>
                                                                        <button className="btn-icon delete" onClick={() => handleDelete(exp._id)}><Trash2 size={16} title="Delete" /></button>
                                                                    </div>
                                                                </td>
                                                            </>
                                                        )}
                                                    </motion.tr>
                                                ))}

                                                {/* Adding New Row for this Day */}
                                                {isAddingNew ? (
                                                    <motion.tr
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="date-row"
                                                    >
                                                        <td></td>
                                                        <EditRow
                                                            editForm={editForm}
                                                            setEditForm={setEditForm}
                                                            onSave={() => handleSave(date)}
                                                            onCancel={() => setEditingId(null)}
                                                        />
                                                    </motion.tr>
                                                ) : (
                                                    <tr className="date-row action-row">
                                                        <td></td>
                                                        <td colSpan="3" style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.8rem' }}>
                                                            {dayExpenses.length === 0 ? 'No entries for this day' : ''}
                                                        </td>
                                                        <td>
                                                            <button className="btn-icon add-btn" onClick={() => startEditing(null, date)}>
                                                                <Plus size={16} /> Add Entry
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </AnimatePresence>
                                <tr className="total-row">
                                    <td colSpan="3">Final Monthly Total spent</td>
                                    <td>₹{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

function EditRow({ editForm, setEditForm, onSave, onCancel }) {
    return (
        <>
            <td>
                <input
                    className="desc-input"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Lunch, Bus, Rent..."
                    autoFocus
                />
            </td>
            <td>
                <select
                    className="desc-input"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                >
                    <option value="General">General</option>
                    <option value="Food">Food</option>
                    <option value="Transport">Transport</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Other">Other</option>
                </select>
            </td>
            <td>
                <input
                    type="number"
                    className="cost-input"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    placeholder="0.00"
                />
            </td>
            <td>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button className="btn btn-primary" onClick={onSave}><Save size={18} /> Save</button>
                    <button className="btn btn-secondary" onClick={onCancel}><X size={18} /></button>
                </div>
            </td>
        </>
    );
}

export default App;
