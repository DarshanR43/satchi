import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase,
  Cpu,
  FileText,
  Hash,
  Mail,
  Phone,
  Target,
  User,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";

import { PROJECT_CATEGORY_OPTIONS, SDG_OPTIONS, TRL_OPTIONS } from "../../lib/projectMeta";

const blankMember = () => ({ name: "", email: "", phone: "" });
const memberHasAnyValue = (member = {}) =>
  Boolean((member.name || "").trim() || (member.email || "").trim() || (member.phone || "").trim());
const normalizeMember = (member = {}) => ({
  name: member.name || "",
  email: member.email || "",
  phone: member.phone || "",
});
const buildInitialFormData = ({
  captainDefaults,
  initialValues,
  minimumVisibleMemberCount,
}) => {
  const initialMembers = Array.isArray(initialValues?.teamMembers)
    ? initialValues.teamMembers
    : Array.isArray(initialValues?.team_members)
      ? initialValues.team_members
      : [];
  const visibleMemberCount = Math.max(minimumVisibleMemberCount, initialMembers.length);

  return {
    team_name: initialValues?.teamName || initialValues?.team_name || "",
    project_topic: initialValues?.projectTopic || initialValues?.project_topic || "",
    project_category: initialValues?.projectCategory || initialValues?.project_category || "",
    trl_level: initialValues?.trlLevel?.toString?.() || initialValues?.trl_level?.toString?.() || "",
    sdgs: Array.isArray(initialValues?.sdgs) ? initialValues.sdgs.map(Number).sort((a, b) => a - b) : [],
    captain_name: initialValues?.captain?.name || initialValues?.captain_name || captainDefaults?.full_name || "",
    captain_email: initialValues?.captain?.email || initialValues?.captain_email || captainDefaults?.email || "",
    captain_phone: initialValues?.captain?.phone || initialValues?.captain_phone || captainDefaults?.phone || "",
    team_members: Array.from({ length: visibleMemberCount }, (_, index) => normalizeMember(initialMembers[index])),
    faculty_mentor_name: initialValues?.facultyMentorName || initialValues?.faculty_mentor_name || "",
  };
};

const inputClassName =
  "w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-800 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff6a3c]";

const lockedInputClassName =
  "w-full rounded-lg border border-gray-300 bg-gray-200/70 px-4 py-2.5 text-gray-600 cursor-not-allowed";

const IconInput = ({ icon: Icon, className = "", disabled = false, ...props }) => (
  <div className="relative">
    <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
    <input
      {...props}
      disabled={disabled}
      className={`${disabled ? lockedInputClassName : inputClassName} pl-11 pr-4 ${className}`}
    />
  </div>
);

const ProjectSubmissionForm = ({
  event,
  captainDefaults,
  lockCaptainIdentity = false,
  prefillMaxMemberSlots = false,
  initialValues = null,
  submitLabel,
  submitProject,
  successRedirectPath,
  successMessage = "Registration successful! Redirecting...",
  onSuccess,
}) => {
  const navigate = useNavigate();
  const minMemberCount = Math.max((event?.minTeamSize || 1) - 1, 0);
  const maxMemberCount = Math.max((event?.maxTeamSize || 1) - 1, 0);
  const initialVisibleMemberSlots = prefillMaxMemberSlots ? maxMemberCount : minMemberCount;

  const [formData, setFormData] = useState(() =>
    buildInitialFormData({
      captainDefaults,
      initialValues,
      minimumVisibleMemberCount: initialVisibleMemberSlots,
    }),
  );
  const [submissionStatus, setSubmissionStatus] = useState({ message: "", type: "" });

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      captain_name: captainDefaults?.full_name || current.captain_name,
      captain_email: captainDefaults?.email || current.captain_email,
      captain_phone: captainDefaults?.phone || current.captain_phone,
    }));
  }, [captainDefaults]);

  useEffect(() => {
    if (!initialValues) {
      return;
    }
    setFormData(
      buildInitialFormData({
        captainDefaults,
        initialValues,
        minimumVisibleMemberCount: initialVisibleMemberSlots,
      }),
    );
    setSubmissionStatus({ message: "", type: "" });
  }, [captainDefaults, initialValues, initialVisibleMemberSlots]);

  useEffect(() => {
    setFormData((current) => {
      const minimumVisibleMemberCount = prefillMaxMemberSlots ? maxMemberCount : minMemberCount;
      const members = [...current.team_members];
      while (members.length < minimumVisibleMemberCount) {
        members.push(blankMember());
      }
      if (members.length > maxMemberCount && maxMemberCount >= minimumVisibleMemberCount) {
        members.length = maxMemberCount;
      }
      return { ...current, team_members: members };
    });
  }, [minMemberCount, maxMemberCount, prefillMaxMemberSlots]);

  const canAddMember = formData.team_members.length < maxMemberCount;
  const canRemoveMember = formData.team_members.length > minMemberCount;
  const enteredMemberCount = formData.team_members.filter(memberHasAnyValue).length;

  const sdgSummary = useMemo(() => {
    if (!formData.sdgs.length) {
      return "Select the SDGs this project supports.";
    }
    return formData.sdgs
      .map((sdgValue) => SDG_OPTIONS.find((option) => option.value === sdgValue))
      .filter(Boolean)
      .map((option) => option.label)
      .join(", ");
  }, [formData.sdgs]);

  const handleInputChange = (eventTarget) => {
    const { name, value } = eventTarget.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleTeamMemberChange = (index, field, value) => {
    setFormData((current) => {
      const nextMembers = [...current.team_members];
      nextMembers[index] = { ...nextMembers[index], [field]: value };
      return { ...current, team_members: nextMembers };
    });
  };

  const addTeamMember = () => {
    if (!canAddMember) {
      return;
    }
    setFormData((current) => ({
      ...current,
      team_members: [...current.team_members, blankMember()],
    }));
  };

  const removeTeamMember = (index) => {
    if (!canRemoveMember) {
      return;
    }
    setFormData((current) => ({
      ...current,
      team_members: current.team_members.filter((_, memberIndex) => memberIndex !== index),
    }));
  };

  const toggleSdg = (sdgValue) => {
    setFormData((current) => {
      const exists = current.sdgs.includes(sdgValue);
      return {
        ...current,
        sdgs: exists
          ? current.sdgs.filter((value) => value !== sdgValue)
          : [...current.sdgs, sdgValue].sort((a, b) => a - b),
      };
    });
  };

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault();
    setSubmissionStatus({ message: "Submitting...", type: "info" });

    try {
      const payload = {
        ...formData,
        trl_level: formData.trl_level ? Number(formData.trl_level) : "",
        sdgs: formData.sdgs,
        team_members: formData.team_members.filter(memberHasAnyValue),
      };

      const result = await submitProject(payload);
      setSubmissionStatus({ message: successMessage, type: "success" });
      await Promise.resolve(onSuccess?.(result));
      if (successRedirectPath) {
        setTimeout(() => navigate(successRedirectPath), 1800);
      }
    } catch (error) {
      const message =
        error?.response?.data?.error || error?.message || "An unknown error occurred.";
      setSubmissionStatus({ message: `Submission failed: ${message}`, type: "error" });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-gray-200/90 bg-white/80 p-8 shadow-xl backdrop-blur-lg">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="team_name" className="mb-1.5 block text-sm font-semibold text-gray-600">
              Team Name
            </label>
            <IconInput
              icon={Users}
              id="team_name"
              name="team_name"
              value={formData.team_name}
              onChange={handleInputChange}
              placeholder="Enter your team's name"
              required
            />
          </div>
          <div>
            <label htmlFor="project_topic" className="mb-1.5 block text-sm font-semibold text-gray-600">
              Project Topic
            </label>
            <IconInput
              icon={FileText}
              id="project_topic"
              name="project_topic"
              value={formData.project_topic}
              onChange={handleInputChange}
              placeholder="What is your project about?"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
            <label htmlFor="project_category" className="mb-1.5 block text-sm font-semibold text-gray-600">
              Project Category
            </label>
            <div className="relative">
              <Cpu className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <select
                id="project_category"
                name="project_category"
                value={formData.project_category}
                onChange={handleInputChange}
                required
                className={`${inputClassName} pl-11 pr-4`}
              >
                <option value="">Select Project Category</option>
                {PROJECT_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="trl_level" className="mb-1.5 block text-sm font-semibold text-gray-600">
              TRL Level
            </label>
            <div className="relative">
              <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <select
                id="trl_level"
                name="trl_level"
                value={formData.trl_level}
                onChange={handleInputChange}
                required
                className={`${inputClassName} pl-11 pr-4`}
              >
                <option value="">Select TRL Level</option>
                {TRL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="mb-1.5 text-sm font-semibold text-gray-600">Selected SDGs</p>
            <p className="text-sm text-gray-500">{sdgSummary}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-gray-600">Sustainable Development Goals</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {SDG_OPTIONS.map((option) => {
              const active = formData.sdgs.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleSdg(option.value)}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-[#ff6a3c] bg-orange-50 text-[#ff6a3c] shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{option.label}</span>
                    <span className="text-xs font-semibold">{active ? "Added" : "Pick"}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 opacity-80">{option.title}</p>
                </button>
              );
            })}
          </div>
        </div>

        <fieldset className="rounded-lg border border-gray-200/90 p-4">
          <legend className="px-2 font-semibold text-gray-700">
            Team Captain {lockCaptainIdentity ? "(You)" : ""}
          </legend>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="captain_name" className="mb-1.5 block text-sm font-semibold text-gray-600">
                Full Name
              </label>
              <IconInput
                icon={User}
                id="captain_name"
                name="captain_name"
                value={formData.captain_name}
                onChange={handleInputChange}
                required
                disabled={lockCaptainIdentity}
              />
            </div>
            <div>
              <label htmlFor="captain_email" className="mb-1.5 block text-sm font-semibold text-gray-600">
                Email
              </label>
              <IconInput
                icon={Mail}
                id="captain_email"
                name="captain_email"
                type="email"
                value={formData.captain_email}
                onChange={handleInputChange}
                required
                disabled={lockCaptainIdentity}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="captain_phone" className="mb-1.5 block text-sm font-semibold text-gray-600">
                Mobile Number
              </label>
              <IconInput
                icon={Phone}
                id="captain_phone"
                name="captain_phone"
                type="tel"
                value={formData.captain_phone}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </fieldset>

        {event?.maxTeamSize > 1 && (
          <div>
            <label className="mb-2 block font-semibold text-gray-700">
              Additional Team Members{" "}
              <span className="text-sm font-normal text-gray-500">
                (Captain counts as 1. Total team size: {event.minTeamSize}-{event.maxTeamSize})
              </span>
            </label>
            <p className="mb-4 text-sm text-gray-500">
              {prefillMaxMemberSlots
                ? "All available member slots are ready for manual entry. Leave unused rows blank and they will be ignored on save."
                : "Add the rest of your team here. Empty optional rows are ignored on save."}
            </p>
            <div className="space-y-4">
              {formData.team_members.map((member, index) => (
                <div key={`${index}-${event?.eventId || "team-member"}`} className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">Member {index + 2}</p>
                    {canRemoveMember && (
                      <button
                        type="button"
                        onClick={() => removeTeamMember(index)}
                        className="inline-flex items-center gap-1 rounded-md bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-200"
                      >
                        <UserMinus size={14} />
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <IconInput
                      icon={User}
                      type="text"
                      value={member.name}
                      onChange={(eventTarget) => handleTeamMemberChange(index, "name", eventTarget.target.value)}
                      placeholder="Full name"
                      required={index < minMemberCount}
                    />
                    <IconInput
                      icon={Mail}
                      type="email"
                      value={member.email}
                      onChange={(eventTarget) => handleTeamMemberChange(index, "email", eventTarget.target.value)}
                      placeholder="Email"
                      required={index < minMemberCount}
                    />
                    <IconInput
                      icon={Phone}
                      type="tel"
                      value={member.phone}
                      onChange={(eventTarget) => handleTeamMemberChange(index, "phone", eventTarget.target.value)}
                      placeholder="Phone"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={addTeamMember}
                disabled={!canAddMember}
                className="inline-flex items-center gap-2 rounded-md bg-orange-100/80 px-4 py-2 text-sm font-semibold text-[#df9400] transition hover:bg-orange-200/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserPlus size={16} />
                Add Member
              </button>
              <div className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-500">
                <Hash size={16} />
                Entered members: {enteredMemberCount} / {maxMemberCount}
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="faculty_mentor_name" className="mb-1.5 block text-sm font-semibold text-gray-600">
            Faculty Mentor Name {event?.isFacultyMentorRequired ? "" : "(Optional)"}
          </label>
          <IconInput
            icon={Briefcase}
            id="faculty_mentor_name"
            name="faculty_mentor_name"
            type="text"
            value={formData.faculty_mentor_name}
            onChange={handleInputChange}
            placeholder="Enter mentor's full name"
            required={Boolean(event?.isFacultyMentorRequired)}
          />
        </div>

        <div className="pt-4 text-center">
          {submissionStatus.message && (
            <p
              className={`mb-4 rounded-lg p-2 text-sm font-semibold ${
                submissionStatus.type === "success"
                  ? "bg-green-100 text-green-800"
                  : submissionStatus.type === "error"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {submissionStatus.message}
            </p>
          )}
          <button
            type="submit"
            disabled={submissionStatus.message === "Submitting..."}
            className="mx-auto w-full max-w-xs rounded-lg bg-[#ff6a3c] px-6 py-3 font-bold text-white transition-shadow hover:shadow-lg hover:shadow-orange-500/50 disabled:bg-gray-400"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ProjectSubmissionForm;
