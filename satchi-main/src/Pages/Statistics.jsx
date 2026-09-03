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
  Download,
  Filter,
  Layers,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Search,
  CheckCircle,
  Clock,
  ChevronDown,
  ArrowUpDown,
  X,
  Award,
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
  const [selectedEvaluationStatus, setSelectedEvaluationStatus] = useState("ALL"); // "ALL" | "EVALUATED" | "NOT_EVALUATED"
  const [projectSearchTerm, setProjectSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("DEFAULT"); // "DEFAULT" | "SCORE_DESC" | "SCORE_ASC" | "NAME_ASC"
  const [expandedMarks, setExpandedMarks] = useState({});

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

  const evaluatedCount = useMemo(
    () => (stats.projects || []).filter((p) => Boolean(p.isEvaluated)).length,
    [stats.projects]
  );
  const notEvaluatedCount = useMemo(
    () => (stats.projects || []).filter((p) => !Boolean(p.isEvaluated)).length,
    [stats.projects]
  );

  const filteredProjects = useMemo(() => {
    let result = (stats.projects || []).filter((project) => {
      const categoryMatch = selectedCategory ? project.projectCategory === selectedCategory : true;
      const trlMatch = selectedTrl ? Number(project.trlLevel) === Number(selectedTrl) : true;
      const sdgMatch = selectedSdg ? (project.sdgs || []).map(Number).includes(Number(selectedSdg)) : true;
      
      const evalMatch =
        selectedEvaluationStatus === "ALL" ||
        (selectedEvaluationStatus === "EVALUATED" && Boolean(project.isEvaluated)) ||
        (selectedEvaluationStatus === "NOT_EVALUATED" && !Boolean(project.isEvaluated));

      const term = projectSearchTerm.trim().toLowerCase();
      const searchMatch = !term || (
        (project.teamName || "").toLowerCase().includes(term) ||
        (project.projectTopic || "").toLowerCase().includes(term) ||
        (project.captain?.name || "").toLowerCase().includes(term) ||
        (project.captain?.email || "").toLowerCase().includes(term) ||
        (getProjectCategoryLabel(project.projectCategory) || "").toLowerCase().includes(term) ||
        String(project.projectId || "").includes(term)
      );

      return categoryMatch && trlMatch && sdgMatch && evalMatch && searchMatch;
    });

    if (sortBy === "SCORE_DESC") {
      result = [...result].sort((a, b) => (Number(b.finalScore) || 0) - (Number(a.finalScore) || 0));
    } else if (sortBy === "SCORE_ASC") {
      result = [...result].sort((a, b) => (Number(a.finalScore) || 0) - (Number(b.finalScore) || 0));
    } else if (sortBy === "NAME_ASC") {
      result = [...result].sort((a, b) => (a.teamName || "").localeCompare(b.teamName || ""));
    }

    return result;
  }, [selectedCategory, selectedSdg, selectedTrl, selectedEvaluationStatus, projectSearchTerm, sortBy, stats.projects]);

  const toggleExpandMarks = (projectId) => {
    setExpandedMarks((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSelectedTrl(null);
    setSelectedSdg(null);
    setSelectedEvaluationStatus("ALL");
    setProjectSearchTerm("");
    setSortBy("DEFAULT");
  };

  const hasActiveFilters = Boolean(
    selectedCategory ||
    selectedTrl ||
    selectedSdg ||
    selectedEvaluationStatus !== "ALL" ||
    projectSearchTerm ||
    sortBy !== "DEFAULT"
  );

  const handleDownloadCSV = () => {
    const headers = [
      "Project ID",
      "Team Name",
      "Project Topic",
      "Project Category",
      "TRL Level",
      "SDGs",
      "Faculty Mentor",
      "Captain Name",
      "Captain Email",
      "Captain Phone",
      "Team Members",
      "Evaluated",
      "Final Score",
      "Total Score",
      "Disqualified",
      "Remarks",
      "Judge Marks Breakdown",
    ];

    const rows = filteredProjects.map((project) => {
      const categoryLabel = getProjectCategoryLabel(project.projectCategory) || project.projectCategory || "";
      const sdgLabels = (project.sdgs || []).map((s) => `SDG ${s}`).join(", ");
      
      const membersList = (project.teamMembers || [])
        .map((m) => {
          let text = m.name || "";
          if (m.email) text += ` <${m.email}>`;
          if (m.phone) text += ` (${m.phone})`;
          return text;
        })
        .join("; ");

      const judgeMarksStr = (project.judgeMarks || [])
        .map((jm) => {
          let str = `${jm.judgeName}: ${jm.mark}`;
          if (jm.rubricMarks && jm.rubricMarks.length > 0) {
            const rubricsStr = jm.rubricMarks.map((rm) => `${rm.rubricName}: ${rm.mark}`).join(", ");
            str += ` (${rubricsStr})`;
          }
          if (jm.comments) {
            str += ` [Note: ${jm.comments}]`;
          }
          return str;
        })
        .join("; ");

      return [
        project.projectId || "",
        project.teamName || "",
        project.projectTopic || "",
        categoryLabel,
        project.trlLevel ? `TRL ${project.trlLevel}` : "",
        sdgLabels,
        project.facultyMentorName || "",
        project.captain?.name || "",
        project.captain?.email || "",
        project.captain?.phone || "",
        membersList,
        project.isEvaluated ? "Yes" : "No",
        project.finalScore !== null && project.finalScore !== undefined ? project.finalScore : "",
        project.totalScore !== null && project.totalScore !== undefined ? project.totalScore : "",
        project.isDisqualified ? "Yes" : "No",
        project.remarks || "",
        judgeMarksStr,
      ];
    });

    const csvContent = [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map((row) =>
        row.map((val) => {
          const strVal = String(val);
          return `"${strVal.replace(/"/g, '""')}"`;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const eventSlug = (stats.eventName || "event")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${eventSlug}-filtered-projects.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              Drill into registrations, evaluations, and judge marks by category, TRL, and SDGs.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
          {/* Left Column: Stat Cards */}
          <div className="space-y-6">
            <StatCard 
              title="Total Teams" 
              value={stats.totalProjects} 
              icon={Users} 
              delay={0.1}
              onClick={() => setSelectedEvaluationStatus("ALL")}
              active={selectedEvaluationStatus === "ALL"}
            />
            <StatCard title="Total Participants" value={stats.totalParticipants} icon={Layers} delay={0.2} />
            <StatCard 
              title="Evaluated Teams" 
              value={stats.evaluatedProjects} 
              icon={Trophy} 
              delay={0.3}
              onClick={() => setSelectedEvaluationStatus(selectedEvaluationStatus === "EVALUATED" ? "ALL" : "EVALUATED")}
              active={selectedEvaluationStatus === "EVALUATED"}
              badge={stats.totalProjects > 0 ? `${Math.round((stats.evaluatedProjects / stats.totalProjects) * 100)}%` : null}
            />
            <StatCard title="Average Mark" value={`${stats.averageMark}%`} icon={TrendingUp} delay={0.4} />
            <StatCard title="Highest Mark" value={`${stats.highestMark}%`} icon={Target} delay={0.5} />
          </div>

          {/* Right Column: Graphs, Filters & Project Cards */}
          <div className="space-y-8">
            {/* Score Distribution Chart */}
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

            {/* Project Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="rounded-2xl border border-gray-200/90 bg-white/80 p-8 shadow-xl backdrop-blur-lg"
            >
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Project Filters</h2>
                  <p className="text-sm text-gray-500">Filter by evaluation status, project category, TRL, or SDG.</p>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
                  >
                    <Filter size={16} />
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Evaluation Status Filter Cards */}
              <div className="mb-8">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Evaluation Status</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setSelectedEvaluationStatus(selectedEvaluationStatus === "ALL" ? "ALL" : "ALL")}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      selectedEvaluationStatus === "ALL"
                        ? "border-[#ff6a3c] bg-orange-50/70 shadow-sm"
                        : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-gray-800">All Teams</p>
                        <p className="mt-1 text-xs leading-5 text-gray-500">Total registered projects</p>
                      </div>
                      <span className="text-2xl font-bold text-gray-800">{stats.totalProjects}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedEvaluationStatus(selectedEvaluationStatus === "EVALUATED" ? "ALL" : "EVALUATED")}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      selectedEvaluationStatus === "EVALUATED"
                        ? "border-green-500 bg-green-50/70 shadow-sm ring-1 ring-green-500"
                        : "border-gray-200 bg-white hover:border-green-200 hover:bg-green-50/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-gray-800">Evaluated</p>
                          <CheckCircle size={14} className="text-green-600" />
                        </div>
                        <p className="mt-1 text-xs leading-5 text-gray-500">Graded with marks</p>
                      </div>
                      <span className="text-2xl font-bold text-green-600">{evaluatedCount}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedEvaluationStatus(selectedEvaluationStatus === "NOT_EVALUATED" ? "ALL" : "NOT_EVALUATED")}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      selectedEvaluationStatus === "NOT_EVALUATED"
                        ? "border-orange-500 bg-orange-50/70 shadow-sm ring-1 ring-orange-500"
                        : "border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-gray-800">Not Evaluated</p>
                          <Clock size={14} className="text-orange-500" />
                        </div>
                        <p className="mt-1 text-xs leading-5 text-gray-500">Pending evaluation</p>
                      </div>
                      <span className="text-2xl font-bold text-[#df9400]">{notEvaluatedCount}</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid gap-8 xl:grid-cols-3">
                {/* Project Category */}
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
                              <p className="mt-1 text-xs leading-5 text-gray-500">Registered teams</p>
                            </div>
                            <span className="text-2xl font-bold text-[#ff6a3c]">{entry.count}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* TRL Breakdown */}
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

                {/* SDG Breakdown */}
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

            {/* Projects & Marks Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="rounded-2xl border border-gray-200/90 bg-white/80 p-8 shadow-xl backdrop-blur-lg space-y-6"
            >
              {/* Section Header */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-gray-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-900">Project Teams & Marks</h2>
                    <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-[#ff6a3c]">
                      {filteredProjects.length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Showing {filteredProjects.length} of {stats.projects.length} teams
                    {selectedEvaluationStatus === "EVALUATED" ? " • Evaluated Only" : selectedEvaluationStatus === "NOT_EVALUATED" ? " • Pending Only" : ""}
                    {selectedCategory ? ` • ${getProjectCategoryLabel(selectedCategory)}` : ""}
                    {selectedTrl ? ` • TRL ${selectedTrl}` : ""}
                    {selectedSdg ? ` • SDG ${selectedSdg}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {filteredProjects.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDownloadCSV}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#ff6a3c] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#e0562b]"
                    >
                      <Download size={16} />
                      Download Projects (CSV)
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Filter & Search Bar */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12 items-center">
                {/* Search Box */}
                <div className="relative md:col-span-6">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search by team, captain, topic, ID..."
                    value={projectSearchTerm}
                    onChange={(e) => setProjectSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm placeholder-gray-400 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                  />
                  {projectSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setProjectSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Evaluation Status Quick Tabs */}
                <div className="flex items-center bg-gray-100/90 p-1 rounded-xl text-xs font-bold md:col-span-4 select-none">
                  <button
                    type="button"
                    onClick={() => setSelectedEvaluationStatus("ALL")}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
                      selectedEvaluationStatus === "ALL"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    All ({stats.totalProjects})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEvaluationStatus("EVALUATED")}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                      selectedEvaluationStatus === "EVALUATED"
                        ? "bg-white text-green-700 shadow-sm"
                        : "text-gray-500 hover:text-green-700"
                    }`}
                  >
                    <span>Evaluated</span>
                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.2 rounded-full font-bold">
                      {evaluatedCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEvaluationStatus("NOT_EVALUATED")}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                      selectedEvaluationStatus === "NOT_EVALUATED"
                        ? "bg-white text-orange-600 shadow-sm"
                        : "text-gray-500 hover:text-orange-600"
                    }`}
                  >
                    <span>Pending</span>
                    <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.2 rounded-full font-bold">
                      {notEvaluatedCount}
                    </span>
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-8 text-xs font-bold text-gray-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                    >
                      <option value="DEFAULT">Sort: Default</option>
                      <option value="SCORE_DESC">Score: High to Low</option>
                      <option value="SCORE_ASC">Score: Low to High</option>
                      <option value="NAME_ASC">Team: A to Z</option>
                    </select>
                    <ArrowUpDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Projects List */}
              {filteredProjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-14 text-center text-sm text-gray-500 space-y-3">
                  <Filter size={32} className="mx-auto opacity-20" />
                  <p className="font-semibold text-gray-700">
                    {selectedEvaluationStatus === "EVALUATED"
                      ? "No evaluated teams found with the current filter criteria."
                      : selectedEvaluationStatus === "NOT_EVALUATED"
                      ? "No pending teams found with the current filter criteria."
                      : "No projects match the current search and filter criteria."}
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="text-xs font-bold text-[#ff6a3c] hover:underline"
                    >
                      Reset all filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProjects.map((project) => {
                    const isExpanded = expandedMarks[project.projectId];
                    const hasJudgeMarks = project.judgeMarks && project.judgeMarks.length > 0;

                    return (
                      <div
                        key={project.projectId}
                        className={`rounded-2xl border transition-all duration-200 p-5 shadow-sm ${
                          project.isEvaluated
                            ? project.isDisqualified
                              ? "border-red-200 bg-red-50/10 hover:border-red-300"
                              : "border-gray-200 bg-white hover:border-orange-200 hover:shadow-md"
                            : "border-gray-200 bg-white/70 hover:border-orange-200"
                        }`}
                      >
                        {/* Team & Score Header */}
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-gray-400">#{project.projectId}</span>
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
                                <button
                                  type="button"
                                  onClick={() => setSelectedTrl(project.trlLevel)}
                                  className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-[#df9400] transition hover:bg-orange-200"
                                >
                                  TRL {project.trlLevel}
                                </button>
                              )}
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                  project.isEvaluated
                                    ? project.isDisqualified
                                      ? "bg-red-100 text-red-700"
                                      : "bg-green-100 text-green-700"
                                    : "bg-orange-100 text-orange-700 font-semibold"
                                }`}
                              >
                                {project.isEvaluated ? (project.isDisqualified ? "Disqualified" : "Evaluated") : "Pending"}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-gray-600">{project.projectTopic}</p>
                          </div>

                          {/* Final Score Badge */}
                          <div className="flex shrink-0 items-center">
                            <div
                              className={`rounded-2xl px-5 py-3 text-right shadow-xs border min-w-[140px] ${
                                project.isEvaluated
                                  ? project.isDisqualified
                                    ? "bg-red-50 border-red-200"
                                    : "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                                  : "bg-gray-50 border-gray-100"
                              }`}
                            >
                              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                {project.isEvaluated ? "Final Score" : "Status"}
                              </p>
                              {project.isEvaluated ? (
                                <div>
                                  <div className="flex items-baseline gap-1 justify-end mt-0.5">
                                    <span className={`text-2xl font-black ${project.isDisqualified ? "text-red-600" : "text-green-700"}`}>
                                      {project.finalScore ?? 0}
                                    </span>
                                    <span className="text-xs text-gray-400 font-semibold">/ 10</span>
                                  </div>
                                  {project.totalScore !== null && project.totalScore !== undefined && (
                                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                                      Total: {project.totalScore}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm font-semibold text-orange-600 mt-1">Pending Evaluation</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Captain & Team Members */}
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

                        {/* Evaluation & Marks Breakdown */}
                        {project.isEvaluated && (
                          <div className="mt-4 rounded-xl border border-green-200/80 bg-green-50/40 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-800">
                                <Award size={15} className="text-green-600" />
                                <span>Judge Evaluation Breakdown</span>
                                {hasJudgeMarks && (
                                  <span className="text-green-700 font-semibold lowercase">
                                    ({project.judgeMarks.length} {project.judgeMarks.length === 1 ? "judge" : "judges"})
                                  </span>
                                )}
                              </div>
                              {hasJudgeMarks && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpandMarks(project.projectId)}
                                  className="text-xs font-bold text-green-700 hover:text-green-900 flex items-center gap-1 transition"
                                >
                                  {isExpanded ? "Hide Details" : "View Judge Marks"}
                                  <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                </button>
                              )}
                            </div>

                            {/* Remarks */}
                            {project.remarks && (
                              <div className="rounded-lg bg-white/90 p-3 border border-green-100 text-xs text-gray-700">
                                <span className="font-bold text-gray-800">Judge Remarks: </span>
                                <span>{project.remarks}</span>
                              </div>
                            )}

                            {/* Detailed Judge Marks */}
                            {hasJudgeMarks && isExpanded && (
                              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                                {project.judgeMarks.map((jm, jIdx) => (
                                  <div key={jIdx} className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs space-y-2">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                      <span className="text-xs font-bold text-gray-800">{jm.judgeName}</span>
                                      <span className="text-xs font-black text-[#ff6a3c] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md">
                                        {jm.mark}
                                      </span>
                                    </div>
                                    {jm.rubricMarks && jm.rubricMarks.length > 0 && (
                                      <div className="space-y-1">
                                        {jm.rubricMarks.map((rm, rIdx) => (
                                          <div key={rIdx} className="flex justify-between text-[11px] text-gray-600">
                                            <span className="truncate pr-2 font-medium">{rm.rubricName}</span>
                                            <span className="font-bold text-gray-800">{rm.mark}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {jm.comments && (
                                      <p className="text-[11px] text-gray-500 italic border-t border-gray-50 pt-1.5">
                                        "{jm.comments}"
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Metadata Tags */}
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
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, delay, onClick, active, badge }) {
  const isClickable = Boolean(onClick);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      className={`group rounded-2xl border p-6 shadow-sm transition-all ${
        isClickable ? "cursor-pointer select-none" : ""
      } ${
        active
          ? "border-[#ff6a3c] bg-orange-50/80 shadow-md ring-1 ring-[#ff6a3c]"
          : "border-gray-200 bg-white/70 hover:shadow-md hover:border-orange-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</p>
            {badge && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                {badge}
              </span>
            )}
          </div>
          <h2 className={`mt-2 font-mono text-4xl font-bold transition-colors ${
            active ? "text-[#ff6a3c]" : "text-gray-800 group-hover:text-[#ff6a3c]"
          }`}>
            {value}
          </h2>
        </div>
        <div className={`rounded-2xl border p-4 transition-colors ${
          active
            ? "border-orange-200 bg-orange-100"
            : "border-gray-100 bg-gray-50 group-hover:border-orange-100 group-hover:bg-orange-50"
        }`}>
          <Icon className={`h-8 w-8 transition-colors ${
            active ? "text-[#ff6a3c]" : "text-gray-400 group-hover:text-[#ff6a3c]"
          }`} />
        </div>
      </div>
    </motion.div>
  );
}

