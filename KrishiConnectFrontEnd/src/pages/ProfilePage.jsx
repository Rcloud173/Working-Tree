import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  MapPin, LinkIcon, Award, Briefcase, Users, Heart, MessageSquare,
  Share2, Bookmark, Edit3, Camera, Check, X, Loader, AlertCircle,
  RefreshCw, Eye, TrendingUp, Plus, ChevronDown, ChevronUp,
  CheckCircle, Star, Calendar, BookOpen, Phone, Image as ImageIcon
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authStore } from '../store/authStore';
import { userService, mapUserToProfile } from '../services/user.service';
import { postService } from '../services/post.service';

// ============================================================================
// UTILITY
// ============================================================================
const formatNumber = (n) => {
  if (!n && n !== 0) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
};

const formatTimeAgo = (dateStr) => {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

// ============================================================================
// EDIT PROFILE MODAL
// ============================================================================
const EditProfileModal = ({ user, currentUserId, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: user.name,
    headline: user.headline,
    location: user.location,
    bio: user.bio,
    education: user.education,
    experience: user.experience,
    website: user.website,
    phone: user.phone,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const raw = await userService.updateProfile({
        name: form.name,
        bio: form.bio,
        location: form.location || undefined,
      });
      const mapped = mapUserToProfile(raw, currentUserId);
      onSaved(mapped);
      if (typeof authStore.setUser === 'function') authStore.setUser(mapped);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update profile');
    } finally { setLoading(false); }
  };

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text' },
    { key: 'headline', label: 'Headline', type: 'text' },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'website', label: 'Website', type: 'text' },
    { key: 'phone', label: 'Phone', type: 'tel' },
    { key: 'education', label: 'Education', type: 'text' },
    { key: 'experience', label: 'Experience', type: 'text' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b border-gray-100 rounded-t-2xl z-10">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><Edit3 size={18} className="text-green-600" /> Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {fields.map(({ key, label, type }) => (
            <div key={key}>
              <label className="text-xs font-bold text-gray-500 block mb-1.5">{label}</label>
              <input type={type} value={form[key] || ''} onChange={(e) => handleChange(key, e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 transition" />
            </div>
          ))}
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1.5">Bio</label>
            <textarea value={form.bio || ''} onChange={(e) => handleChange('bio', e.target.value)}
              rows={4} className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 resize-none transition" />
          </div>
        </div>
        <div className="sticky bottom-0 bg-white p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-40 transition flex items-center justify-center gap-2">
            {loading ? <Loader size={15} className="animate-spin" /> : <Check size={15} />}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// POST MINI CARD
// ============================================================================
const PostMiniCard = ({ post }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
    {post.mediaUrl && (
      <img src={post.mediaUrl} alt="post" className="w-full h-40 object-cover" />
    )}
    <div className="p-4">
      <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">{post.content}</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {post.tags?.map(tag => (
          <span key={tag} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100">#{tag}</span>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Heart size={11} />{formatNumber(post.likesCount)}</span>
        <span className="flex items-center gap-1"><MessageSquare size={11} />{post.commentsCount}</span>
        <span className="flex items-center gap-1"><Bookmark size={11} />{post.savedCount}</span>
        <span className="ml-auto">{formatTimeAgo(post.createdAt)}</span>
      </div>
    </div>
  </div>
);

const SavedPostCard = ({ post }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
    {post.mediaUrl && (
      <img src={post.mediaUrl} alt="post" className="w-full h-36 object-cover" />
    )}
    <div className="p-4">
      <div className="flex items-center gap-2 mb-2">
        {post.author?.avatar && <img src={post.author.avatar} alt={post.author.name} className="w-6 h-6 rounded-full object-cover" />}
        <span className="text-xs font-semibold text-gray-600">{post.author?.name || 'User'}</span>
        {post.savedAt && <span className="text-xs text-gray-400 ml-auto">Saved {post.savedAt}</span>}
      </div>
      <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">{post.content}</p>
    </div>
  </div>
);

// ============================================================================
// MAIN PROFILE PAGE
// ============================================================================
const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  // Select only primitive id to avoid re-renders from object reference changes
  const currentUserId = useAuthStore((s) => s.user?._id ?? null);
  const resolvedUserId = userId || 'current-user';
  const idForApi = !resolvedUserId || resolvedUserId === 'current-user' ? (currentUserId || 'me') : resolvedUserId;

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const profilePhotoInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    const isOwnProfile = idForApi === 'me' || (currentUserId != null && String(idForApi) === String(currentUserId));
    try {
      const profile = await userService.fetchProfileForPage(idForApi, currentUserId);
      setUser(profile);
      setFollowing(profile?.isFollowing ?? false);
    } catch (err) {
      const isUnauthorized = err?.response?.status === 401;
      if (isUnauthorized && isOwnProfile) {
        setError(currentUserId
          ? 'Session expired. Please log in again.'
          : 'Please log in to view your profile.');
      } else {
        setError(err?.message || 'Failed to load profile.');
      }
    } finally {
      setLoading(false);
    }
  }, [idForApi, currentUserId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const userIdForPosts = user?._id;
  useEffect(() => {
    if (!userIdForPosts) return;
    let cancelled = false;
    (async () => {
      setPostsLoading(true);
      try {
        if (activeTab === 'posts') {
          const { posts: data } = await postService.getUserPosts(userIdForPosts);
          if (!cancelled) setPosts(data || []);
        } else {
          const { posts: data } = await postService.getSavedPosts();
          if (!cancelled) setSavedPosts(data || []);
        }
    } catch (err) {
      if (!cancelled) {
        setPosts([]);
        setSavedPosts([]);
        if (err?.response?.status !== 401) toast.error(err?.message || 'Failed to load posts');
      }
    } finally {
        if (!cancelled) setPostsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeTab, userIdForPosts]);

  const handleFollow = async () => {
    if (!user) return;
    setFollowLoading(true);
    try {
      if (following) await userService.unfollowUser(user._id);
      else await userService.followUser(user._id);
      setFollowing(!following);
      setUser(prev => ({
        ...prev,
        followersCount: following ? (prev.followersCount || 0) - 1 : (prev.followersCount || 0) + 1,
      }));
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update follow');
    } finally { setFollowLoading(false); }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${user?._id || idForApi}`;
    navigator.clipboard?.writeText(url);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
  };

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const updated = await userService.uploadProfilePhoto(file);
      const photoUrl = updated?.profilePhoto?.url ?? (typeof updated?.profilePhoto === 'string' ? updated.profilePhoto : null);
      if (photoUrl) {
        setUser(prev => ({ ...prev, profilePhoto: photoUrl }));
        const g = authStore.getState();
        if (g?.user && typeof authStore.setUser === 'function') {
          authStore.setUser({ ...g.user, profilePhoto: photoUrl });
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Profile photo upload failed');
    }
    e.target.value = '';
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const form = new FormData();
      form.append('background', file);
      const updated = await userService.updateBackground(form);
      const coverUrl = updated?.background?.url ?? (typeof updated?.background === 'string' ? updated.background : null);
      if (coverUrl) setUser(prev => ({ ...prev, coverPhoto: coverUrl, coverPreset: null }));
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Cover photo upload failed');
    }
    e.target.value = '';
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200" />
          <div className="bg-white px-6 pb-5">
            <div className="flex items-end gap-4 -mt-12 mb-4">
              <div className="w-24 h-24 rounded-full bg-gray-300 border-4 border-white" />
              <div className="flex-1 pt-16 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-100 rounded" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-red-100 p-10 text-center shadow-sm">
        <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
        <p className="font-semibold text-gray-700">{error}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button onClick={loadProfile} className="px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2">
            <RefreshCw size={14} /> Retry
          </button>
          {error.includes('log in') && (
            <button onClick={() => navigate('/login')} className="px-6 py-2 border border-green-600 text-green-700 rounded-xl text-sm font-semibold hover:bg-green-50 transition">
              Log in
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Edit Modal */}
      {showEditModal && (
        <EditProfileModal user={user} currentUserId={currentUserId} onClose={() => setShowEditModal(false)} onSaved={(updated) => { setUser(updated); }} />
      )}

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle size={15} /> Profile link copied!
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={profilePhotoInputRef} type="file" accept="image/*" hidden onChange={handleProfilePhotoUpload} />
      <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={handleCoverUpload} />

      <div className="max-w-3xl mx-auto">
        {/* Cover Photo */}
        <div className="relative h-52 sm:h-64 bg-gradient-to-br from-green-600 to-green-400 group overflow-hidden" style={user.coverPreset ? { background: user.coverPreset } : undefined}>
          {user.coverPhoto && !user.coverPreset && <img src={user.coverPhoto} alt="cover" className="w-full h-full object-cover" />}
          {user.isOwnProfile && (
            <button onClick={() => coverInputRef.current?.click()}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 bg-black/50 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition hover:bg-black/70">
              <Camera size={13} /> Change Cover
            </button>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white shadow-sm">
          <div className="px-5 sm:px-8">
            {/* Avatar + Actions Row */}
            <div className="flex items-end justify-between -mt-14 sm:-mt-16 pb-4">
              <div className="relative group">
                <img src={user.profilePhoto} alt={user.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-md" />
                {user.isOwnProfile && (
                  <button onClick={() => profilePhotoInputRef.current?.click()}
                    className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                    <Camera size={20} className="text-white" />
                  </button>
                )}
                {user.verified && (
                  <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircle size={13} className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pb-1">
                <button onClick={handleShare}
                  className="px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition flex items-center gap-1.5">
                  <Share2 size={13} /> Share
                </button>
                {user.isOwnProfile ? (
                  <button onClick={() => setShowEditModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition flex items-center gap-1.5 shadow-sm">
                    <Edit3 size={13} /> Edit Profile
                  </button>
                ) : (
                  <button onClick={handleFollow} disabled={followLoading}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${following ? 'border border-gray-200 text-gray-600 hover:bg-gray-50' : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'}`}>
                    {followLoading ? <Loader size={13} className="animate-spin" /> : following ? <Check size={13} /> : <Plus size={13} />}
                    {following ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            </div>

            {/* Name & Info */}
            <div className="pb-5">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">{user.name}</h1>
                {user.verified && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">✓ Verified</span>}
              </div>
              <p className="text-sm text-gray-600 mt-0.5 font-medium">{user.headline}</p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                {user.location && (
                  <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={11} className="text-green-600" />{user.location}</span>
                )}
                {user.website && (
                  <a href={`https://${user.website}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-green-600 hover:underline font-medium">
                    <LinkIcon size={11} />{user.website}
                  </a>
                )}
                {user.joinedDate && (
                  <span className="flex items-center gap-1 text-xs text-gray-400"><Calendar size={11} />Joined {user.joinedDate}</span>
                )}
              </div>

              {user.bio && (
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">{user.bio}</p>
              )}

              {/* Crops */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {user.crops?.map(crop => (
                  <span key={crop} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">🌱 {crop}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="border-t border-gray-100 px-5 sm:px-8 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Followers', value: formatNumber(user.followersCount), icon: Users, color: 'text-green-600' },
                { label: 'Following', value: formatNumber(user.followingCount), icon: Users, color: 'text-blue-600' },
                { label: 'Posts', value: user.postsCount, icon: BookOpen, color: 'text-purple-600' },
                { label: 'Profile Views', value: user.profileViewers, icon: Eye, color: 'text-orange-600' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="text-center p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition group">
                  <Icon size={16} className={`${color} mx-auto mb-1 group-hover:scale-110 transition-transform`} />
                  <p className="text-lg font-black text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Expandable Details */}
          <div className={`overflow-hidden transition-all duration-300 ${showMoreInfo ? 'max-h-96' : 'max-h-0'}`}>
            <div className="px-5 sm:px-8 pb-5 pt-1 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {user.education && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <Award size={15} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div><p className="text-xs font-bold text-gray-500">Education</p><p className="text-sm text-gray-700 mt-0.5">{user.education}</p></div>
                  </div>
                )}
                {user.experience && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <Briefcase size={15} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div><p className="text-xs font-bold text-gray-500">Experience</p><p className="text-sm text-gray-700 mt-0.5">{user.experience}</p></div>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <Phone size={15} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div><p className="text-xs font-bold text-gray-500">Contact</p><p className="text-sm text-gray-700 mt-0.5">{user.phone}</p></div>
                  </div>
                )}
                {user.certifications?.length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <Star size={15} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-gray-500">Certifications</p>
                      {user.certifications.map(cert => <p key={cert} className="text-sm text-gray-700 mt-0.5">{cert}</p>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button onClick={() => setShowMoreInfo(!showMoreInfo)}
            className="w-full py-3 text-sm text-green-700 font-bold hover:bg-green-50 transition flex items-center justify-center gap-1.5 border-t border-gray-100">
            {showMoreInfo ? <><ChevronUp size={15} /> Show Less</> : <><ChevronDown size={15} /> Show More Details</>}
          </button>
        </div>

        {/* Impact Stats */}
        {user.isOwnProfile && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-4 mx-4 sm:mx-0 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><TrendingUp size={15} className="text-green-600" /> Your Impact This Week</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Profile Views', value: user.profileViewers, change: '+12%', up: true },
                { label: 'Post Impressions', value: user.postImpressions, change: '+8%', up: true },
                { label: 'Saved Posts', value: user.savedCount, change: '+3', up: true },
              ].map(({ label, value, change, up }) => (
                <div key={label} className="text-center p-3 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-xl font-black text-green-700">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  <p className={`text-xs font-bold mt-1 ${up ? 'text-green-600' : 'text-red-500'}`}>{change}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs + Content */}
        <div className="bg-white rounded-t-none mt-4 shadow-sm">
          <div className="flex border-b border-gray-100 px-4 sticky top-0 bg-white z-10">
            {[
              { id: 'posts', label: `Posts (${user.postsCount})` },
              { id: 'saved', label: `Saved (${user.savedCount})` },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3.5 text-sm font-bold border-b-2 transition mr-1 ${activeTab === tab.id ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {postsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-gray-50 rounded-2xl animate-pulse h-48 border border-gray-100" />
                ))}
              </div>
            ) : activeTab === 'posts' && posts.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">🌱</div>
                <p className="font-bold text-gray-700">No posts yet</p>
                <p className="text-gray-400 text-sm mt-1">Share your farming experiences!</p>
              </div>
            ) : activeTab === 'saved' && savedPosts.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">🔖</div>
                <p className="font-bold text-gray-700">No saved posts</p>
                <p className="text-gray-400 text-sm mt-1">Bookmark posts to see them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeTab === 'posts' && posts.map(post => <PostMiniCard key={post._id} post={post} />)}
                {activeTab === 'saved' && savedPosts.map(post => <SavedPostCard key={post._id} post={post} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
