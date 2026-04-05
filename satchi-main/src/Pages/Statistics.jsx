"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Cell
} from "recharts";
import { Users, Target, TrendingUp, BarChart3, AlertCircle, ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function Statistics() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { token, isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        eventName: "",
        totalParticipants: 0,
        averageMark: 0,
        highestMark: 0,
        marks: []
    });

    useEffect(() => {
        const fetchStatistics = async () => {
            if (!isAuthenticated || !token) {
                setError("Please login to view statistics.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/api/statistics/${eventId}/`, {
                    headers: { Authorization: `Token ${token}` }
                });
                setStats(response.data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch statistics:", err);
                setError(err.response?.data?.error || "Failed to load statistics.");
            } finally {
                setLoading(false);
            }
        };

        if (eventId) fetchStatistics();
    }, [eventId, token, isAuthenticated]);

    const distributionData = useMemo(() => {
        if (!stats.marks || stats.marks.length === 0) return [];
        const bins = Array.from({ length: 10 }, (_, i) => ({
            range: `${i * 10}-${(i + 1) * 10}`,
            count: 0,
        }));

        stats.marks.forEach((mark) => {
            const m = Number(mark);
            const index = Math.min(Math.floor(m / 10), 9);
            if (index >= 0 && index < 10) bins[index].count++;
        });
        return bins;
    }, [stats.marks]);

    // Adaptive height logic based on the range with the maximum number of people
    const maxCount = distributionData.length > 0 ? Math.max(...distributionData.map(d => d.count)) : 0;
    const yMax = Math.ceil((maxCount + 1) / 5) * 5 || 5;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-amber-50">
            <div className="text-2xl font-bold text-[#ff6a3c] animate-pulse">Loading Statistics...</div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-amber-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button onClick={() => navigate(-1)} className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition">Go Back</button>
            </div>
        </div>
    );

    return (
        <div className="relative w-full min-h-screen px-4 sm:px-6 lg:px-8 py-20 font-body text-gray-800">
            {/* Background elements matched from Admin.jsx */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-amber-50 to-orange-100 z-0"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-200/[0.4] z-0"></div>

            <div className="relative z-10 max-w-6xl mx-auto pt-16">

                {/* Header Section mimicking Admin Dashboard style */}
                <div className="relative mb-12 flex flex-col items-center">
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate('/admin')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 border border-gray-200 text-gray-600 hover:text-[#ff6a3c] hover:border-[#ff6a3c] hover:bg-white hover:shadow-lg transition-all z-20"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={24} />
                    </motion.button>

                    <motion.div
                        initial={{ opacity: 0, y: -40 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text text-transparent pb-2 px-16">
                            {stats.eventName || "Event Statistics"}
                        </h1>
                        <p className="text-lg text-gray-600 mt-3 max-w-2xl mx-auto">
                            Manage and analyze performance metrics for this event.
                        </p>
                    </motion.div>
                </div>

                {/* Dashboard Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <StatCard title="Total Participants" value={stats.totalParticipants} icon={Users} delay={0.1} />
                        <StatCard title="Average Mark" value={`${stats.averageMark}%`} icon={TrendingUp} delay={0.2} />
                        <StatCard title="Highest Mark" value={`${stats.highestMark}%`} icon={Target} delay={0.3} />
                    </div>

                    {/* Glassmorphism Chart Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="lg:col-span-2 bg-white/80 backdrop-blur-lg border border-gray-200/90 rounded-2xl shadow-xl p-8"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                                <BarChart3 className="text-[#ff6a3c] w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Score Distribution</h2>
                                <p className="text-sm text-gray-500">Participant frequency across score ranges</p>
                            </div>
                        </div>

                        <div className="h-[400px] w-full">
                            {stats.marks.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={distributionData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} dy={10} />
                                        <YAxis domain={[0, yMax]} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                                        <Tooltip cursor={{ fill: '#fff7ed' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '12px' }} />
                                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                            {distributionData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#ff6a3c' : '#df9400'} fillOpacity={0.9} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <BarChart3 size={48} className="mb-4 opacity-20" />
                                    <p>No score data available yet.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, delay }) {
    return (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay }} className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{title}</p>
                    <h2 className="text-4xl font-bold mt-2 text-gray-800 group-hover:text-[#ff6a3c] transition-colors font-mono">{value}</h2>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-orange-50 transition-colors border border-gray-100 group-hover:border-orange-100">
                    <Icon className="w-8 h-8 text-gray-400 group-hover:text-[#ff6a3c] transition-colors" />
                </div>
            </div>
        </motion.div>
    );
}
