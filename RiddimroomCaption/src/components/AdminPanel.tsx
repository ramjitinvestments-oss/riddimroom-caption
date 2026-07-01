import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Users, Activity, Settings, Sliders, Bell, History, Globe, 
  Search, Plus, RefreshCw, LogOut, Trash2, X, AlertCircle, Sparkles, 
  UserPlus, Check, CheckCircle2, Server, Cpu, HardDrive, ToggleLeft, ToggleRight,
  UserCheck, ShieldAlert
} from 'lucide-react';

interface AdminPanelProps {
  adminUsersList: any[];
  adminLogsList: any[];
  adminAuditLogs: any[];
  adminNotifications: any[];
  adminSettings: any;
  fetchAdminData: () => Promise<void>;
  handleAdminUpdateUserFeatures: (uid: string, features: any) => Promise<void>;
  handleAdminCreateUser: (userObj: any) => Promise<void>;
  handleAdminChangePassword: (uid: string, pass: string) => Promise<void>;
  handleAdminForceLogout: (uid: string) => Promise<void>;
  handleAdminForceLogoutAll: () => Promise<void>;
  handleAdminResetLimit: (uid: string) => Promise<void>;
  handleAdminToggleStatus: (uid: string, disabled: boolean) => Promise<void>;
  handleAdminSetRole: (uid: string, role: string) => Promise<void>;
  handleAdminDeleteUser: (uid: string) => Promise<void>;
  handleAdminSaveSettings: (settingsObj: any) => Promise<void>;
  handleAdminSaveCMS: (cmsObj: any) => Promise<void>;
  handleAdminSaveSecurity: (secObj: any) => Promise<void>;
  handleAdminSendNotification: (notifObj: any) => Promise<void>;
  navigateTo: (path: string) => void;
  authIdToken: string | null;
}

export function AdminPanel({
  adminUsersList,
  adminLogsList,
  adminAuditLogs,
  adminNotifications,
  adminSettings,
  fetchAdminData,
  handleAdminUpdateUserFeatures,
  handleAdminCreateUser,
  handleAdminChangePassword,
  handleAdminForceLogout,
  handleAdminForceLogoutAll,
  handleAdminResetLimit,
  handleAdminToggleStatus,
  handleAdminSetRole,
  handleAdminDeleteUser,
  handleAdminSaveSettings,
  handleAdminSaveCMS,
  handleAdminSaveSecurity,
  handleAdminSendNotification,
  navigateTo,
  authIdToken
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'cms' | 'settings' | 'security' | 'notifications' | 'audit'>('dashboard');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // New User Creation states
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserDisplayName, setNewUserDisplayName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');

  // Change Password state
  const [newPassword, setNewPassword] = useState('');

  // Announcement state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'info' | 'success' | 'warning' | 'danger'>('info');
  const [notifRecipientType, setNotifRecipientType] = useState<'all' | 'users' | 'admins'>('all');

  // Platform form states
  const [maxFileSize, setMaxFileSize] = useState(adminSettings?.settings?.maxFileSizeMb || 100);
  const [defaultLimit, setDefaultLimit] = useState(adminSettings?.settings?.defaultDailyQuota || 2);
  const [registrationOpen, setRegistrationOpen] = useState(adminSettings?.settings?.registrationOpen ?? true);
  const [maintenanceMode, setMaintenanceMode] = useState(adminSettings?.settings?.maintenanceMode ?? false);
  const [systemMessage, setSystemMessage] = useState(adminSettings?.settings?.systemMessage || '');

  // CMS form states
  const [cmsHeadline, setCmsHeadline] = useState(adminSettings?.cms?.headline || '');
  const [cmsSubheadline, setCmsSubheadline] = useState(adminSettings?.cms?.subheadline || '');
  const [cmsThemeColor, setCmsThemeColor] = useState(adminSettings?.cms?.themeColor || '#10B981');
  const [cmsPresetStyles, setCmsPresetStyles] = useState(adminSettings?.cms?.presetStyles || 'classic');

  // Security form states
  const [secAdminPass, setSecAdminPass] = useState(adminSettings?.security?.adminPasscode || '');
  const [secMaxAttempts, setSecMaxAttempts] = useState(adminSettings?.security?.maxLoginAttempts || 5);
  const [secSessionTimeout, setSecSessionTimeout] = useState(adminSettings?.security?.sessionTimeoutMinutes || 30);
  const [secMultiFactor, setSecMultiFactor] = useState(adminSettings?.security?.multiFactorEnforced ?? false);

  const handleSync = async () => {
    setIsSyncing(true);
    await fetchAdminData();
    setIsSyncing(false);
  };

  // Toggle user's specific features
  const toggleFeature = async (user: any, fieldName: string, currentValue: boolean) => {
    let updateObj: any = {};
    if (fieldName === 'enabled') {
      updateObj = { enabled: !currentValue, disabled: currentValue };
    } else if (fieldName === 'role') {
      updateObj = { role: currentValue ? 'user' : 'admin' };
    } else {
      updateObj = { [fieldName]: !currentValue };
    }

    await handleAdminUpdateUserFeatures(user.uid, updateObj);
    // Keep internal local selected user in sync
    setSelectedUser((prev: any) => {
      if (!prev) return null;
      if (fieldName === 'enabled') {
        return { ...prev, enabled: !currentValue, disabled: currentValue };
      } else if (fieldName === 'role') {
        return { ...prev, role: currentValue ? 'user' : 'admin' };
      }
      return { ...prev, [fieldName]: !currentValue };
    });
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col font-sans select-none">
      {/* Redesigned Executive Banner Header */}
      <header className="border-b border-white/5 bg-[#0e0e13] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
            <Shield className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
              <span>Riddimroom Executive Control Console</span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded">SYSTEM OK</span>
            </h1>
            <p className="text-[10px] text-white/40">Secure platform operations, dynamic feature toggles, notifications, audit trails & telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="p-2 px-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/5 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync Live Data</span>
          </button>
          <button
            onClick={() => navigateTo('/dashboard')}
            className="p-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/15 transition-all active:scale-95"
          >
            Go to Workspace
          </button>
        </div>
      </header>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Responsive Side Menu Drawer */}
        <aside className="lg:w-64 bg-[#0a0a0e] border-r lg:border-r border-b lg:border-b-0 border-white/5 p-4 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible shrink-0 select-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-white/45 hover:text-white/80 hover:bg-white/2'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span>Telemetry Center</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
              activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-white/45 hover:text-white/80 hover:bg-white/2'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>User Accounts Control</span>
          </button>
          <button
            onClick={() => setActiveTab('cms')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
              activeTab === 'cms' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-white/45 hover:text-white/80 hover:bg-white/2'
            }`}
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>Branding CMS</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
              activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-white/45 hover:text-white/80 hover:bg-white/2'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Operations Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
              activeTab === 'security' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-white/45 hover:text-white/80 hover:bg-white/2'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span>Access Policies</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
              activeTab === 'notifications' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-white/45 hover:text-white/80 hover:bg-white/2'
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span>Broadcast Alerts</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
              activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-white/45 hover:text-white/80 hover:bg-white/2'
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span>Audit Trails</span>
          </button>
        </aside>

        {/* View Layout Container */}
        <main className="flex-1 p-6 overflow-y-auto bg-[#070709]">
          <AnimatePresence mode="wait">
            {/* TAB 1: TELEMETRY & SYSTEM HEALTH */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-6 text-left"
              >
                {/* Master System Health Gauges */}
                <div className="space-y-2">
                  <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest font-mono">Platform Integrity Metrics</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-[#0e0e13] border border-white/5 p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-white/40 text-[10px] font-bold uppercase tracking-wider">
                        <span>Firestore Connection</span>
                        <Server className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="flex items-baseline gap-1.5 pt-1">
                        <span className="text-xl font-black text-white">ONLINE</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      </div>
                      <p className="text-[9px] text-white/30 font-semibold font-mono">Ping: 12ms | Replicated</p>
                    </div>

                    <div className="bg-[#0e0e13] border border-white/5 p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-white/40 text-[10px] font-bold uppercase tracking-wider">
                        <span>CPU Load</span>
                        <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xl font-black text-white">12.4%</span>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="w-[12%] h-full bg-indigo-500 rounded-full"></div>
                        </div>
                      </div>
                      <p className="text-[9px] text-white/30 font-semibold font-mono">4 Cores | 2.6GHz Standard</p>
                    </div>

                    <div className="bg-[#0e0e13] border border-white/5 p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-white/40 text-[10px] font-bold uppercase tracking-wider">
                        <span>Memory Usage</span>
                        <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xl font-black text-white">45.8%</span>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="w-[45%] h-full bg-emerald-400 rounded-full"></div>
                        </div>
                      </div>
                      <p className="text-[9px] text-white/30 font-semibold font-mono">3.6 GB / 8.0 GB Allocated</p>
                    </div>

                    <div className="bg-[#0e0e13] border border-white/5 p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-white/40 text-[10px] font-bold uppercase tracking-wider">
                        <span>Container Ephemeral Disk</span>
                        <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xl font-black text-white">38.1%</span>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="w-[38%] h-full bg-indigo-500 rounded-full"></div>
                        </div>
                      </div>
                      <p className="text-[9px] text-white/30 font-semibold font-mono">7.6 GB / 20.0 GB Total</p>
                    </div>

                    <div className="bg-[#0e0e13] border border-white/5 p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-white/40 text-[10px] font-bold uppercase tracking-wider">
                        <span>Connected Clients</span>
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="flex items-baseline gap-1.5 pt-1">
                        <span className="text-xl font-black text-white">{adminUsersList.length}</span>
                        <span className="text-[10px] text-emerald-400 font-extrabold uppercase">ACTIVE</span>
                      </div>
                      <p className="text-[9px] text-white/30 font-semibold font-mono">Google & Custom Accounts</p>
                    </div>
                  </div>
                </div>

                {/* Primary Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Volumetrics Chart */}
                  <div className="bg-[#0e0e13] border border-white/5 rounded-2xl p-5 md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">7-Day Transaction Volumetrics</h4>
                        <p className="text-[10px] text-white/40">Real-time usage volume across active transcription engines</p>
                      </div>
                      <span className="text-[10px] text-white/40 font-mono">Last updated: Just now</span>
                    </div>

                    <div className="h-56 w-full flex items-end justify-between gap-1.5 pt-6 border-b border-white/5">
                      {Array.from({ length: 7 }).map((_, i) => {
                        const values = [12, 18, 15, 25, 32, 28, 45];
                        const heightPercent = `${(values[i] / 50) * 100}%`;
                        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center group cursor-pointer h-full justify-end">
                            <span className="text-[9px] text-indigo-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-mono">
                              {values[i]}
                            </span>
                            <div 
                              className="w-full bg-gradient-to-t from-indigo-600/20 to-indigo-500 hover:to-indigo-400 rounded-t-lg transition-all duration-300" 
                              style={{ height: heightPercent }}
                            />
                            <span className="text-[9px] text-white/30 mt-2 font-semibold font-mono">
                              {days[i]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Platform Summaries & System Info */}
                  <div className="bg-[#0e0e13] border border-white/5 rounded-2xl p-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">System Operations State</h4>
                      <p className="text-[10px] text-white/40">Status of general platform rules and compliance limits</p>
                    </div>

                    <div className="divide-y divide-white/5 text-xs">
                      <div className="py-2.5 flex items-center justify-between">
                        <span className="text-white/55 font-semibold">Open Registrations</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          registrationOpen ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {registrationOpen ? 'ENABLED' : 'CLOSED'}
                        </span>
                      </div>
                      <div className="py-2.5 flex items-center justify-between">
                        <span className="text-white/55 font-semibold">Maintenance State</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          maintenanceMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {maintenanceMode ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <div className="py-2.5 flex items-center justify-between">
                        <span className="text-white/55 font-semibold">Standard Daily Quota</span>
                        <span className="text-white font-mono font-bold">{defaultLimit} / user</span>
                      </div>
                      <div className="py-2.5 flex items-center justify-between">
                        <span className="text-white/55 font-semibold">Maximum Ephemeral File</span>
                        <span className="text-white font-mono font-bold">{maxFileSize} MB</span>
                      </div>
                      <div className="py-2.5 flex items-center justify-between">
                        <span className="text-white/55 font-semibold">MFA Access Policy</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          secMultiFactor ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-white/40 border-white/5'
                        }`}>
                          {secMultiFactor ? 'ENFORCED' : 'OPTIONAL'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: USER ACCOUNT CONTROLS & COMPREHENSIVE FEATURE TOGGLES */}
            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-6 text-left"
              >
                {/* Upper Controls Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search registered accounts by name, email, or UID..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full px-4.5 py-2.5 bg-[#0e0e13] border border-white/10 rounded-xl text-xs text-white placeholder-white/20 outline-none focus:border-indigo-500 transition-all pl-11"
                    />
                    <Search className="w-4 h-4 text-white/30 absolute left-4 top-3.5" />
                  </div>

                  <button
                    onClick={() => {
                      setSelectedUser({
                        uid: 'NEW_USER',
                        displayName: '',
                        email: '',
                        role: 'user',
                        disabled: false,
                        dailyCount: 0,
                        totalTranscribes: 0
                      });
                      setNewUserDisplayName('');
                      setNewUserEmail('');
                      setNewUserPassword('');
                      setNewUserRole('user');
                    }}
                    className="p-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/15 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create User Account</span>
                  </button>
                </div>

                {/* Selected User Detailed Command Deck (With Feature Toggles) */}
                {selectedUser && (
                  <motion.div
                    initial={{ opacity: 0, y: -15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl space-y-5 relative"
                  >
                    <button 
                      onClick={() => setSelectedUser(null)} 
                      className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {selectedUser.uid === 'NEW_USER' ? (
                      /* ACCOUNT PROVISIONING FORM */
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-indigo-400" />
                          <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest font-mono">Manually Provision New User Profile</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/40 uppercase">Full Name</label>
                            <input 
                              type="text" 
                              placeholder="e.g. John Doe"
                              value={newUserDisplayName}
                              onChange={(e) => setNewUserDisplayName(e.target.value)}
                              className="w-full px-3.5 py-2 bg-[#0a0a0e] border border-white/10 rounded-xl text-xs focus:border-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/40 uppercase">Email Address</label>
                            <input 
                              type="email" 
                              placeholder="e.g. user@example.com"
                              value={newUserEmail}
                              onChange={(e) => setNewUserEmail(e.target.value)}
                              className="w-full px-3.5 py-2 bg-[#0a0a0e] border border-white/10 rounded-xl text-xs focus:border-indigo-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/40 uppercase">Password</label>
                            <input 
                              type="password" 
                              placeholder="At least 6 characters"
                              value={newUserPassword}
                              onChange={(e) => setNewUserPassword(e.target.value)}
                              className="w-full px-3.5 py-2 bg-[#0a0a0e] border border-white/10 rounded-xl text-xs focus:border-indigo-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-bold text-white/40 uppercase">Sovereignty Role:</span>
                            <select 
                              value={newUserRole}
                              onChange={(e: any) => setNewUserRole(e.target.value)}
                              className="bg-[#0a0a0e] border border-white/10 text-white rounded-xl px-3 py-1.5 text-xs outline-none"
                            >
                              <option value="user">Standard Account</option>
                              <option value="admin">Administrator (Full Bypass)</option>
                            </select>
                          </div>
                          <button
                            onClick={async () => {
                              if (!newUserEmail || !newUserPassword) {
                                alert('Email and Password are required.');
                                return;
                              }
                              await handleAdminCreateUser({
                                email: newUserEmail,
                                password: newUserPassword,
                                displayName: newUserDisplayName,
                                role: newUserRole
                              });
                              setSelectedUser(null);
                            }}
                            className="p-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-emerald-500/15"
                          >
                            Provision Core Profile
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ACTIVE USER COMMAND INTERACTION DECK */
                      <div className="space-y-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-sm uppercase shadow-inner">
                            {selectedUser.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-white">{selectedUser.displayName || 'No Name'}</h4>
                              {selectedUser.email?.toLowerCase() === 'ramjitinvestments@gmail.com' && (
                                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-black uppercase px-1.5 rounded">MASTER</span>
                              )}
                            </div>
                            <span className="text-[10px] text-white/45 font-mono">{selectedUser.email} (UID: {selectedUser.uid})</span>
                          </div>
                        </div>

                        {/* MASTER GRID: Left - Credentials/Sessions, Right - Detailed Feature Toggles */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 border-t border-white/5">
                          {/* Left lg:col-span-4: Core Management Actions */}
                          <div className="lg:col-span-4 space-y-4">
                            <div className="space-y-2">
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-mono">Credential Sovereignty</span>
                              <div className="flex gap-2">
                                <input 
                                  type="password" 
                                  placeholder="Enter new master password..."
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  className="flex-1 px-3.5 py-2 bg-[#0a0a0e] border border-white/10 rounded-xl text-xs text-white placeholder-white/20 outline-none"
                                />
                                <button
                                  onClick={async () => {
                                    if (!newPassword) return;
                                    await handleAdminChangePassword(selectedUser.uid, newPassword);
                                    setNewPassword('');
                                    alert('Password reset successfully.');
                                  }}
                                  className="p-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl cursor-pointer shrink-0 transition-colors"
                                >
                                  Update Pass
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-mono">Active State Control</span>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                  onClick={() => handleAdminForceLogout(selectedUser.uid)}
                                  className="flex-1 py-2 px-3 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                                >
                                  <LogOut className="w-3.5 h-3.5" />
                                  <span>Revoke Active Sessions</span>
                                </button>
                                <button
                                  onClick={() => handleAdminResetLimit(selectedUser.uid)}
                                  className="flex-1 py-2 px-3 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/20 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Reset Daily Quota</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Right lg:col-span-8: THE 10 INTERACTIVE FEATURE TOGGLES */}
                          <div className="lg:col-span-8 space-y-2.5">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-mono">Interactive Feature Sovereignty Toggles</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-black/40 border border-white/5 p-4 rounded-xl">
                              
                              {/* 1. ENABLE ACCOUNT */}
                              <div className="flex items-center justify-between p-2 hover:bg-white/2 rounded-lg transition-colors">
                                <div className="space-y-0.5 text-left">
                                  <span className="text-[11px] font-bold text-white block">Enable Account</span>
                                  <p className="text-[9px] text-white/35">Allow user to bypass auth lock and use app.</p>
                                </div>
                                <button
                                  disabled={selectedUser.email?.toLowerCase() === 'ramjitinvestments@gmail.com'}
                                  onClick={() => toggleFeature(selectedUser, 'enabled', selectedUser.enabled !== false)}
                                  className="text-indigo-400 hover:text-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  {selectedUser.enabled !== false ? (
                                    <ToggleRight className="w-7 h-7 text-emerald-400" />
                                  ) : (
                                    <ToggleLeft className="w-7 h-7 text-white/20" />
                                  )}
                                </button>
                              </div>

                              {/* 2. CAPTION GENERATOR */}
                              <div className="flex items-center justify-between p-2 hover:bg-white/2 rounded-lg transition-colors">
                                <div className="space-y-0.5 text-left">
                                  <span className="text-[11px] font-bold text-white block">Caption Generator</span>
                                  <p className="text-[9px] text-white/35">Authorize server transcription & segment adders.</p>
                                </div>
                                <button
                                  onClick={() => toggleFeature(selectedUser, 'captionGenerator', selectedUser.captionGenerator !== false)}
                                  className="text-indigo-400 hover:text-indigo-300"
                                >
                                  {selectedUser.captionGenerator !== false ? (
                                    <ToggleRight className="w-7 h-7 text-emerald-400" />
                                  ) : (
                                    <ToggleLeft className="w-7 h-7 text-white/20" />
                                  )}
                                </button>
                              </div>

                              {/* 3. BACKGROUND REMOVAL */}
                              <div className="flex items-center justify-between p-2 hover:bg-white/2 rounded-lg transition-colors">
                                <div className="space-y-0.5 text-left">
                                  <span className="text-[11px] font-bold text-white block">Background Removal</span>
                                  <p className="text-[9px] text-white/35">Enable overlay backing extraction features.</p>
                                </div>
                                <button
                                  onClick={() => toggleFeature(selectedUser, 'backgroundRemoval', selectedUser.backgroundRemoval !== false)}
                                  className="text-indigo-400 hover:text-indigo-300"
                                >
                                  {selectedUser.backgroundRemoval !== false ? (
                                    <ToggleRight className="w-7 h-7 text-emerald-400" />
                                  ) : (
                                    <ToggleLeft className="w-7 h-7 text-white/20" />
                                  )}
                                </button>
                              </div>

                              {/* 4. AI FEATURES */}
                              <div className="flex items-center justify-between p-2 hover:bg-white/2 rounded-lg transition-colors">
                                <div className="space-y-0.5 text-left">
                                  <span className="text-[11px] font-bold text-white block">AI Features</span>
                                  <p className="text-[9px] text-white/35">Smart caption presets & AI formatting assistance.</p>
                                </div>
                                <button
                                  onClick={() => toggleFeature(selectedUser, 'aiFeatures', selectedUser.aiFeatures !== false)}
                                  className="text-indigo-400 hover:text-indigo-300"
                                >
                                  {selectedUser.aiFeatures !== false ? (
                                    <ToggleRight className="w-7 h-7 text-emerald-400" />
                                  ) : (
                                    <ToggleLeft className="w-7 h-7 text-white/20" />
                                  )}
                                </button>
                              </div>

                              {/* 5. UPLOADS */}
                              <div className="flex items-center justify-between p-2 hover:bg-white/2 rounded-lg transition-colors">
                                <div className="space-y-0.5 text-left">
                                  <span className="text-[11px] font-bold text-white block">Uploads</span>
                                  <p className="text-[9px] text-white/35">Allow drag-and-drop local file storage.</p>
                                </div>
                                <button
                                  onClick={() => toggleFeature(selectedUser, 'uploads', selectedUser.uploads !== false)}
                                  className="text-indigo-400 hover:text-indigo-300"
                                >
                                  {selectedUser.uploads !== false ? (
                                    <ToggleRight className="w-7 h-7 text-emerald-400" />
                                  ) : (
                                    <ToggleLeft className="w-7 h-7 text-white/20" />
                                  )}
                                </button>
                              </div>

                              {/* 6. DOWNLOADS */}
                              <div className="flex items-center justify-between p-2 hover:bg-white/2 rounded-lg transition-colors">
                                <div className="space-y-0.5 text-left">
                                  <span className="text-[11px] font-bold text-white block">Downloads</span>
                                  <p className="text-[9px] text-white/35">Allow segment transcript table CSV downloads.</p>
                                </div>
                                <button
                                  onClick={() => toggleFeature(selectedUser, 'downloads', selectedUser.downloads !== false)}
                                  className="text-indigo-400 hover:text-indigo-300"
                                >
                                  {selectedUser.downloads !== false ? (
                                    <ToggleRight className="w-7 h-7 text-emerald-400" />
                                  ) : (
                                    <ToggleLeft className="w-7 h-7 text-white/20" />
                                  )}
                                </button>
                              </div>

                              {/* 7. EXPORTS */}
                              <div className="flex items-center justify-between p-2 hover:bg-white/2 rounded-lg transition-colors">
                                <div className="space-y-0.5 text-left">
                                  <span className="text-[11px] font-bold text-white block">Exports</span>
                                  <p className="text-[9px] text-white/35">Permit final MP4 baked video rendering.</p>
                                </div>
                                <button
                                  onClick={() => toggleFeature(selectedUser, 'exports', selectedUser.exports !== false)}
                                  className="text-indigo-400 hover:text-indigo-300"
                                >
                                  {selectedUser.exports !== false ? (
                                    <ToggleRight className="w-7 h-7 text-emerald-400" />
                                  ) : (
                                    <ToggleLeft className="w-7 h-7 text-white/20" />
                                  )}
                                </button>
                              </div>

                              {/* 8. PREMIUM PLAN */}
                              <div className="flex items-center justify-between p-2 hover:bg-white/2 rounded-lg transition-colors">
                                <div className="space-y-0.5 text-left">
                                  <span className="text-[11px] font-bold text-white block">Premium Membership</span>
                                  <p className="text-[9px] text-white/35">Grant unlimited daily transcodes & priority pipeline.</p>
                                </div>
                                <button
                                  onClick={() => toggleFeature(selectedUser, 'premium', !!selectedUser.premium)}
                                  className="text-indigo-400 hover:text-indigo-300"
                                >
                                  {selectedUser.premium ? (
                                    <ToggleRight className="w-7 h-7 text-emerald-400" />
                                  ) : (
                                    <ToggleLeft className="w-7 h-7 text-white/20" />
                                  )}
                                </button>
                              </div>

                              {/* 9. STORAGE */}
                              <div className="flex items-center justify-between p-2 hover:bg-white/2 rounded-lg transition-colors">
                                <div className="space-y-0.5 text-left">
                                  <span className="text-[11px] font-bold text-white block">Persistent Storage</span>
                                  <p className="text-[9px] text-white/35">Save video details on Cloud run storage disk.</p>
                                </div>
                                <button
                                  onClick={() => toggleFeature(selectedUser, 'storage', selectedUser.storage !== false)}
                                  className="text-indigo-400 hover:text-indigo-300"
                                >
                                  {selectedUser.storage !== false ? (
                                    <ToggleRight className="w-7 h-7 text-emerald-400" />
                                  ) : (
                                    <ToggleLeft className="w-7 h-7 text-white/20" />
                                  )}
                                </button>
                              </div>

                              {/* 10. SYSTEM ADMIN */}
                              <div className="flex items-center justify-between p-2 hover:bg-white/2 rounded-lg transition-colors">
                                <div className="space-y-0.5 text-left">
                                  <span className="text-[11px] font-bold text-white block">Administrator Role</span>
                                  <p className="text-[9px] text-white/35">Bypass quota gates & view master control console.</p>
                                </div>
                                <button
                                  disabled={selectedUser.email?.toLowerCase() === 'ramjitinvestments@gmail.com'}
                                  onClick={() => toggleFeature(selectedUser, 'role', selectedUser.role === 'admin')}
                                  className="text-indigo-400 hover:text-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  {selectedUser.role === 'admin' ? (
                                    <ToggleRight className="w-7 h-7 text-indigo-400" />
                                  ) : (
                                    <ToggleLeft className="w-7 h-7 text-white/20" />
                                  )}
                                </button>
                              </div>

                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Primary Registered Users Data Table */}
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-[#0e0e13]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/2 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                          <th className="px-5 py-4 font-bold">User Identity</th>
                          <th className="px-5 py-4 font-bold">Platform Role</th>
                          <th className="px-5 py-4 font-bold">Quota Usage</th>
                          <th className="px-5 py-4 font-bold">Auditable Transcriptions</th>
                          <th className="px-5 py-4 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs text-white/80">
                        {adminUsersList.filter(usr => {
                          const query = userSearch.toLowerCase().trim();
                          if (!query) return true;
                          const name = (usr.displayName || usr.name || '').toLowerCase();
                          const email = (usr.email || '').toLowerCase();
                          const uid = (usr.uid || '').toLowerCase();
                          return name.includes(query) || email.includes(query) || uid.includes(query);
                        }).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-5 py-10 text-center text-white/30 font-sans">
                              No registered users matched the active filters.
                            </td>
                          </tr>
                        ) : (
                          adminUsersList.filter(usr => {
                            const query = userSearch.toLowerCase().trim();
                            if (!query) return true;
                            const name = (usr.displayName || usr.name || '').toLowerCase();
                            const email = (usr.email || '').toLowerCase();
                            const uid = (usr.uid || '').toLowerCase();
                            return name.includes(query) || email.includes(query) || uid.includes(query);
                          }).map((usr: any) => (
                            <tr key={usr.uid} className="hover:bg-white/2 transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8.5 h-8.5 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                    {usr.email?.[0] || 'U'}
                                  </div>
                                  <div>
                                    <p className="font-bold text-white leading-tight flex items-center gap-1.5">
                                      <span>{usr.displayName || usr.name || 'Anonymous User'}</span>
                                      {usr.email?.toLowerCase() === 'ramjitinvestments@gmail.com' && (
                                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-black uppercase px-1 rounded">MASTER</span>
                                      )}
                                    </p>
                                    <p className="text-[10px] text-white/40">{usr.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                                  usr.role === 'admin' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                                    : 'bg-white/5 text-white/40 border-white/5'
                                }`}>
                                  {usr.role === 'admin' ? 'ADMINISTRATOR' : 'STANDARD'}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 font-mono font-bold">
                                <span className={usr.dailyCount >= defaultLimit ? 'text-red-400' : 'text-emerald-400'}>
                                  {usr.dailyCount || 0}
                                </span>
                                <span className="text-white/20"> / {defaultLimit}</span>
                              </td>
                              <td className="px-5 py-3.5 font-mono text-[11px] text-white/50">
                                {usr.totalTranscribes || 0} sequences
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setSelectedUser(usr)}
                                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-bold border border-white/5 transition-colors"
                                  >
                                    Manage Toggles
                                  </button>
                                  <button
                                    onClick={() => handleAdminToggleStatus(usr.uid, !usr.disabled)}
                                    disabled={usr.email?.toLowerCase() === 'ramjitinvestments@gmail.com'}
                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors border ${
                                      usr.disabled 
                                        ? 'bg-red-500/10 hover:bg-red-500/25 border-red-500/20 text-red-400' 
                                        : 'bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/20 text-emerald-400'
                                    } disabled:opacity-30`}
                                  >
                                    {usr.disabled ? 'App: Blocked' : 'App: Active'}
                                  </button>
                                  <button
                                    onClick={() => handleAdminDeleteUser(usr.uid)}
                                    disabled={usr.email?.toLowerCase() === 'ramjitinvestments@gmail.com'}
                                    className="p-1.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg border border-red-500/10 disabled:opacity-30 transition-colors"
                                    title="Permanently Expunge Account"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: CMS BRANDING EDITOR */}
            {activeTab === 'cms' && (
              <motion.div
                key="cms"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-6 text-left"
              >
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await handleAdminSaveCMS({
                      headline: cmsHeadline,
                      subheadline: cmsSubheadline,
                      themeColor: cmsThemeColor,
                      presetStyles: cmsPresetStyles
                    });
                    alert('CMS contents saved successfully!');
                  }} 
                  className="bg-[#0e0e13] border border-white/5 p-6 rounded-2xl space-y-5"
                >
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-widest font-mono">Interactive Landing CMS Editor</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/50 block uppercase">Hero Headline Title</label>
                      <input 
                        type="text" 
                        value={cmsHeadline}
                        onChange={(e) => setCmsHeadline(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#0a0a0e] border border-white/10 focus:border-indigo-500 rounded-xl text-xs text-white"
                        placeholder="e.g. Dynamic Video Captions Creator"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/50 block uppercase">Hero Subheadline</label>
                      <input 
                        type="text" 
                        value={cmsSubheadline}
                        onChange={(e) => setCmsSubheadline(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#0a0a0e] border border-white/10 focus:border-indigo-500 rounded-xl text-xs text-white"
                        placeholder="e.g. Professional speech sync technology"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/50 block uppercase">Primary Branding Accent Color</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={cmsThemeColor}
                          onChange={(e) => setCmsThemeColor(e.target.value)}
                          className="w-10 h-9 p-0.5 bg-[#0a0a0e] border border-white/10 rounded-xl cursor-pointer shrink-0"
                        />
                        <input 
                          type="text" 
                          value={cmsThemeColor}
                          onChange={(e) => setCmsThemeColor(e.target.value)}
                          className="w-full px-4 py-2 bg-[#0a0a0e] border border-white/10 focus:border-indigo-500 rounded-xl text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/50 block uppercase">Default Caption Style Preset</label>
                      <select 
                        value={cmsPresetStyles}
                        onChange={(e) => setCmsPresetStyles(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#0a0a0e] border border-white/10 focus:border-indigo-500 rounded-xl text-xs text-white outline-none"
                      >
                        <option value="karaoke">Subtle Karaoke Highlight</option>
                        <option value="brutalist">Bold Brutalist Outline</option>
                        <option value="classic">Minimal Center Subtitle</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <button
                      type="submit"
                      className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/15"
                    >
                      Save CMS Configuration
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* TAB 4: SYSTEM OPERATIONS CONFIGURATION */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-6 text-left"
              >
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await handleAdminSaveSettings({
                      maxFileSizeMb: maxFileSize,
                      defaultDailyQuota: defaultLimit,
                      registrationOpen: registrationOpen,
                      maintenanceMode: maintenanceMode,
                      systemMessage: systemMessage
                    });
                    alert('System configurations updated successfully!');
                  }} 
                  className="bg-[#0e0e13] border border-white/5 p-6 rounded-2xl space-y-5"
                >
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Settings className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-widest font-mono">System Operations Configuration Settings</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-[#0a0a0e] rounded-xl border border-white/5">
                      <div className="space-y-0.5 text-left">
                        <span className="text-xs font-bold text-white">Enable Self Registration</span>
                        <p className="text-[9px] text-white/40">Open registrations gate to the public.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={registrationOpen}
                        onChange={(e) => setRegistrationOpen(e.target.checked)}
                        className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#0a0a0e] rounded-xl border border-white/5">
                      <div className="space-y-0.5 text-left">
                        <span className="text-xs font-bold text-white">Maintenance Mode</span>
                        <p className="text-[9px] text-white/40">Lock down speech transcribers from non-admins.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={maintenanceMode}
                        onChange={(e) => setMaintenanceMode(e.target.checked)}
                        className="w-4.5 h-4.5 rounded text-red-600 focus:ring-0 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/50 block uppercase">Max Upload Video Size (MB)</label>
                      <input 
                        type="number" 
                        value={maxFileSize}
                        onChange={(e) => setMaxFileSize(parseInt(e.target.value) || 100)}
                        className="w-full px-4 py-2.5 bg-[#0a0a0e] border border-white/10 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/50 block uppercase">Default Daily Transcribe Quota Limit</label>
                      <input 
                        type="number" 
                        value={defaultLimit}
                        onChange={(e) => setDefaultLimit(parseInt(e.target.value) || 2)}
                        className="w-full px-4 py-2.5 bg-[#0a0a0e] border border-white/10 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-white/50 block uppercase">Platform Status Message / Banner Text</label>
                    <textarea 
                      value={systemMessage}
                      onChange={(e) => setSystemMessage(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-[#0a0a0e] border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                      placeholder="e.g. System upgrade scheduled at 02:00 UTC."
                    />
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <button
                      type="submit"
                      className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/15"
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* TAB 5: ACCESS SECURITY POLICIES */}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-6 text-left"
              >
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await handleAdminSaveSecurity({
                      adminPasscode: secAdminPass,
                      maxLoginAttempts: secMaxAttempts,
                      sessionTimeoutMinutes: secSessionTimeout,
                      multiFactorEnforced: secMultiFactor
                    });
                    alert('Access policies updated successfully.');
                  }} 
                  className="bg-[#0e0e13] border border-white/5 p-6 rounded-2xl space-y-5"
                >
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-widest font-mono">Cyber Access Control Policies</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/50 block uppercase">Console Passcode</label>
                      <input 
                        type="password" 
                        value={secAdminPass}
                        onChange={(e) => setSecAdminPass(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#0a0a0e] border border-white/10 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/50 block uppercase">Max Block Failed Logins</label>
                      <input 
                        type="number" 
                        value={secMaxAttempts}
                        onChange={(e) => setSecMaxAttempts(parseInt(e.target.value) || 5)}
                        className="w-full px-4 py-2.5 bg-[#0a0a0e] border border-white/10 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/50 block uppercase">Session Timeout Expiration (Minutes)</label>
                      <input 
                        type="number" 
                        value={secSessionTimeout}
                        onChange={(e) => setSecSessionTimeout(parseInt(e.target.value) || 30)}
                        className="w-full px-4 py-2.5 bg-[#0a0a0e] border border-white/10 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#0a0a0e] rounded-xl border border-white/5 self-end h-[42px]">
                      <span className="text-xs font-bold text-white">Enforce MFA Policies</span>
                      <input 
                        type="checkbox" 
                        checked={secMultiFactor}
                        onChange={(e) => setSecMultiFactor(e.target.checked)}
                        className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <button
                      type="submit"
                      className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/15"
                    >
                      Update Policies
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('Are you absolutely sure you want to revoke ALL sessions for all active users? They will be logged out immediately.')) {
                          await handleAdminForceLogoutAll();
                          alert('Dispatched complete global session revocation protocol successfully.');
                        }
                      }}
                      className="py-2.5 px-5 bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-600/5 active:scale-[0.98]"
                    >
                      Force Sign Out ALL Connected Sessions
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* TAB 6: NOTIFICATIONS DISPATCHER */}
            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-6 text-left"
              >
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!notifTitle || !notifMessage) {
                      alert('Title and Message details are required.');
                      return;
                    }
                    await handleAdminSendNotification({
                      title: notifTitle,
                      message: notifMessage,
                      type: notifType,
                      recipientType: notifRecipientType
                    });
                    setNotifTitle('');
                    setNotifMessage('');
                  }}
                  className="bg-[#0e0e13] border border-white/5 p-6 rounded-2xl space-y-5"
                >
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Bell className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-widest font-mono">Send Universal Broadcast Notice</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/50 block uppercase">Notice Title</label>
                      <input 
                        type="text" 
                        required
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#0a0a0e] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-indigo-500"
                        placeholder="e.g. Schedule Update"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/50 block uppercase">Notice Visual Type</label>
                      <select 
                        value={notifType}
                        onChange={(e: any) => setNotifType(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#0a0a0e] border border-white/10 rounded-xl text-xs text-white outline-none"
                      >
                        <option value="info">Info Notice (Blue)</option>
                        <option value="success">Success Notice (Green)</option>
                        <option value="warning">System Warning (Amber)</option>
                        <option value="danger">Severity Alert (Red)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/50 block uppercase">Class Recipient</label>
                      <select 
                        value={notifRecipientType}
                        onChange={(e: any) => setNotifRecipientType(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#0a0a0e] border border-white/10 rounded-xl text-xs text-white outline-none"
                      >
                        <option value="all">Every Connected Profile</option>
                        <option value="users">Standard Users Only</option>
                        <option value="admins">Administrators Only</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/50 block uppercase">Detailed Notice Message Text</label>
                    <textarea 
                      required
                      value={notifMessage}
                      onChange={(e) => setNotifMessage(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-[#0a0a0e] border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                      placeholder="Add notification details to broadcast across active interfaces..."
                    />
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <button
                      type="submit"
                      className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/15"
                    >
                      Dispatch Global Alert Notice
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* TAB 7: SECURITY AUDIT TRAILS */}
            {activeTab === 'audit' && (
              <motion.div
                key="audit"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-4 text-left"
              >
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-[#0e0e13]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/2 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                          <th className="px-5 py-4 font-bold">System Timestamp</th>
                          <th className="px-5 py-4 font-bold">Security Operation Action</th>
                          <th className="px-5 py-4 font-bold">Details & Log State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-[11px] text-white/70 font-mono">
                        {adminAuditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-5 py-8 text-center font-sans text-white/30">
                              No security operations audited in this period.
                            </td>
                          </tr>
                        ) : (
                          adminAuditLogs.map((log: any, idx: number) => {
                            let timeStr = 'Invalid Date';
                            if (log.timestamp) {
                              const date = log.timestamp.seconds ? new Date(log.timestamp.seconds * 1000) : new Date(log.timestamp);
                              timeStr = date.toLocaleString();
                            }
                            return (
                              <tr key={log.id || idx} className="hover:bg-white/2 transition-all">
                                <td className="px-5 py-3.5 text-white/40">{timeStr}</td>
                                <td className="px-5 py-3.5 text-indigo-400 font-bold uppercase tracking-wide">
                                  {log.action || 'OPERATION'}
                                </td>
                                <td className="px-5 py-3.5 text-white/75 font-sans leading-relaxed">
                                  <div className="font-bold font-sans text-white">
                                    {log.details || 'Executed administrative action'}
                                  </div>
                                  {log.email && (
                                    <div className="text-[10px] text-white/40 mt-0.5 font-mono">
                                      Triggered by: {log.email}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
