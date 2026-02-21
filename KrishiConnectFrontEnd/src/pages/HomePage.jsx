import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Heart, MessageCircle, Share2, Bookmark, Search, Home, Users, Briefcase,
  MessageSquare, Bell, User, Settings, MoreHorizontal, TrendingUp, Droplet,
  Wind, X, Upload, Loader, Edit3, Award, MapPin, LinkIcon, Eye,
  ChevronDown, ChevronUp, Menu, ArrowRight, Plus, Flag, CheckCircle,
  AlertCircle, RefreshCw, Send, Image, FileText, Sparkles, HelpCircle, Languages
} from 'lucide-react';
import { postService } from '../services/post.service';
import { userService } from '../services/user.service';
import { authStore } from '../store/authStore';
import AIChatPanel from '../components/AIChatPanel';
import { useTranslatePost } from '../hooks/useTranslatePost';

// ============================================================================
// API: postService + userService; demo fallback for weather/market/news
// ============================================================================
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5005/api/v1';

const api = {
  fetchPosts: (page, limit, mode = 'recent') =>
    mode === 'trending' ? postService.getTrending(page, limit) : postService.getRecent(page, limit),
  likePost: (postId) => postService.toggleLike(postId),
  unlikePost: (postId) => postService.toggleLike(postId),
  savePost: (postId) => postService.toggleSave(postId),
  unsavePost: (postId) => postService.toggleSave(postId),
  sharePost: async (postId) => ({ shareUrl: postService.getShareUrl(postId) }),
  reportPost: async (postId, reason) => { await new Promise(r => setTimeout(r, 800)); return { success: true }; },
  fetchComments: (postId) => postService.getComments(postId),
  addComment: (postId, content) => postService.addComment(postId, content),
  fetchCurrentUser: async () => {
    const raw = await userService.getMe();
    return { user: raw };
  },
  fetchUserProfile: async (userId) => ({ user: await userService.getProfile(userId) }),
  followUser: (userId) => userService.followUser(userId),
  unfollowUser: (userId) => userService.unfollowUser(userId),
  updateProfile: async (userId, data) => ({ user: await userService.updateProfile(data) }),
  fetchWeather: async (city) => { await delay(700); return DEMO_WEATHER; },
  fetchMarketPrices: async () => { await delay(600); return { prices: DEMO_MARKET_PRICES }; },
  fetchNews: async () => { await delay(500); return { news: DEMO_NEWS }; },
};

// ============================================================================
// DEMO DATA
// ============================================================================
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const CURRENT_USER = {
  _id: 'current-user',
  name: 'Rajesh Kumar',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
  coverPhoto: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=300&fit=crop',
  headline: 'Organic Farmer | Wheat & Rice Specialist',
  location: 'Bijnor, Uttar Pradesh',
  bio: 'Passionate about sustainable agriculture and helping fellow farmers grow better crops.',
  followersCount: 2450, followingCount: 1203, postsCount: 48, savedCount: 156,
  verified: true, profileViewers: 60, postImpressions: 27,
  education: 'Agricultural Science Degree, IARI New Delhi',
  experience: '12 years in organic farming',
  website: 'www.krishiconnect.farm',
  joinedDate: 'Joined February 2022',
  connections: [
    { _id: 'u2', name: 'Priya Singh', role: 'Vegetable Farmer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
    { _id: 'u3', name: 'Amit Patel', role: 'Sugarcane Farmer', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop' },
  ],
};

const DEMO_POSTS = [
  {
    _id: 'post-1',
    author: { _id: 'u2', name: 'Priya Singh', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop', headline: 'Vegetable Farmer | Tomato Expert', verified: true },
    content: 'Just harvested 50 quintals of tomatoes this season! 🍅 The new drip irrigation technique really made a difference. Yield increased by 35%.',
    mediaUrl: 'https://images.unsplash.com/photo-1464454709131-ffd692591ee5?w=600&h=400&fit=crop',
    tags: ['Tomato', 'Irrigation'],
    likesCount: 342, commentsCount: 28, savedCount: 45, sharesCount: 12,
    isLiked: false, isSaved: false,
    createdAt: new Date(Date.now() - 2 * 36e5).toISOString(),
  },
  {
    _id: 'post-2',
    author: { _id: 'u3', name: 'Amit Patel', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', headline: 'Sugarcane Farmer | Consultant', verified: false },
    content: 'Attending the National Agricultural Conference in Delhi this week. Excited to network with farmers from across India! 🌾',
    mediaUrl: null, tags: ['Conference'],
    likesCount: 189, commentsCount: 16, savedCount: 32, sharesCount: 8,
    isLiked: true, isSaved: false,
    createdAt: new Date(Date.now() - 5 * 36e5).toISOString(),
  },
  {
    _id: 'post-3',
    author: { _id: 'u4', name: 'Neha Sharma', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop', headline: 'Rice Farmer | Women in Agriculture', verified: true },
    content: '🚨 New government subsidy scheme for micro-irrigation approved! Eligible farmers can now apply for 80% subsidy. Check your state agricultural department website for details.',
    mediaUrl: null, tags: ['Subsidy', 'Government'],
    likesCount: 523, commentsCount: 67, savedCount: 108, sharesCount: 34,
    isLiked: false, isSaved: true,
    createdAt: new Date(Date.now() - 8 * 36e5).toISOString(),
  },
];

const DEMO_COMMENTS = [
  { _id: 'c1', author: { _id: 'u5', name: 'Mohan Singh', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop' }, content: 'Amazing results! What irrigation system are you using?', createdAt: new Date(Date.now() - 30 * 60e3).toISOString() },
  { _id: 'c2', author: { _id: 'u6', name: 'Sunita Devi', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop' }, content: 'Congratulations! 🎉 Which variety of tomato gives best yield?', createdAt: new Date(Date.now() - 15 * 60e3).toISOString() },
];

const DEMO_WEATHER = { city: 'Bijnor, UP', temp: 28, condition: 'Partly Cloudy', humidity: 65, wind: 12, icon: '⛅', tip: 'Good day for irrigation ✅' };
const DEMO_MARKET_PRICES = [
  { crop: 'Wheat', price: 2150, unit: '₹/quintal', change: 2.3, trend: 'up' },
  { crop: 'Rice', price: 3420, unit: '₹/quintal', change: -1.2, trend: 'down' },
  { crop: 'Onion', price: 2890, unit: '₹/quintal', change: 5.8, trend: 'up' },
  { crop: 'Tomato', price: 1240, unit: '₹/quintal', change: -3.5, trend: 'down' },
  { crop: 'Soybean', price: 5120, unit: '₹/quintal', change: 1.5, trend: 'up' },
];
const DEMO_NEWS = [
  { _id: 'n1', title: 'Wheat Prices Rise 8% on Supply Concerns', source: 'AgriNews', publishedAt: new Date(Date.now() - 2 * 36e5).toISOString(), category: 'Market', url: '#' },
  { _id: 'n2', title: 'New Pest Control Guidelines for Monsoon Season', source: 'Ministry of Agriculture', publishedAt: new Date(Date.now() - 6 * 36e5).toISOString(), category: 'Advisory', url: '#' },
  { _id: 'n3', title: 'e-NAM Platform Expansion to 500 Markets', source: 'FarmingToday', publishedAt: new Date(Date.now() - 12 * 36e5).toISOString(), category: 'Technology', url: '#' },
  { _id: 'n4', title: 'Organic Farming Adoption Increased by 25%', source: 'GreenAg', publishedAt: new Date(Date.now() - 24 * 36e5).toISOString(), category: 'Sustainability', url: '#' },
  { _id: 'n5', title: 'Soil Health Card Reaches 10 Million Farmers', source: 'AgriNews', publishedAt: new Date(Date.now() - 36 * 36e5).toISOString(), category: 'Government', url: '#' },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const formatTimeAgo = (dateStr) => {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const formatNumber = (n) => {
  if (!n && n !== 0) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
};

const getNavigate = () => (path) => { window.location.href = path; };

// ============================================================================
// GLOBAL STYLES — injected once at top level
// ============================================================================
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,500;0,600;1,400&display=swap');

    *, *::before, *::after { box-sizing: border-box; }

    :root {
      --green-50: #f0fdf4;
      --green-100: #dcfce7;
      --green-200: #bbf7d0;
      --green-500: #22c55e;
      --green-600: #16a34a;
      --green-700: #15803d;
      --green-800: #166534;
      --gray-50: #f8fafc;
      --gray-100: #f1f5f9;
      --gray-200: #e2e8f0;
      --gray-400: #94a3b8;
      --gray-500: #64748b;
      --gray-600: #475569;
      --gray-700: #334155;
      --gray-800: #1e293b;
      --gray-900: #0f172a;
      --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.04);
      --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.04);
      --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04);
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --radius-xl: 20px;
      --radius-2xl: 24px;
    }

    body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--gray-50); }

    /* Smooth scrollbar */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--gray-200); border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--gray-400); }

    /* Animations */
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes heartPop {
      0%   { transform: scale(1); }
      40%  { transform: scale(1.35); }
      70%  { transform: scale(0.9); }
      100% { transform: scale(1); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes spinOnce {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    .anim-fade-slide  { animation: fadeSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .anim-scale-in    { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .anim-fade        { animation: fadeIn 0.25s ease both; }
    .heart-pop        { animation: heartPop 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
    .spin             { animation: spin 0.8s linear infinite; }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Shimmer skeleton */
    .skeleton {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.6s ease infinite;
      border-radius: 6px;
    }

    /* Focus rings */
    .focus-ring:focus-visible {
      outline: 2px solid var(--green-500);
      outline-offset: 2px;
    }

    /* Line clamp */
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Nav active indicator */
    .nav-active-bar {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 60%;
      background: var(--green-600);
      border-radius: 0 3px 3px 0;
    }

    /* Post card hover */
    .post-card { transition: box-shadow 0.2s ease, transform 0.2s ease; }
    .post-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-1px); }

    /* Button base */
    .btn { transition: all 0.15s ease; cursor: pointer; border: none; font-family: inherit; }
    .btn:active { transform: scale(0.97); }

    /* Card */
    .card {
      background: #ffffff;
      border: 1px solid #e8edf2;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-sm);
    }
    .dark .card {
      background: rgb(31 41 55);
      border-color: rgb(55 65 80);
      box-shadow: none;
    }

    /* Sidebar item */
    .sidebar-item { transition: background 0.15s ease, color 0.15s ease; }
    .sidebar-item:hover { background: var(--green-50); }

    /* Input */
    .input-base {
      font-family: 'Plus Jakarta Sans', sans-serif;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .input-base:focus {
      outline: none;
      border-color: var(--green-500) !important;
      box-shadow: 0 0 0 3px rgb(34 197 94 / 0.12);
    }

    /* Tag pill */
    .tag-pill {
      transition: background 0.12s ease, color 0.12s ease;
    }
    .tag-pill:hover { background: var(--green-100); color: var(--green-700); }

    /* Stat item hover */
    .stat-hover { transition: background 0.12s ease; }
    .stat-hover:hover { background: white; border-radius: 10px; }
    .dark .stat-hover:hover { background: rgb(55 65 80); }

    /* Action button */
    .action-btn { transition: background 0.12s ease, color 0.12s ease, transform 0.1s ease; }
    .action-btn:hover { background: var(--gray-100); }
    .action-btn:active { transform: scale(0.94); }

    /* Trend badge */
    .trend-up   { color: #16a34a; background: #dcfce7; }
    .trend-down { color: #dc2626; background: #fee2e2; }

    /* Weather card gradient */
    .weather-gradient {
      background: linear-gradient(135deg, #e0f7fa 0%, #f0fdf4 50%, #ecfdf5 100%);
    }
    .dark .weather-gradient {
      background: linear-gradient(135deg, rgb(30 58 138 / 0.3) 0%, rgb(22 101 52 / 0.25) 50%, rgb(6 95 70 / 0.3) 100%);
    }

    /* Composer bar prompt */
    .composer-prompt {
      transition: background 0.15s ease, box-shadow 0.15s ease;
    }
    .composer-prompt:hover {
      background: #f0fdf4;
      box-shadow: inset 0 0 0 1.5px var(--green-300);
    }
    .dark .composer-prompt:hover {
      background: rgb(22 101 52 / 0.2);
    }

    /* Profile cover overlay */
    .cover-overlay {
      background: linear-gradient(to bottom, transparent 40%, rgba(255,255,255,0.8) 100%);
    }

    /* Mobile nav indicator dot */
    .mobile-nav-dot {
      position: absolute;
      top: 2px; right: 6px;
      width: 8px; height: 8px;
      background: #ef4444;
      border-radius: 50%;
      border: 2px solid white;
    }

    /* Dropdown shadow */
    .dropdown-shadow {
      box-shadow: 0 8px 30px rgb(0 0 0 / 0.12), 0 2px 8px rgb(0 0 0 / 0.06);
    }
  `}</style>
);

// ============================================================================
// SKELETON LOADERS
// ============================================================================
const PostSkeleton = () => (
  <div className="card p-5 mb-3" style={{ animation: 'fadeIn 0.3s ease' }}>
    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 2 }}>
        <div className="skeleton" style={{ height: 13, width: '38%' }} />
        <div className="skeleton" style={{ height: 11, width: '55%' }} />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
      <div className="skeleton" style={{ height: 11 }} />
      <div className="skeleton" style={{ height: 11, width: '88%' }} />
      <div className="skeleton" style={{ height: 11, width: '70%' }} />
    </div>
    <div className="skeleton" style={{ height: 200, borderRadius: 12, marginBottom: 14 }} />
    <div style={{ display: 'flex', gap: 8 }}>
      {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 36, flex: 1, borderRadius: 10 }} />)}
    </div>
  </div>
);

const CardSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
    <div className="skeleton" style={{ height: 13, width: '70%' }} />
    <div className="skeleton" style={{ height: 11 }} />
    <div className="skeleton" style={{ height: 11, width: '55%' }} />
  </div>
);

// ============================================================================
// TOAST
// ============================================================================
const Toast = ({ message, type = 'success', onDismiss }) => (
  <div className="anim-fade-slide" style={{
    position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)',
    zIndex: 200, display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 18px', borderRadius: 14,
    background: type === 'success' ? '#15803d' : '#dc2626',
    color: 'white', fontSize: 13, fontWeight: 600,
    boxShadow: '0 8px 32px rgb(0 0 0 / 0.2)',
    whiteSpace: 'nowrap',
  }}>
    {type === 'success'
      ? <CheckCircle size={15} />
      : <AlertCircle size={15} />}
    {message}
    <button onClick={onDismiss} className="btn" style={{
      marginLeft: 6, opacity: 0.7, display: 'flex', alignItems: 'center',
      background: 'none', color: 'white', padding: 2,
    }}>
      <X size={13} />
    </button>
  </div>
);

// ============================================================================
// REPORT MODAL
// ============================================================================
const REPORT_REASONS = [
  'Spam or misleading', 'Inappropriate content', 'Harassment or bullying',
  'False information', 'Violates community guidelines', 'Other',
];

const ReportModal = ({ postId, onClose }) => {
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await api.reportPost(postId, selected);
      setDone(true);
      setTimeout(onClose, 1500);
    } catch { } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgb(0 0 0 / 0.55)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 100, padding: 16,
    }}>
      <div className="anim-scale-in" style={{
        background: 'white', borderRadius: 20, maxWidth: 440, width: '100%',
        boxShadow: '0 24px 48px rgb(0 0 0 / 0.18)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid #f1f5f9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ padding: 7, background: '#fee2e2', borderRadius: 10 }}>
              <Flag size={16} style={{ color: '#dc2626' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Report Post</span>
          </div>
          <button onClick={onClose} className="btn" style={{
            padding: 8, background: '#f8fafc', borderRadius: 10, color: '#64748b',
            display: 'flex', alignItems: 'center',
          }}>
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, background: '#dcfce7', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <CheckCircle size={28} style={{ color: '#16a34a' }} />
            </div>
            <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>Report submitted</p>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 5 }}>We'll review this post shortly.</p>
          </div>
        ) : (
          <>
            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>Why are you reporting this post?</p>
              {REPORT_REASONS.map((reason) => (
                <label key={reason} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                  borderRadius: 12, cursor: 'pointer',
                  border: `1.5px solid ${selected === reason ? '#86efac' : '#e2e8f0'}`,
                  background: selected === reason ? '#f0fdf4' : 'white',
                  transition: 'all 0.15s ease',
                }}>
                  <input type="radio" name="reason" value={reason}
                    checked={selected === reason} onChange={() => setSelected(reason)}
                    style={{ accentColor: '#16a34a' }} />
                  <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{reason}</span>
                </label>
              ))}
            </div>
            <div style={{
              padding: '16px 22px', borderTop: '1px solid #f1f5f9',
              display: 'flex', gap: 10,
            }}>
              <button onClick={onClose} className="btn" style={{
                flex: 1, padding: '11px 0', border: '1.5px solid #e2e8f0',
                borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#475569',
                background: 'white',
              }}>Cancel</button>
              <button onClick={handleSubmit} disabled={!selected || loading} className="btn" style={{
                flex: 1, padding: '11px 0', background: '#dc2626', color: 'white',
                borderRadius: 12, fontSize: 13, fontWeight: 600,
                opacity: (!selected || loading) ? 0.45 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}>
                {loading ? <Loader size={14} className="spin" /> : <Flag size={14} />}
                Submit Report
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// POST COMPOSER MODAL
// ============================================================================
const AVAILABLE_TAGS = ['Wheat', 'Rice', 'Vegetables', 'Organic', 'Irrigation', 'Pesticides', 'Fertilizers', 'Weather', 'Subsidy'];

const PostComposerModal = ({ user, onClose, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const toggleTag = (tag) => setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setMediaFiles(prev => [...prev, ...files].slice(0, 10));
    const readers = files.map(f => {
      const r = new FileReader();
      r.onload = (ev) => setSelectedImages(prev => [...prev, ev.target.result]);
      r.readAsDataURL(f);
      return r;
    });
  };

  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      if (tags.length) formData.append('tags', JSON.stringify(tags));
      mediaFiles.forEach((file) => formData.append('media', file));
      const { post, postsCount } = await postService.createPost(formData);
      onPostCreated(post, postsCount);
      onClose();
    } catch (err) {
      console.error('Create post failed', err);
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgb(0 0 0 / 0.55)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 100, padding: 16,
    }}>
      <div className="anim-scale-in" style={{
        background: 'white', borderRadius: 22, maxWidth: 640, width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 48px rgb(0 0 0 / 0.18)',
      }}>
        {/* Header */}
        <div style={{
          position: 'sticky', top: 0, background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid #f1f5f9',
          borderRadius: '22px 22px 0 0', zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={user?.profilePhoto?.url ?? user?.avatar?.url ?? user?.avatar} alt={user?.name} style={{
              width: 42, height: 42, borderRadius: '50%', objectFit: 'cover',
              border: '2px solid #dcfce7',
            }} />
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{user.name}</p>
              <p style={{ fontSize: 12, color: '#64748b' }}>{user.headline}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn" style={{
            padding: 8, background: '#f8fafc', borderRadius: 10,
            color: '#64748b', display: 'flex', alignItems: 'center',
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px' }}>
          <textarea
            autoFocus value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="Share your farming insights, experiences, or tips with fellow farmers..."
            className="input-base"
            style={{
              width: '100%', height: 144, padding: '14px 16px',
              fontSize: 14, color: '#0f172a',
              border: '1.5px solid #e2e8f0', borderRadius: 14,
              resize: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif',
              lineHeight: 1.6,
            }}
          />

          {selectedImages.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {selectedImages.map((src, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0', width: 120, height: 120 }}>
                  <img src={src} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <button type="button" onClick={() => removeMedia(i)} className="btn" style={{
                    position: 'absolute', top: 4, right: 4,
                    background: 'rgb(0 0 0 / 0.65)', color: 'white',
                    padding: 4, borderRadius: 8, display: 'flex', alignItems: 'center',
                  }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Tags</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {AVAILABLE_TAGS.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)} className="btn tag-pill" style={{
                  padding: '6px 13px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                  border: tags.includes(tag) ? 'none' : '1.5px solid #e2e8f0',
                  background: tags.includes(tag) ? '#16a34a' : 'white',
                  color: tags.includes(tag) ? 'white' : '#475569',
                }}>
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Media actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 18, paddingTop: 18, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={() => fileInputRef.current?.click()} className="btn" style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10,
              fontSize: 13, fontWeight: 600, color: '#475569',
              background: 'white', transition: 'all 0.15s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = '#86efac'; e.currentTarget.style.color = '#15803d'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
            >
              <Image size={15} /> Photo
            </button>
            <button className="btn" style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10,
              fontSize: 13, fontWeight: 600, color: '#475569', background: 'white',
              transition: 'all 0.15s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.color = '#1d4ed8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
            >
              <FileText size={15} /> Article
            </button>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleMediaChange} />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          position: 'sticky', bottom: 0, background: '#f8fafc',
          padding: '16px 22px', borderTop: '1px solid #f1f5f9',
          display: 'flex', gap: 10, borderRadius: '0 0 22px 22px',
        }}>
          <button onClick={onClose} className="btn" style={{
            flex: 1, padding: '11px 0', border: '1.5px solid #e2e8f0',
            color: '#475569', borderRadius: 12, fontSize: 13, fontWeight: 600,
            background: 'white',
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={(!content.trim() && mediaFiles.length === 0) || loading} className="btn" style={{
            flex: 1, padding: '11px 0',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: 'white', borderRadius: 12, fontSize: 13, fontWeight: 700,
            opacity: ((!content.trim() && mediaFiles.length === 0) || loading) ? 0.45 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            boxShadow: (content.trim() || mediaFiles.length > 0) ? '0 4px 12px rgb(22 163 74 / 0.35)' : 'none',
          }}>
            {loading ? <Loader size={14} className="spin" /> : <Plus size={14} />}
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EDIT PROFILE MODAL
// ============================================================================
const EditProfileModal = ({ user, onClose, onUpdated }) => {
  const [form, setForm] = useState({
    name: user.name, headline: user.headline, bio: user.bio || '',
    location: user.location || '', website: user.website || '',
    education: user.education || '', experience: user.experience || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { user: updated } = await api.updateProfile(user._id, form);
      onUpdated(updated); onClose();
    } catch { } finally { setLoading(false); }
  };

  const fields = [
    { label: 'Full Name', key: 'name', type: 'text' },
    { label: 'Headline', key: 'headline', type: 'text' },
    { label: 'Location', key: 'location', type: 'text' },
    { label: 'Website', key: 'website', type: 'url' },
    { label: 'Education', key: 'education', type: 'text' },
    { label: 'Experience', key: 'experience', type: 'text' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgb(0 0 0 / 0.55)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 100, padding: 16,
    }}>
      <div className="anim-scale-in" style={{
        background: 'white', borderRadius: 22, maxWidth: 500, width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 48px rgb(0 0 0 / 0.18)',
      }}>
        <div style={{
          position: 'sticky', top: 0, background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid #f1f5f9',
          borderRadius: '22px 22px 0 0',
        }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Edit Profile</span>
          <button onClick={onClose} className="btn" style={{
            padding: 8, background: '#f8fafc', borderRadius: 10,
            color: '#64748b', display: 'flex', alignItems: 'center',
          }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {fields.map(({ label, key, type }) => (
            <div key={key}>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
              }}>{label}</label>
              <input type={type} value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                className="input-base"
                style={{
                  width: '100%', padding: '10px 14px', fontSize: 13,
                  border: '1.5px solid #e2e8f0', borderRadius: 12,
                  fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#1e293b',
                }}
              />
            </div>
          ))}
          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
            }}>Bio</label>
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              rows={3} className="input-base"
              style={{
                width: '100%', padding: '10px 14px', fontSize: 13,
                border: '1.5px solid #e2e8f0', borderRadius: 12,
                resize: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#1e293b',
              }}
            />
          </div>
        </div>

        <div style={{
          position: 'sticky', bottom: 0, background: '#f8fafc',
          padding: '16px 22px', borderTop: '1px solid #f1f5f9',
          display: 'flex', gap: 10, borderRadius: '0 0 22px 22px',
        }}>
          <button onClick={onClose} className="btn" style={{
            flex: 1, padding: '11px 0', border: '1.5px solid #e2e8f0',
            color: '#475569', borderRadius: 12, fontSize: 13, fontWeight: 600, background: 'white',
          }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} className="btn" style={{
            flex: 1, padding: '11px 0',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: 'white', borderRadius: 12, fontSize: 13, fontWeight: 700,
            opacity: loading ? 0.5 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            boxShadow: '0 4px 12px rgb(22 163 74 / 0.3)',
          }}>
            {loading ? <Loader size={14} className="spin" /> : null}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMMENTS SECTION
// ============================================================================
const CommentsSection = ({ postId, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { comments: data } = await api.fetchComments(postId);
        setComments(Array.isArray(data) ? data : []);
      } catch { setComments([]); } finally { setLoading(false); }
    })();
  }, [postId]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    const optimistic = {
      _id: `c-opt-${Date.now()}`,
      author: { _id: currentUser._id, name: currentUser.name || 'You', avatar: currentUser?.profilePhoto?.url ?? currentUser?.avatar?.url ?? currentUser?.avatar },
      content: text, createdAt: new Date().toISOString(),
    };
    setComments(prev => [optimistic, ...prev]);
    setText('');
    try {
      const { comment } = await api.addComment(postId, text.trim());
      setComments(prev => prev.map(c => c._id === optimistic._id ? (comment || optimistic) : c));
    } catch { setComments(prev => prev.filter(c => c._id !== optimistic._id)); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, marginTop: 4 }}>
      {/* Comment input */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <img src={currentUser.avatar} alt="you" style={{
          width: 34, height: 34, borderRadius: '50%', objectFit: 'cover',
          flexShrink: 0, border: '2px solid #dcfce7',
        }} />
        <div style={{ flex: 1, display: 'flex', gap: 8 }}>
          <input type="text" value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder="Write a comment..."
            className="input-base"
            style={{
              flex: 1, background: '#f8fafc', padding: '9px 16px',
              borderRadius: 99, fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif',
              border: '1.5px solid #e8edf2', color: '#1e293b',
            }}
          />
          <button onClick={handleSubmit} disabled={!text.trim() || submitting} className="btn" style={{
            padding: 9, background: '#16a34a', color: 'white', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: (!text.trim() || submitting) ? 0.4 : 1,
            flexShrink: 0, width: 36, height: 36,
          }}>
            {submitting ? <Loader size={14} className="spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>

      {/* Comment list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : comments.length === 0 ? (
        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>
          No comments yet. Be the first!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 240, overflowY: 'auto', paddingRight: 4 }}>
          {comments.map(c => (
            <div key={c._id} style={{ display: 'flex', gap: 10 }}>
              <img src={c.author.avatar} alt={c.author.name}
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, cursor: 'pointer' }}
                onClick={() => navigate(`/profile/${c.author._id}`)} />
              <div style={{ flex: 1, background: '#f8fafc', borderRadius: 14, padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
                    onClick={() => navigate(`/profile/${c.author._id}`)}>
                    {c.author.name}
                  </span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{formatTimeAgo(c.createdAt)}</span>
                </div>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.55 }}>{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// POST CARD
// ============================================================================
const PostCard = memo(({ post, currentUser, onPostUpdate, onPostDeleted }) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post?.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post?.likesCount ?? 0);
  const [saved, setSaved] = useState(post?.isSaved ?? false);
  const [savedCount, setSavedCount] = useState(post?.savedCount ?? 0);
  const [sharesCount, setSharesCount] = useState(post?.sharesCount ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Defensive: do not render if post or author is missing (e.g. deleted user, API inconsistency)
  if (!post || !post.author) return null;

  const handleLike = async () => {
    if (!post?._id) return;
    const next = !liked;
    setLiked(next); setLikeAnim(next);
    setLikesCount(c => next ? c + 1 : c - 1);
    if (next) setTimeout(() => setLikeAnim(false), 400);
    try {
      const res = await api.likePost(post._id);
      if (res?.likesCount != null) setLikesCount(res.likesCount);
      if (typeof res?.liked === 'boolean') setLiked(res.liked);
    } catch { setLiked(!next); setLikesCount(c => next ? c - 1 : c + 1); }
  };

  const handleSave = async () => {
    if (!post?._id) return;
    const next = !saved; setSaved(next); setSavedCount(c => next ? c + 1 : c - 1);
    try {
      const res = await api.savePost(post._id);
      if (res?.savedCount != null) setSavedCount(res.savedCount);
      if (typeof res?.saved === 'boolean') setSaved(res.saved);
    } catch { setSaved(!next); setSavedCount(c => next ? c - 1 : c + 1); }
  };

  const handleShare = async () => {
    if (!post?._id) return;
    try {
      const { shareUrl } = await api.sharePost(post._id);
      setSharesCount(c => c + 1);
      if (navigator.clipboard) await navigator.clipboard.writeText(shareUrl);
      if (navigator.share) await navigator.share({ title: 'KrishiConnect Post', url: shareUrl });
    } catch { }
  };

  const handleFollow = async () => {
    if (!post?.author?._id) return;
    setFollowLoading(true);
    try {
      if (isFollowing) await api.unfollowUser(post.author._id);
      else await api.followUser(post.author._id);
      setIsFollowing(!isFollowing);
    } catch { } finally { setFollowLoading(false); }
    setShowDropdown(false);
  };

  const content = post?.content ?? '';
  const isLong = content.length > 180;
  const displayContent = isLong && !showMore ? content.slice(0, 180) + '…' : content;
  const isOwn = post?.author?._id === currentUser?._id;

  const { t } = useTranslation();
  const {
    translatedText,
    loading: translateLoading,
    error: translateError,
    translate,
    showTranslated,
    setShowTranslated,
    toggleView,
  } = useTranslatePost(content);

  const isLongTranslated = translatedText && translatedText.length > 180;
  const displayTranslated =
    showTranslated && translatedText
      ? isLongTranslated && !showMore
        ? translatedText.slice(0, 180) + '…'
        : translatedText
      : '';
  const bodyToShow =
    showTranslated && translatedText ? displayTranslated : displayContent;

  return (
    <>
      {showReportModal && <ReportModal postId={post._id} onClose={() => setShowReportModal(false)} />}

      <article className="card post-card anim-fade-slide bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-none transition-colors duration-200" style={{ marginBottom: 12, overflow: 'hidden' }}>
        {/* Post Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px 12px' }}>
          <img src={post.author.avatar} alt={post.author.name}
            style={{
              width: 44, height: 44, borderRadius: '50%', objectFit: 'cover',
              flexShrink: 0, cursor: 'pointer', border: '2px solid #dcfce7',
              transition: 'transform 0.2s ease',
            }}
            onClick={() => navigate(`/profile/${post.author._id}`)}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate(`/profile/${post.author._id}`)}
                className="btn font-bold text-gray-900 dark:text-gray-100 text-sm bg-transparent p-0 transition-colors hover:text-green-600 dark:hover:text-green-400"
              >
                {post.author.name}
              </button>
              {post.author.verified && (
                <span title={t('post.verified')} style={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle size={14} fill="#3b82f6" color="white" />
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 1.4 }}>{post.author.headline}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{formatTimeAgo(post.createdAt)}</p>
          </div>

          {/* Dropdown */}
          <div style={{ position: 'relative', flexShrink: 0 }} ref={dropRef}>
            <button onClick={() => setShowDropdown(!showDropdown)} className="btn" style={{
              padding: 7, borderRadius: 10, color: '#94a3b8',
              background: showDropdown ? '#f1f5f9' : 'transparent',
              display: 'flex', alignItems: 'center', transition: 'all 0.15s ease',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => { if (!showDropdown) e.currentTarget.style.background = 'transparent'; }}
            >
              <MoreHorizontal size={18} />
            </button>
            {showDropdown && (
              <div className="anim-scale-in dropdown-shadow" style={{
                position: 'absolute', right: 0, top: 38,
                background: 'white', borderRadius: 14, width: 196, zIndex: 30,
                border: '1px solid #f1f5f9', overflow: 'hidden',
              }}>
                {!isOwn && (
                  <button onClick={handleFollow} disabled={followLoading} className="btn" style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#334155',
                    background: 'none', textAlign: 'left', transition: 'background 0.12s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    {followLoading ? <Loader size={14} className="spin" /> : <Users size={14} />}
                    {isFollowing ? t('post.unfollow') : t('post.follow')} {post.author.name.split(' ')[0]}
                  </button>
                )}
                {isOwn && onPostDeleted && (
                  <button onClick={async () => {
                    setShowDropdown(false);
                    setDeleteLoading(true);
                    try {
                      const { postsCount } = await postService.deletePost(post._id);
                      onPostDeleted(post._id, postsCount);
                      const u = authStore.getState().user;
                      if (u) authStore.setUser({ ...u, stats: { ...(u.stats || {}), postsCount } });
                    } catch (err) { console.error(err); }
                    finally { setDeleteLoading(false); }
                  }} disabled={deleteLoading} className="btn" style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#dc2626',
                    background: 'none', textAlign: 'left', transition: 'background 0.12s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    {deleteLoading ? <Loader size={14} className="spin" /> : <X size={14} />}
                    {t('post.deletePost')}
                  </button>
                )}
                <button onClick={() => { setShowDropdown(false); setShowReportModal(true); }} className="btn" style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                  padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#dc2626',
                  background: 'none', textAlign: 'left', transition: 'background 0.12s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <Flag size={14} /> {t('post.reportPost')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '0 20px 14px' }}>
          <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.65 }}>
            {bodyToShow}
            {(isLong && !showTranslated) || (showTranslated && isLongTranslated) ? (
              <button onClick={() => setShowMore(!showMore)} className="btn" style={{
                color: '#16a34a', fontWeight: 600, fontSize: 13,
                background: 'none', marginLeft: 5, padding: 0,
              }}>
                {showMore ? t('post.showLess') : t('post.more')}
              </button>
            ) : null}
          </p>
          {content.trim() && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {!translatedText ? (
                <button
                  type="button"
                  onClick={translate}
                  disabled={translateLoading}
                  className="btn"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 12, color: '#16a34a', fontWeight: 600,
                    background: '#f0fdf4', padding: '4px 10px', borderRadius: 8,
                    border: '1px solid #dcfce7',
                  }}
                >
                  {translateLoading ? <Loader size={12} className="animate-spin" /> : <Languages size={12} />}
                  {translateLoading ? t('post.translating') : t('post.translate')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={toggleView}
                  className="btn"
                  style={{
                    fontSize: 12, color: '#16a34a', fontWeight: 600,
                    background: 'none', padding: '4px 0', border: 'none',
                  }}
                >
                  {showTranslated ? t('post.showOriginal') : t('post.showTranslated')}
                </button>
              )}
              {translateError && (
                <span style={{ fontSize: 11, color: '#dc2626' }}>{t('post.translationFailed')}</span>
              )}
            </div>
          )}

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {post.tags.map(tag => (
                <span key={tag} className="tag-pill" style={{
                  fontSize: 12, color: '#16a34a', background: '#f0fdf4',
                  padding: '3px 10px', borderRadius: 99, fontWeight: 600,
                  cursor: 'pointer', border: '1px solid #dcfce7',
                }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Media */}
        {post.media?.length > 0 && (
          <div style={{ padding: '0 20px 14px' }}>
            {post.media[0].type === 'video' ? (
              <video src={post.media[0].url} controls style={{
                width: '100%', borderRadius: 14, maxHeight: 380, display: 'block',
                border: '1px solid #f1f5f9',
              }} />
            ) : (
              <img src={post.media[0].url} alt="Post media" style={{
                width: '100%', borderRadius: 14, objectFit: 'cover',
                maxHeight: 380, cursor: 'pointer', display: 'block',
                border: '1px solid #f1f5f9', transition: 'opacity 0.2s ease',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.93'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              />
            )}
          </div>
        )}

        {/* Stats bar */}
        <div style={{
          padding: '0 20px 10px',
          display: 'flex', alignItems: 'center', gap: 16,
          fontSize: 12, color: '#94a3b8',
        }}>
          <button className="btn" style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', color: '#94a3b8', padding: 0, fontSize: 12,
            transition: 'color 0.15s ease',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#16a34a'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >
            <Heart size={12} style={{ color: liked ? '#ef4444' : 'inherit' }} fill={liked ? '#ef4444' : 'none'} />
            <span>{formatNumber(likesCount)}</span>
          </button>
          <button className="btn" style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', color: '#94a3b8', padding: 0, fontSize: 12,
            transition: 'color 0.15s ease',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#16a34a'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle size={12} />
            <span>{formatNumber(post.commentsCount)}</span>
          </button>
          <button className="btn" style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', color: '#94a3b8', padding: 0, fontSize: 12,
            transition: 'color 0.15s ease',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#16a34a'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >
            <Bookmark size={12} style={{ color: saved ? '#16a34a' : 'inherit' }} fill={saved ? '#16a34a' : 'none'} />
            <span>{formatNumber(savedCount)}</span>
          </button>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Share2 size={12} />
            {formatNumber(sharesCount)}
          </span>
        </div>

        {/* Divider */}
        <div style={{ margin: '0 20px', height: 1, background: '#f1f5f9' }} />

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '4px 8px' }}>
          {[
            {
              label: 'Like', icon: Heart,
              active: liked, activeColor: '#ef4444', activeBg: '#fff5f5',
              iconProps: { fill: liked ? '#ef4444' : 'none', style: likeAnim ? { animation: 'heartPop 0.4s ease' } : {} },
              onClick: handleLike,
            },
            {
              label: 'Comment', icon: MessageCircle,
              active: showComments, activeColor: '#16a34a', activeBg: '#f0fdf4',
              onClick: () => setShowComments(!showComments),
            },
            {
              label: 'Share', icon: Share2,
              active: false, activeColor: '#16a34a', activeBg: '#f0fdf4',
              onClick: handleShare,
            },
            {
              label: 'Save', icon: Bookmark,
              active: saved, activeColor: '#16a34a', activeBg: '#f0fdf4',
              iconProps: { fill: saved ? '#16a34a' : 'none' },
              onClick: handleSave,
            },
          ].map(({ label, icon: Icon, active, activeColor, activeBg, iconProps = {}, onClick }) => (
            <button key={label} onClick={onClick} className="btn action-btn" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 0', borderRadius: 12, fontSize: 12, fontWeight: 600,
              color: active ? activeColor : '#64748b',
              background: active ? activeBg : 'transparent',
            }}>
              <Icon size={16} {...iconProps} />
              <span className="hidden sm:inline" style={{ fontSize: 12 }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Comments */}
        {showComments && (
          <div style={{ padding: '0 20px 18px' }}>
            <CommentsSection postId={post._id} currentUser={currentUser} />
          </div>
        )}
      </article>
    </>
  );
});

// ============================================================================
// COMPACT PROFILE CARD (Left panel)
// ============================================================================
const CompactProfileCard = ({ user, onEditProfile }) => {
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  if (!user) return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 80 }} />
      <div style={{ padding: '48px 18px 18px', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <div className="skeleton" style={{ height: 14, width: '55%' }} />
        <div className="skeleton" style={{ height: 11, width: '70%' }} />
      </div>
    </div>
  );

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Cover */}
      <div style={{ position: 'relative', height: 80, overflow: 'hidden', cursor: 'pointer' }}
        onClick={() => navigate(`/profile/${user._id}`)}>
        <img src={user.coverPhoto} alt="cover" style={{
          width: '100%', height: '100%', objectFit: 'cover',
          transition: 'transform 0.5s ease',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        />
        <div className="cover-overlay" style={{ position: 'absolute', inset: 0 }} />
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: -28, marginBottom: 10 }}>
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate(`/profile/${user._id}`)}>
          <img src={user.avatar} alt={user.name} style={{
            width: 56, height: 56, borderRadius: '50%',
            border: '3px solid white', objectFit: 'cover',
            boxShadow: '0 4px 14px rgb(0 0 0 / 0.12)',
          }} />
          {user.verified && (
            <div style={{
              position: 'absolute', bottom: 0, right: -1,
              background: '#3b82f6', borderRadius: '50%', padding: 2,
              border: '2px solid white', display: 'flex', alignItems: 'center',
            }}>
              <CheckCircle size={10} fill="white" color="#3b82f6" />
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '0 16px 16px', textAlign: 'center' }}>
        <button onClick={() => navigate(`/profile/${user._id}`)} className="btn" style={{
          background: 'none', padding: 0, fontWeight: 700, fontSize: 14,
          color: '#0f172a', transition: 'color 0.15s ease',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#16a34a'}
          onMouseLeave={e => e.currentTarget.style.color = '#0f172a'}
        >{user.name}</button>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 3, lineHeight: 1.45 }}>{user.headline}</p>
        {user.location && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 6 }}>
            <MapPin size={11} style={{ color: '#94a3b8' }} />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{user.location}</span>
          </div>
        )}

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6,
          marginTop: 14, padding: 10, background: '#f0fdf4', borderRadius: 14,
        }}>
          {[
            { label: 'Followers', value: formatNumber(user.followersCount) },
            { label: 'Following', value: formatNumber(user.followingCount) },
            { label: 'Posts', value: user.postsCount },
            { label: 'Saved', value: formatNumber(user.savedCount) },
          ].map(({ label, value }) => (
            <div key={label} className="stat-hover" style={{ textAlign: 'center', padding: '6px 4px', cursor: 'pointer' }}>
              <p style={{ fontWeight: 800, fontSize: 14, color: '#15803d' }}>{value}</p>
              <p style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Activity */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6,
          padding: '12px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', marginTop: 12,
        }}>
          {[
            { icon: Eye, value: user.profileViewers, label: 'Profile views' },
            { icon: TrendingUp, value: user.postImpressions, label: 'Impressions' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '6px 8px', borderRadius: 10, cursor: 'pointer',
              transition: 'background 0.12s ease',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ padding: 6, background: '#dcfce7', borderRadius: 8 }}>
                <Icon size={12} style={{ color: '#16a34a' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 700, fontSize: 12, color: '#15803d' }}>{value}</p>
                <p style={{ fontSize: 10, color: '#94a3b8' }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 12 }}>
          <button onClick={onEditProfile} className="btn" style={{
            width: '100%', padding: '9px 0',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: 'white', borderRadius: 11, fontSize: 12, fontWeight: 700,
            boxShadow: '0 3px 10px rgb(22 163 74 / 0.3)',
            transition: 'all 0.15s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 5px 16px rgb(22 163 74 / 0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 10px rgb(22 163 74 / 0.3)'; }}
          >
            Edit Profile
          </button>
          <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/profile/${user._id}`); }}
            className="btn" style={{
              width: '100%', padding: '9px 0',
              border: '1.5px solid #bbf7d0', color: '#16a34a',
              borderRadius: 11, fontSize: 12, fontWeight: 700,
              background: 'white', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            Share Profile
          </button>
        </div>

        {/* Expandable info */}
        <div style={{
          marginTop: 10, textAlign: 'left', overflow: 'hidden',
          maxHeight: showMore ? 200 : 0, transition: 'max-height 0.3s ease',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {user.education && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 8px', borderRadius: 10, transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Award size={12} style={{ color: '#16a34a', marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>{user.education}</span>
            </div>
          )}
          {user.experience && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 8px', borderRadius: 10, transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Briefcase size={12} style={{ color: '#16a34a', marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>{user.experience}</span>
            </div>
          )}
          {user.website && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 8px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <LinkIcon size={12} style={{ color: '#16a34a', marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#16a34a', textDecoration: 'underline', lineHeight: 1.5 }}>{user.website}</span>
            </div>
          )}
          <p style={{ fontSize: 11, color: '#94a3b8', padding: '4px 8px' }}>{user.joinedDate}</p>
        </div>

        <button onClick={() => setShowMore(!showMore)} className="btn" style={{
          width: '100%', marginTop: 8, color: '#16a34a', fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          padding: '8px 0', background: 'none', borderTop: '1px solid #f1f5f9',
        }}>
          {showMore ? 'Less' : 'More'}
          {showMore ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {/* Connections */}
        {user.connections?.length > 0 && (
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, marginTop: 4 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your network</p>
            <div style={{ display: 'flex', marginLeft: -4 }}>
              {user.connections.slice(0, 4).map(c => (
                <img key={c._id} src={c.avatar} alt={c.name} title={c.name}
                  style={{
                    width: 30, height: 30, borderRadius: '50%',
                    border: '2px solid white', objectFit: 'cover',
                    cursor: 'pointer', marginLeft: -6,
                    transition: 'transform 0.2s ease',
                  }}
                  onClick={() => navigate(`/profile/${c._id}`)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.15)'; e.currentTarget.style.zIndex = 10; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.zIndex = 'auto'; }}
                />
              ))}
            </div>
            <button onClick={() => navigate('/network')} className="btn" style={{
              background: 'none', padding: 0, color: '#16a34a', fontSize: 12,
              fontWeight: 600, marginTop: 7, display: 'block', textAlign: 'left',
            }}>View all connections →</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// POST COMPOSER BAR
// ============================================================================
const PostComposerBar = ({ user, onOpenModal }) => (
  <div className="card p-4 mb-3 transition-colors duration-200">
    <div className="flex gap-3 mb-3">
      <img
        src={user?.avatar}
        alt={user?.name}
        className="w-10 h-10 rounded-full object-cover border-2 border-green-200 dark:border-green-800 flex-shrink-0"
      />
      <button
        type="button"
        onClick={onOpenModal}
        className="btn composer-prompt flex-1 rounded-full px-4 text-left text-[13px] text-gray-500 dark:text-gray-400 font-medium h-10 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
        style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
      >
        Share something with farmers...
      </button>
    </div>
    <div className="flex gap-0.5 pt-2.5 border-t border-gray-100 dark:border-gray-700">
      {[{ icon: '📹', label: 'Video' }, { icon: '📷', label: 'Photo' }, { icon: '✍️', label: 'Article' }].map(({ icon, label }) => (
        <button
          key={label}
          type="button"
          onClick={onOpenModal}
          className="btn flex items-center justify-center gap-2 flex-1 py-2 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        >
          <span className="text-[15px]">{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  </div>
);

// ============================================================================
// RIGHT SIDEBAR
// ============================================================================
const RightSidebar = () => {
  const navigate = useNavigate();
  const [weather, setWeather] = useState(null);
  const [prices, setPrices] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllNews, setShowAllNews] = useState(false);
  const [pricesRefreshing, setPricesRefreshing] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [w, p, n] = await Promise.all([api.fetchWeather('Bijnor'), api.fetchMarketPrices(), api.fetchNews()]);
        setWeather(w); setPrices(p.prices); setNews(n.news);
      } catch { } finally { setLoading(false); }
    };
    load();
  }, []);

  const refreshPrices = async () => {
    setPricesRefreshing(true);
    try { const { prices: p } = await api.fetchMarketPrices(); setPrices(p); }
    catch { } finally { setPricesRefreshing(false); }
  };

  const displayedNews = showAllNews ? news : news.slice(0, 3);

  const categoryColors = {
    Market: { bg: '#fef3c7', color: '#92400e' },
    Advisory: { bg: '#fee2e2', color: '#991b1b' },
    Technology: { bg: '#dbeafe', color: '#1e40af' },
    Sustainability: { bg: '#dcfce7', color: '#14532d' },
    Government: { bg: '#ede9fe', color: '#4c1d95' },
  };

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 80 }}>

      {/* ── Weather Card ── */}
      <div
        onClick={() => navigate('/weather')}
        className="card weather-gradient"
        style={{ padding: '18px 18px', cursor: 'pointer' }}
      >
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="font-bold text-[13px] text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span className="text-base">🌤️</span> Today's Weather
          </h3>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-1 rounded-full font-semibold border border-gray-200 dark:border-gray-600">
            Live
          </span>
        </div>

        {loading ? <CardSkeleton /> : weather ? (
          <>
            {/* Main temp block */}
            <div className="flex items-center gap-3.5 bg-white dark:bg-gray-700/50 rounded-xl p-3.5 mb-2.5 shadow-sm">
              <span className="text-4xl leading-none">{weather.icon}</span>
              <div>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 leading-none tracking-tight">
                  {weather.temp}°<span className="text-base font-medium text-gray-500 dark:text-gray-400">C</span>
                </p>
                <p className="text-[13px] text-gray-600 dark:text-gray-300 mt-1 font-medium">{weather.condition}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                  <MapPin size={10} /> {weather.city}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              {[
                { icon: Droplet, label: 'Humidity', value: `${weather.humidity}%`, iconBg: 'bg-blue-100 dark:bg-blue-900/40', iconColor: 'text-blue-600 dark:text-blue-400' },
                { icon: Wind, label: 'Wind', value: `${weather.wind} km/h`, iconBg: 'bg-orange-100 dark:bg-orange-900/40', iconColor: 'text-orange-600 dark:text-orange-400' },
              ].map(({ icon: Icon, label, value, iconBg, iconColor }) => (
                <div key={label} className="flex items-center gap-2 bg-white dark:bg-gray-700/50 py-2.5 px-3 rounded-xl shadow-sm">
                  <div className={`p-1.5 rounded-lg ${iconBg}`}>
                    <Icon size={13} className={iconColor} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{label}</p>
                    <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tip */}
            <div style={{
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              color: 'white', borderRadius: 12, padding: '11px 14px',
              fontSize: 12, fontWeight: 600, lineHeight: 1.5,
            }}>
              {weather.tip}
            </div>
          </>
        ) : null}
      </div>

      {/* ── Mandi Prices ── */}
      <div
        onClick={() => navigate('/market')}
        className="card"
        style={{ padding: '18px 18px', cursor: 'pointer' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[13px] text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>📈</span> Mandi Prices
          </h3>
          <button
            type="button"
            onClick={refreshPrices}
            className={`btn p-1.5 rounded-lg flex items-center transition-colors ${pricesRefreshing ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            <RefreshCw size={13} className={pricesRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {prices.map((item, idx) => (
              <div
                key={item.crop}
                className="flex items-center justify-between py-2 px-2.5 rounded-xl cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30"
              >
                <div>
                  <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{item.crop}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{item.unit}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
                    ₹{item.price.toLocaleString()}
                  </p>
                  <span className={item.trend === 'up' ? 'trend-up' : 'trend-down'} style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px',
                    borderRadius: 99, display: 'inline-block', marginTop: 2,
                  }}>
                    {item.trend === 'up' ? '▲' : '▼'} {Math.abs(item.change)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center mt-2.5 font-medium">
          Auto-updates every 5 min
        </p>
      </div>

      {/* ── Agri News ── */}
      <div className="card p-4">
        <h3 className="font-bold text-[13px] text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <span>🌾</span> Agri News
        </h3>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {displayedNews.map(item => {
              const cat = categoryColors[item.category] || { bg: '#f1f5f9', color: '#475569' };
              return (
                <a
                key={item._id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="block py-2.5 px-2.5 rounded-xl no-underline transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                  <p className="line-clamp-2 text-xs font-semibold text-gray-800 dark:text-gray-200 leading-snug mb-1.5 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold py-0.5 px-2 rounded-full"
                      style={{ background: cat.bg, color: cat.color }}
                    >
                      {item.category}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{formatTimeAgo(item.publishedAt)}</span>
                  </div>
                </a>
              );
            })}
            <button
              type="button"
              onClick={() => setShowAllNews(!showAllNews)}
              className="btn w-full text-green-600 dark:text-green-400 text-xs font-semibold py-2 bg-transparent flex items-center justify-center gap-1.5 border-t border-gray-100 dark:border-gray-700 mt-1.5 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              {showAllNews ? 'Show less' : 'Show more'}
              <ArrowRight size={12} className={showAllNews ? 'rotate-180' : ''} style={{ transition: 'transform 0.2s ease' }} />
            </button>
          </div>
        )}
      </div>

      {/* ── Trending Tags ── */}
      <div className="card" style={{ padding: '18px 18px' }}>
        <h3 className="font-bold text-[13px] text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <span>🔥</span> Trending
        </h3>
        <div className="flex flex-col gap-0.5">
          {['#OrganicFarming', '#SustainableAg', '#FarmToTable', '#AgriculturalTech', '#KrishiIndia'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => navigate(`/tag/${tag.slice(1)}`)}
              className="btn w-full flex items-center justify-between py-2 px-2.5 rounded-xl text-green-700 dark:text-green-400 font-semibold text-[13px] bg-transparent text-left transition-colors hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <span>{tag}</span>
              <ArrowRight size={13} className="text-green-200 dark:text-green-700 group-hover:text-green-600" />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

// ============================================================================
// HOME PAGE – Feed, create post, recent/trending (sidebar from AppLayout)
// ============================================================================
const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const outletContext = useOutletContext();
  const sidebarOpen = outletContext?.sidebarOpen ?? true;
  const setSidebarOpen = outletContext?.setSidebarOpen ?? (() => {});
  const isHomeActive = location.pathname === '/' || location.pathname === '/feed';

  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedMode, setFeedMode] = useState('recent');
  const [showComposer, setShowComposer] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [notificationCount] = useState(5);
  const [toast, setToast] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showAIChat, setShowAIChat] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { user } = await api.fetchCurrentUser();
        setCurrentUser(user);
        if (user) authStore.setUser(user);
      } catch { } finally { setUserLoading(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setPostsLoading(true); setPostsError(null);
      try {
        const { posts: data, hasMore: more } = await api.fetchPosts(1, 20, feedMode);
        setPosts(data || []); setPage(1); setHasMore(!!more);
      } catch (e) {
        setPostsError('Failed to load posts. Please try again.');
      } finally { setPostsLoading(false); }
    })();
  }, [feedMode, retryCount]);

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { posts: more, hasMore: moreAvail } = await api.fetchPosts(nextPage, 20, feedMode);
      setPosts(prev => [...prev, ...(more || [])]);
      setPage(nextPage); setHasMore(!!moreAvail);
    } catch { } finally { setLoadingMore(false); }
  };

  const handlePostCreated = useCallback((newPost, postsCount) => {
    setPosts(prev => [newPost, ...prev]);
    const u = authStore.getState().user;
    if (u != null && typeof postsCount === 'number') {
      authStore.setUser({ ...u, stats: { ...(u.stats || {}), postsCount } });
    }
    setCurrentUser(prev => (prev && typeof postsCount === 'number' ? { ...prev, stats: { ...(prev.stats || {}), postsCount } } : prev));
    showToast('Post created successfully!');
  }, [showToast]);

  const handleProfileUpdated = useCallback((updatedUser) => {
    setCurrentUser(updatedUser);
    showToast('Profile updated!');
  }, [showToast]);

  const handleNavChange = (id) => {
    if (id === 'profile') navigate(`/profile/${currentUser?._id}`);
    else if (id === 'messages') navigate('/messages');
    else if (id === 'notifications') navigate('/notifications');
    else if (id === 'network') navigate('/network');
    else if (id === 'jobs') navigate('/jobs');
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <GlobalStyles />
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}

      {/* Modals */}
      {showComposer && currentUser && (
        <PostComposerModal user={currentUser} onClose={() => setShowComposer(false)} onPostCreated={handlePostCreated} />
      )}
      {showEditProfile && currentUser && (
        <EditProfileModal user={currentUser} onClose={() => setShowEditProfile(false)} onUpdated={handleProfileUpdated} />
      )}

      {/* Main content wrapper */}
      <div style={{ transition: 'margin-left 0.28s cubic-bezier(0.16, 1, 0.3, 1)' }} className="main-content">

        {/* ── Top Bar ── */}
        <div className="sticky top-0 z-30 flex items-center gap-[14px] px-6 h-16 backdrop-blur-[16px] border-b border-gray-200 dark:border-gray-700 bg-white/92 dark:bg-gray-800/92 shadow-[0_1px_0_rgb(0_0_0/0.04)] transition-colors duration-200 topbar-desktop">
          {/* Search */}
          <div className="flex-1 max-w-[400px] relative">
            <Search size={15} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              type="search"
              placeholder="Search farmers, posts, topics..."
              className="input-base w-full pl-10 pr-4 py-2 text-[13px] bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 transition-colors"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            />
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            {/* Notification bell */}
            <button
              type="button"
              className="btn relative p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center"
              onClick={() => handleNavChange('notifications')}
            >
              <Bell size={19} />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
              )}
            </button>

            {/* Create Post */}
            <button
              type="button"
              onClick={() => setShowComposer(true)}
              className="btn flex items-center gap-2 py-2.5 px-4 rounded-xl text-[13px] font-bold text-white bg-green-600 hover:bg-green-700 shadow-[0_3px_10px_rgb(22_163_74/0.3)] hover:shadow-[0_5px_16px_rgb(22_163_74/0.4)] hover:-translate-y-px transition-all"
            >
              <Plus size={16} /> Create Post
            </button>
          </div>
        </div>

        {/* ── Page content (centered, wider for less compressed cards) ── */}
        <div className="max-w-[1320px] mx-auto px-5 py-6">
          {/* <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, alignItems: 'start' }} className="content-grid"> */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', columnGap: 20, rowGap: 0, alignItems: 'start' }} className="content-grid">
            {/* AI Assistant (left) — guidance & doubt solving; hidden on mobile, shown from 768px */}
            <div style={{ display: 'none' }} className="profile-col">
              <div style={{ position: 'sticky', top: 80 }}>
                <div className="card" style={{ overflow: 'hidden' }}>
                  {/* Header banner */}
                  <div style={{
                    position: 'relative', height: 80, overflow: 'hidden',
                    background: 'linear-gradient(135deg, #166534 0%, #15803d 50%, #16a34a 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Sparkles size={36} style={{ color: 'rgba(255,255,255,0.9)' }} />
                  </div>
                  {/* Avatar / icon */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: -28, marginBottom: 10 }}>
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 border-[3px] border-white dark:border-gray-800 shadow flex items-center justify-center">
                      <HelpCircle size={26} className="text-green-700 dark:text-green-400" />
                    </div>
                  </div>
                  {/* Info */}
                  <div className="px-4 pb-4 text-center">
                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100">Krishi Assistant</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                      Guidance & doubt solving for farming, crops & weather
                    </p>
                    {/* Quick actions */}
                    <div className="grid grid-cols-2 gap-1.5 mt-3.5 p-2.5 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      {[
                        { label: 'Crops', hint: 'Tips & pests' },
                        { label: 'Weather', hint: 'Forecast' },
                        { label: 'Market', hint: 'Prices' },
                        { label: 'Soil', hint: 'Health' },
                      ].map(({ label, hint }) => (
                        <div
                          key={label}
                          className="stat-hover text-center py-2 px-1 rounded-lg cursor-pointer"
                        >
                          <p className="font-bold text-xs text-green-700 dark:text-green-400">{label}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{hint}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowAIChat(prev => !prev)}
                      className="btn"
                      style={{
                        width: '100%', marginTop: 12, padding: '10px 0',
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        color: 'white', borderRadius: 11, fontSize: 12, fontWeight: 700,
                        boxShadow: '0 3px 10px rgb(22 163 74 / 0.3)',
                        transition: 'all 0.15s ease',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 5px 16px rgb(22 163 74 / 0.4)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 10px rgb(22 163 74 / 0.3)'; }}
                    >
                      <MessageSquare size={14} /> Ask a question
                    </button>
                  </div>
                </div>
                {/* AI Chat expandable panel – same width as card, directly below */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${showAIChat ? 'max-h-[70vh] opacity-100 mt-0' : 'max-h-0 opacity-0'}`}
                >
                  <AIChatPanel onClose={() => setShowAIChat(false)} />
                </div>
              </div>
            </div>

            {/* Feed */}
            <div className="feed-col" style={{ minWidth: 0 }}>
              {/* Mobile header */}
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-3 shadow-sm mobile-header transition-colors duration-200">
                <span className="font-semibold text-lg text-green-700 dark:text-green-400" style={{ fontFamily: 'Lora, Georgia, serif' }}>
                  🌾 KrishiConnect
                </span>
                <div className="flex gap-2">
                  <button type="button" className="btn p-2.5 rounded-xl text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center">
                    <Search size={18} />
                  </button>
                  <button type="button" onClick={() => setShowComposer(true)} className="btn p-2.5 bg-green-600 text-white rounded-xl flex items-center">
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Composer bar */}
              {currentUser && <PostComposerBar user={currentUser} onOpenModal={() => setShowComposer(true)} />}

              {/* Feed mode: Recent / Trending */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setFeedMode('recent')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-[13px] font-semibold transition-colors ${
                    feedMode === 'recent'
                      ? 'bg-green-600 text-white border-none'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  Recent
                </button>
                <button
                  type="button"
                  onClick={() => setFeedMode('trending')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-[13px] font-semibold transition-colors ${
                    feedMode === 'trending'
                      ? 'bg-green-600 text-white border-none'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  Trending
                </button>
              </div>

              {/* Loading skeletons */}
              {postsLoading && <>{[1, 2, 3].map(i => <PostSkeleton key={i} />)}</>}

              {/* Error state */}
              {postsError && (
                <div className="card py-9 px-6 text-center mb-3">
                  <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle size={26} className="text-red-500" />
                  </div>
                  <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">{postsError}</p>
                  <button
                    type="button"
                    onClick={() => { setPostsError(null); setRetryCount(c => c + 1); }}
                    className="btn mt-2.5 py-2.5 px-6 bg-green-600 text-white rounded-xl text-[13px] font-semibold"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!postsLoading && !postsError && posts.length === 0 && (
                <div className="card py-14 px-6 text-center mb-3">
                  <div className="text-5xl mb-4">🌱</div>
                  <p className="font-extrabold text-lg text-gray-900 dark:text-gray-100 mb-1.5">No posts yet</p>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400">Follow other farmers or create your first post!</p>
                  <button
                    type="button"
                    onClick={() => setShowComposer(true)}
                    className="btn mt-5 py-2.5 px-7 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[13px] font-bold shadow-[0_4px_12px_rgb(22_163_74/0.3)] transition-colors"
                  >
                    Create First Post
                  </button>
                </div>
              )}

              {/* Post cards — skip posts with missing author to avoid runtime crashes */}
              {!postsLoading && posts.filter(p => p && p.author).map(post => (
                <PostCard key={post._id} post={post} currentUser={currentUser}
                  onPostUpdate={(updated) => setPosts(p => p.map(x => x._id === updated._id ? updated : x))}
                  onPostDeleted={(postId, postsCount) => {
                    setPosts(p => p.filter(x => x._id !== postId));
                    setCurrentUser(prev => prev && typeof postsCount === 'number' ? { ...prev, stats: { ...(prev.stats || {}), postsCount } } : prev);
                  }} />
              ))}

              {/* Load more */}
              {!postsLoading && posts.length > 0 && (
                <div className="text-center pb-8 pt-2">
                  {hasMore ? (
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="btn py-2.5 px-8 border-2 border-green-600 text-green-600 dark:text-green-400 rounded-xl font-bold text-[13px] bg-white dark:bg-gray-800 inline-flex items-center gap-2 transition-all opacity-100 disabled:opacity-60 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      {loadingMore ? <><Loader size={15} className="animate-spin" /> Loading...</> : 'Load More Posts'}
                    </button>
                  ) : (
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                      <CheckCircle size={15} className="text-green-500" /> You're all caught up!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div style={{ display: 'none' }} className="right-col">
              <RightSidebar />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around py-2 px-2 pb-3 backdrop-blur-[16px] border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 shadow-[0_-4px_20px_rgb(0_0_0/0.06)] z-40 mobile-nav transition-colors duration-200">
        {[
          { id: 'home', icon: Home, label: 'Home' },
          { id: 'network', icon: Users, label: 'Network' },
          { id: 'messages', icon: MessageSquare, label: 'Messages' },
          { id: 'notifications', icon: Bell, label: 'Alerts' },
          { id: 'profile', icon: User, label: 'Profile' },
        ].map(item => {
          const isActive = item.id === 'home' ? isHomeActive : (item.id === 'profile' && location.pathname.startsWith('/profile')) || (item.id === 'network' && location.pathname.startsWith('/network')) || (item.id === 'messages' && location.pathname.startsWith('/messages')) || (item.id === 'notifications' && location.pathname.startsWith('/alerts'));
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavChange(item.id)}
              className={`btn flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl relative min-w-[56px] transition-colors ${
                isActive ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {item.id === 'notifications' && notificationCount > 0 && (
                <span className="mobile-nav-dot" />
              )}
              <item.icon size={21} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium" style={{ fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div style={{ height: 72 }} className="mobile-spacer" />

      {/* Responsive layout injection */}
      <style>{`
        /* Topbar desktop: hidden on mobile */
        .topbar-desktop { display: none !important; }
        @media (min-width: 1024px) { .topbar-desktop { display: flex !important; } }

        /* Mobile header: shown only on mobile */
        .mobile-header { display: flex !important; }
        @media (min-width: 768px) { .mobile-header { display: none !important; } }

        /* Mobile nav: hidden on md+ */
        .mobile-nav { display: flex !important; }
        @media (min-width: 768px) { .mobile-nav { display: none !important; } }

        /* Mobile spacer */
        .mobile-spacer { display: block !important; }
        @media (min-width: 768px) { .mobile-spacer { display: none !important; } }

        /* Main content: no extra margin; AppLayout already reserves space for sidebar */
        .main-content {
          margin-left: 0;
        }

        /* Content grid: 1-col on mobile → 2-col at 768px → 3-col at 1280px */
        .content-grid {
          grid-template-columns: 1fr !important;
          align-items: start !important;
        }
        @media (min-width: 768px) {
          .content-grid {
            grid-template-columns: 260px 1fr !important;
          }
          .profile-col { display: block !important; }
        }
        @media (min-width: 1280px) {
          .content-grid {
            grid-template-columns: 260px 1fr 320px !important;
          }
          .right-col { display: block !important; }
        }

        /* Column order: feed first on mobile; left sidebar then feed on tablet+ */
        .profile-col { order: 2; }
        .feed-col    { order: 1; min-width: 0; }
        .right-col   { order: 3; }
        @media (min-width: 768px) {
          .profile-col { order: 1; }
          .feed-col    { order: 2; }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
