import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CalendarRange,
  Edit3,
  FileText,
  Loader,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  Target,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import ProjectSubmissionForm from "../Components/projects/ProjectSubmissionForm";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../lib/api";
import { SDG_OPTIONS } from "../lib/projectMeta";

const allowedRoles = [
  "SUPERADMIN",
  "EVENTADMIN",
  "EVENTMANAGER",
  "SUBEVENTADMIN",
  "SUBEVENTMANAGER",
  "SUBSUBEVENTMANAGER",
];

const formatDateTime = (isoString) => {
  if (!isoString) {
    return "Unknown";
  }

  const value = new Date(isoString);
  if (Number.isNaN(value.getTime())) {
    return "Unknown";
  }

  return value.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const TeamManagementPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [event, setEvent] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingDeleteId, setSubmittingDeleteId] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [pageMessage, setPageMessage] = useState({ type: "", text: "" });

  const loadTeams = async () => {
    if (!eventId) {
      setError("No competition selected for team management.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/event-registrations/${eventId}/`);
      setEvent(response.data?.event || null);
      setProjects(response.data?.projects || []);
      setError(null);
    } catch (requestError) {
      console.error("Failed to load event registrations:", requestError);
      setError(requestError.response?.data?.error || "Could not load team registrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, [eventId]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return projects;
    }

    return projects.filter((project) => {
      const memberSearchText = (project.teamMembers || [])
        .flatMap((member) => [member.name, member.email, member.phone])
        .filter(Boolean)
        .join(" ");

      const haystack = [
        project.teamName,
        project.projectTopic,
        project.captain?.name,
        project.captain?.email,
        project.captain?.phone,
        project.facultyMentorName,
        memberSearchText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [projects, search]);

  const handleDeleteTeam = async () => {
    if (!deletingProject) {
      return;
    }

    try {
      setSubmittingDeleteId(deletingProject.projectId);
      const response = await axios.delete(
        `${API_URL}/api/event-registrations/${eventId}/${deletingProject.projectId}/`,
      );
      setPageMessage({
        type: "success",
        text: response.data?.message || "Team deleted successfully.",
      });
      setDeletingProject(null);
      await loadTeams();
    } catch (requestError) {
      console.error("Failed to delete team:", requestError);
      setPageMessage({
        type: "error",
        text: requestError.response?.data?.error || "Could not delete this team.",
      });
    } finally {
      setSubmittingDeleteId(null);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/admin" />;
  }

  return (
    <div className="relative min-h-screen w-full px-4 py-20 font-body text-gray-800 sm:px-6 lg:px-8">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white via-amber-50 to-orange-100" />
      <div className="absolute left-0 top-0 z-0 h-full w-full bg-grid-gray-200/[0.4]" />

      <div className="relative z-10 mx-auto max-w-6xl pt-16">
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white/75 p-5 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-[#ff6a3c] transition hover:bg-orange-200"
              aria-label="Back to admin dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text pb-1 text-3xl font-bold text-transparent sm:text-5xl">
                Team Management
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-600 sm:text-base">
                Review, edit, or remove registered teams for this competition.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="self-start rounded-2xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-600">
              Acting as <span className="text-gray-900">{user?.full_name || user?.email}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/admin/events/${eventId}/manual-entry`)}
              className="inline-flex items-center gap-2 self-start rounded-2xl bg-[#ff6a3c] px-4 py-2.5 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-orange-500/30"
            >
              <UserPlus size={16} />
              Add Team
            </button>
          </div>
        </motion.div>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader className="animate-spin text-[#ff6a3c]" size={40} />
          </div>
        )}

        {error && (
          <div className="mb-8 rounded-2xl border border-red-300 bg-red-100 p-4 text-red-700">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={18} />
              {error}
            </div>
          </div>
        )}

        {pageMessage.text && (
          <div
            className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-medium ${
              pageMessage.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {pageMessage.text}
          </div>
        )}

        {event && (
          <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50/80 p-5 text-sm text-gray-600 shadow-sm">
            <div className="mb-2 flex items-center gap-2 font-semibold text-gray-800">
              <ShieldCheck size={16} className="text-blue-500" />
              Competition context
            </div>
            <p className="leading-6">
              Managing teams for <span className="font-semibold text-gray-900">{event.name}</span>. Team size stays
              validated against {event.minTeamSize}-{event.maxTeamSize} participants, including the captain.
            </p>
          </div>
        )}

        {!loading && event && (
          <div className="mb-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="search"
                value={search}
                onChange={(targetEvent) => setSearch(targetEvent.target.value)}
                placeholder="Search by team, captain, participant, mentor, or topic"
                className="w-full rounded-2xl border border-gray-200 bg-white/80 py-3 pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-[#ff6a3c] focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 text-sm text-gray-600 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Visible Teams</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{filteredProjects.length}</p>
              <p>
                of {projects.length} total
              </p>
            </div>
          </div>
        )}

        {!loading && !error && event && filteredProjects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/80 px-6 py-14 text-center text-sm text-gray-500 shadow-sm">
            {projects.length === 0
              ? "No teams have been registered for this competition yet."
              : "No teams matched the current search."}
          </div>
        )}

        {!loading && !error && filteredProjects.length > 0 && (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <div
                key={project.projectId}
                className="rounded-2xl border border-gray-200 bg-white/85 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-bold text-gray-900">{project.teamName}</h2>
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
                        {project.isEvaluated ? "Evaluated" : "Not Evaluated"}
                      </span>
                    </div>
                    <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                      <FileText size={16} className="mt-0.5 text-[#ff6a3c]" />
                      <p className="leading-6">{project.projectTopic}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPageMessage({ type: "", text: "" });
                        setEditingProject(project);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
                    >
                      <Edit3 size={16} />
                      Edit Team
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPageMessage({ type: "", text: "" });
                        setDeletingProject(project);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200"
                    >
                      <Trash2 size={16} />
                      Delete Team
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Captain</p>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2 font-semibold text-gray-800">
                        <Users size={16} className="text-[#ff6a3c]" />
                        <span>{project.captain?.name}</span>
                      </div>
                      {project.captain?.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-gray-400" />
                          <span>{project.captain.email}</span>
                        </div>
                      )}
                      {project.captain?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-gray-400" />
                          <span>{project.captain.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Team Members</p>
                    {project.teamMembers?.length > 0 ? (
                      <div className="space-y-3">
                        {project.teamMembers.map((member, index) => (
                          <div
                            key={`${project.projectId}-member-${member.email || index}`}
                            className="text-sm text-gray-600"
                          >
                            <p className="font-semibold text-gray-800">{member.name || "Unnamed member"}</p>
                            {member.email && <p>{member.email}</p>}
                            {member.phone && <p>{member.phone}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No non-captain members recorded.</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
                  <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
                    <CalendarRange size={14} className="text-[#ff6a3c]" />
                    Registered {formatDateTime(project.registeredAt)}
                  </div>
                  {project.trlLevel && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
                      <Target size={14} className="text-[#ff6a3c]" />
                      TRL {project.trlLevel}
                    </div>
                  )}
                  {project.facultyMentorName && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-blue-700">
                      <Briefcase size={14} />
                      Mentor: {project.facultyMentorName}
                    </div>
                  )}
                  {(project.sdgs || []).map((sdg) => {
                    const option = SDG_OPTIONS.find((candidate) => candidate.value === Number(sdg));
                    return (
                      <div
                        key={`${project.projectId}-sdg-${sdg}`}
                        className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-semibold text-[#df9400]"
                      >
                        {option?.label || `SDG ${sdg}`}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingProject && event && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 p-4 backdrop-blur-sm"
          >
            <div className="mx-auto max-w-5xl py-12">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="rounded-3xl bg-white p-5 shadow-2xl"
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Edit Team</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Update the captain, members, project details, TRL, SDGs, and mentor information.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingProject(null)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 transition hover:bg-gray-200"
                    aria-label="Close edit team modal"
                  >
                    <X size={18} />
                  </button>
                </div>

                <ProjectSubmissionForm
                  key={editingProject.projectId}
                  event={event}
                  captainDefaults={{}}
                  initialValues={editingProject}
                  prefillMaxMemberSlots
                  submitLabel="Save Team Changes"
                  submitProject={(payload) =>
                    axios.patch(
                      `${API_URL}/api/event-registrations/${eventId}/${editingProject.projectId}/`,
                      payload,
                      { headers: { "Content-Type": "application/json" } },
                    )
                  }
                  successMessage="Team updated successfully."
                  onSuccess={async (response) => {
                    setPageMessage({
                      type: "success",
                      text: response?.data?.message || "Team updated successfully.",
                    });
                    setEditingProject(null);
                    await loadTeams();
                  }}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/60 p-4 backdrop-blur-sm"
          >
            <div className="flex min-h-full items-center justify-center">
              <motion.div
                initial={{ scale: 0.92, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: 10 }}
                className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
              >
                <div className="mb-4 flex items-start gap-3">
                  <div className="rounded-2xl bg-red-100 p-3 text-red-600">
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Delete Team</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      This removes the team registration, participant mappings, and any evaluation records tied to this
                      project.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">{deletingProject.teamName}</p>
                  <p className="mt-1">{deletingProject.projectTopic}</p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setDeletingProject(null)}
                    className="rounded-2xl bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteTeam}
                    disabled={submittingDeleteId === deletingProject.projectId}
                    className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingDeleteId === deletingProject.projectId ? "Deleting..." : "Delete Team"}
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamManagementPage;
