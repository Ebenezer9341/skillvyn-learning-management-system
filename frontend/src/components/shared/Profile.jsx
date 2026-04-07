import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Shield,
  Bell,
  Globe,
  Linkedin,
  Twitter,
  Github,
  Save,
  Edit2,
  Briefcase,
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Key,
  ExternalLink,
  Star,
  Award,
  BookOpen,
  Users,
  Wand2,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getImageUrl } from "../../utils/imageUtils";
import AvatarGeneratorModal from "./AvatarGeneratorModal";

const Profile = ({ userRole = "User" }) => {
  const { user: authUser, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({});
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    specialty: "",
    socialLinks: {
      linkedin: "",
      twitter: "",
      github: "",
      portfolio: "",
    },
    avatar: "",
    cover: "",
    notificationSettings: {
      emailAlerts: true,
      pushNotifications: true,
      courseUpdates: true,
      marketingEmails: false,
    },
  });

  useEffect(() => {
    document.title = `${userRole} Profile | Skillvyn`;
    fetchUserProfile();
  }, [userRole]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/users/me");
      const { user: userData, stats: userStats } = response.data.data;

      setStats(userStats || {});
      setFormData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        phone: userData.phone || "",
        location: userData.location || "",
        bio: userData.bio || "",
        specialty: userData.specialty || "",
        socialLinks: {
          linkedin: userData.socialLinks?.linkedin || "",
          twitter: userData.socialLinks?.twitter || "",
          github: userData.socialLinks?.github || "",
          portfolio: userData.socialLinks?.portfolio || "",
        },
        avatar:
          userData.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.firstName}`,
        cover:
          userData.cover ||
          "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=2000",
        notificationSettings: userData.notificationSettings || {
          emailAlerts: true,
          pushNotifications: true,
          courseUpdates: true,
          marketingEmails: false,
        },
      });
    } catch (err) {
      toast.error("Failed to load profile data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleToggle = (name) => {
    if (!isEditing) return;
    const [parent, child] = name.split(".");
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: !prev[parent][child],
      },
    }));
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataFile = new FormData();
    formDataFile.append(type, file);

    try {
      setSaving(true);
      const endpoint =
        type === "avatar" ? "/api/users/avatar" : "/api/users/cover";
      const response = await api.patch(endpoint, formDataFile, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedUser = response.data.data.user;
      setFormData((prev) => ({ ...prev, [type]: updatedUser[type] }));

      // Sync AuthContext
      updateUser(updatedUser);

      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`,
      );
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to upload ${type}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.patch("/api/users/update-profile", formData);
      const updatedUser = response.data.data.user;

      // Update auth context so other components (TopBar etc) reflect changes
      updateUser(updatedUser);

      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const toastId = toast.loading("Sending reset link to your email...");
      await api.post("/api/auth/forgot-password", { email: formData.email });
      toast.update(toastId, { 
        render: "Password reset link sent! Check your inbox.", 
        type: "success", 
        isLoading: false, 
        autoClose: 5000 
      });
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || "Failed to send reset link.");
    }
  };

  const allTabs = [
    { id: "personal", label: "Personal Info", icon: User, color: "blue" },
    {
      id: "professional",
      label: "Professional",
      icon: Briefcase,
      color: "emerald",
    },
    { id: "security", label: "Security", icon: Key, color: "amber" },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      color: "purple",
    },
  ];

  // Filter tabs based on role
  const tabs =
    userRole.toLowerCase() === "candidate"
      ? allTabs.filter((tab) => tab.id !== "professional")
      : allTabs;

  const tabColorMap = {
    blue: {
      active: "bg-primary text-white shadow-primary/20",
      icon: "bg-white/20",
      inactive: "text-slate-400 hover:bg-slate-50 hover:text-slate-900",
      inactiveIcon: "bg-slate-50 group-hover:bg-white",
    },
    emerald: {
      active: "bg-accent text-white shadow-accent/20",
      icon: "bg-white/20",
      inactive: "text-slate-400 hover:bg-slate-50 hover:text-slate-900",
      inactiveIcon: "bg-slate-50 group-hover:bg-white",
    },
    amber: {
      active: "bg-accent/80 text-white shadow-accent/20",
      icon: "bg-white/20",
      inactive: "text-slate-400 hover:bg-slate-50 hover:text-slate-900",
      inactiveIcon: "bg-slate-50 group-hover:bg-white",
    },
    purple: {
      active: "bg-secondary text-white shadow-secondary/20",
      icon: "bg-white/20",
      inactive: "text-slate-400 hover:bg-slate-50 hover:text-slate-900",
      inactiveIcon: "bg-slate-50 group-hover:bg-white",
    },
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 },
    },
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <RefreshCw size={40} className="text-primary animate-spin mb-4" />
      <p className="text-slate-500 font-bold animate-pulse">
        Synchronizing Profile...
      </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto pb-12"
    >
      {/* Header / Cover Section */}
      <div className="relative mb-[280px] sm:mb-[300px] md:mb-32 group/header">
        <div className="h-48 md:h-64 rounded-2xl overflow-hidden relative shadow-2xl shadow-slate-200">
          <img
            src={getImageUrl(
              formData.cover,
              "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=2000",
            )}
            alt="cover"
            className="w-full h-full object-cover transition-transform duration-700 group-hover/header:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>

          {isEditing && (
            <div className="absolute bottom-6 right-8">
              <input
                type="file"
                id="cover-upload"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "cover")}
              />
              <label
                htmlFor="cover-upload"
                className="bg-white/20 backdrop-blur-xl text-white p-3 rounded-2xl hover:bg-white/30 transition-all border border-white/30 shadow-xl group/btn cursor-pointer block"
              >
                <Camera
                  size={20}
                  className="group-hover/btn:scale-110 transition-transform"
                />
              </label>
            </div>
          )}

          <div className="absolute top-6 left-8 flex items-center gap-3">
            <div className="px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl">
              <span className="text-white text-[10px] font-black tracking-[0.2em] uppercase">
                {userRole} Account
              </span>
            </div>
            {authUser?.isActive && (
              <div className="px-5 py-2 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-2xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                  Verified
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Avatar Overlay */}
        <div className="absolute -bottom-18 left-8 md:left-14 flex flex-col md:flex-row md:items-end gap-8">
          <div className="relative group/avatar">
            <div className="w-32 h-32 md:w-44 md:h-44 rounded-2xl border-[6px] border-white overflow-hidden shadow-2xl bg-white shadow-primary/10 transition-transform duration-500 group-hover/avatar:rotate-2">
              <img
                src={getImageUrl(
                  formData.avatar,
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.firstName}`,
                )}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
            {isEditing && (
              <div className="absolute inset-4">
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "avatar")}
                />
                <div className="w-full h-full bg-secondary/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 rounded-2xl text-white">
                  <div className="flex gap-4">
                    <label
                      htmlFor="avatar-upload"
                      className="p-3 bg-white/10 hover:bg-white/30 rounded-2xl cursor-pointer transition-all hover:scale-110 active:scale-95"
                      title="Upload Photo"
                    >
                      <Camera size={24} className="animate-pulse" />
                    </label>
                    <button
                      onClick={() => setIsGeneratorOpen(true)}
                      className="p-3 bg-primary/20 text-primary-300 hover:bg-primary/40 rounded-2xl cursor-pointer transition-all hover:scale-110 active:scale-95"
                      title="Generate Avatar"
                    >
                      <Wand2 size={24} className="animate-pulse" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="m-0">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}` : 'Anonymous User'}
              <CheckCircle2 size={24} className="text-primary" />
            </h1>
            {formData.email && (
              <p className="text-slate-500 font-bold mt-1 opacity-70">
                @{formData.email.split("@")[0]}
              </p>
            )}
          </div>
        </div>

        <div className="absolute -bottom-[200px] md:bottom-5 left-8 right-8 md:left-auto md:right-25 flex flex-col sm:flex-row justify-start md:justify-end gap-4 z-10">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/10 active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-8 py-4 bg-secondary text-white font-black rounded-2xl hover:bg-secondary/90 transition-all shadow-xl shadow-secondary/10 active:scale-95 group/edit"
            >
              <Edit2
                size={20}
                className="group-hover:rotate-12 transition-transform"
              />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {userRole.toLowerCase() === "mentor" ? (
          <>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-5 group hover:scale-[1.02] transition-all">
              <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                <BookOpen size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Published Courses
                </p>
                <h4 className="text-2xl font-black text-slate-900">
                  {stats.courseCount || 0}
                </h4>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-5 group hover:scale-[1.02] transition-all">
              <div className="w-14 h-14 bg-accent/5 text-accent rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-accent group-hover:text-white transition-all">
                <Users size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Students
                </p>
                <h4 className="text-2xl font-black text-slate-900">
                  {stats.totalStudents || 0}
                </h4>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-5 group hover:scale-[1.02] transition-all">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-amber-600 group-hover:text-white transition-all">
                <Star size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Avg. Rating
                </p>
                <h4 className="text-2xl font-black text-slate-900">
                  {stats.averageRating || 0} / 5.0
                </h4>
              </div>
            </div>
          </>
        ) : userRole.toLowerCase() === "candidate" ? (
          <>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-5 group hover:scale-[1.02] transition-all">
              <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                <BookOpen size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Enrolled Courses
                </p>
                <h4 className="text-2xl font-black text-slate-900">
                  {stats.enrolledCount || 0}
                </h4>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-5 group hover:scale-[1.02] transition-all">
              <div className="w-14 h-14 bg-accent/5 text-accent rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-accent group-hover:text-white transition-all">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Completed
                </p>
                <h4 className="text-2xl font-black text-slate-900">
                  {stats.completedCount || 0}
                </h4>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-5 group hover:scale-[1.02] transition-all">
              <div className="w-14 h-14 bg-secondary/5 text-secondary rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-secondary group-hover:text-white transition-all">
                <Award size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Certificates
                </p>
                <h4 className="text-2xl font-black text-slate-900">
                  {stats.certificateCount || 0}
                </h4>
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-full bg-slate-100 p-8 rounded-2xl border border-slate-200/50 text-center">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
              Administrative Profile Control Center
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-6 md:px-0">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const colors = tabColorMap[tab.color];
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 text-left group ${
                      isActive
                        ? `${colors.active} shadow-xl font-black scale-[1.02]`
                        : `${colors.inactive} font-bold`
                    }`}
                  >
                    <div
                      className={`p-2 rounded-2xl transition-colors ${
                        isActive ? colors.icon : colors.inactiveIcon
                      }`}
                    >
                      <tab.icon size={18} />
                    </div>
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-6 border-t border-slate-50 space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">
                Social Connect
              </h3>
              <div className="space-y-4 px-2">
                {["linkedin", "twitter", "github"].map((platform) => {
                  const Icon =
                    platform === "linkedin"
                      ? Linkedin
                      : platform === "twitter"
                        ? Twitter
                        : Github;
                  return (
                    <div key={platform} className="space-y-2">
                      <div className="relative group/input">
                        <Icon
                          size={14}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-primary transition-colors"
                        />
                        <input
                          type="text"
                          name={`socialLinks.${platform}`}
                          disabled={!isEditing}
                          value={formData.socialLinks[platform]}
                          onChange={handleInputChange}
                          placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL`}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold text-slate-600 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === "personal" && (
              <motion.div
                key="personal"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                      <User size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 leading-none">
                        Personal Identity
                      </h2>
                      <p className="text-slate-400 text-sm font-bold mt-1">
                        Basic identification and contact details
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        disabled={!isEditing}
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all outline-none text-slate-900 font-black tracking-tight inner-shadow"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        disabled={!isEditing}
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all outline-none text-slate-900 font-black tracking-tight inner-shadow"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                        Official Email
                      </label>
                      <div className="relative group">
                        <Mail
                          size={18}
                          className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"
                        />
                        <input
                          type="email"
                          disabled
                          value={formData.email}
                          className="w-full pl-14 pr-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-400 font-bold opacity-70 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                        Direct Phone
                      </label>
                      <div className="relative group">
                        <Phone
                          size={18}
                          className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors"
                        />
                        <input
                          type="text"
                          name="phone"
                          disabled={!isEditing}
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all outline-none text-slate-900 font-black tracking-tight inner-shadow"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                        Current Residency
                      </label>
                      <div className="relative group">
                        <MapPin
                          size={18}
                          className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"
                        />
                        <input
                          type="text"
                          name="location"
                          disabled={!isEditing}
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all outline-none text-slate-900 font-black tracking-tight inner-shadow"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                      The Story (Bio)
                    </label>
                    <textarea
                      rows={5}
                      name="bio"
                      disabled={!isEditing}
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself..."
                      className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all outline-none text-slate-700 font-bold leading-relaxed resize-none inner-shadow"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary via-secondary to-secondary/80 p-10 rounded-2xl text-white shadow-2xl shadow-primary/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-2xl -mr-32 -mt-32 blur-3xl transition-transform duration-1000 group-hover:scale-150"></div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-2xl">
                        <Calendar size={36} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black mb-1">
                          Active Journey
                        </h3>
                        <p className="text-white/70 font-bold text-sm">
                          Member since{" "}
                          {authUser?.createdAt
                            ? new Date(authUser.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "Recently Joined"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button className="px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl hover:bg-white/20 transition-all font-black text-sm active:scale-95">
                        Archive Data
                      </button>
                      <button className="px-8 py-4 bg-white text-secondary rounded-2xl hover:bg-slate-50 transition-all font-black text-sm shadow-2xl shadow-black/20 active:scale-95">
                        Security Key
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "professional" && (
              <motion.div
                key="professional"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-accent/5 rounded-2xl flex items-center justify-center text-accent shadow-inner">
                      <Briefcase size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 leading-none">
                        Career Information
                      </h2>
                      <p className="text-slate-400 text-sm font-bold mt-1">
                        Professional expertise and showcase
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                          Dominant Specialty
                        </label>
                        <input
                          type="text"
                          name="specialty"
                          disabled={!isEditing}
                          value={formData.specialty}
                          onChange={handleInputChange}
                          placeholder="e.g. Senior Backend Architect"
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-accent/5 transition-all outline-none text-slate-900 font-black tracking-tight inner-shadow"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                          Digital Portfolio
                        </label>
                        <div className="relative group">
                          <Globe
                            size={18}
                            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"
                          />
                          <input
                            type="text"
                            name="socialLinks.portfolio"
                            disabled={!isEditing}
                            value={formData.socialLinks.portfolio}
                            onChange={handleInputChange}
                            placeholder="https://yourportfolio.com"
                            className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-accent/5 transition-all outline-none text-slate-900 font-black tracking-tight inner-shadow"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-10 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100/50 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-2xl -mr-16 -mt-16 blur-2xl"></div>
                      <div className="flex items-start gap-6 relative z-10">
                        <div className="w-16 h-16 px-4 bg-white rounded-2xl flex items-center justify-center text-accent shadow-xl shadow-accent/20">
                          <Shield size={32} />
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-slate-900">
                            Mentor Credentials
                          </h4>
                          <p className="text-sm text-slate-500 mt-2 font-bold leading-relaxed">
                            Your professional credentials have been verified by
                            the Skillvyn auditing team. You are authorized to
                            publish courses and issue globally recognized
                            certificates.
                          </p>
                          <button className="mt-5 flex items-center gap-2 text-accent font-black text-xs uppercase tracking-widest hover:gap-3 transition-all">
                            View Certification Details{" "}
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                      <Key size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 leading-none">
                        Security Center
                      </h2>
                      <p className="text-slate-400 text-sm font-bold mt-1">
                        Manage authentication and account protection
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between inner-shadow">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-md">
                          <Shield size={24} />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-900">
                            Change Password
                          </h4>
                          <p className="text-slate-400 text-sm font-bold">
                            Update your account credentials
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={handlePasswordReset}
                        className="px-8 py-3 bg-white border border-slate-200 text-slate-900 font-black rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                      >
                        Reset Password
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shadow-inner">
                      <Bell size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 leading-none">
                        Communication Preferences
                      </h2>
                      <p className="text-slate-400 text-sm font-bold mt-1">
                        Control how Skillvyn reaches out to you
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        id: "emailAlerts",
                        label: "Email Alerts",
                        desc: "Critical account and security updates",
                        icon: Mail,
                      },
                      {
                        id: "pushNotifications",
                        label: "Push Notifications",
                        desc: "Real-time learning reminders",
                        icon: Bell,
                      },
                      {
                        id: "courseUpdates",
                        label: "Course Updates",
                        desc: "New content from your mentors",
                        icon: BookOpen,
                      },
                      {
                        id: "marketingEmails",
                        label: "Marketing Info",
                        desc: "Promotions and new platform features",
                        icon: Star,
                      },
                    ].map((setting) => (
                      <div
                        key={setting.id}
                        className="p-8 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-secondary/20 transition-all inner-shadow"
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-secondary shadow-sm border border-slate-100 transition-colors">
                            <setting.icon size={20} />
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-slate-900">
                              {setting.label}
                            </h4>
                            <p className="text-slate-400 text-sm font-bold">
                              {setting.desc}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handleToggle(`notificationSettings.${setting.id}`)
                          }
                          className={`w-14 h-8 rounded-full relative transition-all duration-500 ${
                            formData.notificationSettings?.[setting.id]
                              ? "bg-secondary shadow-lg shadow-secondary/20"
                              : "bg-slate-200 shadow-inner"
                          } ${!isEditing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div
                            className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-500 transform ${
                              formData.notificationSettings?.[setting.id]
                                ? "left-7"
                                : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {isGeneratorOpen && (
        <AvatarGeneratorModal
          isOpen={isGeneratorOpen}
          onClose={() => setIsGeneratorOpen(false)}
          currentSeed={formData.firstName}
          onSave={(newUrl) =>
            setFormData((prev) => ({ ...prev, avatar: newUrl }))
          }
        />
      )}
    </motion.div>
  );
};

export default Profile;
