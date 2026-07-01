/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Upload,
  Volume2,
  VolumeX,
  Sparkles,
  Type,
  Download,
  RefreshCw,
  Clock,
  Video,
  AlertCircle,
  Smartphone,
  Save,
  Trash2,
  Plus,
  Database,
  Check,
  Palette,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WordCaption, CaptionStyle, CaptionPosition, AnimationStyle, FontStyle } from './types';
import { DEMO_VIDEOS, CAPTION_PRESETS, FONT_PAIRS, COMPONENT_IDS } from './data';
import { RiddimLogo } from './components/RiddimLogo';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './components/LoginPage';
import { AdminPanel } from './components/AdminPanel';
import { auth, googleProvider } from './lib/firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { Shield, Lock, User as UserIcon, LogOut, Users, BarChart3, X, Search, Activity, Settings, Globe, Sliders, Bell, History, PlusCircle, Edit2 } from 'lucide-react';

const getBubbleBgColor = (hex: string, opacity: number) => {
  if (!hex || typeof hex !== 'string') return `rgba(0, 0, 0, ${opacity})`;
  if (!hex.startsWith('#')) return hex;
  const cleanHex = hex.replace('#', '');
  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function App() {
  // Firebase Auth and User States
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authIdToken, setAuthIdToken] = useState<string | null>(null);
  const [userQuota, setUserQuota] = useState<{ dailyCount: number; maxFree: number; isNoLimit: boolean; role: string; disabled: boolean } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isAccountDisabled, setIsAccountDisabled] = useState<boolean>(false);

  // Admin Panel States
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [adminInputPassword, setAdminInputPassword] = useState<string>('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminSessionToken, setAdminSessionToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [adminUsersList, setAdminUsersList] = useState<any[]>([]);
  const [adminLogsList, setAdminLogsList] = useState<any[]>([]);
  const [adminActiveTab, setAdminActiveTab] = useState<'dashboard' | 'users' | 'cms' | 'settings' | 'security' | 'notifications' | 'audit'>('dashboard');
  const [adminPanelError, setAdminPanelError] = useState<string | null>(null);
  const [adminUsersSearch, setAdminUsersSearch] = useState<string>('');
  const [adminSettings, setAdminSettings] = useState<any>(null);
  const [adminAuditLogs, setAdminAuditLogs] = useState<any[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [adminPanelTheme, setAdminPanelTheme] = useState<'dark' | 'light'>('dark');
  const [adminSelectedUser, setAdminSelectedUser] = useState<any>(null);

  // Admin Edit Form States
  const [editMaxFileSize, setEditMaxFileSize] = useState<number>(100);
  const [editDefaultLimit, setEditDefaultLimit] = useState<number>(2);
  const [editRegistrationOpen, setEditRegistrationOpen] = useState<boolean>(true);
  const [editMaintenanceMode, setEditMaintenanceMode] = useState<boolean>(false);
  const [editSystemMessage, setEditSystemMessage] = useState<string>('');

  const [editCmsHeadline, setEditCmsHeadline] = useState<string>('');
  const [editCmsSubheadline, setEditCmsSubheadline] = useState<string>('');
  const [editCmsThemeColor, setEditCmsThemeColor] = useState<string>('#10B981');
  const [editCmsPresetStyles, setEditCmsPresetStyles] = useState<string>('');

  const [editSecAdminPass, setEditSecAdminPass] = useState<string>('');
  const [editSecMaxAttempts, setEditSecMaxAttempts] = useState<number>(5);
  const [editSecSessionTimeout, setEditSecSessionTimeout] = useState<number>(30);
  const [editSecMultiFactor, setEditSecMultiFactor] = useState<boolean>(false);

  // New User Creation Form States
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserPassword, setNewUserPassword] = useState<string>('');
  const [newUserDisplayName, setNewUserDisplayName] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');

  // Change Password Form State
  const [changePassUserUid, setChangePassUserUid] = useState<string | null>(null);
  const [changePassNewPassword, setChangePassNewPassword] = useState<string>('');

  // Announcement Form States
  const [notifTitle, setNotifTitle] = useState<string>('');
  const [notifMessage, setNotifMessage] = useState<string>('');
  const [notifType, setNotifType] = useState<'info' | 'success' | 'warning' | 'danger'>('info');
  const [notifRecipientType, setNotifRecipientType] = useState<'all' | 'users' | 'admins' | 'selected'>('all');
  const [notifSelectedUsers, setNotifSelectedUsers] = useState<string[]>([]);

  // Pre-populate effect
  useEffect(() => {
    if (adminSettings) {
      if (adminSettings.settings) {
        setEditMaxFileSize(adminSettings.settings.maxFileSizeMb || 100);
        setEditDefaultLimit(adminSettings.settings.defaultDailyQuota || 2);
        setEditRegistrationOpen(adminSettings.settings.registrationOpen ?? true);
        setEditMaintenanceMode(adminSettings.settings.maintenanceMode ?? false);
        setEditSystemMessage(adminSettings.settings.systemMessage || '');
      }
      if (adminSettings.cms) {
        setEditCmsHeadline(adminSettings.cms.headline || '');
        setEditCmsSubheadline(adminSettings.cms.subheadline || '');
        setEditCmsThemeColor(adminSettings.cms.themeColor || '#10B981');
        setEditCmsPresetStyles(adminSettings.cms.presetStyles || '');
      }
      if (adminSettings.security) {
        setEditSecAdminPass(adminSettings.security.adminPasscode || '');
        setEditSecMaxAttempts(adminSettings.security.maxLoginAttempts || 5);
        setEditSecSessionTimeout(adminSettings.security.sessionTimeoutMinutes || 30);
        setEditSecMultiFactor(adminSettings.security.multiFactorEnforced ?? false);
      }
    }
  }, [adminSettings]);

  // Auth States
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [authModalError, setAuthModalError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);

  // Client-Side Routing States
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const p = window.location.pathname;
    return p === '/' ? '/dashboard' : p;
  });

  const navigateTo = useCallback((path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname === '/' ? '/dashboard' : window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Video and Core States
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoSize, setVideoSize] = useState<number>(0);
  const [videoDimensions, setVideoDimensions] = useState({ width: 1080, height: 1920 });
  const [viewportHeight, setViewportHeight] = useState<number>(360);
  const [viewportWidth, setViewportWidth] = useState<number>(640);

  const [captions, setCaptions] = useState<WordCaption[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<CaptionStyle>(JSON.parse(JSON.stringify(CAPTION_PRESETS[0]))); // Default "Classic Viral"
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Loaders and error states
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isUploadingToDisk, setIsUploadingToDisk] = useState<boolean>(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState<boolean>(false);
  const [chunkProgresses, setChunkProgresses] = useState<any[]>([]);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [isDownloadingForTranscribe, setIsDownloadingForTranscribe] = useState<boolean>(false);

  // Editing state for transcript
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editStart, setEditStart] = useState(0);
  const [editEnd, setEditEnd] = useState(0);

  // Find & Replace Search states
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // Export states
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedVideoExtension, setExportedVideoExtension] = useState<string>('mp4');
  const [autoNormalizeAudio, setAutoNormalizeAudio] = useState<boolean>(true);
  const [exportStatusText, setExportStatusText] = useState<string>('Baking overlay stream...');

  // References
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const renderLoopRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastLoggedCaptionIdRef = useRef<string | null>(null);

  // Timeline Drag & Edit States
  const timelineTrackRef = useRef<HTMLDivElement>(null);
  const [timelineEditingId, setTimelineEditingId] = useState<string | null>(null);
  const [timelineEditingText, setTimelineEditingText] = useState<string>('');
  const [draggingSegment, setDraggingSegment] = useState<{
    id: string;
    type: 'move' | 'left' | 'right';
    initialStart: number;
    initialEnd: number;
    startX: number;
  } | null>(null);

  // Drag and Resize States for ultra smooth, lag-free viewport interactive positioning
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [isDraggingCaption, setIsDraggingCaption] = useState<boolean>(false);
  const [isResizingCaption, setIsResizingCaption] = useState<boolean>(false);

  const dragPosRef = useRef({
    startX: 0,
    startY: 0,
    initCustomX: 0,
    initCustomY: 0,
    initFontSize: 0,
  });

  const handleCaptionPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Skip if clicking the resize handle inside the element
    if ((e.target as HTMLElement).closest('.resize-handle')) {
      return;
    }
    
    e.preventDefault();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    
    // Fallback coordinate mappings
    const mappedY = selectedStyle.position === 'top' ? 0.18 : selectedStyle.position === 'center' ? 0.5 : selectedStyle.position === 'bottom' ? 0.8 : selectedStyle.customY;
    const currentCustomX = selectedStyle.position === 'custom' ? selectedStyle.customX : 0.5;
    const currentCustomY = selectedStyle.position === 'custom' ? selectedStyle.customY : mappedY;

    dragPosRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initCustomX: currentCustomX,
      initCustomY: currentCustomY,
      initFontSize: selectedStyle.fontSize,
    };
    
    setIsDraggingCaption(true);
  };

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    
    dragPosRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initCustomX: selectedStyle.customX,
      initCustomY: selectedStyle.customY,
      initFontSize: selectedStyle.fontSize,
    };
    
    setIsResizingCaption(true);
  };

  useEffect(() => {
    if (!isDraggingCaption && !isResizingCaption) return;

    // Completely stabilize touch behaviors: lock body scrolling and gestures while dragging/resizing
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.style.userSelect = 'none';

    const handlePointerMove = (e: PointerEvent) => {
      // Prevent browser scroll-pan gestures from triggering and shifting layout
      if (e.cancelable) {
        e.preventDefault();
      }

      if (!viewportRef.current) return;

      const rect = viewportRef.current.getBoundingClientRect();
      const dx = e.clientX - dragPosRef.current.startX;
      const dy = e.clientY - dragPosRef.current.startY;

      if (isDraggingCaption) {
        const deltaPctX = dx / rect.width;
        const deltaPctY = dy / rect.height;

        const nextX = Math.max(0.01, Math.min(0.99, dragPosRef.current.initCustomX + deltaPctX));
        const nextY = Math.max(0.01, Math.min(0.99, dragPosRef.current.initCustomY + deltaPctY));

        setSelectedStyle(prev => ({
          ...prev,
          position: 'custom',
          customX: parseFloat(nextX.toFixed(3)),
          customY: parseFloat(nextY.toFixed(3)),
        }));
      } else if (isResizingCaption) {
        // Dragging to the right/down increases font size, left/up decreases font size
        // Diagonal scale calculation with a custom sensitivity factor (dx * 0.45)
        const growth = Math.max(dx, dy);
        const newSize = Math.max(16, Math.min(150, Math.round(dragPosRef.current.initFontSize + growth * 0.45)));
        setSelectedStyle(prev => ({
          ...prev,
          fontSize: newSize,
        }));
      }
    };

    const handlePointerUp = () => {
      setIsDraggingCaption(false);
      setIsResizingCaption(false);
    };

    // Register with passive: false to allow e.preventDefault() during dragging/resizing
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingCaption, isResizingCaption]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Do not auto-load vertical demo immediately, show the logo and the welcome landing screen upon opening!
  useEffect(() => {
    // Left empty intentionally to show the logo landing page on load
  }, []);

  // Monitor preview container size dynamically to keep caption preview scaling 100% matched to final MP4 bake
  useEffect(() => {
    if (!viewportRef.current) return;
    
    // Initial measure
    setViewportHeight(viewportRef.current.clientHeight || viewportRef.current.offsetHeight || 360);
    setViewportWidth(viewportRef.current.clientWidth || viewportRef.current.offsetWidth || 640);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (el) {
          setViewportHeight(el.clientHeight || el.offsetHeight || 360);
          setViewportWidth(el.clientWidth || el.offsetWidth || 640);
        }
      }
    });

    resizeObserver.observe(viewportRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [videoUrl, videoDimensions]);

  // Update speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Fetch User Quota Details Helper
  const fetchUserQuota = async (token: string) => {
    try {
      const res = await fetch('/api/user/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const isDisabled = data.user.enabled === false || data.user.disabled === true;
          if (isDisabled) {
            setIsAccountDisabled(true);
            await signOut(auth);
            return;
          }
          setUserQuota({
            dailyCount: data.user.dailyCount || 0,
            maxFree: 2,
            isNoLimit: data.user.isNoLimit || false,
            role: data.user.role || 'user',
            disabled: false,
            enabled: true
          });
          if (data.user.role === 'admin' || data.user.email?.toLowerCase() === 'ramjitinvestments@gmail.com') {
            setIsAdminAuthenticated(true);
          }
        }
      }
    } catch (e) {
      console.error('[fetchUserQuota] Failed:', e);
    }
  };

  // Track Firebase Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthLoading(true);
      setCurrentUser(user);
      if (user) {
        setIsAccountDisabled(false);
        try {
          const token = await user.getIdToken(true);
          setAuthIdToken(token);
          await fetchUserQuota(token);
        } catch (e) {
          console.error('[Auth state change] Error updating token:', e);
        }
      } else {
        setAuthIdToken(null);
        setUserQuota(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isAuthLoading && !currentUser && currentPath !== '/login') {
      navigateTo('/login');
    }
  }, [isAuthLoading, currentUser, currentPath, navigateTo]);

  // Redirect authenticated users from login page
  useEffect(() => {
    if (!isAuthLoading && currentUser && currentPath === '/login') {
      navigateTo('/dashboard');
    }
  }, [isAuthLoading, currentUser, currentPath, navigateTo]);

  // Redirect non-admin users from admin page
  useEffect(() => {
    if (!isAuthLoading && currentUser && currentPath === '/admin' && currentUser.email?.toLowerCase() !== 'ramjitinvestments@gmail.com') {
      navigateTo('/dashboard');
    }
  }, [isAuthLoading, currentUser, currentPath, navigateTo]);

  // Google, Email and Admin Authentication Handlers
  const handleGoogleLogin = async () => {
    try {
      setTranscriptionError(null);
      setAuthModalError(null);
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const token = await result.user.getIdToken(true);
        setAuthIdToken(token);
        await fetchUserQuota(token);
      }
    } catch (e: any) {
      console.error('[Google login] Error signing in:', e);
      setTranscriptionError(`Failed to sign in with Google: ${e.message}`);
      setAuthModalError(`Google sign-in failed: ${e.message}`);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setAuthIdToken(null);
      setUserQuota(null);
      setIsAdminAuthenticated(false);
      navigateTo('/login');
    } catch (e: any) {
      console.error('[Google logout] Error signing out:', e);
    }
  };

  const handleEmailAuthDirect = async (
    mode: 'login' | 'signup',
    email: string,
    password: string,
    displayName?: string
  ) => {
    setIsSubmittingAuth(true);
    setAuthModalError(null);
    try {
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);

      if (mode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (result.user) {
          if (displayName?.trim()) {
            await updateProfile(result.user, {
              displayName: displayName.trim()
            });
          }
          const token = await result.user.getIdToken(true);
          setAuthIdToken(token);
          await fetchUserQuota(token);
        }
      } else {
        const result = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (result.user) {
          const token = await result.user.getIdToken(true);
          setAuthIdToken(token);
          await fetchUserQuota(token);
        }
      }
      navigateTo('/dashboard');
    } catch (err: any) {
      console.error('[Email Auth Direct Error]:', err);
      let friendlyMessage = err.message;
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        friendlyMessage = 'Invalid email or password. Please try again.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This email is already in use. Try signing in instead.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      }
      setAuthModalError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleForgotPasswordDirect = async (email: string) => {
    setIsSubmittingAuth(true);
    setAuthModalError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      console.error('[Password Reset Direct Error]:', err);
      setAuthModalError(err.message || 'Failed to send password reset email.');
      throw err;
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Admin Panel Action Handlers
  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPanelError(null);
    if (!currentUser) {
      setAdminPanelError('Please sign in before accessing the Admin Panel.');
      return;
    }
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': authIdToken ? `Bearer ${authIdToken}` : ''
        },
        body: JSON.stringify({ password: adminInputPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAdminAuthenticated(true);
        fetchAdminData();
      } else {
        setAdminPanelError(data.error || 'Incorrect Admin Password');
      }
    } catch (err: any) {
      setAdminPanelError(`Auth Error: ${err.message}`);
    }
  };

  const fetchAdminData = async () => {
    if (!authIdToken) return;
    setAdminPanelError(null);
    try {
      const headers = {
        'Authorization': `Bearer ${authIdToken}`
      };

      // Fetch settings, cms, security
      const resSettings = await fetch('/api/admin/settings', { headers });
      if (resSettings.ok) {
        const d = await resSettings.json();
        if (d.success) {
          setAdminSettings(d);
        }
      }

      // Fetch users list
      const resUsers = await fetch('/api/admin/users', { headers });
      if (resUsers.ok) {
        const d = await resUsers.json();
        if (d.success) setAdminUsersList(d.users || []);
      }

      // Fetch logs list
      const resLogs = await fetch('/api/admin/logs', { headers });
      if (resLogs.ok) {
        const d = await resLogs.json();
        if (d.success) setAdminLogsList(d.logs || []);
      }

      // Fetch audit logs
      const resAudit = await fetch('/api/admin/audit-logs', { headers });
      if (resAudit.ok) {
        const d = await resAudit.json();
        if (d.success) setAdminAuditLogs(d.auditLogs || []);
      }

      // Fetch notifications
      const resNotifs = await fetch('/api/admin/notifications', { headers });
      if (resNotifs.ok) {
        const d = await resNotifs.json();
        if (d.success) setAdminNotifications(d.notifications || []);
      }
    } catch (err: any) {
      setAdminPanelError(`Data Fetch Error: ${err.message}`);
    }
  };

  const handleAdminResetLimit = async (uid: string) => {
    if (!authIdToken) return;
    try {
      const res = await fetch('/api/admin/reset-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authIdToken}`
        },
        body: JSON.stringify({ uid })
      });
      if (res.ok) {
        await fetchAdminData();
        if (currentUser) {
          const t = await currentUser.getIdToken(true);
          await fetchUserQuota(t);
        }
      }
    } catch (e) {
      console.error('Reset limit failed:', e);
    }
  };

  const handleAdminSetRole = async (uid: string, newRole: string) => {
    if (!authIdToken) return;
    try {
      const res = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authIdToken}`
        },
        body: JSON.stringify({ uid, role: newRole })
      });
      if (res.ok) {
        await fetchAdminData();
      }
    } catch (e) {
      console.error('Set role failed:', e);
    }
  };

  const handleAdminToggleStatus = async (uid: string, disabled: boolean) => {
    if (!authIdToken) return;
    try {
      const res = await fetch('/api/admin/toggle-user-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authIdToken}`
        },
        body: JSON.stringify({ uid, disabled })
      });
      if (res.ok) {
        await fetchAdminData();
      }
    } catch (e) {
      console.error('Toggle user status failed:', e);
    }
  };

  const handleAdminDeleteUser = async (uid: string) => {
    if (!authIdToken) return;
    if (!window.confirm("Are you sure you want to permanently delete this user? This cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authIdToken}`
        },
        body: JSON.stringify({ uid })
      });
      if (res.ok) {
        await fetchAdminData();
      }
    } catch (e) {
      console.error('Delete user failed:', e);
    }
  };

  const handleAdminSaveSettings = async (settingsToSave: any) => {
    if (!authIdToken) return;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authIdToken}`
        },
        body: JSON.stringify(settingsToSave)
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setAdminSettings((prev: any) => ({ ...prev, settings: d.settings }));
          alert('System settings updated successfully!');
        }
      }
    } catch (e) {
      console.error('Save settings failed:', e);
    }
  };

  const handleAdminSaveCMS = async (cmsToSave: any) => {
    if (!authIdToken) return;
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authIdToken}`
        },
        body: JSON.stringify(cmsToSave)
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setAdminSettings((prev: any) => ({ ...prev, cms: d.cms }));
          alert('CMS Content updated successfully!');
        }
      }
    } catch (e) {
      console.error('Save CMS failed:', e);
    }
  };

  const handleAdminSaveSecurity = async (securityToSave: any) => {
    if (!authIdToken) return;
    try {
      const res = await fetch('/api/admin/security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authIdToken}`
        },
        body: JSON.stringify(securityToSave)
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setAdminSettings((prev: any) => ({ ...prev, security: d.security }));
          alert('Security settings updated successfully!');
        }
      }
    } catch (e) {
      console.error('Save security failed:', e);
    }
  };

  const handleAdminCreateUser = async (userObj: any) => {
    if (!authIdToken) return;
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authIdToken}`
        },
        body: JSON.stringify(userObj)
      });
      const d = await res.json();
      if (res.ok && d.success) {
        await fetchAdminData();
        alert('User account created manually successfully!');
      } else {
        alert('Failed to create user: ' + (d.error || 'Unknown error'));
      }
    } catch (e: any) {
      console.error('Create user failed:', e);
      alert('Error creating user: ' + e.message);
    }
  };

  const handleAdminChangePassword = async (uid: string, pass: string) => {
    if (!authIdToken || !pass) return;
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authIdToken}`
        },
        body: JSON.stringify({ uid, password: pass })
      });
      if (res.ok) {
        alert('User password changed successfully!');
      } else {
        alert('Failed to update password.');
      }
    } catch (e) {
      console.error('Password update failed:', e);
    }
  };

  const handleAdminForceLogout = async (uid: string) => {
    if (!authIdToken) return;
    try {
      const res = await fetch('/api/admin/force-logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authIdToken}`
        },
        body: JSON.stringify({ uid })
      });
      if (res.ok) {
        alert('Active user session revoked successfully!');
      }
    } catch (e) {
      console.error('Revoke session failed:', e);
    }
  };

  const handleAdminForceLogoutAll = async () => {
    if (!authIdToken) return;
    if (!window.confirm("Are you sure you want to force logout ALL platform users? This will revoke active sessions.")) {
      return;
    }
    try {
      const res = await fetch('/api/admin/force-logout-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authIdToken}`
        }
      });
      if (res.ok) {
        alert('Forced logout initiated for all active users successfully!');
      }
    } catch (e) {
      console.error('Revoke all sessions failed:', e);
    }
  };

  const handleAdminUpdateUserFeatures = async (uid: string, features: any) => {
    if (!authIdToken) return;
    try {
      const res = await fetch('/api/admin/update-user-features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authIdToken}`
        },
        body: JSON.stringify({ uid, features })
      });
      if (res.ok) {
        await fetchAdminData();
      }
    } catch (e) {
      console.error('Update user features failed:', e);
    }
  };

  const handleAdminSendNotification = async (notifObj: any) => {
    if (!authIdToken) return;
    try {
      const res = await fetch('/api/admin/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authIdToken}`
        },
        body: JSON.stringify(notifObj)
      });
      const d = await res.json();
      if (res.ok && d.success) {
        await fetchAdminData();
        alert('Notification announcement dispatched successfully!');
      }
    } catch (e) {
      console.error('Dispatch notice failed:', e);
    }
  };

  // Load admin data when panel is open and authenticated
  useEffect(() => {
    if (currentPath === '/admin' && authIdToken) {
      fetchAdminData();
    }
  }, [currentPath, authIdToken]);

  // Watermark States
  const [watermarkUrl, setWatermarkUrl] = useState<string | null>(null);
  const [watermarkName, setWatermarkName] = useState<string | null>(null);
  const [watermarkSize, setWatermarkSize] = useState<number>(15); // percent of canvas width
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.8);
  const [watermarkPosition, setWatermarkPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-right');
  const [watermarkXOffset, setWatermarkXOffset] = useState<number>(4);
  const [watermarkYOffset, setWatermarkYOffset] = useState<number>(4);

  const watermarkImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!watermarkUrl) {
      watermarkImgRef.current = null;
      return;
    }
    const img = new Image();
    img.src = watermarkUrl;
    img.onload = () => {
      watermarkImgRef.current = img;
    };
  }, [watermarkUrl]);

  const drawWatermark = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    const img = watermarkImgRef.current;
    if (!img) return;

    ctx.save();
    ctx.globalAlpha = watermarkOpacity;

    // Calculate watermark width based on percentage of canvas width
    const targetWidth = canvasWidth * (watermarkSize / 100);
    // Maintain aspect ratio
    const targetHeight = targetWidth * (img.naturalHeight / img.naturalWidth);

    // Padding based on canvas size
    const padX = canvasWidth * (watermarkXOffset / 100);
    const padY = canvasHeight * (watermarkYOffset / 100);

    let x = padX;
    let y = padY;

    if (watermarkPosition === 'top-right') {
      x = canvasWidth - targetWidth - padX;
    } else if (watermarkPosition === 'bottom-left') {
      y = canvasHeight - targetHeight - padY;
    } else if (watermarkPosition === 'bottom-right') {
      x = canvasWidth - targetWidth - padX;
      y = canvasHeight - targetHeight - padY;
    }

    ctx.drawImage(img, x, y, targetWidth, targetHeight);
    ctx.restore();
  }, [watermarkOpacity, watermarkSize, watermarkPosition, watermarkXOffset, watermarkYOffset]);

  // Handle Video Frame rendering loop on HTML Canvas for Export
  const drawActiveSubtitle = useCallback(
    (ctx: CanvasRenderingContext2D, time: number) => {
      if (captions.length === 0 || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const canvasScaleMultiplier = canvas.width / 1080;
      const baseFontSize = selectedStyle.fontSize * canvasScaleMultiplier;

      const active = captions.find((c) => time >= c.start && time <= c.end);
      
      if (active && lastLoggedCaptionIdRef.current !== active.id) {
        lastLoggedCaptionIdRef.current = active.id;
        console.log(`[Caption Rendering] Active subtitle segment rendered. ID: "${active.id}", Text: "${active.text}", Timing: ${active.start.toFixed(2)}s - ${active.end.toFixed(2)}s (Current Time: ${time.toFixed(2)}s)`);
      }

      if (!active) return;

      // Vertical position ratios
      let x = canvas.width * (selectedStyle.position === 'custom' ? selectedStyle.customX : 0.5);
      let y = canvas.height * 0.8; // default standard bottom overlay

      if (selectedStyle.position === 'top') {
        y = canvas.height * 0.18;
      } else if (selectedStyle.position === 'center') {
        y = canvas.height * 0.5;
      } else if (selectedStyle.position === 'custom') {
        y = canvas.height * selectedStyle.customY;
      }

      let scale = 1.0;
      let scaleX = 1.0;
      let scaleY = 1.0;
      let rotation = 0;
      let opacity = 1.0;
      let textToDraw = active.text;
      let offsetX = 0;
      let offsetY = 0;
      let textColor = selectedStyle.textColor;
      let strokeColor = selectedStyle.strokeColor;
      let shadowColor = selectedStyle.shadowColor;
      let shadowBlur = selectedStyle.shadowBlur;

      const progress = (time - active.start) / Math.max(0.1, active.end - active.start);

      // Micro-animations presets
      if (selectedStyle.animationStyle === 'pop') {
        if (progress < 0.2) {
          scale = 1.0 + (0.2 - progress) * 2.0;
        }
      } else if (selectedStyle.animationStyle === 'bounce') {
        if (progress < 0.3) {
          offsetY = -Math.sin((progress / 0.3) * Math.PI) * (baseFontSize * 0.35);
        }
      } else if (selectedStyle.animationStyle === 'zoom') {
        scale = 1.0 + Math.sin(Math.min(progress, 0.4) * Math.PI) * 0.18;
      } else if (selectedStyle.animationStyle === 'shake') {
        offsetX = (Math.random() - 0.5) * (baseFontSize * 0.12);
        offsetY = (Math.random() - 0.5) * (baseFontSize * 0.12);
      } else if (selectedStyle.animationStyle === 'typewriter') {
        const charCount = textToDraw.length;
        const visibleMax = Math.floor(charCount * Math.min(progress * 1.6, 1.0));
        textToDraw = textToDraw.substring(0, visibleMax);
      } else if (selectedStyle.animationStyle === 'fadeup') {
        const t = Math.min(progress / 0.25, 1.0);
        offsetY = (1.0 - t) * (baseFontSize * 0.4);
        scale = 0.95 + t * 0.05;
      } else if (selectedStyle.animationStyle === 'smoke') {
        opacity = Math.min(1.0, progress / 0.35);
        scale = 1.15 - (0.15 * Math.min(progress / 0.35, 1.0));
        if (progress < 0.5) {
          ctx.save();
          ctx.fillStyle = 'rgba(240, 240, 240, 0.32)';
          ctx.shadowBlur = baseFontSize * 0.45;
          ctx.shadowColor = 'rgba(200, 200, 200, 0.2)';
          const pX = x + offsetX;
          const pY = y + offsetY;
          for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2 + progress * 2.5;
            const dist = progress * baseFontSize * 1.3;
            const px = pX + Math.cos(angle) * dist;
            const py = pY + Math.sin(angle) * dist - progress * baseFontSize * 0.4;
            ctx.beginPath();
            ctx.arc(px, py, baseFontSize * 0.28 * (1 - progress / 0.5), 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      } else if (selectedStyle.animationStyle === 'glitch') {
        if (Math.random() < 0.35) {
          offsetX = (Math.random() - 0.5) * (baseFontSize * 0.18);
          offsetY = (Math.random() - 0.5) * (baseFontSize * 0.1);
          textColor = '#00ffff';
          strokeColor = '#ff0055';
        }
      } else if (selectedStyle.animationStyle === 'skew') {
        const t = Math.min(progress / 0.3, 1.0);
        offsetX = -40 * (1.0 - t);
        opacity = t;
      } else if (selectedStyle.animationStyle === 'elastic') {
        const s = progress;
        if (s < 1.0) {
          const p = 0.3;
          scale = Math.pow(2, -10 * s) * Math.sin((s - p / 4) * (2 * Math.PI) / p) + 1;
        }
      } else if (selectedStyle.animationStyle === 'flip') {
        const angle = (1.0 - Math.min(progress / 0.4, 1.0)) * Math.PI;
        scaleX = Math.cos(angle);
      } else if (selectedStyle.animationStyle === 'fire') {
        offsetY = -2 - (Math.random() * 4);
        shadowColor = '#ef4444';
        shadowBlur = 15 + Math.random() * 15;
        if (Math.random() < 0.5) {
          textColor = '#f97316';
        } else {
          textColor = '#facc15';
        }
      } else if (selectedStyle.animationStyle === 'spin') {
        const t = Math.min(progress / 0.35, 1.0);
        rotation = (1.0 - t) * -Math.PI * 1.2;
        scale = t;
      } else if (selectedStyle.animationStyle === 'slideSplit') {
        const t = Math.min(progress / 0.22, 1.0);
        offsetX = -50 * (1.0 - t);
        opacity = t;
      } else if (selectedStyle.animationStyle === 'rainbow') {
        const hue = (time * 150) % 360;
        textColor = `hsl(${hue}, 90%, 65%)`;
      } else if (selectedStyle.animationStyle === 'heartbeat') {
        const t = progress;
        if (t < 0.14) {
          scale = 1.0 + (t / 0.14) * 0.15;
        } else if (t < 0.28) {
          scale = 1.15 - ((t - 0.14) / 0.14) * 0.1;
        } else if (t < 0.42) {
          scale = 1.05 + ((t - 0.28) / 0.14) * 0.15;
        } else if (t < 0.6) {
          scale = 1.2 - ((t - 0.42) / 0.18) * 0.2;
        } else {
          scale = 1.0;
        }
      }

      ctx.save();

      // Configure font size and styles
      const fontName = FONT_PAIRS[selectedStyle.fontFamily] || 'sans-serif';
      const weight = selectedStyle.fontFamily === 'impact' ? '900 italic' : selectedStyle.fontFamily === 'hype' ? '900' : '700';
      ctx.font = `${weight} ${baseFontSize * scale}px ${fontName}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Apply proportional letter-spacing to canvas context (supported on modern browsers)
      if (selectedStyle.letterSpacing && 'letterSpacing' in ctx) {
        try {
          (ctx as any).letterSpacing = `${selectedStyle.letterSpacing * canvasScaleMultiplier * scale}px`;
        } catch (e) {
          // Fallback if browser throws
        }
      }

      // Drop shadows
      if (selectedStyle.useShadow) {
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur * canvasScaleMultiplier;
        ctx.shadowOffsetX = selectedStyle.shadowOffset * canvasScaleMultiplier;
        ctx.shadowOffsetY = selectedStyle.shadowOffset * canvasScaleMultiplier;
      }

      const drawX = x + offsetX;
      const drawY = y + offsetY;

      // Case-transforms for Tiktok-style uppercase look
      const finalString =
        selectedStyle.fontFamily === 'impact' || selectedStyle.fontFamily === 'hype'
          ? textToDraw.toUpperCase()
          : textToDraw;

      const textMetrics = ctx.measureText(finalString);
      const textWidth = textMetrics.width;
      const textHeight = baseFontSize * scale;

      // Set globalAlpha for opacity changes
      ctx.globalAlpha = opacity;

      // Apply transforms (rotate, scaleX, scaleY, skew) on standard rendering
      const isKaraoke = selectedStyle.animationStyle === 'karaoke';

      if (!isKaraoke) {
        ctx.translate(drawX, drawY);
        if (rotation !== 0) {
          ctx.rotate(rotation);
        }
        if (scaleX !== 1.0 || scaleY !== 1.0) {
          ctx.scale(scaleX, scaleY);
        }
        if (selectedStyle.animationStyle === 'skew') {
          const t = Math.min(progress / 0.3, 1.0);
          const slant = -0.32 * (1.0 - t);
          ctx.transform(1, 0, slant, 1, 0, 0);
        }
      }

      // Rounded Capsule/Bubble behind subtitles text
      if (selectedStyle.useBubble) {
        ctx.save();
        ctx.shadowColor = 'transparent'; // Reset drop shadow for crisp card background
        ctx.fillStyle = selectedStyle.bubbleColor;
        ctx.globalAlpha = selectedStyle.bubbleOpacity * opacity;
        const padX = textHeight * 0.45;
        const padY = textHeight * 0.25;
        const rx = isKaraoke ? (drawX - textWidth / 2 - padX) : (-textWidth / 2 - padX);
        const ry = isKaraoke ? (drawY - textHeight / 2 - padY) : (-textHeight / 2 - padY);
        const rw = textWidth + padX * 2;
        const rh = textHeight + padY * 2;

        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(rx, ry, rw, rh, textHeight * 0.35);
        } else {
          ctx.rect(rx, ry, rw, rh);
        }
        ctx.fill();
        ctx.restore();
      }

      // Split words to see if we do word-by-word active Karaoke highlight
      const words = finalString.split(/\s+/).filter(Boolean);

      if (isKaraoke && words.length > 0) {
        // Karaoke active word calculation
        const activeWordIdx = Math.min(words.length - 1, Math.max(0, Math.floor(progress * words.length)));
        
        // Measure horizontal offsets manually
        const spaceWidth = ctx.measureText(' ').width;
        const wordWidths = words.map(w => ctx.measureText(w).width);
        const totalTextWidth = wordWidths.reduce((a, b) => a + b, 0) + (words.length - 1) * spaceWidth;
        
        let startX = drawX - totalTextWidth / 2;

        words.forEach((word, wIdx) => {
          const isWordActive = wIdx === activeWordIdx;
          const wordW = wordWidths[wIdx];
          const wordCenter = startX + wordW / 2;

          ctx.save();
          
          if (isWordActive) {
            // Give the active word a slight bump in scale or emphasis
            const wordScale = 1.12;
            ctx.translate(wordCenter, drawY);
            ctx.scale(wordScale, wordScale);
            ctx.translate(-wordCenter, -drawY);
          }

          if (selectedStyle.useStroke) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = selectedStyle.strokeWidth * canvasScaleMultiplier;
            ctx.lineJoin = 'round';
            ctx.strokeText(word, wordCenter, drawY);
          }

          if (isWordActive) {
            ctx.fillStyle = selectedStyle.wordHighlightColor;
            if (selectedStyle.useShadow) {
              ctx.shadowColor = selectedStyle.wordHighlightColor;
              ctx.shadowBlur = (selectedStyle.shadowBlur + 6) * canvasScaleMultiplier;
            }
          } else {
            ctx.fillStyle = textColor;
          }

          ctx.fillText(word, wordCenter, drawY);
          ctx.restore();

          startX += wordW + spaceWidth;
        });
      } else {
        // Standard full-string rendering (remember we translated to drawX, drawY if !isKaraoke)
        const targetX = 0;
        const targetY = 0;

        if (selectedStyle.useStroke) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = selectedStyle.strokeWidth * canvasScaleMultiplier;
          ctx.lineJoin = 'round';
          ctx.strokeText(finalString, targetX, targetY);
        }

        ctx.fillStyle = textColor;
        ctx.fillText(finalString, targetX, targetY);
      }
      ctx.restore();
    },
    [captions, selectedStyle]
  );

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const renderLoop = () => {
      const ctx = canvas.getContext('2d');
      if (ctx && video.readyState >= 2) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw responsive video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Draw watermark overlay on canvas
        drawWatermark(ctx, canvas.width, canvas.height);
        // Play overlay subtitles on canvas
        drawActiveSubtitle(ctx, video.currentTime);
      }
      renderLoopRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoopRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (renderLoopRef.current) cancelAnimationFrame(renderLoopRef.current);
    };
  }, [drawActiveSubtitle, drawWatermark, videoUrl]);

  // Video time tracking
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      const vid = videoRef.current;
      setVideoDuration(vid.duration);
      setVideoDimensions({
        width: vid.videoWidth || 1080,
        height: vid.videoHeight || 1920,
      });

      // Maintain high canvas resolution aspect ratio matching source file
      if (canvasRef.current) {
        canvasRef.current.width = vid.videoWidth || 1080;
        canvasRef.current.height = vid.videoHeight || 1920;
      }
    }
  };

  // Upload actions
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Hard enforce maximum 20 seconds as per CORE RULES
    const checkVideo = document.createElement('video');
    checkVideo.preload = 'metadata';
    checkVideo.src = URL.createObjectURL(file);
    checkVideo.onloadedmetadata = async () => {
      URL.revokeObjectURL(checkVideo.src);
      if (checkVideo.duration > 20.5) {
        alert('❌ Video is too long! This editor has a strict limit of 20 seconds. Please clip your video and upload again.');
        return;
      }

      setIsUploadingToDisk(true);
      let preservedUrl = '';
      try {
        console.log('[Upload] Commencing video upload save to persistent Express backend...');
        
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const rawResult = reader.result as string;
            if (typeof rawResult === 'string' && rawResult.includes(',')) {
              resolve(rawResult.split(',')[1]);
            } else {
              reject(new Error('Failed to encode video file into Base64'));
            }
          };
          reader.onerror = () => reject(new Error('FileReader failed to process the file'));
        });

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authIdToken) {
          headers['Authorization'] = `Bearer ${authIdToken}`;
        }

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers,
          body: JSON.stringify({ videoBase64: base64Data, fileName: file.name })
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload API returned status: ${uploadRes.status}`);
        }

        const uploadResult = await uploadRes.json();
        if (uploadResult.success && uploadResult.url) {
          preservedUrl = uploadResult.url;
          console.log(`[Upload] Natively preserved video file on server disk at: ${preservedUrl}`);
        } else {
          throw new Error(uploadResult.error || 'Server storage save rejected');
        }
      } catch (err) {
        console.warn('[Upload] Failed storing to disk, utilizing transient client-side Object URL instead:', err);
        preservedUrl = URL.createObjectURL(file);
      } finally {
        setIsUploadingToDisk(false);
      }

      setVideoUrl(preservedUrl);
      setVideoName(file.name);
      setVideoSize(file.size);
      setRawFile(file);
      setExportedVideoUrl(null);
      setIsPlaying(false);
      setCurrentTime(0);

      // Trigger automatic server-side transcribe
      triggerAITranscribe(file);
    };
  };

  // Helper to convert browser AudioBuffer slice into standard mono WAV file
  const audioBufferToWav = (buffer: AudioBuffer, startSec: number, endSec: number): Blob => {
    const origSampleRate = buffer.sampleRate;
    const startSample = Math.floor(startSec * origSampleRate);
    const endSample = Math.min(buffer.length, Math.floor(endSec * origSampleRate));
    const numSamples = endSample - startSample;

    if (numSamples <= 0) return new Blob();

    const channelData = buffer.getChannelData(0);
    const resultData = new Int16Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const origIdx = startSample + i;
      const sample = channelData[origIdx] || 0;
      const clamped = Math.max(-1, Math.min(1, sample));
      resultData[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    }

    const wavBuffer = new ArrayBuffer(44 + resultData.byteLength);
    const view = new DataView(wavBuffer);

    const writeString = (v: DataView, offset: number, str: string) => {
      for (let j = 0; j < str.length; j++) {
        v.setUint8(offset + j, str.charCodeAt(j));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + resultData.byteLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, origSampleRate, true);
    view.setUint32(28, origSampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, resultData.byteLength, true);

    for (let i = 0; i < resultData.length; i++) {
      view.setInt16(44 + i * 2, resultData[i], true);
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  const triggerAITranscribe = async (file: File) => {
    setIsTranscribing(true);
    setTranscriptionError(null);
    setFallbackMode(false);
    setCaptions([]);
    setChunkProgresses([]);

    try {
      const arrayBuffer = await file.arrayBuffer();

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      let rawAudioBuffer: AudioBuffer | null = null;
      try {
        rawAudioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      } catch (err) {
        console.warn('Standard decodeAudioData promise failed, attempting legacy callback resolver:', err);
        rawAudioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
          audioCtx.decodeAudioData(arrayBuffer, resolve, reject);
        });
      }

      if (!rawAudioBuffer) {
        throw new Error('Web Audio Engine was unable to decode the uploaded track samples.');
      }

      const duration = rawAudioBuffer.duration;
      console.log(`[Audio Extraction] Successfully decoded video track of ${duration.toFixed(2)}s duration. Standard Sample Rate: ${rawAudioBuffer.sampleRate}Hz`);

      // Hardware-accelerated offline Context downsampling to standard clean 16kHz mono PCM WAV
      let audioBuffer: AudioBuffer = rawAudioBuffer;
      try {
        console.log('[Audio Extraction] Downsampling audio track to 16000Hz via OfflineAudioContext...');
        const offlineCtx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(
          1,
          Math.ceil(duration * 16000),
          16000
        );
        const source = offlineCtx.createBufferSource();
        source.buffer = rawAudioBuffer;
        source.connect(offlineCtx.destination);
        source.start();
        audioBuffer = await offlineCtx.startRendering();
        console.log('[Audio Extraction] 16kHz mono downsampling completed successfully.');
      } catch (resampleErr) {
        console.warn('[Audio Extraction] Offline downsampler failed, proceeding with original audio buffer directly:', resampleErr);
        audioBuffer = rawAudioBuffer;
      }

      // Slice the entire duration into a single mono standard 16kHz WAV file
      const wavBlob = audioBufferToWav(audioBuffer, 0, duration);
      if (wavBlob.size === 0) {
        throw new Error('Failed to extract audio track content of video.');
      }

      console.log(`[Audio Extraction] Extracted high-precision mono WAV file on browser side. Size: ${(wavBlob.size / 1024).toFixed(1)} KB`);

      // Convert full WAV blob to base64 encoding
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(wavBlob);
        reader.onload = () => {
          const textResult = reader.result as string;
          if (textResult && textResult.includes(',')) {
            resolve(textResult.split(',')[1]);
          } else {
            reject(new Error('Base64 encoding buffer failed'));
          }
        };
        reader.onerror = () => reject(new Error('FileReader error encoding audio stream'));
      });

      // Call single-shot high accuracy full video transcriber endpoint with metadata duration
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': authIdToken ? `Bearer ${authIdToken}` : ''
        },
        body: JSON.stringify({ videoBase64: base64Data, mimeType: 'audio/wav', duration }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.quotaExceeded || response.status === 429) {
          throw new Error('Gemini API Daily/Minute Quota Limit Exceeded. Activating offline sample subtitle flow.');
        }
        throw new Error(data.error || `Transcription server returned status error: ${response.status}`);
      }

      if (Array.isArray(data.captions) && data.captions.length > 0) {
        console.log(`[Speech Recognition] Received ${data.captions.length} raw caption nodes from server. Engine: ${data.engine || 'Gemini 3.5-Flash'}`);
        if (data.warning) {
          setTranscriptionError(data.warning);
        }
        
        const aligned: WordCaption[] = data.captions.map((cap: any, cIdx: number) => {
          const alignedWord = {
            id: `trans-${cIdx}-${Date.now()}`,
            text: cap.text,
            start: parseFloat(cap.start.toFixed(2)),
            end: Math.min(duration, parseFloat(cap.end.toFixed(2))),
          };
          console.log(` [Segment Timestamp] Word/Phrase Index #${cIdx}: "${alignedWord.text}" at ${alignedWord.start.toFixed(2)}s - ${alignedWord.end.toFixed(2)}s`);
          return alignedWord;
        });

        const finalSequence = rebuildCaptionSequence(aligned);
        console.log(`[Caption Generation] Successfully aligned and built sequence containing ${finalSequence.length} finalized non-overlapping subtitles.`);
        setCaptions(finalSequence);

        if (authIdToken) {
          fetchUserQuota(authIdToken);
        }
      } else {
        throw new Error('No spoken dialog or words detected in the audio track of video.');
      }

      setIsTranscribing(false);

    } catch (error: any) {
      console.warn('Speech-to-text fell back to offline mode:', error);
      const isQuota = String(error.message || '').toLowerCase().includes('quota') || String(error.message || '').includes('429');
      setTranscriptionError(
        isQuota
          ? 'Gemini API Free Tier Quota Exceeded. Offline simulation fallback captions activated.'
          : (error.message || 'Speech engine failure. Offline simulation fallback activated.')
      );
      setIsTranscribing(false);
      activateDummyFallback();
    }
  };

  const rebuildCaptionSequence = (list: WordCaption[]): WordCaption[] => {
    const sorted = [...list].sort((a, b) => a.start - b.start);
    return sorted.map((item, idx) => ({
      id: String(idx + 1),
      text: item.text,
      start: Number(item.start.toFixed(2)),
      end: Number(item.end.toFixed(2)),
    }));
  };

  const activateDummyFallback = () => {
    setFallbackMode(true);
    const fallbackCaptions: WordCaption[] = [
      { id: '1', text: 'Create', start: 0.1, end: 0.8 },
      { id: '2', text: 'stunning', start: 0.8, end: 1.4 },
      { id: '3', text: 'captions', start: 1.5, end: 2.2 },
      { id: '4', text: 'and style', start: 2.3, end: 3.0 },
      { id: '5', text: 'them quickly!', start: 3.0, end: 4.2 },
      { id: '6', text: 'Edit wording', start: 4.8, end: 5.8 },
      { id: '7', text: 'and positions', start: 5.9, end: 6.8 },
      { id: '8', text: 'directly on', start: 6.9, end: 7.7 },
      { id: '9', text: 'this screen.', start: 7.8, end: 9.0 },
      { id: '10', text: 'It works', start: 9.5, end: 10.3 },
      { id: '11', text: 'with high speed', start: 10.4, end: 11.5 },
      { id: '12', text: 'and exports', start: 11.6, end: 12.3 },
      { id: '13', text: 'instantly!', start: 12.4, end: 13.8 },
    ];
    setCaptions(fallbackCaptions);
  };

  const handleApplyAITranscript = async () => {
    if (!videoUrl) {
      alert("Please upload a video or load a demo video first!");
      return;
    }

    if (rawFile) {
      await triggerAITranscribe(rawFile);
      return;
    }

    setIsDownloadingForTranscribe(true);
    setTranscriptionError(null);
    try {
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch video stream: ${response.statusText}`);
      }
      const blob = await response.blob();
      const filename = videoName || "video.mp4";
      const file = new File([blob], filename, { type: blob.type || "video/mp4" });
      setRawFile(file);
      await triggerAITranscribe(file);
    } catch (err: any) {
      console.warn("Failed to fetch and transcribe video URL:", err);
      setTranscriptionError("Speech engine offline fallback activated.");
      activateDummyFallback();
    } finally {
      setIsDownloadingForTranscribe(false);
    }
  };

  const handleReset = () => {
    setSelectedStyle(JSON.parse(JSON.stringify(CAPTION_PRESETS[0])));
    setVideoUrl(null);
    setVideoName(null);
    setVideoDuration(0);
    setVideoSize(0);
    setVideoDimensions({ width: 1080, height: 1920 });
    setCaptions([]);
    setCurrentTime(0);
    setIsPlaying(false);
    setIsMuted(false);
    setPlaybackSpeed(1.0);
    setIsTranscribing(false);
    setIsUploadingToDisk(false);
    setTranscriptionError(null);
    setFallbackMode(false);
    setChunkProgresses([]);
    setRawFile(null);
    setIsDownloadingForTranscribe(false);
    setEditingIndex(null);
    setEditText('');
    setFindText('');
    setReplaceText('');
    setIsExporting(false);
    setExportProgress(0);
    setExportedVideoUrl(null);
    setTimelineEditingId(null);
    setTimelineEditingText('');

    if (videoRef.current) {
      videoRef.current.pause();
      try {
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      } catch (e) {
        console.warn("Reset video src failed gracefully:", e);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleLoadDemo = (idx: number) => {
    const demo = DEMO_VIDEOS[idx];
    setVideoUrl(demo.url);
    setVideoName(demo.name);
    setRawFile(null);
    const parsed = JSON.parse(JSON.stringify(demo.captions));
    setCaptions(rebuildCaptionSequence(parsed));
    setExportedVideoUrl(null);
    setTranscriptionError(null);
    setFallbackMode(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setChunkProgresses([]);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      // Warm up and resume Web Audio Context on user play gesture
      try {
        const g = window as any;
        if (g.__riddimroom_audio_ctx && g.__riddimroom_audio_ctx.state === 'suspended') {
          g.__riddimroom_audio_ctx.resume().catch((e: any) => console.warn('AudioContext resume on togglePlay failed:', e));
        }
      } catch (err) {
        console.warn('AudioContext resume check failed:', err);
      }

      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Timeline Drag & Edit Event Handlers
  const handleTimelinePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    capId: string,
    type: 'move' | 'left' | 'right'
  ) => {
    e.stopPropagation();
    try {
      if (timelineTrackRef.current) {
        timelineTrackRef.current.setPointerCapture(e.pointerId);
      }
    } catch (err) {
      console.warn("setPointerCapture failed:", err);
    }

    const cap = captions.find(c => c.id === capId);
    if (!cap) return;

    setDraggingSegment({
      id: capId,
      type,
      initialStart: cap.start,
      initialEnd: cap.end,
      startX: e.clientX,
    });
  };

  const handleTimelinePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingSegment || !timelineTrackRef.current) return;
    e.stopPropagation();

    const rect = timelineTrackRef.current.getBoundingClientRect();
    const duration = videoDuration || 20;
    
    // Calculate difference in seconds
    const deltaX = e.clientX - draggingSegment.startX;
    const deltaSeconds = (deltaX / rect.width) * duration;

    setCaptions(prev => {
      return prev.map(cap => {
        if (cap.id !== draggingSegment.id) return cap;

        let newStart = cap.start;
        let newEnd = cap.end;

        if (draggingSegment.type === 'left') {
          newStart = Math.max(0, Math.min(draggingSegment.initialEnd - 0.2, draggingSegment.initialStart + deltaSeconds));
          newStart = parseFloat(newStart.toFixed(2));
        } else if (draggingSegment.type === 'right') {
          newEnd = Math.max(draggingSegment.initialStart + 0.2, Math.min(duration, draggingSegment.initialEnd + deltaSeconds));
          newEnd = parseFloat(newEnd.toFixed(2));
        } else if (draggingSegment.type === 'move') {
          const length = draggingSegment.initialEnd - draggingSegment.initialStart;
          let calculatedStart = draggingSegment.initialStart + deltaSeconds;
          
          if (calculatedStart < 0) {
            calculatedStart = 0;
          } else if (calculatedStart + length > duration) {
            calculatedStart = duration - length;
          }
          
          newStart = parseFloat(calculatedStart.toFixed(2));
          newEnd = parseFloat((calculatedStart + length).toFixed(2));
        }

        return {
          ...cap,
          start: newStart,
          end: newEnd,
        };
      });
    });
  };

  const handleTimelinePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingSegment) return;
    try {
      if (timelineTrackRef.current) {
        timelineTrackRef.current.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}
    
    setDraggingSegment(null);
    setCaptions(prev => rebuildCaptionSequence(prev));
  };

  const handleTimelineDoubleClick = (e: React.MouseEvent, capId: string, text: string) => {
    e.stopPropagation();
    setTimelineEditingId(capId);
    setTimelineEditingText(text);
  };

  const handleTimelineTextSubmit = (capId: string) => {
    if (timelineEditingText.trim()) {
      setCaptions(prev => prev.map(cap => {
        if (cap.id === capId) {
          return { ...cap, text: timelineEditingText.trim() };
        }
        return cap;
      }));
    }
    setTimelineEditingId(null);
  };

  const handleTimelineTextKeyDown = (e: React.KeyboardEvent, capId: string) => {
    if (e.key === 'Enter') {
      handleTimelineTextSubmit(capId);
    } else if (e.key === 'Escape') {
      setTimelineEditingId(null);
    }
  };

  const handleTrackBgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains('timeline-track-bg')) {
      return;
    }
    if (!timelineTrackRef.current) return;
    const rect = timelineTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const duration = videoDuration || 20;
    const calculatedTime = Math.max(0, Math.min(duration, (clickX / rect.width) * duration));
    handleSeek(parseFloat(calculatedTime.toFixed(2)));
  };

  // Inline Segment Editor Handlers
  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditText(captions[index].text);
    setEditStart(captions[index].start);
    setEditEnd(captions[index].end);
  };

  const handleSaveInline = (index: number) => {
    const nextCaptions = [...captions];
    nextCaptions[index] = {
      id: captions[index].id,
      text: editText,
      start: parseFloat(editStart.toFixed(2)),
      end: parseFloat(editEnd.toFixed(2)),
    };
    const sequenced = rebuildCaptionSequence(nextCaptions);
    setCaptions(sequenced);
    setEditingIndex(null);
  };

  const handleDeleteSegment = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextCaptions = captions.filter((_, i) => i !== index);
    const sequenced = rebuildCaptionSequence(nextCaptions);
    setCaptions(sequenced);
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleAddSegment = () => {
    const newSegment: WordCaption = {
      id: `new-${Date.now()}`,
      text: 'NewWord',
      start: parseFloat(currentTime.toFixed(2)),
      end: parseFloat(Math.min(currentTime + 1.2, videoDuration || 20).toFixed(2)),
    };
    const combined = [...captions, newSegment];
    const sequenced = rebuildCaptionSequence(combined);
    setCaptions(sequenced);
    
    const nextIndex = sequenced.findIndex(
      (c) => c.start === newSegment.start && c.text === newSegment.text
    );
    if (nextIndex !== -1) {
      setEditingIndex(nextIndex);
      setEditText('NewWord');
      setEditStart(newSegment.start);
      setEditEnd(newSegment.end);
    }
  };

  // Modern Instant Inline Text Change (Auto-Save on Input keystroke)
  const handleTextChange = (index: number, newText: string) => {
    setCaptions(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          text: newText
        };
      }
      return updated;
    });
  };

  const handleTimeChange = (index: number, field: 'start' | 'end', val: number) => {
    setCaptions(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = {
          ...next[index],
          [field]: Math.max(0, parseFloat(val.toFixed(2)))
        };
      }
      return rebuildCaptionSequence(next);
    });
  };

  // Splits caption proportionally based on character cursor position
  const handleSplitSegment = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const inputEl = document.getElementById(`caption-input-${index}`) as HTMLInputElement;
    const currentCaption = captions[index];
    const currentText = currentCaption.text;
    
    let cursorPosition = Math.floor(currentText.length / 2);
    if (inputEl) {
      cursorPosition = inputEl.selectionStart !== null ? inputEl.selectionStart : cursorPosition;
    }

    const leftText = currentText.substring(0, cursorPosition).trim();
    const rightText = currentText.substring(cursorPosition).trim();

    if (!leftText || !rightText) {
      return; // Fail silently or do nothing to prevent empty splits
    }

    // Calculate timing division proportionally
    const duration = currentCaption.end - currentCaption.start;
    const ratio = leftText.length / (leftText.length + rightText.length);
    const midPoint = parseFloat((currentCaption.start + duration * ratio).toFixed(2));

    const firstHalf: WordCaption = {
      id: `split-${Date.now()}-1`,
      text: leftText,
      start: currentCaption.start,
      end: midPoint,
    };

    const secondHalf: WordCaption = {
      id: `split-${Date.now()}-2`,
      text: rightText,
      start: midPoint,
      end: currentCaption.end,
    };

    const nextCaptions = [...captions];
    nextCaptions.splice(index, 1, firstHalf, secondHalf);

    const resequenced = rebuildCaptionSequence(nextCaptions);
    setCaptions(resequenced);
  };

  // Merge adjacent segment
  const handleMergeSegment = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index >= captions.length - 1) return;

    const cap1 = captions[index];
    const cap2 = captions[index + 1];

    const mergedCap: WordCaption = {
      id: cap1.id,
      text: `${cap1.text} ${cap2.text}`.replace(/\s+/g, ' ').trim(),
      start: cap1.start,
      end: cap2.end,
    };

    const nextCaptions = [...captions];
    nextCaptions.splice(index, 2, mergedCap);

    const resequenced = rebuildCaptionSequence(nextCaptions);
    setCaptions(resequenced);
  };

  // Instant find-and-replace for all captions
  const handleSearchReplace = () => {
    if (!findText) return;
    setCaptions(prev => {
      const next = prev.map(cap => ({
        ...cap,
        text: cap.text.split(findText).join(replaceText)
      }));
      return rebuildCaptionSequence(next);
    });
  };

  // Auto-normalize audio volume to -14 LUFS (ITU-R BS.1770 compliant K-weighting approximation)
  const getLoudnessNormalizationGain = (audioBuffer: AudioBuffer, targetLUFS: number = -14): number => {
    const sampleRate = audioBuffer.sampleRate;
    const numChannels = audioBuffer.numberOfChannels;
    let totalWeightedEnergy = 0;
    let totalSamples = 0;

    for (let c = 0; c < numChannels; c++) {
      const data = audioBuffer.getChannelData(c);
      const len = data.length;
      
      // Apply simple pre-filter (high-pass cutoff ~100Hz mimicking ITU-R BS.1770 stage)
      let prevVal = 0;
      const rc = 1.0 / (2 * Math.PI * 100.0);
      const dt = 1.0 / sampleRate;
      const alpha = rc / (rc + dt);
      
      let channelEnergy = 0;
      for (let i = 0; i < len; i++) {
        const val = data[i];
        const filtered = alpha * (prevVal + val - (data[i - 1] || 0));
        prevVal = filtered;
        channelEnergy += filtered * filtered;
      }
      totalWeightedEnergy += channelEnergy;
      totalSamples += len;
    }

    if (totalSamples === 0) return 1.0;

    const rms = Math.sqrt(totalWeightedEnergy / totalSamples);
    const currentLUFS = rms > 0 ? 20 * Math.log10(rms) : -100;
    
    console.log(`[Loudness Analysis] Current integrated loudness/RMS (K-weighted filter): ${currentLUFS.toFixed(2)} LUFS`);

    if (currentLUFS < -70) {
      console.log('[Loudness Analysis] Track is extremely quiet or silent. Skipping boost to avoid ground noise amplitude spike.');
      return 1.0;
    }

    const dbAdjustment = targetLUFS - currentLUFS;
    const gain = Math.pow(10, dbAdjustment / 20);
    const cappedGain = Math.max(0.1, Math.min(gain, 12.0));
    
    console.log(`[Loudness Analysis] Target matches -14 LUFS. Calculated gain factor: ${cappedGain.toFixed(4)}x (${dbAdjustment.toFixed(2)} dB adjustment)`);
    return cappedGain;
  };

  // Pre-fetch/decode video audio track buffer for accurate loudness calculation
  const analyzeVideoLoudness = async (targetLUFS: number = -14): Promise<number> => {
    let audioCtx: AudioContext | null = null;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AudioCtx();
      let arrayBuffer: ArrayBuffer;

      if (rawFile) {
        console.log('[Loudness Extractor] Decoding raw user-uploaded file for LUFS measurement...');
        arrayBuffer = await rawFile.arrayBuffer();
      } else if (videoUrl) {
        console.log(`[Loudness Extractor] Fetching and decoding video asset from: ${videoUrl}`);
        const resp = await fetch(videoUrl);
        arrayBuffer = await resp.arrayBuffer();
      } else {
        return 1.0;
      }

      let audioBuf: AudioBuffer;
      try {
        audioBuf = await audioCtx.decodeAudioData(arrayBuffer);
      } catch {
        audioBuf = await new Promise<AudioBuffer>((resolve, reject) => {
          if (audioCtx) {
            audioCtx.decodeAudioData(arrayBuffer, resolve, reject);
          } else {
            reject(new Error('AudioContext is null'));
          }
        });
      }

      return getLoudnessNormalizationGain(audioBuf, targetLUFS);
    } catch (err) {
      console.warn('[Loudness Extractor] Audio loudness scan failed, utilizing default gain 1.0x', err);
      return 1.0;
    } finally {
      if (audioCtx) {
        try {
          await audioCtx.close();
          console.log('[Loudness Extractor] Closed temporary analyzer AudioContext successfully.');
        } catch (e) {
          console.warn('[Loudness Extractor] Failed to close analyzer AudioContext:', e);
        }
      }
    }
  };

  // High performance, single pass canvas capture export
  const handleExportVideo = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Pause player
    video.pause();
    setIsPlaying(false);
    setIsExporting(true);
    setExportProgress(1);
    setExportedVideoUrl(null);

    // Calculate required gain multiplier for -14 LUFS normalization
    let normalizationGain = 1.0;
    if (autoNormalizeAudio) {
      setExportStatusText('Normalizing audio volume of video to -14 LUFS...');
      normalizationGain = await analyzeVideoLoudness(-14);
    }
    setExportStatusText('Baking overlay subtitles on video stream...');

    // Store original player state to completely restore after baking is completed
    const originalMuted = video.muted;
    const originalLoop = video.loop;
    const originalPlaybackRate = video.playbackRate;
    const originalVolume = video.volume;

    // Setup video parameters temporarily to guarantee high-fidelity audio track recording and precise timeline stop
    video.muted = false;
    video.loop = false;
    video.playbackRate = 1.0;
    video.volume = 1.0; // Play at full source volume internally for full recording fidelity

    // Rewind video to start rendering and wait for seek operation to complete
    video.currentTime = 0;
    setCurrentTime(0);

    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
      // Safety timeout backup
      setTimeout(resolve, 800);
    });

    const chunks: Blob[] = [];
    const canvasStream = canvas.captureStream(30);

    // Acquire native media stream first to capture high-fidelity audio tracks directly from the video element
    let nativeStream: MediaStream | null = null;
    try {
      if ((video as any).captureStream) {
        nativeStream = (video as any).captureStream();
      } else if ((video as any).mozCaptureStream) {
        nativeStream = (video as any).mozCaptureStream();
      }
    } catch (errStream) {
      console.warn('[Export] Could not acquire native video capture stream:', errStream);
    }

    // Use Web Audio API for robust high-fidelity audio track capture & processing
    let audioStream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;

    if (nativeStream && nativeStream.getAudioTracks().length > 0) {
      console.log('[Export] Successfully obtained native audio track from video captureStream.');
      
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioCtx = new AudioCtx();
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
          }

          // Use the native audio track and route it via MediaStreamAudioSourceNode
          // (This completely bypasses HTMLMediaElement already connected restrictions and is fully reusable)
          const source = audioCtx.createMediaStreamSource(nativeStream);
          const dest = audioCtx.createMediaStreamDestination();

          // Apply normalization gain stage to hit -14 LUFS compliant with the user option
          const gainNode = audioCtx.createGain();
          gainNode.gain.setValueAtTime(normalizationGain, audioCtx.currentTime);

          // Route source through normalization gain to the recorder destination
          source.connect(gainNode);
          gainNode.connect(dest);

          audioStream = dest.stream;
          console.log(`[Export] Audio connected via MediaStreamSource. Normalization Gain: ${normalizationGain.toFixed(4)}x.`);
        }
      } catch (errAudio) {
        console.error('[Export] Web Audio normalization routing failed, falling back to direct native tracks:', errAudio);
        audioStream = nativeStream;
      }
    } else {
      console.warn('[Export] No native audio tracks detected in video stream.');
    }

    // Combine tracks immediately so they are initialized in sync
    const compiledTracks: MediaStreamTrack[] = [];
    compiledTracks.push(canvasStream.getVideoTracks()[0]);

    if (audioStream && audioStream.getAudioTracks().length > 0) {
      compiledTracks.push(audioStream.getAudioTracks()[0]);
      console.log('[Export] Integrated processed audio track into recorded stream.');
    } else if (nativeStream && nativeStream.getAudioTracks().length > 0) {
      compiledTracks.push(nativeStream.getAudioTracks()[0]);
      console.log('[Export] Integrated native fallback audio track into recorded stream.');
    }

    const compiledStream = new MediaStream(compiledTracks);

    // High performance multi-platform candidate record mimeTypes (preferring standard MP4 codec arrangements)
    const candidateMimeTypes = [
      'video/mp4;codecs=avc1,aac',
      'video/mp4;codecs=h264,aac',
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=avc1,opus',
      'video/mp4;codecs=h264,opus',
      'video/mp4',
      'video/webm;codecs=h264,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];

    let mimeType = '';
    for (const candidate of candidateMimeTypes) {
      if (MediaRecorder.isTypeSupported(candidate)) {
        mimeType = candidate;
        break;
      }
    }

    let recorder: MediaRecorder;
    try {
      if (mimeType) {
        recorder = new MediaRecorder(compiledStream, { mimeType });
      } else {
        recorder = new MediaRecorder(compiledStream);
      }
    } catch (err) {
      console.warn('Falling back to default browser MediaRecorder encoding', err);
      recorder = new MediaRecorder(compiledStream);
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = async () => {
      // Restore original player properties immediately
      video.muted = originalMuted;
      video.loop = originalLoop;
      video.playbackRate = originalPlaybackRate;
      video.volume = originalVolume;

      // Close temporary export AudioContext to release all hardware sound card holds and media nodes cleanly
      if (audioCtx) {
        try {
          await audioCtx.close();
          console.log('[Export] Closed export AudioContext successfully. Audio resources freed.');
        } catch (err) {
          console.warn('Failed to close AudioContext on export completion', err);
        }
      }

      const actualMime = recorder.mimeType || mimeType;
      const ext = actualMime.includes('mp4') ? 'mp4' : 'webm';
      setExportedVideoExtension(ext);

      const blob = new Blob(chunks, { type: actualMime });
      const downloadUrl = URL.createObjectURL(blob);
      setExportedVideoUrl(downloadUrl);
      setIsExporting(false);
      setExportProgress(100);
      video.pause();

      // Automatically trigger the single-click download for premium user flow!
      try {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `riddimroom_captioned_video.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('[Export] Automatic render-and-download triggered successfully!');
      } catch (clickErr) {
        console.warn('[Export] Browser block on auto-click handled:', clickErr);
      }
    };

    recorder.start();
    
    // Attempt play and handle native browser autoplay/unmute blocks gracefully
    try {
      await video.play();
      setIsPlaying(true);
    } catch (playErr) {
      console.warn('[Export] Direct playback failed, trying muted play fallback:', playErr);
      video.muted = true;
      try {
        await video.play();
        setIsPlaying(true);
      } catch (mutedPlayErr) {
        console.error('[Export] Muted play fallback also failed:', mutedPlayErr);
      }
    }

    const maxRecordDuration = Math.min(20.0, video.duration || 20);
    let lastTime = video.currentTime;
    let stuckChecks = 0;

    const checkProgressInterval = setInterval(() => {
      if ((recorder.state as any) === 'inactive') {
        clearInterval(checkProgressInterval);
        return;
      }
      
      const current = video.currentTime;
      const progressPercent = Math.min(99, Math.floor((current / maxRecordDuration) * 100));
      setExportProgress(progressPercent);

      // Detect if playback has stalled or naturally ended without the 'ended' event firing (frequent in canvas recording)
      if (current === lastTime) {
        stuckChecks++;
        // If stuck for ~1.5 seconds, attempt recovery by forcing play
        if (stuckChecks === 10) {
          console.log('[Export] Playback seems quiet or stalled. Verifying resume...', video.paused);
          video.play().catch(e => console.warn('[Export] Resume play attempt failed:', e));
        }
        // If stuck for ~3.0 seconds, gracefully stop recorder and finalize the video with available frames!
        if (stuckChecks >= 20) {
          console.warn(`[Export] Progress stall detected at ${current.toFixed(2)}s. Wrapping up and completing render successfully!`);
          clearInterval(checkProgressInterval);
          if ((recorder.state as any) !== 'inactive') {
            recorder.stop();
          }
          video.pause();
          setIsPlaying(false);
          return;
        }
      } else {
        lastTime = current;
        stuckChecks = 0;
      }

      if (video.ended || current >= maxRecordDuration) {
        clearInterval(checkProgressInterval);
        if ((recorder.state as any) !== 'inactive') {
          recorder.stop();
        }
        video.pause();
        setIsPlaying(false);
      }
    }, 150);
  };

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070707] text-white">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-[#10B981]/10 border-t-[#10B981] animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <RiddimLogo size={32} />
          </div>
        </div>
        <p className="mt-5 text-[10px] font-black text-white/50 tracking-widest uppercase font-mono animate-pulse">
          Establishing Secure Handshake...
        </p>
      </div>
    );
  }

  if (isAccountDisabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#070707] text-white p-6">
        <div className="max-w-md w-full bg-[#0e0e13] border border-red-500/20 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0-8V5m0 11h.01M12 2a10 10 0 110 20 10 10 0 010-20z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black text-white tracking-tight uppercase text-red-400 animate-pulse">Access Restrained</h2>
            <p className="text-xs text-white/60 leading-relaxed">
              Your account has been disabled. Please contact the administrator.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                setIsAccountDisabled(false);
                navigateTo('/login');
              }}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-600/10 active:scale-[0.98]"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage
        onGoogleLogin={handleGoogleLogin}
        onEmailAuth={handleEmailAuthDirect}
        onForgotPassword={handleForgotPasswordDirect}
        authModalError={authModalError}
        setAuthModalError={setAuthModalError}
        isSubmittingAuth={isSubmittingAuth}
        rememberMe={rememberMe}
        setRememberMe={setRememberMe}
      />
    );
  }

  if (currentPath === '/admin') {
    if (currentUser.email?.toLowerCase() !== 'ramjitinvestments@gmail.com') {
      return null;
    }

    return (
      <ProtectedRoute
        currentUser={currentUser}
        isAuthLoading={isAuthLoading}
        requiredRole="admin"
        userQuota={userQuota}
        redirectTo={navigateTo}
      >
        <AdminPanel
          adminUsersList={adminUsersList}
          adminLogsList={adminLogsList}
          adminAuditLogs={adminAuditLogs}
          adminNotifications={adminNotifications}
          adminSettings={adminSettings}
          fetchAdminData={fetchAdminData}
          handleAdminUpdateUserFeatures={handleAdminUpdateUserFeatures}
          handleAdminCreateUser={handleAdminCreateUser}
          handleAdminChangePassword={handleAdminChangePassword}
          handleAdminForceLogout={handleAdminForceLogout}
          handleAdminForceLogoutAll={handleAdminForceLogoutAll}
          handleAdminResetLimit={handleAdminResetLimit}
          handleAdminToggleStatus={handleAdminToggleStatus}
          handleAdminSetRole={handleAdminSetRole}
          handleAdminDeleteUser={handleAdminDeleteUser}
          handleAdminSaveSettings={handleAdminSaveSettings}
          handleAdminSaveCMS={handleAdminSaveCMS}
          handleAdminSaveSecurity={handleAdminSaveSecurity}
          handleAdminSendNotification={handleAdminSendNotification}
          navigateTo={navigateTo}
          authIdToken={authIdToken}
        />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute
      currentUser={currentUser}
      isAuthLoading={isAuthLoading}
      userQuota={userQuota}
      redirectTo={navigateTo}
    >
      <div className="flex flex-col h-screen max-h-screen bg-[#0A0A0A] text-white overflow-hidden font-sans">
        {/* Visual Header */}
        <header className="border-b border-white/5 bg-[#0C0C0C] px-5 py-3 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <img src="/riddimroom_logo.jpg" alt="RiddimroomCaption Brand" className="w-7 h-7 rounded-full border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)] object-cover shrink-0" />
            <div>
              <h1 className="text-sm font-black bg-gradient-to-r from-[#10B981] via-[#FBBF24] to-[#EF4444] bg-clip-text text-transparent tracking-tight">
                RiddimroomCaption
              </h1>
              <p className="text-[10px] text-white/40">Vibrant animated subtitles creator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Admin Panel Access Button */}
            {currentUser?.email?.toLowerCase() === 'ramjitinvestments@gmail.com' && (
              <button
                onClick={() => navigateTo('/admin')}
                className="py-1.5 px-3 rounded-lg text-xs font-semibold transition-all border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/15 text-indigo-300 flex items-center gap-1 active:scale-[0.98]"
                title="Open Admin Settings Panel"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Admin Panel</span>
              </button>
            )}

          {/* Quota Indicator */}
          {currentUser && userQuota && (
            <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[11px] font-medium text-white/75 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {userQuota.isNoLimit ? (
                <span className="text-emerald-400 font-bold">Admin Quota</span>
              ) : (
                <span>Quota: <strong className="text-white">{Math.max(0, userQuota.maxFree - userQuota.dailyCount)}/{userQuota.maxFree}</strong> left</span>
              )}
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="py-1.5 px-3 rounded-lg text-xs font-bold transition-all border border-white/5 bg-white/5 hover:bg-white/10 text-white flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Upload Video</span>
          </button>
          
          {videoUrl && (
            <button
              onClick={handleReset}
              className="py-1.5 px-3 rounded-lg text-xs font-semibold transition-all border border-white/5 hover:bg-[#ff4444]/10 hover:border-[#ff4444]/20 hover:text-[#ff4444]"
            >
              Reset
            </button>
          )}

          {/* Google Auth Status / Actions */}
          {isAuthLoading ? (
            <div className="w-5 h-5 rounded-full border-2 border-white/10 animate-spin border-t-transparent"></div>
          ) : currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl pl-2 pr-2 py-1">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-5.5 h-5.5 rounded-full border border-white/10"
                  />
                ) : (
                  <div className="w-5.5 h-5.5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold">
                    {currentUser.displayName?.[0] || currentUser.email?.[0] || '?'}
                  </div>
                )}
                <div className="text-left hidden md:block max-w-[100px]">
                  <p className="text-[10px] font-semibold text-white truncate">{currentUser.displayName || 'User'}</p>
                </div>
              </div>
              <button
                onClick={handleGoogleLogout}
                className="py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="text-[10px] text-white/40">Secure Session</div>
          )}
        </div>
      </header>
      {/* Workspace Area */}
      <main className={`flex-1 ${isDraggingCaption || isResizingCaption ? 'overflow-hidden' : 'overflow-y-auto'} bg-[#070707] w-full relative`}>
        {/* File Drag Over Alert */}
        <AnimatePresence>
          {isDraggingFile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-[#0A0A0A]/90 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm pointer-events-none"
            >
              <div className="w-full h-full border-2 border-dashed border-indigo-500/50 rounded-2xl flex flex-col items-center justify-center space-y-4 max-w-sm m-auto">
                <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 rounded-xl flex items-center justify-center animate-bounce">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Drop MP4 Video Here</h3>
                  <p className="text-[11px] text-white/40 mt-1">Maximum 20 seconds, fully automatic speech transcription</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {videoUrl ? (
          <div className="w-full max-w-7xl mx-auto py-6 px-4 select-none">
            {/* The Premium Multi-Column Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT SIDE COLUMN (lg:col-span-5) - The master video screen viewport & playback controls BY ITSELF */}
              <div id="video-workspace-screen" className="lg:col-span-5 flex flex-col items-center gap-4 bg-[#0e0e11]/80 border border-white/5 rounded-2xl p-4 lg:p-5 shadow-2xl lg:sticky lg:top-4 z-10 shrink-0 select-none">
                
                {/* 1. MASTER VIDEO ASPECT SCREEN CONTAINER */}
                <div className="w-full flex justify-center items-center">
                  <div className={`w-full flex flex-col items-center select-none ${
                    videoDimensions.width > videoDimensions.height
                      ? 'max-w-[450px]'
                      : 'max-w-[280px] sm:max-w-[300px]'
                  }`}>
                    {/* Aspect Phone Container */}
                    <div
                      ref={viewportRef}
                      className={`relative rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl flex items-center justify-center cursor-default select-none transition-all ${
                        videoDimensions.width > videoDimensions.height
                          ? 'aspect-[16/9] w-full h-auto'
                          : 'aspect-[9/16] w-auto h-[32vh] min-h-[220px] max-h-[500px]'
                      }`}
                    >
                      {/* HTML5 Video element */}
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        preload="auto"
                        playsInline
                        crossOrigin={
                          videoUrl && (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) && !videoUrl.includes(window.location.host)
                            ? 'anonymous'
                            : undefined
                        }
                        muted={isExporting ? false : isMuted}
                        loop
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleVideoLoadedMetadata}
                        className="w-full h-full object-contain block relative z-10 pointer-events-none"
                      />

                      {/* Video Render Canvas (Captions are baked visually here) */}
                      <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-0 z-0"
                      />

                      {/* Watermark Live Preview Overlay */}
                      {watermarkUrl && (
                        <div
                          style={{
                            position: 'absolute',
                            top: watermarkPosition.startsWith('top') ? `${watermarkYOffset}%` : 'auto',
                            bottom: watermarkPosition.startsWith('bottom') ? `${watermarkYOffset}%` : 'auto',
                            left: watermarkPosition.endsWith('left') ? `${watermarkXOffset}%` : 'auto',
                            right: watermarkPosition.endsWith('right') ? `${watermarkXOffset}%` : 'auto',
                            width: `${watermarkSize}%`,
                            opacity: watermarkOpacity,
                          }}
                          className="z-20 pointer-events-none"
                        >
                          <img
                            src={watermarkUrl}
                            alt="Watermark Preview"
                            referrerPolicy="no-referrer"
                            className="w-full h-auto object-contain"
                          />
                        </div>
                      )}

                      {/* Dynamic Draggable Caption Layer Overlay */}
                      {captions.length > 0 && (() => {
                        const active = captions.find((c) => currentTime >= c.start && currentTime <= c.end);
                        if (!active) return null;

                        const fontName = FONT_PAIRS[selectedStyle.fontFamily] || 'sans-serif';
                        const finalString =
                          selectedStyle.fontFamily === 'impact' || selectedStyle.fontFamily === 'hype'
                            ? active.text.toUpperCase()
                            : active.text;

                        const renderScale = viewportWidth / 1080;

                        let animationClass = '';
                        if (selectedStyle.animationStyle === 'pop') {
                          animationClass = 'animate-caption-pop';
                        } else if (selectedStyle.animationStyle === 'bounce') {
                          animationClass = 'animate-caption-bounce';
                        } else if (selectedStyle.animationStyle === 'zoom') {
                          animationClass = 'animate-caption-zoom';
                        } else if (selectedStyle.animationStyle === 'shake') {
                          animationClass = 'animate-caption-shake';
                        } else if (selectedStyle.animationStyle === 'typewriter') {
                          animationClass = 'animate-caption-typewriter';
                        } else if (selectedStyle.animationStyle === 'fadeup') {
                          animationClass = 'animate-caption-fadeup';
                        } else if (selectedStyle.animationStyle === 'smoke') {
                          animationClass = 'animate-caption-smoke';
                        } else if (selectedStyle.animationStyle === 'glitch') {
                          animationClass = 'animate-caption-glitch';
                        } else if (selectedStyle.animationStyle === 'skew') {
                          animationClass = 'animate-caption-skew';
                        } else if (selectedStyle.animationStyle === 'elastic') {
                          animationClass = 'animate-caption-elastic';
                        } else if (selectedStyle.animationStyle === 'flip') {
                          animationClass = 'animate-caption-flip';
                        } else if (selectedStyle.animationStyle === 'fire') {
                          animationClass = 'animate-caption-fire';
                        } else if (selectedStyle.animationStyle === 'spin') {
                          animationClass = 'animate-caption-spin';
                        } else if (selectedStyle.animationStyle === 'slideSplit') {
                          animationClass = 'animate-caption-slideSplit';
                        } else if (selectedStyle.animationStyle === 'rainbow') {
                          animationClass = 'animate-caption-rainbow';
                        } else if (selectedStyle.animationStyle === 'heartbeat') {
                          animationClass = 'animate-caption-heartbeat';
                        }

                        const layoutLeft = selectedStyle.position === 'top' ? '50%' : selectedStyle.position === 'center' ? '50%' : selectedStyle.position === 'bottom' ? '50%' : `${selectedStyle.customX * 100}%`;
                        const layoutTop = selectedStyle.position === 'top' ? '18%' : selectedStyle.position === 'center' ? '50%' : selectedStyle.position === 'bottom' ? '80%' : `${selectedStyle.customY * 100}%`;

                        return (
                          <motion.div
                            key={active.id}
                            onPointerDown={handleCaptionPointerDown}
                            className="absolute z-20 flex flex-col items-center group/caption cursor-grab active:cursor-grabbing select-none touch-none"
                            style={{
                              left: layoutLeft,
                              top: layoutTop,
                              x: '-50%',
                              y: '-50%',
                            }}
                          >
                            {/* Active text render display with premium dashed hover guide & scaling dot */}
                            <div className="relative inline-block group/box p-3 border-2 border-dashed border-transparent hover:border-indigo-500/40 rounded-xl transition-all select-none touch-none">
                              {/* Interactive Resize Handle Dot */}
                              <div
                                onPointerDown={handleResizePointerDown}
                                className="resize-handle absolute -bottom-1 -right-1 w-6 h-6 flex items-center justify-center cursor-se-resize z-30 group-hover/box:opacity-100 opacity-60 transition-opacity touch-none"
                                title="Drag diagonal to scale font size smoothly"
                              >
                                <div className="w-3 h-3 bg-white border-2 border-indigo-500 rounded-full shadow-md shadow-black/50 hover:scale-125 hover:bg-indigo-500 hover:border-white transition-all active:scale-150" />
                              </div>

                              <span
                                style={{
                                  fontFamily: fontName,
                                  color: selectedStyle.textColor,
                                  fontSize: `${selectedStyle.fontSize * renderScale}px`,
                                  letterSpacing: `${selectedStyle.letterSpacing * renderScale}px`,
                                  WebkitTextStroke: selectedStyle.useStroke
                                    ? `${selectedStyle.strokeWidth * renderScale}px ${selectedStyle.strokeColor}`
                                    : 'none',
                                  paintOrder: 'stroke fill',
                                  textShadow: selectedStyle.useShadow
                                    ? `${(selectedStyle.shadowOffset || 1) * renderScale}px ${(selectedStyle.shadowOffset || 1) * renderScale}px ${(selectedStyle.shadowBlur || 2) * renderScale}px ${selectedStyle.shadowColor || 'rgba(0,0,0,0.8)'}`
                                    : 'none',
                                  backgroundColor: selectedStyle.useBubble
                                    ? getBubbleBgColor(selectedStyle.bubbleColor, selectedStyle.bubbleOpacity)
                                    : 'transparent',
                                  borderRadius: `${(selectedStyle.fontSize * renderScale) * 0.35}px`,
                                  padding: selectedStyle.useBubble 
                                    ? `${(selectedStyle.fontSize * renderScale) * 0.25}px ${(selectedStyle.fontSize * renderScale) * 0.45}px` 
                                    : '0px',
                                  display: 'inline-block',
                                  maxWidth: `${viewportWidth * 0.9}px`
                                }}
                                className={`inline-block tracking-tight font-extrabold break-words text-center select-none touch-none ${animationClass}`}
                              >
                                {selectedStyle.animationStyle === 'karaoke' ? (
                                  (() => {
                                    const words = finalString.split(/\s+/).filter(Boolean);
                                    const progress = (currentTime - active.start) / Math.max(0.1, active.end - active.start);
                                    const activeWordIdx = Math.min(words.length - 1, Math.max(0, Math.floor(progress * words.length)));
                                    return words.map((word, wIdx) => {
                                      const isWordActive = wIdx === activeWordIdx;
                                      return (
                                        <span
                                          key={wIdx}
                                          style={{
                                            color: isWordActive ? selectedStyle.wordHighlightColor : undefined,
                                            scale: isWordActive ? '1.1' : '1',
                                            transition: 'all 0.08s ease-out'
                                          }}
                                          className="inline-block mx-0.5 font-extrabold select-none touch-none"
                                        >
                                          {word}
                                        </span>
                                      );
                                    });
                                  })()
                                ) : (
                                  finalString
                                )}
                              </span>
                            </div>

                            {(isDraggingCaption || isResizingCaption) && (
                              <div className="absolute -inset-2 border-2 border-dashed border-indigo-500/60 rounded-xl animate-pulse pointer-events-none" />
                            )}
                          </motion.div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* 2. SCRUBBER TIMELINE BAR AND PLAY HUD (Stacked below video viewport side) */}
                <div className="w-full space-y-4 bg-[#09090b]/90 border border-white/5 p-4 rounded-xl shadow-md select-none">
                  <div className="flex justify-between text-[9px] text-white/40 font-mono">
                    <span>{currentTime.toFixed(1)}s</span>
                    <span>{videoDuration.toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={videoDuration || 20}
                    step="0.01"
                    value={currentTime}
                    onChange={(e) => handleSeek(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg cursor-pointer"
                  />

                  {/* INTERACTIVE TIMELINE TRANSCRIPT TRACK */}
                  {captions.length > 0 && (
                    <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-white/50 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          Edit Subtitles on Timeline
                        </span>
                        <span className="text-indigo-400/80 font-medium text-[9px]">
                          Double-click to edit
                        </span>
                      </div>
                      
                      <div
                        ref={timelineTrackRef}
                        onPointerMove={handleTimelinePointerMove}
                        onPointerUp={handleTimelinePointerUp}
                        onClick={handleTrackBgClick}
                        className="timeline-track-bg h-14 w-full bg-[#050508] border border-white/5 hover:border-white/10 rounded-lg relative overflow-hidden cursor-default transition-all"
                      >
                        {/* Background Track grid / Ruler */}
                        <div className="absolute inset-0 flex justify-between px-2 text-[8px] text-white/10 font-mono pointer-events-none select-none z-0">
                          {Array.from({ length: 6 }).map((_, i) => {
                            const labelTime = ((videoDuration || 20) / 5) * i;
                            return (
                              <div key={i} className="flex flex-col justify-between h-full border-l border-white/5 pt-0.5 pb-1">
                                <span>{labelTime.toFixed(1)}s</span>
                                <div className="h-1 w-[1px] bg-white/10 self-start" />
                              </div>
                            );
                          })}
                        </div>

                        {/* Timeline segments */}
                        {captions.map((cap, idx) => {
                          const duration = videoDuration || 20;
                          const leftPercent = (cap.start / duration) * 100;
                          const widthPercent = ((cap.end - cap.start) / duration) * 100;
                          const isActive = currentTime >= cap.start && currentTime <= cap.end;
                          const isEditing = timelineEditingId === cap.id;

                          return (
                            <div
                              key={cap.id}
                              onDoubleClick={(e) => handleTimelineDoubleClick(e, cap.id, cap.text)}
                              className={`absolute top-3.5 bottom-1 rounded flex items-center justify-between text-[10px] font-semibold select-none group/item ${
                                isActive
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg border border-indigo-300 font-extrabold z-20 shadow-indigo-500/10'
                                  : 'bg-white/10 border border-white/5 text-white/70 hover:bg-white/15 hover:border-white/10'
                              }`}
                              style={{
                                left: `${leftPercent}%`,
                                width: `${widthPercent}%`,
                                minWidth: '24px',
                              }}
                              title="Double-click to edit text, drag center to slide time, drag edges to adjust duration"
                            >
                              {isEditing ? (
                                <div className="absolute inset-x-0 -top-3.5 -bottom-0.5 bg-[#12121A] border-2 border-indigo-500 rounded p-0.5 flex items-center z-40 gap-1 w-full min-w-[120px]">
                                  <input
                                    type="text"
                                    value={timelineEditingText}
                                    onChange={(e) => setTimelineEditingText(e.target.value)}
                                    onKeyDown={(e) => handleTimelineTextKeyDown(e, cap.id)}
                                    onBlur={() => handleTimelineTextSubmit(cap.id)}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full h-full bg-black/80 text-white text-[10px] rounded px-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                                  />
                                  <button
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      handleTimelineTextSubmit(cap.id);
                                    }}
                                    className="h-4.5 w-4.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shrink-0 active:scale-95"
                                  >
                                    <Check className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  {/* Left drag-timing handle */}
                                  <div
                                    onPointerDown={(e) => handleTimelinePointerDown(e, cap.id, 'left')}
                                    className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize bg-black/30 hover:bg-white/40 active:bg-indigo-300 rounded-l transition-all z-20 flex items-center justify-center border-r border-white/5"
                                    title="Drag back to increase start duration"
                                  >
                                    <div className="w-[1px] h-2 bg-white/30" />
                                  </div>

                                  {/* Click/drag focus segment */}
                                  <div
                                    onPointerDown={(e) => handleTimelinePointerDown(e, cap.id, 'move')}
                                    onClick={() => handleSeek(cap.start)}
                                    className="flex-1 min-w-0 h-full flex items-center justify-center px-1.5 cursor-grab active:cursor-grabbing text-center"
                                  >
                                    <span className="truncate select-none font-sans overflow-hidden block w-full text-[9px]">
                                      {cap.text}
                                    </span>
                                  </div>

                                  {/* Right drag-timing handle */}
                                  <div
                                    onPointerDown={(e) => handleTimelinePointerDown(e, cap.id, 'right')}
                                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize bg-black/30 hover:bg-white/40 active:bg-indigo-300 rounded-r transition-all z-20 flex items-center justify-center border-l border-white/5"
                                    title="Drag forward to increase end duration"
                                  >
                                    <div className="w-[1px] h-2 bg-white/30" />
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}

                        {/* Vertical Playhead head and cursor bar */}
                        <div
                          className="absolute top-0 bottom-0 w-[2px] bg-red-500 pointer-events-none z-30 transition-all duration-[30ms]"
                          style={{
                            left: `${((currentTime || 0) / (videoDuration || 20)) * 100}%`,
                          }}
                        >
                          <div className="absolute top-0 -left-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white shadow shadow-black flex items-center justify-center pointer-events-none">
                            <div className="w-0.5 h-0.5 bg-white rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={togglePlay}
                        className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all active:scale-95 text-xs flex items-center justify-center"
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                      </button>
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 rounded-lg bg-white/5 border border-white/5 text-white/60 hover:text-white"
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <span className="text-[10px] text-indigo-400 font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                      1080x1920 HD
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE COLUMN (lg:col-span-7) - Comprehensive Transcript editing lists & Style Presets */}
              <div className="lg:col-span-7 space-y-5 w-full">
                
                {/* 1. ROOMY CHRONOLOGICAL TRANSCRIPT EDITOR */}
                <div className="w-full bg-[#0E0E0E] border border-white/5 rounded-2xl p-4 lg:p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-600/10 text-indigo-400 flex items-center justify-center pb-2">
                        <Clock className="w-4 h-4 ml-0.5 mt-0.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                          Transcript Editing System
                        </h3>
                        <p className="text-[10px] text-white/40">
                          Word segments listed sequentially. Click and edit word details instantly.
                        </p>
                      </div>
                    </div>

                    {/* Inline segment adder */}
                    <button
                      onClick={handleAddSegment}
                      className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white py-1 px-3 rounded-lg font-bold flex items-center gap-1 active:scale-95 transition-all shadow-md shadow-indigo-600/10"
                    >
                      + Add Word
                    </button>
                  </div>

                  {/* ONE-CLICK AI TRANSCRIBE BUTTON */}
                  <button
                    id="one-click-transcribe-btn"
                    onClick={handleApplyAITranscript}
                    disabled={isTranscribing || isDownloadingForTranscribe}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white transition-all bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-indigo-500/20 group relative overflow-hidden"
                  >
                    {isTranscribing || isDownloadingForTranscribe ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>
                          {isDownloadingForTranscribe ? "Downloading Source Video..." : "Generating & Applying Timed Subtitles..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-200 group-hover:scale-110 transition-transform" />
                        <span>One-Click AI Transcribe & Apply Subtitles</span>
                      </>
                    )}
                  </button>

                  {/* LIGHTWEIGHT SEARCH AND REPLACE */}
                  <div className="bg-[#080808] border border-white/5 rounded-xl p-3 flex flex-wrap lg:flex-nowrap items-center gap-3">
                    <div className="flex-1 min-w-[120px]">
                      <span className="text-[9px] text-white/40 font-semibold block mb-1 uppercase tracking-wider font-sans">Find</span>
                      <input
                        type="text"
                        placeholder="e.g. riddim"
                        value={findText}
                        onChange={(e) => setFindText(e.target.value)}
                        className="w-full bg-[#121212] border border-white/5 focus:border-indigo-500/30 rounded px-2.5 py-1 text-xs text-white placeholder-white/20"
                      />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <span className="text-[9px] text-white/40 font-semibold block mb-1 uppercase tracking-wider font-sans">Replace</span>
                      <input
                        type="text"
                        placeholder="e.g. Riddim"
                        value={replaceText}
                        onChange={(e) => setReplaceText(e.target.value)}
                        className="w-full bg-[#121212] border border-white/5 focus:border-indigo-500/30 rounded px-2.5 py-1 text-xs text-white placeholder-white/20"
                      />
                    </div>
                    <button
                      onClick={handleSearchReplace}
                      disabled={!findText}
                      className="self-end text-[10px] bg-indigo-600 border border-transparent hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none h-8 flex items-center justify-center align-middle"
                    >
                      Replace All
                    </button>
                  </div>

                  {/* EDITABLE SEGMENTS ROW LIST */}
                  <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                    {captions.map((cap, idx) => {
                      const isWordActive = currentTime >= cap.start && currentTime <= cap.end;

                      return (
                        <div
                          key={cap.id}
                          className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${
                            isWordActive
                              ? 'bg-[#14141d] border-indigo-500/40 shadow-md shadow-indigo-600/5'
                              : 'bg-black/40 border-white/5 text-white/70 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[9px] font-mono font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                                #{cap.id}
                              </span>
                              <div className="flex items-center gap-1 text-[10px] text-white/50 font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                <span className="text-[9px] text-white/30 font-semibold">Start:</span>
                                <input
                                  type="number"
                                  step="0.05"
                                  min="0"
                                  max={videoDuration || 20}
                                  value={cap.start}
                                  onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    if (!isNaN(v)) handleTimeChange(idx, 'start', v);
                                  }}
                                  className="w-11 bg-black/60 border border-white/10 rounded px-1 text-[9px] font-mono text-indigo-300 focus:outline-none focus:border-indigo-500/50 text-center"
                                />
                                <span className="text-white/20">|</span>
                                <span className="text-[9px] text-white/30 font-semibold">End:</span>
                                <input
                                  type="number"
                                  step="0.05"
                                  min="0"
                                  max={videoDuration || 20}
                                  value={cap.end}
                                  onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    if (!isNaN(v)) handleTimeChange(idx, 'end', v);
                                  }}
                                  className="w-11 bg-black/60 border border-white/10 rounded px-1 text-[9px] font-mono text-indigo-300 focus:outline-none focus:border-indigo-500/50 text-center"
                                />
                                <span className="text-[9px] text-white/30">s</span>
                              </div>
                            </div>

                            <div className="flex gap-1">
                              {/* Seek segment */}
                              <button
                                onClick={() => handleSeek(cap.start)}
                                className="text-[9px] bg-white/5 hover:bg-indigo-600/20 hover:text-indigo-300 border border-transparent hover:border-indigo-500/10 text-white/50 font-semibold px-2 py-0.5 rounded transition-all"
                                title="Jump timeline playhead to segment"
                              >
                                Seek
                              </button>

                              {/* Split action */}
                              <button
                                onClick={(e) => handleSplitSegment(idx, e)}
                                className="text-[9px] bg-white/5 hover:bg-cyan-600/25 hover:text-cyan-300 border border-transparent hover:border-cyan-500/10 text-white/50 font-semibold px-2 py-0.5 rounded transition-all"
                                title="Split caption at text field cursor position"
                              >
                                Split
                              </button>

                              {/* Merge action */}
                              {idx < captions.length - 1 && (
                                <button
                                  onClick={(e) => handleMergeSegment(idx, e)}
                                  className="text-[9px] bg-white/5 hover:bg-emerald-600/25 hover:text-emerald-300 border border-transparent hover:border-emerald-500/10 text-white/50 font-semibold px-2 py-0.5 rounded transition-all"
                                  title="Merge this segment with the next adjacent segment"
                                >
                                  Merge Next
                                </button>
                              )}

                              {/* Delete action */}
                              <button
                                onClick={(e) => handleDeleteSegment(idx, e)}
                                className="text-[9px] text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-0.5 rounded transition-all"
                                title="Delete segment"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {/* Text input - Edits auto-save immediately on keystroke */}
                          <input
                            id={`caption-input-${idx}`}
                            type="text"
                            value={cap.text}
                            onChange={(e) => handleTextChange(idx, e.target.value)}
                            className="w-full bg-[#121212] hover:bg-[#151515] focus:bg-[#181818] border border-white/5 focus:border-indigo-500/40 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/20 transition-all focus:outline-none"
                            placeholder="Type caption text..."
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. STYLE PRESETS AND EXPORT BURN-IN CONTROLS */}
                <div className="bg-[#0E0E0E] border border-white/5 rounded-2xl p-4 lg:p-5 space-y-4 shadow-xl w-full">
                  
                  {transcriptionError && (
                    <div className="bg-amber-950/10 border border-amber-500/10 text-amber-300 text-[11px] rounded-lg p-3 flex gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold">
                          {transcriptionError.toLowerCase().includes('quota') || transcriptionError.toLowerCase().includes('429') 
                            ? 'Quota Limit Fallback' 
                            : 'Transcription System Alert'}
                        </span>
                        <p className="text-white/80 mt-0.5">{transcriptionError}</p>
                      </div>
                    </div>
                  )}

                  {isTranscribing && (
                    <div className="bg-emerald-950/10 border border-emerald-500/10 rounded-lg p-3 flex items-center gap-2.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#10b981]" />
                      <span className="text-[11px] text-emerald-200">Processing audio voice timeline transcription...</span>
                    </div>
                  )}

                  {/* PRESET SELECTOR (Caption Presets) */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2 font-sans">
                      <Sparkles className="w-3 h-3 text-[#10b981]" />
                      Caption Style Presets
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {CAPTION_PRESETS.map((p) => {
                        const isActive = selectedStyle.id === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => setSelectedStyle(JSON.parse(JSON.stringify(p)))}
                            className={`py-2 px-3 text-left rounded-lg border text-xs font-semibold transition-all flex items-center justify-between ${
                              isActive
                                ? 'bg-[#10b981]/10 border-[#10b981] text-white shadow-sm font-extrabold'
                                : 'bg-white/5 border-white/5 text-white/50 hover:border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <span>{p.name}</span>
                            <span className="text-[9px] font-mono text-white/30 capitalize">
                              {p.fontFamily} • {p.animationStyle}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* CUSTOM STYLE PANEL */}
                  <div className="space-y-4 border-t border-white/5 pt-4">
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                      <Palette className="w-3.5 h-3.5 text-indigo-400" />
                      Design & Color Controls
                    </h4>

                    <div className="bg-white/2 border border-white/5 rounded-xl p-3.5 space-y-4">
                      {/* TEXT COLOR ROW */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-white/80">Text Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={selectedStyle.textColor}
                              onChange={(e) =>
                                setSelectedStyle((prev) => ({
                                  ...prev,
                                  textColor: e.target.value,
                                }))
                              }
                              className="w-6 h-6 rounded-md bg-transparent cursor-pointer border border-white/10"
                            />
                            <span className="text-[10px] font-mono text-white/40">{selectedStyle.textColor}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {['#ffffff', '#facc15', '#10b981', '#ef4444', '#06b6d4', '#3b82f6'].map((c) => (
                            <button
                              key={c}
                              onClick={() =>
                                setSelectedStyle((prev) => ({
                                  ...prev,
                                  textColor: c,
                                }))
                              }
                              style={{ backgroundColor: c }}
                              className={`w-5 h-5 rounded-full border ${
                                selectedStyle.textColor.toLowerCase() === c.toLowerCase()
                                  ? 'border-indigo-500 scale-110 shadow-md ring-1 ring-indigo-500/50'
                                  : 'border-white/10 hover:scale-105'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* STROKE OUTLINE ROW */}
                      <div className="space-y-2 border-t border-white/5 pt-3">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white/80">
                            <input
                              type="checkbox"
                              checked={selectedStyle.useStroke}
                              onChange={(e) =>
                                setSelectedStyle((prev) => ({
                                  ...prev,
                                  useStroke: e.target.checked,
                                }))
                              }
                              className="rounded border-white/10 bg-[#121212] text-indigo-600 focus:ring-0 focus:ring-offset-0"
                            />
                            Stroke Outline
                          </label>
                          {selectedStyle.useStroke && (
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={selectedStyle.strokeColor}
                                onChange={(e) =>
                                  setSelectedStyle((prev) => ({
                                    ...prev,
                                    strokeColor: e.target.value,
                                  }))
                                }
                                className="w-5 h-5 rounded-md bg-transparent cursor-pointer border border-white/10"
                              />
                              <span className="text-[10px] font-mono text-white/40">{selectedStyle.strokeColor}</span>
                            </div>
                          )}
                        </div>
                        {selectedStyle.useStroke && (
                          <div className="space-y-1 pl-6">
                            <div className="flex items-center justify-between text-[10px] text-white/40">
                              <span>Outline Thickness</span>
                              <span>{selectedStyle.strokeWidth}px</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="12"
                              step="0.5"
                              value={selectedStyle.strokeWidth}
                              onChange={(e) =>
                                setSelectedStyle((prev) => ({
                                  ...prev,
                                  strokeWidth: parseFloat(e.target.value),
                                }))
                              }
                              className="w-full accent-indigo-500 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        )}
                      </div>

                      {/* KARAOKE WORD HIGHLIGHT */}
                      <div className="space-y-1.5 border-t border-white/5 pt-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-white/80">Karaoke Highlight Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={selectedStyle.wordHighlightColor}
                              onChange={(e) =>
                                setSelectedStyle((prev) => ({
                                  ...prev,
                                  wordHighlightColor: e.target.value,
                                }))
                              }
                              className="w-5 h-5 rounded-md bg-transparent cursor-pointer border border-white/10"
                            />
                            <span className="text-[10px] font-mono text-white/40">{selectedStyle.wordHighlightColor}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {['#facc15', '#f97316', '#a855f7', '#ec4899', '#10b981', '#ffffff'].map((c) => (
                            <button
                              key={c}
                              onClick={() =>
                                setSelectedStyle((prev) => ({
                                  ...prev,
                                  wordHighlightColor: c,
                                }))
                              }
                              style={{ backgroundColor: c }}
                              className={`w-5 h-5 rounded-full border ${
                                selectedStyle.wordHighlightColor.toLowerCase() === c.toLowerCase()
                                  ? 'border-indigo-500 scale-110 shadow-md ring-1 ring-indigo-500/50'
                                  : 'border-white/10 hover:scale-105'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* BUBBLE BACKGROUND ROW */}
                      <div className="space-y-2 border-t border-white/5 pt-3">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white/80">
                            <input
                              type="checkbox"
                              checked={selectedStyle.useBubble}
                              onChange={(e) =>
                                setSelectedStyle((prev) => ({
                                  ...prev,
                                  useBubble: e.target.checked,
                                }))
                              }
                              className="rounded border-white/10 bg-[#121212] text-indigo-600 focus:ring-0 focus:ring-offset-0"
                            />
                            Bubble Card Background
                          </label>
                          {selectedStyle.useBubble && (
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={selectedStyle.bubbleColor.startsWith('rgba') ? '#000000' : selectedStyle.bubbleColor}
                                onChange={(e) =>
                                  setSelectedStyle((prev) => ({
                                    ...prev,
                                    bubbleColor: e.target.value,
                                  }))
                                }
                                className="w-5 h-5 rounded-md bg-transparent cursor-pointer border border-white/10"
                              />
                              <span className="text-[10px] font-mono text-white/40">
                                {selectedStyle.bubbleColor.startsWith('rgba') ? 'Default' : selectedStyle.bubbleColor}
                              </span>
                            </div>
                          )}
                        </div>
                        {selectedStyle.useBubble && (
                          <div className="space-y-1 pl-6">
                            <div className="flex items-center justify-between text-[10px] text-white/40">
                              <span>Card Opacity</span>
                              <span>{Math.round(selectedStyle.bubbleOpacity * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="1.0"
                              step="0.05"
                              value={selectedStyle.bubbleOpacity}
                              onChange={(e) =>
                                setSelectedStyle((prev) => ({
                                  ...prev,
                                  bubbleOpacity: parseFloat(e.target.value),
                                }))
                              }
                              className="w-full accent-indigo-500 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        )}
                      </div>

                      {/* DROP SHADOW ROW */}
                      <div className="space-y-2 border-t border-white/5 pt-3">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white/80">
                            <input
                              type="checkbox"
                              checked={selectedStyle.useShadow}
                              onChange={(e) =>
                                setSelectedStyle((prev) => ({
                                  ...prev,
                                  useShadow: e.target.checked,
                                }))
                              }
                              className="rounded border-white/10 bg-[#121212] text-indigo-600 focus:ring-0 focus:ring-offset-0"
                            />
                            Text Glow / Drop Shadow
                          </label>
                          {selectedStyle.useShadow && (
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={selectedStyle.shadowColor}
                                onChange={(e) =>
                                  setSelectedStyle((prev) => ({
                                    ...prev,
                                    shadowColor: e.target.value,
                                  }))
                                }
                                className="w-5 h-5 rounded-md bg-transparent cursor-pointer border border-white/10"
                              />
                              <span className="text-[10px] font-mono text-white/40">{selectedStyle.shadowColor}</span>
                            </div>
                          )}
                        </div>
                        {selectedStyle.useShadow && (
                          <div className="space-y-1 pl-6">
                            <div className="flex items-center justify-between text-[10px] text-white/40">
                              <span>Blur Intensity</span>
                              <span>{selectedStyle.shadowBlur}px</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="24"
                              step="1"
                              value={selectedStyle.shadowBlur}
                              onChange={(e) =>
                                setSelectedStyle((prev) => ({
                                  ...prev,
                                  shadowBlur: parseFloat(e.target.value),
                                }))
                              }
                              className="w-full accent-indigo-500 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        )}
                      </div>

                      {/* TEXT SIZE ROW */}
                      <div className="space-y-1 pt-3 border-t border-white/5">
                        <div className="flex items-center justify-between text-xs font-semibold text-white/80">
                          <span>Base Font Size</span>
                          <span>{selectedStyle.fontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="16"
                          max="96"
                          step="1"
                          value={selectedStyle.fontSize}
                          onChange={(e) =>
                              setSelectedStyle((prev) => ({
                                ...prev,
                                fontSize: parseInt(e.target.value),
                              }))
                          }
                          className="w-full accent-indigo-500 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* WATERMARK LOGO PANEL */}
                  <div className="space-y-4 border-t border-white/5 pt-4">
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                      Logo Watermark Overlay
                    </h4>

                    <div className="bg-white/2 border border-white/5 rounded-xl p-3.5 space-y-4">
                      {!watermarkUrl ? (
                        <div
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/png, image/jpeg, image/jpg';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const url = URL.createObjectURL(file);
                                setWatermarkUrl(url);
                                setWatermarkName(file.name);
                              }
                            };
                            input.click();
                          }}
                          className="border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-xl p-4 text-center cursor-pointer hover:bg-white/1 transition-all group"
                        >
                          <Upload className="w-6 h-6 text-white/30 group-hover:text-indigo-400 mx-auto mb-2 transition-colors" />
                          <p className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">
                            Upload Watermark / Logo
                          </p>
                          <p className="text-[9px] text-white/40 mt-1">
                            Supports PNG, JPEG or JPG
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Selected Logo Details */}
                          <div className="flex items-center justify-between bg-white/3 border border-white/5 rounded-lg p-2">
                            <div className="flex items-center gap-2 overflow-hidden mr-2">
                              <img
                                src={watermarkUrl}
                                alt="logo thumbnail"
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded bg-black/40 object-contain border border-white/10 shrink-0"
                              />
                              <div className="text-left overflow-hidden">
                                <p className="text-xs font-medium text-white truncate max-w-[120px]">{watermarkName}</p>
                                <p className="text-[9px] text-white/40">Active Logo</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (watermarkUrl) URL.revokeObjectURL(watermarkUrl);
                                setWatermarkUrl(null);
                                setWatermarkName(null);
                              }}
                              className="p-1.5 hover:bg-red-500/15 rounded-lg text-white/40 hover:text-red-400 transition-all shrink-0"
                              title="Remove watermark"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Position Grid selector */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-white/70">Corner Position</label>
                            <div className="grid grid-cols-2 gap-1.5">
                              {[
                                { key: 'top-left', label: 'Top Left' },
                                { key: 'top-right', label: 'Top Right' },
                                { key: 'bottom-left', label: 'Bottom Left' },
                                { key: 'bottom-right', label: 'Bottom Right' },
                              ].map((pos) => {
                                const isSel = watermarkPosition === pos.key;
                                return (
                                  <button
                                    key={pos.key}
                                    onClick={() => setWatermarkPosition(pos.key as any)}
                                    className={`px-2 py-1.5 text-[11px] font-medium rounded-lg border transition-all text-center ${
                                      isSel
                                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                                        : 'bg-white/2 border-white/5 text-white/60 hover:border-white/10'
                                    }`}
                                  >
                                    {pos.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Size slider */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-white/70">Size Scale</span>
                              <span className="font-mono text-white/50">{watermarkSize}%</span>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="40"
                              step="1"
                              value={watermarkSize}
                              onChange={(e) => setWatermarkSize(parseInt(e.target.value))}
                              className="w-full accent-indigo-500 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          {/* Opacity slider */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-white/70">Opacity / Transparency</span>
                              <span className="font-mono text-white/50">{Math.round(watermarkOpacity * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="1.0"
                              step="0.05"
                              value={watermarkOpacity}
                              onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                              className="w-full accent-indigo-500 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          {/* Offset/Padding sliders */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-medium text-white/60">Margin X</span>
                                <span className="font-mono text-white/40">{watermarkXOffset}%</span>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="15"
                                step="0.5"
                                value={watermarkXOffset}
                                onChange={(e) => setWatermarkXOffset(parseFloat(e.target.value))}
                                className="w-full accent-indigo-500 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-medium text-white/60">Margin Y</span>
                                <span className="font-mono text-white/40">{watermarkYOffset}%</span>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="15"
                                step="0.5"
                                value={watermarkYOffset}
                                onChange={(e) => setWatermarkYOffset(parseFloat(e.target.value))}
                                className="w-full accent-indigo-500 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ACTION BURN EXPORTER */}
                  <div className="pt-3 border-t border-white/5 space-y-3">
                    {/* Audio Normalization Control Switch */}
                    <div className="bg-white/2 border border-white/5 rounded-xl p-3.5 space-y-1.5">
                      <label className="flex items-start justify-between cursor-pointer group">
                        <div className="space-y-0.5 pr-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-emerald-400 transition-colors">
                            <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            Auto-Normalize to -14 LUFS
                          </span>
                          <p className="text-[10px] text-white/45 leading-normal">
                            Bakes professional consistent loudness compliant with TikTok, Shorts, and Reels standard algorithms, preventing muting or low volume.
                          </p>
                        </div>
                        <div className="relative shrink-0 mt-1">
                          <input
                            type="checkbox"
                            checked={autoNormalizeAudio}
                            onChange={(e) => setAutoNormalizeAudio(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#10b981] transition-colors"></div>
                        </div>
                      </label>
                    </div>
                    {exportedVideoUrl && (
                      <div className="space-y-2">
                        <div className="bg-emerald-900/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Video export completed!</span>
                        </div>
                        <a
                          href={exportedVideoUrl}
                          download={`riddimroom_captioned_video.${exportedVideoExtension}`}
                          className="w-full bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold py-2.5 rounded-lg block shadow-md text-center flex items-center justify-center gap-1.5 transition-all animate-pulse"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Captioned Video
                        </a>
                      </div>
                    )}

                    {isExporting ? (
                      <div className="space-y-2 text-center text-xs">
                        <span className="text-white/40 flex items-center justify-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                          {exportStatusText} ({exportProgress}%)
                        </span>
                        <div className="w-full bg-white/10 rounded-full h-1">
                          <div
                            className="bg-emerald-500 h-1 rounded-full transition-all duration-150"
                            style={{ width: `${exportProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleExportVideo}
                        id={COMPONENT_IDS.EXPORT_BUTTON}
                        disabled={isExporting}
                        className="w-full bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold py-2.5 rounded-lg shadow-md flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        <span>Burn & Download Final Video</span>
                      </button>
                    )}
                  </div>

                </div>

              </div>
              
            </div>
          </div>
        ) : (
          <div className="max-w-lg w-full mx-auto my-12 bg-[#0F0F13] border border-white/5 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
            {/* Riddimroom Caption Logo display on opening */}
            <div className="relative group flex justify-center py-2">
              <img 
                src="/riddimroom_logo.jpg" 
                alt="RiddimroomCaption Logo" 
                className="w-44 h-44 rounded-full border-4 border-[#10b981] shadow-[0_0_35px_rgba(16,185,129,0.35)] hover:scale-105 active:scale-95 transition-all duration-300 object-cover cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-3xl font-black bg-gradient-to-r from-[#10B981] via-[#FBBF24] to-[#EF4444] bg-clip-text text-transparent tracking-tighter uppercase italic">
                Riddimroom Caption
              </h2>
              <p className="text-[11px] text-white/50 leading-relaxed max-w-sm mx-auto">
                Generate, edit, and burn high-conversion animated subtitles instantly onto your promo clips and creator shorts.
              </p>
            </div>

            {/* Slogan details and Vibes block */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-4.5 space-y-2.5 text-left text-xs">
              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-500/20 text-emerald-400 p-0.5 rounded-full shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="font-extrabold text-emerald-400 tracking-wide uppercase text-[10px]">THE VIBES IS UNSTOPPABLE!</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-500/20 text-emerald-400 p-0.5 rounded-full shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-white/80 font-bold text-[10px]">LEVEL UP YOUR CONTENT IN SECONDS.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-500/20 text-emerald-400 p-0.5 rounded-full shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-white/80 font-bold text-[10px]">MAKE IT LOUD, MAKE IT <span className="text-rose-500 font-black uppercase italic">VIRAL!</span></span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-500/20 text-emerald-400 p-0.5 rounded-full shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-white/80 font-bold text-[10px]">RIDDIMROOM CAPTION DOES IT ALL.</span>
              </div>
            </div>

            {/* Quick-start preset demo tools selection */}
            <div className="space-y-2.5 border-t border-white/5 pt-5 text-left">
              <h4 className="text-[10px] uppercase tracking-wider text-amber-400 font-bold mb-1 flex items-center gap-1.5 justify-center">
                <Sparkles className="w-3.5 h-3.5 text-[#10b981]" /> TRY DEMO VIDEO SAMPLES
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleLoadDemo(0)}
                  className="flex flex-col items-center gap-2 p-3.5 bg-white/5 hover:bg-[#10b981]/15 border border-white/15 hover:border-[#10b981]/40 rounded-xl text-center transition-all cursor-pointer group active:scale-95"
                >
                  <div className="p-2 bg-[#10b981]/20 text-[#10b981] rounded-lg group-hover:scale-110 transition-transform">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-white block">Vertical Clip</span>
                    <span className="text-[8px] text-white/40 block">9:16 Cyberpunk</span>
                  </div>
                </button>
                
                <button
                  onClick={() => handleLoadDemo(1)}
                  className="flex flex-col items-center gap-2 p-3.5 bg-white/5 hover:bg-orange-500/15 border border-white/15 hover:border-orange-500/40 rounded-xl text-center transition-all cursor-pointer group active:scale-95"
                >
                  <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg group-hover:scale-110 transition-transform">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-white block">Landscape Vlog</span>
                    <span className="text-[8px] text-white/40 block">16:9 Talk Show</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Local Video drop-uploader */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/10 hover:border-[#10b981]/40 hover:bg-[#10b981]/5 transition-all rounded-xl p-5 cursor-pointer space-y-2 bg-white/2"
            >
              <div className="p-2 rounded-lg bg-white/5 w-8 h-8 flex items-center justify-center mx-auto text-[#10b981]">
                <Upload className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-white/80 block">Upload Your Own Creator Video</span>
                <span className="text-[8px] text-white/30 block mt-0.5">MP4, MOV, or WebM format (Maximum 20s)</span>
              </div>
            </div>

            {/* Core Badges Row */}
            <div className="grid grid-cols-5 gap-2 border-t border-white/5 pt-5 text-center">
              <div className="bg-white/2 border border-white/5 p-2 rounded-lg flex flex-col items-center justify-center gap-1">
                <div className="text-[8px] font-black px-1 py-0.5 border border-emerald-500/30 text-emerald-400 rounded bg-emerald-500/10 leading-none">CC</div>
                <span className="text-[7px] font-extrabold text-white/40 uppercase tracking-tight leading-none mt-1">Automatic Captions</span>
              </div>
              <div className="bg-white/2 border border-white/5 p-2 rounded-lg flex flex-col items-center justify-center gap-1">
                <div className="text-[8px] font-black px-1 py-0.5 border border-amber-500/30 text-amber-400 rounded bg-amber-500/10 leading-none">💧</div>
                <span className="text-[7px] font-extrabold text-white/40 uppercase tracking-tight leading-none mt-1">Add Watermark</span>
              </div>
              <div className="bg-white/2 border border-white/5 p-2 rounded-lg flex flex-col items-center justify-center gap-1">
                <div className="text-[8px] font-black px-1 py-0.5 border border-rose-500/30 text-rose-400 rounded bg-rose-500/10 leading-none">FX</div>
                <span className="text-[7px] font-extrabold text-white/40 uppercase tracking-tight leading-none mt-1">Amazing Effects</span>
              </div>
              <div className="bg-white/2 border border-white/5 p-2 rounded-lg flex flex-col items-center justify-center gap-1">
                <Type className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span className="text-[7px] font-extrabold text-white/40 uppercase tracking-tight leading-none mt-1">Custom Style</span>
              </div>
              <div className="bg-white/2 border border-white/5 p-2 rounded-lg flex flex-col items-center justify-center gap-1">
                <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-[7px] font-extrabold text-white/40 uppercase tracking-tight leading-none mt-1">Fast & Powerful</span>
              </div>
            </div>

            {/* Bottom URL Link Ribbon */}
            <div className="border-t border-white/5 pt-4">
              <div className="bg-gradient-to-r from-[#10B981] via-[#FBBF24] to-[#EF4444] p-[1px] rounded-lg shadow-lg overflow-hidden">
                <div className="bg-[#09090C] py-2 px-3 text-center flex flex-col sm:flex-row items-center justify-center gap-2">
                  <span className="text-[10px] text-white/70 font-semibold">
                    Perfectly designed for use after our event camera.
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-white/40 text-[11px]">🌐</span>
                    <span className="text-xs font-black tracking-widest text-white font-mono bg-gradient-to-r from-emerald-400 via-amber-200 to-rose-400 bg-clip-text text-transparent">
                      eventcam.riddimroom.com
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Admin Panel Modal Overlay */}
      <AnimatePresence>
        {false && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-4xl bg-[#0F0F13] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* Header */}
              <div className="border-b border-white/5 bg-[#14141A] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">RiddimroomCaption Executive Command Center</h3>
                    <p className="text-[10px] text-white/40">Secure administrative operations, profile logs, security policies & live user control</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsAdminOpen(false);
                      handleGoogleLogout();
                    }}
                    className="py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                    title="Log Out Admin"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                  <button
                    onClick={() => setIsAdminOpen(false)}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {adminPanelError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{adminPanelError}</span>
                  </div>
                )}

                {!isAdminAuthenticated ? (
                  /* Password Verification Form */
                  <form onSubmit={handleAdminAuth} className="max-w-md mx-auto py-12 space-y-5 text-center">
                    <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20 mb-2">
                      <Lock className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-black text-white tracking-tight">Authorized Operations Gateway</h4>
                      <p className="text-xs text-white/40">Enter the system master administrative passcode to synchronize credentials and log telemetry.</p>
                    </div>
                    <div className="space-y-3 pt-2">
                      <input
                        type="password"
                        placeholder="Enter admin passcode..."
                        value={adminInputPassword}
                        onChange={(e) => setAdminInputPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-[#1A1A24] border border-white/10 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-all text-center tracking-widest"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/15 transition-all cursor-pointer active:scale-[0.98]"
                      >
                        Unlock System Console
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Admin Dashboard Interface */
                  <div className="space-y-5">
                    {/* Multi-Tab Command Navigation */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-white/5 pb-3">
                      <div className="flex flex-wrap gap-1 bg-[#14141A] p-1 rounded-xl border border-white/5 overflow-x-auto">
                        <button
                          onClick={() => setAdminActiveTab('dashboard')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            adminActiveTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-white/40 hover:text-white'
                          }`}
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>Telemetry</span>
                        </button>
                        <button
                          onClick={() => setAdminActiveTab('users')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            adminActiveTab === 'users' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-white/40 hover:text-white'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>User Control ({adminUsersList.length})</span>
                        </button>
                        <button
                          onClick={() => setAdminActiveTab('cms')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            adminActiveTab === 'cms' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-white/40 hover:text-white'
                          }`}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>CMS Editor</span>
                        </button>
                        <button
                          onClick={() => setAdminActiveTab('settings')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            adminActiveTab === 'settings' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-white/40 hover:text-white'
                          }`}
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>Platform Settings</span>
                        </button>
                        <button
                          onClick={() => setAdminActiveTab('security')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            adminActiveTab === 'security' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-white/40 hover:text-white'
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Security Policies</span>
                        </button>
                        <button
                          onClick={() => setAdminActiveTab('notifications')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            adminActiveTab === 'notifications' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-white/40 hover:text-white'
                          }`}
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>Announcements ({adminNotifications.length})</span>
                        </button>
                        <button
                          onClick={() => setAdminActiveTab('audit')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            adminActiveTab === 'audit' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' : 'text-white/40 hover:text-white'
                          }`}
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Audits ({adminAuditLogs.length})</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 self-end xl:self-auto">
                        <button
                          onClick={() => fetchAdminData()}
                          className="p-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl text-xs flex items-center gap-1.5 border border-white/5 transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Sync Data</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsAdminAuthenticated(false);
                          }}
                          className="px-3 py-2 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-semibold transition-all border border-red-500/10 cursor-pointer"
                        >
                          Lock Console
                        </button>
                      </div>
                    </div>

                    {/* Tab 1: TELEMETRY & SYSTEM ANALYTICS */}
                    {adminActiveTab === 'dashboard' && (
                      <div className="space-y-5">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-[#14141A] border border-white/5 p-4 rounded-xl flex flex-col justify-between space-y-2">
                            <span className="text-[10px] font-bold text-white/40 tracking-wider uppercase">Active Users</span>
                            <span className="text-xl font-black text-white">{adminUsersList.length}</span>
                            <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-semibold">
                              <span>↑ +12.4%</span>
                              <span className="text-white/20">this week</span>
                            </span>
                          </div>
                          <div className="bg-[#14141A] border border-white/5 p-4 rounded-xl flex flex-col justify-between space-y-2">
                            <span className="text-[10px] font-bold text-white/40 tracking-wider uppercase">Transcriptions</span>
                            <span className="text-xl font-black text-white">{adminLogsList.length}</span>
                            <span className="text-[9px] text-[#10B981] flex items-center gap-1 font-semibold">
                              <span className="animate-pulse">●</span>
                              <span>Live Engine</span>
                            </span>
                          </div>
                          <div className="bg-[#14141A] border border-white/5 p-4 rounded-xl flex flex-col justify-between space-y-2">
                            <span className="text-[10px] font-bold text-white/40 tracking-wider uppercase">Quotas Active</span>
                            <span className="text-xl font-black text-white">
                              {adminUsersList.filter(u => u.dailyCount > 0).length}
                            </span>
                            <span className="text-[9px] text-white/40 font-semibold">Standard 2-Limit policy</span>
                          </div>
                          <div className="bg-[#14141A] border border-white/5 p-4 rounded-xl flex flex-col justify-between space-y-2">
                            <span className="text-[10px] font-bold text-white/40 tracking-wider uppercase">MFA Compliance</span>
                            <span className="text-xl font-black text-indigo-400">
                              {editSecMultiFactor ? 'POLICIED' : 'OPTIONAL'}
                            </span>
                            <span className="text-[9px] text-white/40 font-semibold">Session length: {editSecSessionTimeout}m</span>
                          </div>
                        </div>

                        {/* Beautiful Visual SVG Graph */}
                        <div className="bg-[#14141A] border border-white/5 rounded-xl p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Historical API Volumetrics</h4>
                            <span className="text-[10px] text-white/40">Last 7 days sequence</span>
                          </div>
                          <div className="h-44 w-full flex items-end justify-between gap-1 pt-4 border-b border-white/5">
                            {Array.from({ length: 7 }).map((_, i) => {
                              // Generate beautiful responsive histogram blocks
                              const values = [12, 18, 15, 25, 32, 28, 45];
                              const heightPercent = `${(values[i] / 50) * 100}%`;
                              const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                              return (
                                <div key={i} className="flex-1 flex flex-col items-center group cursor-pointer h-full justify-end">
                                  <div className="text-[9px] text-indigo-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-mono">
                                    {values[i]}
                                  </div>
                                  <div 
                                    className="w-full bg-gradient-to-t from-indigo-600/20 to-indigo-500 hover:to-indigo-400 rounded-t-md transition-all duration-300" 
                                    style={{ height: heightPercent }}
                                  />
                                  <span className="text-[9px] text-white/30 mt-2 font-semibold tracking-wider font-mono">
                                    {days[i]}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: USER CONTROL */}
                    {adminActiveTab === 'users' && (
                      <div className="space-y-4">
                        {/* Controls Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              placeholder="Search users by name, email or uid..."
                              value={adminUsersSearch}
                              onChange={(e) => setAdminUsersSearch(e.target.value)}
                              className="w-full px-4 py-2 bg-[#14141A] border border-white/10 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-white/20 outline-none transition-all pl-10"
                            />
                            <Search className="w-4 h-4 text-white/35 absolute left-3.5 top-3" />
                          </div>

                          <button
                            onClick={() => {
                              setAdminSelectedUser({
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
                            className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add New User Account</span>
                          </button>
                        </div>

                        {/* Interactive Management Modal Overlay/Panel for Selected User */}
                        {adminSelectedUser && (
                          <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-xl space-y-4 relative">
                            <button 
                              onClick={() => setAdminSelectedUser(null)} 
                              className="absolute top-3 right-3 p-1 hover:bg-white/15 rounded-lg text-white/50 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            {adminSelectedUser.uid === 'NEW_USER' ? (
                              <div className="space-y-3">
                                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider">Manually Provision Account</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-white/50 uppercase">Name</label>
                                    <input 
                                      type="text" 
                                      placeholder="Full name"
                                      value={newUserDisplayName}
                                      onChange={(e) => setNewUserDisplayName(e.target.value)}
                                      className="w-full px-3 py-1.5 bg-[#14141A] border border-white/10 rounded-lg text-xs focus:border-indigo-500 focus:outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-white/50 uppercase">Email</label>
                                    <input 
                                      type="email" 
                                      placeholder="email@example.com"
                                      value={newUserEmail}
                                      onChange={(e) => setNewUserEmail(e.target.value)}
                                      className="w-full px-3 py-1.5 bg-[#14141A] border border-white/10 rounded-lg text-xs focus:border-indigo-500 focus:outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-white/50 uppercase">Password</label>
                                    <input 
                                      type="password" 
                                      placeholder="At least 6 chars"
                                      value={newUserPassword}
                                      onChange={(e) => setNewUserPassword(e.target.value)}
                                      className="w-full px-3 py-1.5 bg-[#14141A] border border-white/10 rounded-lg text-xs focus:border-indigo-500 focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center justify-between gap-3 pt-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-white/50 uppercase">System Role:</span>
                                    <select 
                                      value={newUserRole}
                                      onChange={(e: any) => setNewUserRole(e.target.value)}
                                      className="bg-[#14141A] border border-white/10 text-white rounded-lg px-2.5 py-1 text-xs"
                                    >
                                      <option value="user">Standard User</option>
                                      <option value="admin">Administrator</option>
                                    </select>
                                  </div>
                                  <button
                                    onClick={() => {
                                      handleAdminCreateUser({
                                        email: newUserEmail,
                                        password: newUserPassword,
                                        displayName: newUserDisplayName,
                                        role: newUserRole
                                      });
                                      setAdminSelectedUser(null);
                                    }}
                                    className="py-1.5 px-3 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-lg cursor-pointer"
                                  >
                                    Provision Core Account
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white">
                                    {adminSelectedUser.email?.[0]?.toUpperCase()}
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-white leading-none">{adminSelectedUser.displayName || 'No Name'}</h4>
                                    <span className="text-[10px] text-white/40">{adminSelectedUser.email} (UID: {adminSelectedUser.uid})</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-3">
                                  {/* Credentials management */}
                                  <div className="space-y-3">
                                    <span className="text-[10px] font-bold text-indigo-400 block uppercase tracking-wider">Credential Sovereignty</span>
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="password" 
                                        placeholder="Enter new master password..."
                                        value={changePassNewPassword}
                                        onChange={(e) => setChangePassNewPassword(e.target.value)}
                                        className="flex-1 px-3 py-1.5 bg-[#14141A] border border-white/10 rounded-lg text-xs text-white placeholder-white/20 focus:outline-none"
                                      />
                                      <button
                                        onClick={() => {
                                          handleAdminChangePassword(adminSelectedUser.uid, changePassNewPassword);
                                          setChangePassNewPassword('');
                                        }}
                                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg cursor-pointer shrink-0"
                                      >
                                        Change Password
                                      </button>
                                    </div>
                                  </div>

                                  {/* Session operations */}
                                  <div className="space-y-3">
                                    <span className="text-[10px] font-bold text-indigo-400 block uppercase tracking-wider">Active State Control</span>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleAdminForceLogout(adminSelectedUser.uid)}
                                        className="flex-1 py-1.5 px-3 bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all"
                                      >
                                        <LogOut className="w-3.5 h-3.5" />
                                        <span>Revoke Active Sessions</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Registered Users Table */}
                        <div className="border border-white/5 rounded-xl overflow-hidden bg-[#14141A]">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-white/2 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                  <th className="px-4 py-3 font-bold">User Identity</th>
                                  <th className="px-4 py-3 font-bold">Platform Role</th>
                                  <th className="px-4 py-3 font-bold">Limit State</th>
                                  <th className="px-4 py-3 font-bold">Auditable Usage</th>
                                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 text-xs text-white/80">
                                {adminUsersList.filter(usr => {
                                  const query = adminUsersSearch.toLowerCase().trim();
                                  if (!query) return true;
                                  const name = (usr.displayName || usr.name || '').toLowerCase();
                                  const email = (usr.email || '').toLowerCase();
                                  const uid = (usr.uid || '').toLowerCase();
                                  return name.includes(query) || email.includes(query) || uid.includes(query);
                                }).length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-white/30 font-sans">
                                      No registered users matched the active filters.
                                    </td>
                                  </tr>
                                ) : (
                                  adminUsersList.filter(usr => {
                                    const query = adminUsersSearch.toLowerCase().trim();
                                    if (!query) return true;
                                    const name = (usr.displayName || usr.name || '').toLowerCase();
                                    const email = (usr.email || '').toLowerCase();
                                    const uid = (usr.uid || '').toLowerCase();
                                    return name.includes(query) || email.includes(query) || uid.includes(query);
                                  }).map((usr: any) => (
                                    <tr key={usr.uid} className="hover:bg-white/2 transition-all">
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs uppercase">
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
                                      <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                          usr.role === 'admin' 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                                            : 'bg-white/5 text-white/60 border-white/5'
                                        }`}>
                                          {usr.role === 'admin' ? 'ADMINISTRATOR' : 'STANDARD'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 font-mono font-bold">
                                        <span className={usr.dailyCount >= editDefaultLimit ? 'text-red-400' : 'text-emerald-400'}>
                                          {usr.dailyCount || 0}
                                        </span>
                                        <span className="text-white/25"> / {editDefaultLimit}</span>
                                      </td>
                                      <td className="px-4 py-3 font-mono text-[11px] text-white/50">
                                        {usr.totalTranscribes || 0} total sequences
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          <button
                                            onClick={() => setAdminSelectedUser(usr)}
                                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-bold border border-white/5 transition-all"
                                          >
                                            Manage
                                          </button>
                                          <button
                                            onClick={() => handleAdminToggleStatus(usr.uid, !usr.disabled)}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                              usr.disabled 
                                                ? 'bg-red-500/10 hover:bg-red-500/25 border-red-500/20 text-red-400' 
                                                : 'bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/20 text-emerald-400'
                                            }`}
                                          >
                                            {usr.disabled ? 'App: Blocked' : 'App: Active'}
                                          </button>
                                          <button
                                            onClick={() => handleAdminResetLimit(usr.uid)}
                                            className="px-2 py-1 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg text-[10px] font-bold border border-indigo-500/10 transition-all"
                                            title="Clear usage quota to 0"
                                          >
                                            Reset Quota
                                          </button>
                                          <button
                                            onClick={() => handleAdminSetRole(usr.uid, usr.role === 'admin' ? 'user' : 'admin')}
                                            disabled={usr.email?.toLowerCase() === 'ramjitinvestments@gmail.com'}
                                            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-bold border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                          >
                                            {usr.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                                          </button>
                                          <button
                                            onClick={() => handleAdminDeleteUser(usr.uid)}
                                            disabled={usr.email?.toLowerCase() === 'ramjitinvestments@gmail.com'}
                                            className="p-1 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg border border-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
                      </div>
                    )}

                    {/* Tab 3: CMS CONTENT EDITOR */}
                    {adminActiveTab === 'cms' && (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAdminSaveCMS({
                            headline: editCmsHeadline,
                            subheadline: editCmsSubheadline,
                            themeColor: editCmsThemeColor,
                            presetStyles: editCmsPresetStyles
                          });
                        }} 
                        className="bg-[#14141A] border border-white/5 p-6 rounded-xl space-y-4 text-left"
                      >
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                          <Globe className="w-4 h-4 text-indigo-400" />
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">Interactive Public Landing CMS Configuration</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/50 block">Hero Title Heading</label>
                            <input 
                              type="text" 
                              value={editCmsHeadline}
                              onChange={(e) => setEditCmsHeadline(e.target.value)}
                              className="w-full px-4 py-2.5 bg-[#1A1A24] border border-white/10 focus:border-indigo-500 rounded-xl text-xs text-white"
                              placeholder="e.g. Dynamic Video Captions Creator"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/50 block">Hero Subheading Description</label>
                            <input 
                              type="text" 
                              value={editCmsSubheadline}
                              onChange={(e) => setEditCmsSubheadline(e.target.value)}
                              className="w-full px-4 py-2.5 bg-[#1A1A24] border border-white/10 focus:border-indigo-500 rounded-xl text-xs text-white"
                              placeholder="e.g. Professional speech sync technology"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/50 block">Branding Primary Accent Color</label>
                            <div className="flex gap-2">
                              <input 
                                type="color" 
                                value={editCmsThemeColor}
                                onChange={(e) => setEditCmsThemeColor(e.target.value)}
                                className="w-10 h-9 p-0.5 bg-[#1A1A24] border border-white/10 rounded-xl cursor-pointer shrink-0"
                              />
                              <input 
                                type="text" 
                                value={editCmsThemeColor}
                                onChange={(e) => setEditCmsThemeColor(e.target.value)}
                                className="w-full px-4 py-2 bg-[#1A1A24] border border-white/10 focus:border-indigo-500 rounded-xl text-xs text-white font-mono"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/50 block">Caption CSS Presets Definition</label>
                            <select 
                              value={editCmsPresetStyles}
                              onChange={(e) => setEditCmsPresetStyles(e.target.value)}
                              className="w-full px-4 py-2.5 bg-[#1A1A24] border border-white/10 focus:border-indigo-500 rounded-xl text-xs text-white"
                            >
                              <option value="karaoke">Subtle Karaoke Highlight</option>
                              <option value="brutalist">Bold Brutalist Outline</option>
                              <option value="classic">Minimal Center Subtitle</option>
                            </select>
                          </div>
                        </div>
                        <div className="pt-2">
                          <button
                            type="submit"
                            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-[0.98]"
                          >
                            Save CMS Configuration
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Tab 4: PLATFORM CONFIGURATION SETTINGS */}
                    {adminActiveTab === 'settings' && (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAdminSaveSettings({
                            maxFileSizeMb: editMaxFileSize,
                            defaultDailyQuota: editDefaultLimit,
                            registrationOpen: editRegistrationOpen,
                            maintenanceMode: editMaintenanceMode,
                            systemMessage: editSystemMessage
                          });
                        }} 
                        className="bg-[#14141A] border border-white/5 p-6 rounded-xl space-y-4 text-left"
                      >
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                          <Sliders className="w-4 h-4 text-indigo-400" />
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">System Operations Control Settings</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl border border-white/5">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-white">Enable Open Registration</span>
                              <p className="text-[10px] text-white/40">Toggle public accounts self-provisioning gate.</p>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={editRegistrationOpen}
                              onChange={(e) => setEditRegistrationOpen(e.target.checked)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl border border-white/5">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-white">System Maintenance Mode</span>
                              <p className="text-[10px] text-white/40">Lock down features for standard user interactions.</p>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={editMaintenanceMode}
                              onChange={(e) => setEditMaintenanceMode(e.target.checked)}
                              className="w-4 h-4 rounded text-red-600 focus:ring-0"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/50 block">Max Allowed Video Upload Size (MB)</label>
                            <input 
                              type="number" 
                              value={editMaxFileSize}
                              onChange={(e) => setEditMaxFileSize(parseInt(e.target.value) || 100)}
                              className="w-full px-4 py-2.5 bg-[#1A1A24] border border-white/10 rounded-xl text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/50 block">Default Daily Transcribe Quota Limit</label>
                            <input 
                              type="number" 
                              value={editDefaultLimit}
                              onChange={(e) => setEditDefaultLimit(parseInt(e.target.value) || 2)}
                              className="w-full px-4 py-2.5 bg-[#1A1A24] border border-white/10 rounded-xl text-xs text-white"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-white/50 block">System Maintenance Banner / Message Text</label>
                          <textarea 
                            value={editSystemMessage}
                            onChange={(e) => setEditSystemMessage(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 bg-[#1A1A24] border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                            placeholder="Announce maintenance periods or important updates..."
                          />
                        </div>
                        <div className="pt-2">
                          <button
                            type="submit"
                            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-[0.98]"
                          >
                            Save Platform Configuration
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Tab 5: SECURITY POLICIES */}
                    {adminActiveTab === 'security' && (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAdminSaveSecurity({
                            adminPasscode: editSecAdminPass,
                            maxLoginAttempts: editSecMaxAttempts,
                            sessionTimeoutMinutes: editSecSessionTimeout,
                            multiFactorEnforced: editSecMultiFactor
                          });
                        }} 
                        className="bg-[#14141A] border border-white/5 p-6 rounded-xl space-y-4 text-left"
                      >
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                          <Shield className="w-4 h-4 text-red-400" />
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">Advanced Cyber-Security Access Policies</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/50 block">System Administrator Master Passcode</label>
                            <input 
                              type="password" 
                              value={editSecAdminPass}
                              onChange={(e) => setEditSecAdminPass(e.target.value)}
                              className="w-full px-4 py-2.5 bg-[#1A1A24] border border-white/10 rounded-xl text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/50 block">Max Failed Access Block Attempts</label>
                            <input 
                              type="number" 
                              value={editSecMaxAttempts}
                              onChange={(e) => setEditSecMaxAttempts(parseInt(e.target.value) || 5)}
                              className="w-full px-4 py-2.5 bg-[#1A1A24] border border-white/10 rounded-xl text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/50 block">Session Expiration Token Lifetime (Minutes)</label>
                            <input 
                              type="number" 
                              value={editSecSessionTimeout}
                              onChange={(e) => setEditSecSessionTimeout(parseInt(e.target.value) || 30)}
                              className="w-full px-4 py-2.5 bg-[#1A1A24] border border-white/10 rounded-xl text-xs text-white"
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl border border-white/5 self-end h-[42px]">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-white">MFA Governance</span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={editSecMultiFactor}
                              onChange={(e) => setEditSecMultiFactor(e.target.checked)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
                            />
                          </div>
                        </div>

                        <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <button
                            type="submit"
                            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-[0.98]"
                          >
                            Update Security Policies
                          </button>

                          <button
                            type="button"
                            onClick={handleAdminForceLogoutAll}
                            className="py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-[0.98]"
                          >
                            Revoke ALL Active User Sessions
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Tab 6: ANNOUNCEMENTS / NOTIFICATIONS */}
                    {adminActiveTab === 'notifications' && (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAdminSendNotification({
                            title: notifTitle,
                            message: notifMessage,
                            type: notifType,
                            recipientType: notifRecipientType,
                            selectedUsers: notifSelectedUsers
                          });
                          setNotifTitle('');
                          setNotifMessage('');
                        }}
                        className="bg-[#14141A] border border-white/5 p-6 rounded-xl space-y-4 text-left"
                      >
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                          <Bell className="w-4 h-4 text-indigo-400" />
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">Send Universal Broadcast Alert Notification</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/50 block">Alert Banner Headline Title</label>
                            <input 
                              type="text" 
                              required
                              value={notifTitle}
                              onChange={(e) => setNotifTitle(e.target.value)}
                              className="w-full px-4 py-2.5 bg-[#1A1A24] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                              placeholder="e.g. Server Upgrade Scheduled"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/50 block">Notice visual variant</label>
                            <select 
                              value={notifType}
                              onChange={(e: any) => setNotifType(e.target.value)}
                              className="w-full px-4 py-2.5 bg-[#1A1A24] border border-white/10 rounded-xl text-xs text-white"
                            >
                              <option value="info">Information (Blue)</option>
                              <option value="success">Success Notice (Green)</option>
                              <option value="warning">System Warning (Amber)</option>
                              <option value="danger">High Severity Danger (Red)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/50 block">Recipient Classification</label>
                            <select 
                              value={notifRecipientType}
                              onChange={(e: any) => setNotifRecipientType(e.target.value)}
                              className="w-full px-4 py-2.5 bg-[#1A1A24] border border-white/10 rounded-xl text-xs text-white"
                            >
                              <option value="all">Every Connected Account (All)</option>
                              <option value="users">Standard Users Only</option>
                              <option value="admins">System Admins Only</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-white/50 block">Detailed Broadcast Message Text</label>
                          <textarea 
                            required
                            value={notifMessage}
                            onChange={(e) => setNotifMessage(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 bg-[#1A1A24] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                            placeholder="Add notification paragraph details here..."
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-[0.98]"
                          >
                            Dispatch Global Alert Notice
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Tab 7: SECURITY AUDIT TRAILS */}
                    {adminActiveTab === 'audit' && (
                      <div className="space-y-3">
                        <div className="border border-white/5 rounded-xl overflow-hidden bg-[#14141A]">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-white/2 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                  <th className="px-4 py-3 font-bold">System Timestamp</th>
                                  <th className="px-4 py-3 font-bold">Security Operation Action</th>
                                  <th className="px-4 py-3 font-bold">Details & Log State</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 text-[11px] text-white/70 font-mono">
                                {adminAuditLogs.length === 0 ? (
                                  <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center font-sans text-white/30">
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
                                        <td className="px-4 py-3 text-white/40">{timeStr}</td>
                                        <td className="px-4 py-3 text-indigo-400 font-bold uppercase tracking-wide">
                                          {log.action || 'OPERATION'}
                                        </td>
                                        <td className="px-4 py-3 text-white/75 font-sans leading-relaxed">
                                          <div className="font-bold font-sans text-white">
                                            {log.details || 'Executed administrative action'}
                                          </div>
                                          {log.email && (
                                            <div className="text-[10px] text-white/40 mt-0.5">
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
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Upload trigger logic element */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />
    </div>
    </ProtectedRoute>
  );
}
