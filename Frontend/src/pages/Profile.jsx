import React, { useState } from "react";
import {
  FiUser,
  FiSettings,
  FiActivity,
  FiAlertTriangle,
  FiCheckSquare,
  FiPlus,
  FiX,
  FiBell,
  FiMoon,
  FiDroplet,
  FiMonitor,
  FiZap,
  FiShield,
  FiAward,
  FiSave,
  FiRefreshCw,
  FiMail,
  FiCheck,
  FiTrash2,
} from "react-icons/fi";
import { PageTransition } from "../components/PageTransition";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

// ─── Shared tiny helpers ───────────────────────────────────────────────────

const Label = ({ children }) => (
  <p className="text-[11px] uppercase font-bold tracking-widest text-text-dark/45 dark:text-text-light/40 mb-1.5">
    {children}
  </p>
);

const inputCls = `w-full rounded-xl px-4 py-2.5 text-sm border outline-none transition-all
    bg-bg-light dark:bg-bg-dark
    text-text-dark dark:text-text-light
    border-secondary/20 dark:border-secondary/10
    focus:border-secondary/60 dark:focus:border-secondary/40
    disabled:opacity-50 disabled:cursor-not-allowed`;

const SectionTitle = ({ icon, children }) => (
  <div className="flex items-center gap-2 mb-5">
    <span className="text-secondary">{icon}</span>
    <h3 className="text-base font-bold text-text-dark dark:text-text-light">
      {children}
    </h3>
  </div>
);

const Divider = () => (
  <hr className="border-secondary/10 dark:border-secondary/5 my-5" />
);

const TagChip = ({ label, colorCls, onRemove }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${colorCls}`}
  >
    {label}
    <button
      type="button"
      onClick={onRemove}
      className="hover:opacity-60 transition-opacity cursor-pointer"
    >
      <FiX className="w-3 h-3" />
    </button>
  </span>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export const Profile = () => {
  const {
    userProfile,
    isInitialLoading,
    updateProfile,
    retakeAssessment,
    deleteAccount,
    streak,
    wellnessScore,
  } = useApp();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // ── Form state ──
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [occupation, setOccupation] = useState("");
  const [sleepHours, setSleepHours] = useState(7);
  const [exerciseFrequency, setExerciseFrequency] = useState("");
  const [screenTime, setScreenTime] = useState(6);
  const [waterIntake, setWaterIntake] = useState(2.5);
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState("");
  const [triggers, setTriggers] = useState([]);
  const [newTrigger, setNewTrigger] = useState("");
  const [copingMethods, setCopingMethods] = useState([]);
  const [newCoping, setNewCoping] = useState("");
  const [notifications, setNotifications] = useState({
    dailyCheckin: true,
    weeklySummary: true,
    wellnessReminders: false,
  });

  // ── Snapshot for change detection ──
  const original = React.useRef(null);
  const hasLoaded = React.useRef(false);

  React.useEffect(() => {
    if (!isInitialLoading && userProfile && userProfile.name) {
      const snap = {
        name: userProfile.name,
        email: userProfile.email || "",
        occupation: userProfile.occupation || "",
        sleepHours: userProfile.sleepHours ?? 7,
        exerciseFrequency: userProfile.exerciseFrequency || "",
        screenTime: userProfile.screenTime ?? 6,
        waterIntake: userProfile.waterIntake ?? 2.5,
        goals: userProfile.goals || [],
        triggers: userProfile.triggers || [],
        copingMethods: userProfile.copingMethods || [],
        notifications: userProfile.notifications || {
          dailyCheckin: true,
          weeklySummary: true,
          wellnessReminders: false,
        },
      };
      if (!hasLoaded.current) {
        hasLoaded.current = true;
        original.current = snap;
        setName(snap.name);
        setEmail(snap.email);
        setOccupation(snap.occupation);
        setSleepHours(snap.sleepHours);
        setExerciseFrequency(snap.exerciseFrequency);
        setScreenTime(snap.screenTime);
        setWaterIntake(snap.waterIntake);
        setGoals(snap.goals);
        setTriggers(snap.triggers);
        setCopingMethods(snap.copingMethods);
        setNotifications(snap.notifications);
      }
    }
  }, [userProfile, isInitialLoading]);

  const hasChanges = () => {
    const o = original.current;
    if (!o) return false;
    const arrEq = (a, b) =>
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((v, i) => v === b[i]);
    return (
      name !== o.name ||
      email !== o.email ||
      occupation !== o.occupation ||
      Number(sleepHours) !== Number(o.sleepHours) ||
      exerciseFrequency !== o.exerciseFrequency ||
      Number(screenTime) !== Number(o.screenTime) ||
      Number(waterIntake) !== Number(o.waterIntake) ||
      !arrEq(goals, o.goals) ||
      !arrEq(triggers, o.triggers) ||
      !arrEq(copingMethods, o.copingMethods) ||
      notifications.dailyCheckin !== o.notifications?.dailyCheckin ||
      notifications.weeklySummary !== o.notifications?.weeklySummary ||
      notifications.wellnessReminders !== o.notifications?.wellnessReminders
    );
  };

  const addTag = (val, list, setList, setVal) => {
    if (val.trim() && !list.includes(val.trim())) {
      setList([...list, val.trim()]);
      setVal("");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!hasChanges()) {
      alert("No changes detected. Update any field before saving.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name,
        email,
        occupation,
        sleepHours,
        exerciseFrequency,
        screenTime,
        waterIntake,
        goals,
        triggers,
        copingMethods,
        notifications,
      });
      original.current = {
        name,
        email,
        occupation,
        sleepHours,
        exerciseFrequency,
        screenTime,
        waterIntake,
        goals: [...goals],
        triggers: [...triggers],
        copingMethods: [...copingMethods],
        notifications: { ...notifications },
      };
      setSaving(false);
      alert("Profile updated successfully!");
    } catch (err) {
      setSaving(false);
      const errs = err.response?.data?.errors || err.response?.data || {};
      alert(
        errs.username?.[0] ||
          errs.email?.[0] ||
          err.message ||
          "Failed to save."
      );
    }
  };

  const handleRetakeAssessment = async () => {
    if (
      window.confirm(
        "Retaking the assessment will reset your profile data and redirect you to the onboarding wizard. Your check-in history and journals are preserved. Continue?",
      )
    ) {
      try {
        await retakeAssessment();
        navigate("/app/onboarding");
      } catch (err) {
        alert("Failed to reset: " + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleDeleteAccount = async () => {
    // First confirmation
    const first = window.confirm(
      "⚠️ Are you sure you want to permanently delete your account?\n\n" +
        "This will delete:\n" +
        "• Your profile and all personal data\n" +
        "• All check-in history\n" +
        "• All journal entries\n" +
        "• All activity records\n" +
        "• Your AI insights history\n\n" +
        "This action CANNOT be undone.",
    );
    if (!first) return;

    // Second confirmation — must type name to confirm
    const typed = window.prompt(
      `Final confirmation required.\n\nType your username "${name}" exactly to permanently delete your account:`,
    );
    if (typed !== name) {
      if (typed !== null)
        alert("Username did not match. Account deletion cancelled.");
      return;
    }

    try {
      await deleteAccount();
      navigate("/login");
    } catch (err) {
      alert(
        "Failed to delete account: " +
          (err.response?.data?.error || err.message),
      );
    }
  };

  const exerciseOptions = [
    "Daily",
    "5–6x/week",
    "3–4x/week",
    "1–2x/week",
    "Rarely",
    "Never",
  ];

  // ── Slider component ──
  const Slider = ({
    label,
    icon,
    val,
    setVal,
    min,
    max,
    step,
    unit,
    accentColor,
  }) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label>{label}</Label>
        <span className="text-xs font-bold text-primary dark:text-accent">
          {val}
          {unit}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-secondary/70 shrink-0">{icon}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={val}
          onChange={(e) => setVal(Number(e.target.value))}
          style={{ accentColor }}
          className="w-full h-1.5 rounded-full appearance-none bg-secondary/15 dark:bg-secondary/10 cursor-pointer"
        />
      </div>
    </div>
  );

  // ── Tag section component ──
  const TagSection = ({
    label,
    icon,
    items,
    setItems,
    newVal,
    setNewVal,
    placeholder,
    chipColor,
  }) => (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2 min-h-[2rem] mb-3">
        {items.length === 0 ? (
          <span className="text-xs text-text-dark/30 dark:text-text-light/30 italic">
            None added yet
          </span>
        ) : (
          items.map((item, i) => (
            <TagChip
              key={i}
              label={item}
              colorCls={chipColor}
              onRemove={() => setItems(items.filter((x) => x !== item))}
            />
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={placeholder}
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(newVal, items, setItems, setNewVal);
            }
          }}
          className={`${inputCls} flex-1 py-2 text-xs`}
        />
        <button
          type="button"
          onClick={() => addTag(newVal, items, setItems, setNewVal)}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-primary dark:bg-accent text-bg-light dark:text-bg-dark hover:opacity-90 transition-opacity cursor-pointer"
        >
          <FiPlus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <PageTransition>
      <div className="flex-grow flex flex-col gap-7 text-left max-w-4xl mx-auto w-full">
        {/* ── Page Header ── */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-dark dark:text-text-light">
            Profile & Settings
          </h1>
          <p className="text-sm text-text-dark/55 dark:text-text-light/55 mt-1">
            Manage your personal details, lifestyle baselines, wellness goals,
            and notification preferences.
          </p>
        </div>

        {/* ── Read-only Stats Row ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Day Streak",
              val: streak ?? 0,
              icon: <FiZap className="w-4 h-4 text-amber-500" />,
              valCls: "text-amber-600 dark:text-amber-400",
            },
            {
              label: "Wellness Score",
              val: `${wellnessScore ?? "--"}/100`,
              icon: <FiActivity className="w-4 h-4 text-indigo-500" />,
              valCls: "text-indigo-600 dark:text-indigo-400",
            },
            {
              label: "Email Status",
              val: userProfile?.is_email_verified ? "Verified" : "Unverified",
              icon: <FiMail className="w-4 h-4 text-emerald-500" />,
              valCls: userProfile?.is_email_verified
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400",
            },
          ].map(({ label, val, icon, valCls }) => (
            <div
              key={label}
              className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-2xl px-5 py-4 flex items-center gap-3"
            >
              <div className="p-2 bg-secondary/8 dark:bg-secondary/5 rounded-xl shrink-0">
                {icon}
              </div>
              <div>
                <p className={`text-sm font-bold ${valCls}`}>{val}</p>
                <p className="text-[11px] text-text-dark/45 dark:text-text-light/40 font-medium">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSave}>
          <fieldset disabled={saving} className="contents">
            <div className="space-y-5">
              {/* ── Card 1: Personal Info ── */}
              <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-3xl p-6 md:p-8 shadow-sm">
                <SectionTitle icon={<FiUser className="w-5 h-5" />}>
                  Personal Info
                </SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <Label>Preferred Name</Label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      required
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <Label>Occupation</Label>
                    <input
                      id="occupation"
                      type="text"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder="e.g. Student, Engineer…"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* ── Card 2: Lifestyle Baseline ── */}
              <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-3xl p-6 md:p-8 shadow-sm">
                <SectionTitle icon={<FiActivity className="w-5 h-5" />}>
                  Lifestyle Baseline
                </SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
                  <Slider
                    label="Sleep per night"
                    icon={<FiMoon className="w-4 h-4" />}
                    val={sleepHours}
                    setVal={setSleepHours}
                    min={3}
                    max={12}
                    step={0.5}
                    unit=" hrs"
                    accentColor="#6366f1"
                  />
                  <Slider
                    label="Daily screen time"
                    icon={<FiMonitor className="w-4 h-4" />}
                    val={screenTime}
                    setVal={setScreenTime}
                    min={0}
                    max={16}
                    step={0.5}
                    unit=" hrs"
                    accentColor="#f59e0b"
                  />
                  <Slider
                    label="Water intake"
                    icon={<FiDroplet className="w-4 h-4" />}
                    val={waterIntake}
                    setVal={setWaterIntake}
                    min={0.5}
                    max={5}
                    step={0.25}
                    unit=" L"
                    accentColor="#06b6d4"
                  />
                </div>
                <Divider />
                <div>
                  <Label>Exercise Frequency</Label>
                  <div className="flex flex-wrap gap-2">
                    {exerciseOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setExerciseFrequency(opt)}
                        className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-all cursor-pointer
                                                    ${
                                                      exerciseFrequency === opt
                                                        ? "bg-primary dark:bg-accent text-bg-light dark:text-bg-dark border-transparent shadow-sm"
                                                        : "bg-transparent border-secondary/25 text-text-dark/60 dark:text-text-light/55 hover:border-secondary/50"
                                                    }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Card 3: Goals / Triggers / Coping ── */}
              <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-3xl p-6 md:p-8 shadow-sm">
                <SectionTitle icon={<FiAward className="w-5 h-5" />}>
                  Wellness Data
                </SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                  <TagSection
                    label="Wellness Goals"
                    icon={<FiAward />}
                    items={goals}
                    setItems={setGoals}
                    newVal={newGoal}
                    setNewVal={setNewGoal}
                    placeholder="e.g. Sleep better…"
                    chipColor="bg-primary/10 text-primary dark:bg-accent/15 dark:text-accent"
                  />
                  <TagSection
                    label="Emotional Triggers"
                    icon={<FiAlertTriangle />}
                    items={triggers}
                    setItems={setTriggers}
                    newVal={newTrigger}
                    setNewVal={setNewTrigger}
                    placeholder="e.g. Work deadlines…"
                    chipColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  />
                  <TagSection
                    label="Coping Methods"
                    icon={<FiCheckSquare />}
                    items={copingMethods}
                    setItems={setCopingMethods}
                    newVal={newCoping}
                    setNewVal={setNewCoping}
                    placeholder="e.g. Meditation…"
                    chipColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              {/* ── Card 4: Notification Preferences ── */}
              <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-3xl p-6 md:p-8 shadow-sm">
                <SectionTitle icon={<FiBell className="w-5 h-5" />}>
                  Notification Preferences
                </SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      key: "dailyCheckin",
                      label: "Daily Morning Check-in",
                      sub: "Redirects you to check-in when you first open the app",
                    },
                    {
                      key: "weeklySummary",
                      label: "Weekly Metrics Summary",
                      sub: "Shows your AI-generated weekly summary on Insights",
                    },
                    {
                      key: "wellnessReminders",
                      label: "Wellness Activity Reminders",
                      sub: "Nudges to complete your daily recommended activity",
                    },
                  ].map(({ key, label, sub }) => (
                    <label
                      key={key}
                      className={`flex flex-col justify-between p-4.5 rounded-2xl border transition-all cursor-pointer select-none
                        ${
                          notifications[key]
                            ? "border-primary/40 bg-primary/5 dark:border-accent/40 dark:bg-accent/5 shadow-xs"
                            : "border-secondary/15 dark:border-secondary/10 bg-transparent hover:border-secondary/30"
                        }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={notifications[key]}
                        onChange={() =>
                          setNotifications((prev) => ({
                            ...prev,
                            [key]: !prev[key],
                          }))
                        }
                      />
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold text-text-dark dark:text-text-light leading-snug">
                            {label}
                          </p>
                          <div
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all
                              ${
                                notifications[key]
                                  ? "bg-primary dark:bg-accent border-primary dark:border-accent"
                                  : "border-secondary/30 dark:border-secondary/20 bg-transparent"
                              }`}
                          >
                            {notifications[key] && (
                              <FiCheck
                                className="w-3.5 h-3.5 text-bg-light dark:text-bg-dark"
                                strokeWidth={3}
                              />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-text-dark/50 dark:text-text-light/45 leading-relaxed">
                          {sub}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* ── Save Bar ── */}
              <div className="flex items-center justify-between py-2">
                <p className="text-xs text-text-dark/40 dark:text-text-light/35">
                  {saving
                    ? "Saving your changes…"
                    : "All changes are saved to the database and persist permanently."}
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full text-sm font-bold
                                        bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover
                                        text-bg-light dark:text-bg-dark shadow-sm hover:shadow transition-all cursor-pointer
                                        disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FiSave className="w-4 h-4" />
                  {saving ? "Saving…" : "Save Settings"}
                </button>
              </div>
            </div>
          </fieldset>
        </form>

        {/* ── Account Actions (outside form — never disabled) ── */}
        <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-3xl p-6 md:p-8 shadow-sm">
          <SectionTitle icon={<FiShield className="w-5 h-5" />}>
            Account Actions
          </SectionTitle>
          <p className="text-sm text-text-dark/60 dark:text-text-light/60 leading-relaxed -mt-2 mb-5">
            These actions are permanent. Retaking the assessment clears profile
            configuration but keeps your journals and check-ins. Deleting your
            account removes everything permanently.
          </p>
          <div className="border border-red-200/60 dark:border-red-900/30 rounded-2xl p-5 bg-red-50/50 dark:bg-red-950/10">
            <p className="text-xs font-bold uppercase tracking-wider text-red-500/80 mb-4">
              Danger Zone
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleRetakeAssessment}
                title="⚠️ Warning: This will reset your onboarding profile configuration. Your check-in history, journal entries, and account data will be preserved — but occupation, goals, lifestyle baselines, and coping methods will be cleared."
                className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400
                                    border border-red-300/60 dark:border-red-700/40 bg-white dark:bg-transparent
                                    hover:bg-red-50 dark:hover:bg-red-950/20 px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                <FiRefreshCw className="w-4 h-4" />
                Retake Onboarding Assessment
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                title="⛔ Permanently deletes your account and ALL data. This cannot be undone."
                className="inline-flex items-center gap-2 text-sm font-bold text-white
                                    bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800
                                    px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <FiTrash2 className="w-4 h-4" />
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
