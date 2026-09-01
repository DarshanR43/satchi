import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckSquare,
  Edit3,
  Filter,
  KeyRound,
  Mail,
  Phone,
  Save,
  Search,
  ShieldCheck,
  Square,
  Trash2,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../lib/api";

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  role: "PARTICIPANT",
};

const defaultRoleOptions = [{ value: "PARTICIPANT", label: "Participant" }];

const modalInputClassName =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#ff6a3c] focus:bg-white focus:ring-2 focus:ring-orange-100";

const buildEditForm = (managedUser) => ({
  full_name: managedUser?.full_name || "",
  email: managedUser?.email || "",
  phone: managedUser?.phone || "",
  password: "",
  role: managedUser?.role || "PARTICIPANT",
});

const InputField = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
      <Icon size={18} />
    </div>
    <input
      {...props}
      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pl-11 text-sm text-gray-800 outline-none transition focus:border-[#ff6a3c] focus:bg-white focus:ring-2 focus:ring-orange-100"
    />
  </div>
);

const SelectField = ({ value, onChange, options, disabled = false }) => (
  <select
    value={value}
    onChange={onChange}
    disabled={disabled}
    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 outline-none transition focus:border-[#ff6a3c] focus:bg-white focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

const RoleBadge = ({ role }) => {
  const palette = {
    SUPERADMIN: "bg-red-100 text-red-700",
    EVENTADMIN: "bg-amber-100 text-amber-700",
    SUBEVENTADMIN: "bg-orange-100 text-orange-700",
    EVENTMANAGER: "bg-blue-100 text-blue-700",
    SUBEVENTMANAGER: "bg-sky-100 text-sky-700",
    SUBSUBEVENTMANAGER: "bg-cyan-100 text-cyan-700",
    COORDINATOR: "bg-violet-100 text-violet-700",
    PARTICIPANT: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${palette[role] || palette.PARTICIPANT}`}>
      {role}
    </span>
  );
};

const UserManagementPage = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState(defaultRoleOptions);
  const [formData, setFormData] = useState(emptyForm);
  const [draftRoles, setDraftRoles] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingUserId, setSavingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState(buildEditForm(null));
  const [editingSubmitting, setEditingSubmitting] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deletingSubmitting, setDeletingSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Bulk selection & mass delete states
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [massDeleteModal, setMassDeleteModal] = useState(null); // { mode: 'selected' | 'all_participants', count: number, userIds?: number[] }
  const [massDeleting, setMassDeleting] = useState(false);

  const hasAccess = Boolean(user && (user.role === "SUPERADMIN" || user.is_superuser));

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: API_URL });
    instance.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
      return config;
    });
    return instance;
  }, [token]);

  const superadminCount = useMemo(
    () => users.filter((managedUser) => managedUser.role === "SUPERADMIN").length,
    [users],
  );

  const participantsCount = useMemo(
    () => users.filter((managedUser) => managedUser.role === "PARTICIPANT" && managedUser.id !== user?.id).length,
    [users, user?.id],
  );

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/user/admin/users/");
      const loadedUsers = response.data.users || [];
      setUsers(loadedUsers);
      setAvailableRoles(response.data.available_roles || []);
      setDraftRoles(Object.fromEntries(loadedUsers.map((loadedUser) => [loadedUser.id, loadedUser.role])));
      setSelectedUserIds([]);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && hasAccess) {
      loadUsers();
    } else if (isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, hasAccess, token]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((listedUser) => {
      if (roleFilter !== "ALL" && listedUser.role !== roleFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = [listedUser.full_name, listedUser.email, listedUser.phone, listedUser.role]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [users, search, roleFilter]);

  // Selectable users in current filter view (excluding active user & lone superadmin)
  const selectableUsers = useMemo(() => {
    return filteredUsers.filter((u) => {
      const isSelf = u.id === user?.id;
      const isLastSuperAdmin = u.role === "SUPERADMIN" && superadminCount === 1;
      return !isSelf && !isLastSuperAdmin;
    });
  }, [filteredUsers, user?.id, superadminCount]);

  const allFilteredSelected = useMemo(() => {
    if (selectableUsers.length === 0) return false;
    return selectableUsers.every((u) => selectedUserIds.includes(u.id));
  }, [selectableUsers, selectedUserIds]);

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      const selectableIdSet = new Set(selectableUsers.map((u) => u.id));
      setSelectedUserIds((prev) => prev.filter((id) => !selectableIdSet.has(id)));
    } else {
      const newIds = new Set([...selectedUserIds, ...selectableUsers.map((u) => u.id)]);
      setSelectedUserIds(Array.from(newIds));
    }
  };

  const toggleSelectUser = (targetId) => {
    setSelectedUserIds((prev) =>
      prev.includes(targetId) ? prev.filter((id) => id !== targetId) : [...prev, targetId],
    );
  };

  const handleSelectAllParticipants = () => {
    const participantIds = users
      .filter((u) => u.role === "PARTICIPANT" && u.id !== user?.id)
      .map((u) => u.id);
    setSelectedUserIds(participantIds);
  };

  const handleClearSelection = () => {
    setSelectedUserIds([]);
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await api.post("/user/admin/users/", formData);
      const createdUser = response.data.user;
      setUsers((currentUsers) => [...currentUsers, createdUser].sort((a, b) => a.email.localeCompare(b.email)));
      setDraftRoles((currentDrafts) => ({ ...currentDrafts, [createdUser.id]: createdUser.role }));
      setFormData(emptyForm);
      setSuccessMessage(response.data.message || "User created successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveRole = async (targetUser) => {
    const nextRole = draftRoles[targetUser.id];
    if (!nextRole || nextRole === targetUser.role) {
      return;
    }

    setSavingUserId(targetUser.id);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await api.patch(`/user/admin/users/${targetUser.id}/`, { role: nextRole });
      const updatedUser = response.data.user;
      setUsers((currentUsers) =>
        currentUsers.map((listedUser) => (listedUser.id === updatedUser.id ? updatedUser : listedUser)),
      );
      setDraftRoles((currentDrafts) => ({ ...currentDrafts, [updatedUser.id]: updatedUser.role }));
      setSuccessMessage(response.data.message || "User updated successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to update role.");
    } finally {
      setSavingUserId(null);
    }
  };

  const openEditModal = (targetUser) => {
    setEditingUser(targetUser);
    setEditFormData(buildEditForm(targetUser));
    setError(null);
    setSuccessMessage(null);
  };

  const handleEditUser = async (event) => {
    event.preventDefault();
    if (!editingUser) {
      return;
    }

    setEditingSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await api.patch(`/user/admin/users/${editingUser.id}/`, editFormData);
      const updatedUser = response.data.user;
      setUsers((currentUsers) =>
        currentUsers.map((listedUser) => (listedUser.id === updatedUser.id ? updatedUser : listedUser)),
      );
      setDraftRoles((currentDrafts) => ({ ...currentDrafts, [updatedUser.id]: updatedUser.role }));
      setEditingUser(null);
      setEditFormData(buildEditForm(null));
      setSuccessMessage(response.data.message || "User updated successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to update user.");
    } finally {
      setEditingSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) {
      return;
    }

    setDeletingSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await api.delete(`/user/admin/users/${deletingUser.id}/`);
      setUsers((currentUsers) => currentUsers.filter((listedUser) => listedUser.id !== deletingUser.id));
      setSelectedUserIds((prev) => prev.filter((id) => id !== deletingUser.id));
      setDraftRoles((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        delete nextDrafts[deletingUser.id];
        return nextDrafts;
      });
      setDeletingUser(null);
      setSuccessMessage(response.data.message || "User deleted successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to delete user.");
    } finally {
      setDeletingSubmitting(false);
    }
  };

  const handleConfirmMassDelete = async () => {
    if (!massDeleteModal) return;

    setMassDeleting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload =
        massDeleteModal.mode === "all_participants"
          ? { delete_all_role: "PARTICIPANT" }
          : { user_ids: massDeleteModal.userIds };

      const response = await api.post("/user/admin/users/bulk-delete/", payload);
      const deletedIds = new Set(response.data.deleted_ids || []);

      setUsers((currentUsers) => currentUsers.filter((u) => !deletedIds.has(u.id)));
      setSelectedUserIds((prev) => prev.filter((id) => !deletedIds.has(id)));
      setDraftRoles((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        deletedIds.forEach((id) => delete nextDrafts[id]);
        return nextDrafts;
      });

      setMassDeleteModal(null);
      setSuccessMessage(response.data.message || "Users deleted successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Failed to bulk delete users.");
    } finally {
      setMassDeleting(false);
    }
  };


  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!loading && !hasAccess) {
    return <Navigate to="/admin" />;
  }

  return (
    <>
      <div className="relative min-h-screen overflow-hidden bg-gray-50 px-4 py-20 font-body text-gray-800 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-amber-50 to-orange-100" />
        <div className="pointer-events-none absolute inset-0 bg-grid-gray-200/[0.35]" />

        <div className="relative z-10 mx-auto max-w-7xl pt-10 sm:pt-16">
          <motion.div
            initial={{ opacity: 0, y: -24 }}
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
                  User Management
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
                  Create accounts, edit user details, manage roles, and remove users safely from one place.
                </p>
              </div>
            </div>
            <div className="self-start rounded-2xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-600">
              Signed in as <span className="text-gray-900">{user?.full_name || user?.email}</span>
            </div>
          </motion.div>

          {(error || successMessage) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-medium ${
                error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {error || successMessage}
            </motion.div>
          )}

          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-xl backdrop-blur-lg"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-[#ff6a3c]">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Create User</h2>
                  <p className="text-sm text-gray-500">New accounts log in with their email address.</p>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <InputField icon={Users} type="text" placeholder="Full name" value={formData.full_name} onChange={(event) => setFormData((current) => ({ ...current, full_name: event.target.value }))} />
                <InputField icon={Mail} type="email" placeholder="Email address" value={formData.email} onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))} />
                <InputField icon={Phone} type="tel" placeholder="Phone number (optional)" value={formData.phone} onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))} />
                <InputField icon={KeyRound} type="password" placeholder="Temporary password" value={formData.password} onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))} />
                <SelectField value={formData.role} onChange={(event) => setFormData((current) => ({ ...current, role: event.target.value }))} options={availableRoles} />

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff6a3c] px-4 py-3 font-bold text-white transition hover:shadow-lg hover:shadow-orange-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserPlus size={18} />
                  {submitting ? "Creating..." : "Create User"}
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50/70 p-4 text-sm text-gray-600">
                <div className="mb-2 flex items-center gap-2 font-semibold text-gray-800">
                  <ShieldCheck size={16} className="text-[#df9400]" />
                  Role notes
                </div>
                <p>Assigning `SUPERADMIN` also grants Django staff and superuser access. Other roles stay inside the app only.</p>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-xl backdrop-blur-lg"
            >
              <div className="mb-6 flex flex-col gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Existing Users</h2>
                    <p className="text-sm text-gray-500">Quick-save roles, edit account details, or mass delete accounts.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full sm:w-auto">
                    {/* Role Filter */}
                    <div className="relative min-w-[170px]">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <Filter size={16} />
                      </div>
                      <select
                        value={roleFilter}
                        onChange={(e) => {
                          setRoleFilter(e.target.value);
                          setSelectedUserIds([]);
                        }}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-8 text-sm font-medium text-gray-800 outline-none transition focus:border-[#ff6a3c] focus:bg-white focus:ring-2 focus:ring-orange-100 cursor-pointer"
                      >
                        <option value="ALL">All Roles ({users.length})</option>
                        {availableRoles.map((r) => {
                          const count = users.filter((u) => u.role === r.value).length;
                          return (
                            <option key={r.value} value={r.value}>
                              {r.label} ({count})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                        <Search size={18} />
                      </div>
                      <input
                        type="search"
                        placeholder="Search users..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-[#ff6a3c] focus:bg-white focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Bulk Actions Control Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-200/70 bg-gradient-to-r from-orange-50/80 via-amber-50/60 to-orange-50/80 p-3.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleSelectAllFiltered}
                      disabled={selectableUsers.length === 0}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {allFilteredSelected ? <CheckSquare size={16} className="text-[#ff6a3c]" /> : <Square size={16} />}
                      {allFilteredSelected ? "Deselect Filtered" : "Select Filtered"}
                    </button>

                    <button
                      type="button"
                      onClick={handleSelectAllParticipants}
                      disabled={participantsCount === 0}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <Users size={14} className="text-[#df9400]" />
                      Select All Participants ({participantsCount})
                    </button>

                    {selectedUserIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="text-xs text-gray-500 hover:text-gray-800 underline underline-offset-2 ml-1"
                      >
                        Clear Selection ({selectedUserIds.length})
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Mass Delete All Participants Quick Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setMassDeleteModal({
                          mode: "all_participants",
                          count: participantsCount,
                        });
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      disabled={participantsCount === 0}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-700 border border-red-200 hover:bg-red-500 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <UserX size={15} />
                      Mass Delete All Participants ({participantsCount})
                    </button>

                    {/* Delete Selected Button */}
                    {selectedUserIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setMassDeleteModal({
                            mode: "selected",
                            count: selectedUserIds.length,
                            userIds: selectedUserIds,
                          });
                          setError(null);
                          setSuccessMessage(null);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-600/20 hover:bg-red-700 active:scale-95 transition"
                      >
                        <Trash2 size={15} />
                        Delete Selected ({selectedUserIds.length})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex min-h-[280px] items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#ff6a3c]" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-14 text-center text-sm text-gray-500">
                  No users matched this filter.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((listedUser) => {
                    const selectedRole = draftRoles[listedUser.id] || listedUser.role;
                    const isDirty = selectedRole !== listedUser.role;
                    const isSelf = listedUser.id === user?.id;
                    const isLastSuperAdmin = listedUser.role === "SUPERADMIN" && superadminCount === 1;
                    const deleteBlocked = isSelf || isLastSuperAdmin;
                    const isChecked = selectedUserIds.includes(listedUser.id);

                    return (
                      <div
                        key={listedUser.id}
                        className={`rounded-3xl border p-5 shadow-sm transition ${
                          isChecked
                            ? "border-orange-300 bg-orange-50/30 ring-2 ring-orange-200"
                            : "border-gray-200 bg-white/80 hover:border-orange-200"
                        }`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex items-start gap-3.5 min-w-0">
                            {/* Row Checkbox */}
                            <div className="pt-1">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectUser(listedUser.id)}
                                disabled={deleteBlocked}
                                title={
                                  isSelf
                                    ? "Cannot select your own logged in account"
                                    : isLastSuperAdmin
                                    ? "Cannot select the only remaining superadmin"
                                    : "Select for mass deletion"
                                }
                                className="h-5 w-5 rounded-lg border-gray-300 text-[#ff6a3c] focus:ring-orange-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-lg font-bold text-gray-900">{listedUser.full_name || listedUser.email}</h3>
                                <RoleBadge role={listedUser.role} />
                                {listedUser.is_superuser ? (
                                  <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                                    Django Admin
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-2 flex flex-col gap-1 text-sm text-gray-500">
                                <span>{listedUser.email}</span>
                                {listedUser.phone ? <span>{listedUser.phone}</span> : null}
                                <span>Username: {listedUser.username}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 lg:min-w-[420px]">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                              <div className="min-w-[220px] flex-1">
                                <SelectField value={selectedRole} onChange={(event) => setDraftRoles((current) => ({ ...current, [listedUser.id]: event.target.value }))} options={availableRoles} />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSaveRole(listedUser)}
                                disabled={!isDirty || savingUserId === listedUser.id}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Save size={16} />
                                {savingUserId === listedUser.id ? "Saving..." : "Save Role"}
                              </button>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                              <button
                                type="button"
                                onClick={() => openEditModal(listedUser)}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-100 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
                              >
                                <Edit3 size={16} />
                                Edit Details
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeletingUser(listedUser);
                                  setError(null);
                                  setSuccessMessage(null);
                                }}
                                disabled={deleteBlocked}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-100 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash2 size={16} />
                                Delete User
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-gray-600">
                <div className="mb-2 flex items-center gap-2 font-semibold text-gray-800">
                  <AlertCircle size={16} className="text-blue-500" />
                  Safety guard
                </div>
                <p>The page blocks removing the final superadmin and stops you from deleting your own account here.</p>
              </div>
            </motion.section>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {/* Mass Delete Confirmation Modal */}
        {massDeleteModal ? (
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
                className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
              >
                <div className="mb-4 flex items-start gap-3">
                  <div className="rounded-2xl bg-red-100 p-3 text-red-600">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {massDeleteModal.mode === "all_participants"
                        ? "Mass Delete All Participants?"
                        : "Mass Delete Selected Users?"}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      This will permanently remove the accounts, login credentials, and event permissions.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800 space-y-2">
                  <div className="font-bold flex items-center justify-between">
                    <span>Total accounts to be deleted:</span>
                    <span className="text-base px-2.5 py-0.5 rounded-full bg-red-200 text-red-900 font-extrabold">
                      {massDeleteModal.count}
                    </span>
                  </div>
                  {massDeleteModal.mode === "all_participants" ? (
                    <p className="text-xs text-red-700 leading-relaxed">
                      Every user account with the role <strong>Participant</strong> (excluding your logged-in account) will be permanently deleted.
                    </p>
                  ) : (
                    <p className="text-xs text-red-700 leading-relaxed">
                      All {massDeleteModal.count} selected user accounts will be permanently deleted from the database.
                    </p>
                  )}
                  <p className="text-xs text-red-600 font-semibold pt-1">
                    ⚠️ This action cannot be undone.
                  </p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => !massDeleting && setMassDeleteModal(null)}
                    className="rounded-2xl bg-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmMassDelete}
                    disabled={massDeleting || massDeleteModal.count === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={16} />
                    {massDeleting ? "Deleting Users..." : `Permanently Delete ${massDeleteModal.count} User${massDeleteModal.count !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {editingUser ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 p-4 backdrop-blur-sm">
            <div className="mx-auto max-w-2xl py-10">
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="rounded-3xl bg-white p-6 shadow-2xl">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
                    <p className="mt-1 text-sm text-gray-500">Update the basic account details for this user.</p>
                  </div>
                  <button type="button" onClick={() => !editingSubmitting && setEditingUser(null)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-600 transition hover:bg-gray-200" aria-label="Close edit user modal">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleEditUser} className="space-y-4">
                  <label className="block space-y-2"><span className="text-sm font-semibold text-gray-700">Full Name</span><input type="text" value={editFormData.full_name} onChange={(event) => setEditFormData((current) => ({ ...current, full_name: event.target.value }))} className={modalInputClassName} required /></label>
                  <label className="block space-y-2"><span className="text-sm font-semibold text-gray-700">Email</span><input type="email" value={editFormData.email} onChange={(event) => setEditFormData((current) => ({ ...current, email: event.target.value }))} className={modalInputClassName} required /></label>
                  <label className="block space-y-2"><span className="text-sm font-semibold text-gray-700">Phone</span><input type="tel" value={editFormData.phone} onChange={(event) => setEditFormData((current) => ({ ...current, phone: event.target.value }))} className={modalInputClassName} /></label>
                  <label className="block space-y-2"><span className="text-sm font-semibold text-gray-700">Role</span><SelectField value={editFormData.role} onChange={(event) => setEditFormData((current) => ({ ...current, role: event.target.value }))} options={availableRoles} /></label>
                  <label className="block space-y-2"><span className="text-sm font-semibold text-gray-700">New Password</span><input type="password" value={editFormData.password} onChange={(event) => setEditFormData((current) => ({ ...current, password: event.target.value }))} className={modalInputClassName} placeholder="Leave blank to keep the current password" /></label>

                  <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                    <button type="button" onClick={() => !editingSubmitting && setEditingUser(null)} className="rounded-2xl bg-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-300">Cancel</button>
                    <button type="submit" disabled={editingSubmitting} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ff6a3c] px-5 py-3 text-sm font-bold text-white transition hover:shadow-lg hover:shadow-orange-500/30 disabled:cursor-not-allowed disabled:opacity-60">
                      <Save size={16} />
                      {editingSubmitting ? "Saving..." : "Save User"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deletingUser ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-gray-900/60 p-4 backdrop-blur-sm">
            <div className="flex min-h-full items-center justify-center">
              <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-start gap-3">
                  <div className="rounded-2xl bg-red-100 p-3 text-red-600"><AlertCircle size={22} /></div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
                    <p className="mt-1 text-sm text-gray-500">This removes the user account and its event-role mappings.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">{deletingUser.full_name || deletingUser.email}</p>
                  <p className="mt-1">{deletingUser.email}</p>
                  {deletingUser.phone ? <p className="mt-1">{deletingUser.phone}</p> : null}
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => !deletingSubmitting && setDeletingUser(null)} className="rounded-2xl bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-300">Cancel</button>
                  <button type="button" onClick={handleDeleteUser} disabled={deletingSubmitting} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                    <Trash2 size={16} />
                    {deletingSubmitting ? "Deleting..." : "Delete User"}
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default UserManagementPage;
