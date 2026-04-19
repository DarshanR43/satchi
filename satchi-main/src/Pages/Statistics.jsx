"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Cpu,
  Filter,
  Layers,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import { useAuth } from "../context/AuthContext";
import { API_URL } from "../lib/api";
import {
  getProjectCategoryLabel,
  PROJECT_CATEGORY_OPTIONS,
  SDG_OPTIONS,
} from "../lib/projectMeta";

export default function Statistics() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTrl, setSelectedTrl] = useState(null);
  const [selectedSdg, setSelectedSdg] = useState(null);
  const [stats, setStats] = useState({
    eventName: "",
    totalProjects: 0,
    totalParticipants: 0,
    evaluatedProjects: 0,
    averageMark: 0,
    highestMark: 0,
    marks: [],
    projectCategoryBreakdown: [],
    trlBreakdown: [],
    sdgBreakdown: [],
    projects: [],
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
          headers: { Authorization: `Token ${token}` },
        });
        setStats(response.data);
        setError(null);
      } catch (requestError) {
        console.error("Failed to fetch statistics:", requestError);
        setError(requestError.response?.data?.error || "Failed to load statistics.");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchStatistics();
    }
  }, [eventId, token, isAuthenticated]);

  const distributionData = useMemo(() => {
    if (!stats.marks?.length) return [];
    const bins = Array.from({ length: 10 }, (_, index) => ({
      range: `${index * 10}-${(index + 1) * 10}`,
      count: 0,
    }));

    stats.marks.forEach((mark) => {
      const numericMark = Number(mark);
      const index = Math.min(Math.floor(numericMark / 10), 9);
      if (index >= 0 && index < 10) {
        bins[index].count += 1;
      }
    });

    return bins;
  }, [stats.marks]);

  const categoryBreakdown = useMemo(() => {
    const incoming = Array.isArray(stats.projectCategoryBreakdown) ? stats.projectCategoryBreakdown : [];
    if (incoming.length > 0) {
      return incoming;
    }

    return PROJECT_CATEGORY_OPTIONS.map((option) => ({
      category: option.value,
      label: option.label,
      count: 0,
    }));
  }, [stats.projectCategoryBreakdown]);

  const filteredProjects = useMemo(() => {
    return (stats.projects || []).filter((project) => {
      const categoryMatch = selectedCategory ? project.projectCategory === selectedCategory : true;
      const trlMatch = selectedTrl ? Number(project.trlLevel) === Number(selectedTrl) : true;
      const sdgMatch = selectedSdg ? (project.sdgs || []).map(Number).includes(Number(selectedSdg)) : true;
      return categoryMatch && trlMatch && sdgMatch;
    });
  }, [selectedCategory, selectedSdg, selectedTrl, stats.projects]);

  const maxCount = distributionData.length > 0 ? Math.max(...distributionData.map((entry) => entry.count)) : 0;
  const yMax = Math.ceil((maxCount + 1) / 5) * 5 || 5;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        <div className="animate-pulse text-2xl font-bold text-[#ff6a3c]">Loading Statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-800">Access Denied</h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg bg-gray-800 px-6 py-2 text-white transition hover:bg-gray-900"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full px-4 py-20 font-body text-gray-800 sm:px-6 lg:px-8">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white via-amber-50 to-orange-100" />
      <div className="absolute left-0 top-0 z-0 h-full w-full bg-grid-gray-200/[0.4]" />

      <div className="relative z-10 mx-auto max-w-7xl pt-16">
        <div className="relative mb-12 flex flex-col items-center">
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate("/admin")}
            className="absolute left-0 top-1/2 z-20 rounded-full border border-gray-200 bg-white/80 p-3 text-gray-600 transition-all hover:border-[#ff6a3c] hover:bg-white hover:text-[#ff6a3c] hover:shadow-lg"
            title="Back to Dashboard"
          >
            <ArrowLeft size={24} />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text px-16 pb-2 text-5xl font-bold text-transparent md:text-6xl">
              {stats.eventName || "Event Statistics"}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">
              Drill into registrations by project category, TRL, and SDGs while keeping the judging metrics in view.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-6">
            <StatCard title="Total Teams" value={stats.totalProjects} icon={Users} delay={0.1} />
            <StatCard title="Total Participants" value={stats.totalParticipants} icon={Layers} delay={0.2} />
            <StatCard title="Evaluated Teams" value={stats.evaluatedProjects} icon={Trophy} delay={0.3} />
            <StatCard title="Average Mark" value={`${stats.averageMark}%`} icon={TrendingUp} delay={0.4} />
            <StatCard title="Highest Mark" value={`${stats.highestMark}%`} icon={Target} delay={0.5} />
          </div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="rounded-2xl border border-gray-200/90 bg-white/80 p-8 shadow-xl backdrop-blur-lg"
            >
              <div className="mb-8 flex items-center gap-3">
                <div className="rounded-xl border border-orange-100 bg-orange-50 p-3">
                  <BarChart3 className="h-6 w-6 text-[#ff6a3c]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Score Distribution</h2>
                  <p className="text-sm text-gray-500">Team frequency across score ranges</p>
                </div>
              </div>

              <div className="h-[360px] w-full">
                {stats.marks.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }} dy={10} />
                      <YAxis domain={[0, yMax]} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dx={-10} />
                      <Tooltip
                        cursor={{ fill: "#fff7ed" }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          padding: "12px",
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {distributionData.map((_, index) => (
                          <Cell key={`distribution-cell-${index}`} fill={index % 2 === 0 ? "#ff6a3c" : "#df9400"} fillOpacity={0.9} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-gray-400">
                    <BarChart3 size={48} className="mb-4 opacity-20" />
                    <p>No score data available yet.</p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="rounded-2xl border border-gray-200/90 bg-white/80 p-8 shadow-xl backdrop-blur-lg"
            >
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Project Filters</h2>
                  <p className="text-sm text-gray-500">Click a category, TRL, or SDG tile to drill into matching teams.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedTrl(null);
                    setSelectedSdg(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
                >
                  <Filter size={16} />
                  Clear Filters
                </button>
              </div>

              <div className="grid gap-8 xl:grid-cols-3">
                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Project Category</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    {categoryBreakdown.map((entry) => {
                      const active = selectedCategory === entry.category;
                      return (
                        <button
                          key={`category-${entry.category}`}
                          type="button"
                          onClick={() => setSelectedCategory(active ? null : entry.category)}
                          className={`rounded-2xl border px-4 py-4 text-left transition ${
                            active
                              ? "border-[#ff6a3c] bg-orange-50 shadow-sm"
                              : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-gray-800">{entry.label}</p>
                              <p className="mt-1 text-xs leading-5 text-gray-500">Registered teams in this category</p>
                            </div>
                            <span className="text-2xl font-bold text-[#ff6a3c]">{entry.count}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">TRL Breakdown</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {stats.trlBreakdown.map((entry) => {
                      const active = selectedTrl === entry.trlLevel;
                      return (
                        <button
                          key={`trl-${entry.trlLevel}`}
                          type="button"
                          onClick={() => setSelectedTrl(active ? null : entry.trlLevel)}
                          className={`rounded-2xl border px-4 py-4 text-left transition ${
                            active
                              ? "border-[#ff6a3c] bg-orange-50 shadow-sm"
                              : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/50"
                          }`}
                        >
                          <p className="text-sm font-bold text-gray-800">TRL {entry.trlLevel}</p>
                          <p className="mt-1 text-2xl font-bold text-[#ff6a3c]">{entry.count}</p>
                          <p className="text-xs text-gray-500">projects</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">SDG Breakdown</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {stats.sdgBreakdown.map((entry) => {
                      const option = SDG_OPTIONS.find((candidate) => candidate.value === entry.sdg);
                      const active = selectedSdg === entry.sdg;
                      return (
                        <button
                          key={`sdg-${entry.sdg}`}
                          type="button"
                          onClick={() => setSelectedSdg(active ? null : entry.sdg)}
                          className={`rounded-2xl border px-4 py-4 text-left transition ${
                            active
                              ? "border-[#ff6a3c] bg-orange-50 shadow-sm"
                              : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-gray-800">{option?.label || `SDG ${entry.sdg}`}</p>
                              <p className="mt-1 text-xs leading-5 text-gray-500">{option?.title}</p>
                            </div>
                            <span className="text-2xl font-bold text-[#ff6a3c]">{entry.count}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="rounded-2xl border border-gray-200/90 bg-white/80 p-8 shadow-xl backdrop-blur-lg"
            >
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Projects</h2>
                  <p className="text-sm text-gray-500">
                    Showing {filteredProjects.length} of {stats.projects.length} teams
                    {selectedCategory ? ` | ${getProjectCategoryLabel(selectedCategory)}` : ""}
                    {selectedTrl ? ` | TRL ${selectedTrl}` : ""}
                    {selectedSdg ? ` | SDG ${selectedSdg}` : ""}
                  </p>
                </div>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-14 text-center text-sm text-gray-500">
                  No projects match the current category, TRL, and SDG filters.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProjects.map((project) => (
                    <div key={project.projectId} className="rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-bold text-gray-900">{project.teamName}</h3>
                            {project.projectCategory && (
                              <button
                                type="button"
                                onClick={() => setSelectedCategory(project.projectCategory)}
                                className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-200"
                              >
                                {getProjectCategoryLabel(project.projectCategory)}
                              </button>
                            )}
                            {project.trlLevel && (
                              <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-[#df9400]">
                                TRL {project.trlLevel}
                              </span>
                            )}
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                project.isEvaluated ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {project.isEvaluated ? "Evaluated" : "Pending"}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-gray-600">{project.projectTopic}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                          <p className="font-semibold text-gray-800">Final Score</p>
                          <p>{project.finalScore ?? "Not evaluated"}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Captain</p>
                          <p className="font-semibold text-gray-800">{project.captain?.name}</p>
                          <p className="text-sm text-gray-600">{project.captain?.email}</p>
                          {project.captain?.phone && <p className="text-sm text-gray-600">{project.captain.phone}</p>}
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Team Members</p>
                          {project.teamMembers?.length > 0 ? (
                            <div className="space-y-2">
                              {project.teamMembers.map((member, index) => (
                                <div key={`${project.projectId}-member-${member.email || index}`} className="text-sm text-gray-600">
                                  <p className="font-semibold text-gray-800">{member.name}</p>
                                  {member.email && <p>{member.email}</p>}
                                  {member.phone && <p>{member.phone}</p>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No additional team members recorded.</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {project.projectCategory && (
                          <button
                            type="button"
                            onClick={() => setSelectedCategory(project.projectCategory)}
                            className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-200"
                          >
                            <Cpu size={12} />
                            {getProjectCategoryLabel(project.projectCategory)}
                          </button>
                        )}
                        {(project.sdgs || []).map((sdg) => {
                          const option = SDG_OPTIONS.find((candidate) => candidate.value === Number(sdg));
                          return (
                            <button
                              key={`${project.projectId}-sdg-chip-${sdg}`}
                              type="button"
                              onClick={() => setSelectedSdg(Number(sdg))}
                              className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-[#df9400] transition hover:bg-orange-200"
                            >
                              {option?.label || `SDG ${sdg}`}
                            </button>
                          );
                        })}
                        {project.facultyMentorName && (
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            Mentor: {project.facultyMentorName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="group rounded-2xl border border-gray-200 bg-white/70 p-6 shadow-sm transition-all hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</p>
          <h2 className="mt-2 font-mono text-4xl font-bold text-gray-800 transition-colors group-hover:text-[#ff6a3c]">
            {value}
          </h2>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-colors group-hover:border-orange-100 group-hover:bg-orange-50">
          <Icon className="h-8 w-8 text-gray-400 transition-colors group-hover:text-[#ff6a3c]" />
        </div>
      </div>
    </motion.div>
  );
}
