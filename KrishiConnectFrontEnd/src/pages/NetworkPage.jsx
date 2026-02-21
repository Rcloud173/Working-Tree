import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, UserPlus, UserCheck, MapPin, Briefcase, Filter,
  ChevronDown, X, Loader, AlertCircle, RefreshCw, TrendingUp,
  CheckCircle, Star, Globe, MessageSquare
} from 'lucide-react';

// ============================================================================
// API PLACEHOLDER FUNCTIONS
// ============================================================================
const API_BASE = 'http://localhost:5000/api';
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const networkApi = {
  fetchSuggestedFarmers: async (filters = {}) => {
    // TODO: GET ${API_BASE}/network/suggestions?specialty=${filters.specialty}&state=${filters.state}
    await delay(800);
    return { farmers: DEMO_FARMERS };
  },
  fetchConnections: async () => {
    // TODO: GET ${API_BASE}/network/connections
    await delay(600);
    return { connections: DEMO_CONNECTIONS };
  },
  fetchConnectionRequests: async () => {
    // TODO: GET ${API_BASE}/network/requests
    await delay(400);
    return { requests: DEMO_REQUESTS };
  },
  sendConnectionRequest: async (userId) => {
    // TODO: POST ${API_BASE}/network/connect  body: { targetUserId: userId }
    await delay(500);
    return { success: true };
  },
  acceptRequest: async (requestId) => {
    // TODO: PUT ${API_BASE}/network/requests/${requestId}/accept
    await delay(400);
    return { success: true };
  },
  declineRequest: async (requestId) => {
    // TODO: DELETE ${API_BASE}/network/requests/${requestId}
    await delay(300);
    return { success: true };
  },
  removeConnection: async (userId) => {
    // TODO: DELETE ${API_BASE}/network/connections/${userId}
    await delay(400);
    return { success: true };
  },
  searchFarmers: async (query) => {
    // TODO: GET ${API_BASE}/network/search?q=${query}
    await delay(600);
    return { farmers: DEMO_FARMERS.filter(f => f.name.toLowerCase().includes(query.toLowerCase()) || f.specialty.toLowerCase().includes(query.toLowerCase())) };
  },
  fetchNetworkStats: async () => {
    // TODO: GET ${API_BASE}/network/stats
    await delay(300);
    return { stats: { connections: 124, followers: 2450, following: 1203, pendingRequests: 3 } };
  },
};

// ============================================================================
// DEMO DATA
// ============================================================================
const DEMO_FARMERS = [
  { _id: 'f1', name: 'Sunita Devi', avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop', specialty: 'Organic Vegetables', state: 'Punjab', followers: 3200, mutualConnections: 12, verified: true, connected: false, requested: false, crops: ['Tomato', 'Onion', 'Capsicum'], experience: '8 years' },
  { _id: 'f2', name: 'Ramesh Yadav', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop', specialty: 'Rice Cultivation', state: 'West Bengal', followers: 1890, mutualConnections: 7, verified: false, connected: false, requested: false, crops: ['Rice', 'Jute'], experience: '15 years' },
  { _id: 'f3', name: 'Meena Kumari', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop', specialty: 'Dairy & Poultry', state: 'Haryana', followers: 4100, mutualConnections: 19, verified: true, connected: false, requested: false, crops: ['Wheat', 'Fodder'], experience: '20 years' },
  { _id: 'f4', name: 'Deepak Patil', avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop', specialty: 'Sugarcane & Cotton', state: 'Maharashtra', followers: 2750, mutualConnections: 4, verified: true, connected: false, requested: false, crops: ['Sugarcane', 'Cotton'], experience: '10 years' },
  { _id: 'f5', name: 'Kavita Sharma', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop', specialty: 'Horticulture', state: 'Himachal Pradesh', followers: 980, mutualConnections: 2, verified: false, connected: false, requested: false, crops: ['Apple', 'Mango', 'Grapes'], experience: '6 years' },
  { _id: 'f6', name: 'Arjun Nair', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', specialty: 'Coconut Farming', state: 'Kerala', followers: 1560, mutualConnections: 9, verified: true, connected: false, requested: false, crops: ['Coconut', 'Banana', 'Rubber'], experience: '18 years' },
];

const DEMO_CONNECTIONS = [
  { _id: 'c1', name: 'Priya Singh', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop', specialty: 'Vegetable Farmer', state: 'Uttar Pradesh', connectedSince: '6 months ago', verified: true },
  { _id: 'c2', name: 'Amit Patel', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', specialty: 'Sugarcane Consultant', state: 'Gujarat', connectedSince: '1 year ago', verified: false },
  { _id: 'c3', name: 'Neha Sharma', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop', specialty: 'Rice Farmer', state: 'Bihar', connectedSince: '3 months ago', verified: true },
];

const DEMO_REQUESTS = [
  { _id: 'r1', sender: { _id: 'u10', name: 'Vikram Singh', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop', specialty: 'Wheat Farmer', state: 'Rajasthan', mutualConnections: 5 }, sentAt: '2 days ago' },
  { _id: 'r2', sender: { _id: 'u11', name: 'Anita Gupta', avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop', specialty: 'Floriculture Expert', state: 'Karnataka', mutualConnections: 3 }, sentAt: '4 days ago' },
  { _id: 'r3', sender: { _id: 'u12', name: 'Mohan Das', avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=400&h=400&fit=crop', specialty: 'Fishery Farmer', state: 'Odisha', mutualConnections: 1 }, sentAt: '1 week ago' },
];

const SPECIALTIES = ['All', 'Organic Vegetables', 'Rice Cultivation', 'Dairy & Poultry', 'Sugarcane & Cotton', 'Horticulture', 'Wheat Farming', 'Coconut Farming'];
const STATES = ['All', 'Punjab', 'West Bengal', 'Haryana', 'Maharashtra', 'Himachal Pradesh', 'Kerala', 'Uttar Pradesh', 'Gujarat', 'Bihar', 'Rajasthan'];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse shadow-sm">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    </div>
    <div className="h-8 bg-gray-100 rounded-xl" />
  </div>
);

const StatCard = ({ icon, label, value, color }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      {icon}
    </div>
    <p className="text-2xl font-black text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
  </div>
);

const ConnectionRequestCard = ({ request, onAccept, onDecline }) => {
  const [loading, setLoading] = useState(null);
  const [done, setDone] = useState(false);
  const [action, setAction] = useState(null);

  const handle = async (type) => {
    setLoading(type);
    try {
      if (type === 'accept') await networkApi.acceptRequest(request._id);
      else await networkApi.declineRequest(request._id);
      setAction(type);
      setDone(true);
      setTimeout(() => {
        if (type === 'accept') onAccept(request._id);
        else onDecline(request._id);
      }, 800);
    } catch { } finally { setLoading(null); }
  };

  if (done) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
      {action === 'accept'
        ? <><CheckCircle size={20} className="text-green-500 flex-shrink-0" /><span className="text-sm text-gray-600 font-medium">Connected with <strong>{request.sender.name}</strong></span></>
        : <><X size={20} className="text-gray-400 flex-shrink-0" /><span className="text-sm text-gray-400">Request declined</span></>}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <img src={request.sender.avatar} alt={request.sender.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-green-100" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm truncate">{request.sender.name}</p>
          <p className="text-xs text-gray-500 truncate">{request.sender.specialty}</p>
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={10} className="text-gray-400" />
            <span className="text-xs text-gray-400">{request.sender.state}</span>
            <span className="text-xs text-gray-300 mx-1">•</span>
            <Users size={10} className="text-green-600" />
            <span className="text-xs text-green-600 font-medium">{request.sender.mutualConnections} mutual</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{request.sentAt}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => handle('accept')} disabled={loading !== null}
          className="flex-1 py-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-1">
          {loading === 'accept' ? <Loader size={12} className="animate-spin" /> : <UserCheck size={12} />} Accept
        </button>
        <button onClick={() => handle('decline')} disabled={loading !== null}
          className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 transition disabled:opacity-50 flex items-center justify-center gap-1">
          {loading === 'decline' ? <Loader size={12} className="animate-spin" /> : <X size={12} />} Decline
        </button>
      </div>
    </div>
  );
};

const FarmerCard = ({ farmer, onConnect }) => {
  const [status, setStatus] = useState(farmer.connected ? 'connected' : farmer.requested ? 'requested' : 'none');
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (status !== 'none') return;
    setLoading(true);
    try {
      await networkApi.sendConnectionRequest(farmer._id);
      setStatus('requested');
      onConnect?.(farmer._id);
    } catch { } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={farmer.avatar} alt={farmer.name} className="w-14 h-14 rounded-full object-cover border-2 border-green-100 group-hover:border-green-300 transition-colors" />
            {farmer.verified && <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white"><CheckCircle size={10} className="text-white" /></span>}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">{farmer.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{farmer.specialty}</p>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={10} className="text-gray-400" />
              <span className="text-xs text-gray-400">{farmer.state}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-green-700">{(farmer.followers / 1000).toFixed(1)}k</p>
          <p className="text-xs text-gray-400">followers</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {farmer.crops.slice(0, 3).map(crop => (
          <span key={crop} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100">
            {crop}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-1 mb-3 text-xs text-gray-500">
        <Users size={11} className="text-green-600" />
        <span className="text-green-600 font-semibold">{farmer.mutualConnections} mutual connections</span>
        <span className="text-gray-300 mx-1">•</span>
        <span>{farmer.experience}</span>
      </div>

      <button onClick={handleConnect} disabled={status !== 'none' || loading}
        className={`w-full py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
          status === 'connected' ? 'bg-green-50 text-green-700 border border-green-200 cursor-default' :
          status === 'requested' ? 'bg-gray-50 text-gray-500 border border-gray-200 cursor-default' :
          'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md'
        }`}>
        {loading ? <Loader size={12} className="animate-spin" /> :
         status === 'connected' ? <><UserCheck size={12} /> Connected</> :
         status === 'requested' ? <><CheckCircle size={12} /> Request Sent</> :
         <><UserPlus size={12} /> Connect</>}
      </button>
    </div>
  );
};

const ConnectionCard = ({ connection, onRemove }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removed, setRemoved] = useState(false);

  const handleRemove = async () => {
    setLoading(true);
    try {
      await networkApi.removeConnection(connection._id);
      setRemoved(true);
      setTimeout(() => onRemove(connection._id), 500);
    } catch { } finally { setLoading(false); setMenuOpen(false); }
  };

  if (removed) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-3">
      <img src={connection.avatar} alt={connection.name} className="w-12 h-12 rounded-full object-cover border-2 border-green-100 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm truncate">{connection.name}</p>
        <p className="text-xs text-gray-500 truncate">{connection.specialty}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin size={9} className="text-gray-400" />
          <span className="text-xs text-gray-400">{connection.state}</span>
          <span className="text-gray-300 mx-1 text-xs">•</span>
          <span className="text-xs text-gray-400">Since {connection.connectedSince}</span>
        </div>
      </div>
      <div className="flex gap-1">
        <button onClick={() => {}} className="p-2 hover:bg-green-50 rounded-xl transition text-gray-500 hover:text-green-700">
          <MessageSquare size={15} />
        </button>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400">
            <ChevronDown size={15} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-10 py-1 min-w-[140px]">
              <button onClick={handleRemove} disabled={loading} className="w-full px-4 py-2 text-xs text-red-500 hover:bg-red-50 text-left flex items-center gap-2 font-medium">
                {loading ? <Loader size={12} className="animate-spin" /> : <X size={12} />} Remove Connection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN NETWORK PAGE
// ============================================================================
const NetworkPage = () => {
  const [activeTab, setActiveTab] = useState('discover');
  const [farmers, setFarmers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [farmersRes, connectionsRes, requestsRes, statsRes] = await Promise.all([
        networkApi.fetchSuggestedFarmers(),
        networkApi.fetchConnections(),
        networkApi.fetchConnectionRequests(),
        networkApi.fetchNetworkStats(),
      ]);
      setFarmers(farmersRes.farmers);
      setConnections(connectionsRes.connections);
      setRequests(requestsRes.requests);
      setStats(statsRes.stats);
    } catch {
      setError('Failed to load network data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { loadData(); return; }
    setSearching(true);
    try {
      const { farmers: results } = await networkApi.searchFarmers(q);
      setFarmers(results);
    } catch { } finally { setSearching(false); }
  };

  const filteredFarmers = farmers.filter(f => {
    if (selectedSpecialty !== 'All' && f.specialty !== selectedSpecialty) return false;
    if (selectedState !== 'All' && f.state !== selectedState) return false;
    return true;
  });

  const tabs = [
    { id: 'discover', label: 'Discover', count: null },
    { id: 'connections', label: 'My Connections', count: connections.length },
    { id: 'requests', label: 'Requests', count: requests.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Users size={22} className="text-green-600" /> Farmer Network
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Connect with farmers across India</p>
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition ${showFilters ? 'bg-green-50 text-green-700 border-green-200' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <Filter size={15} /> Filters
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            {searching ? <Loader size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-600 animate-spin" /> :
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />}
            <input type="search" value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search farmers by name, specialty, or crop..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-200 focus:bg-white transition" />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-3 flex flex-wrap gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Specialty</label>
                <select value={selectedSpecialty} onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-200 bg-white">
                  {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">State</label>
                <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-200 bg-white">
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={() => { setSelectedSpecialty('All'); setSelectedState('All'); }}
                className="self-end text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 py-1.5">
                <X size={12} /> Clear
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition relative ${activeTab === tab.id ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full font-bold ${activeTab === tab.id ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard icon={<Users size={18} className="text-green-700" />} label="Connections" value={stats.connections} color="bg-green-50" />
            <StatCard icon={<TrendingUp size={18} className="text-blue-700" />} label="Followers" value={stats.followers.toLocaleString()} color="bg-blue-50" />
            <StatCard icon={<Globe size={18} className="text-purple-700" />} label="Following" value={stats.following.toLocaleString()} color="bg-purple-50" />
            <StatCard icon={<Star size={18} className="text-orange-700" />} label="Pending" value={stats.pendingRequests} color="bg-orange-50" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-white rounded-2xl border border-red-100 p-8 text-center shadow-sm mb-6">
            <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold">{error}</p>
            <button onClick={loadData} className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2 mx-auto">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : filteredFarmers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                <div className="text-5xl mb-4">🌾</div>
                <p className="font-bold text-gray-900 text-lg">No farmers found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
                <button onClick={() => { setSearchQuery(''); setSelectedSpecialty('All'); setSelectedState('All'); loadData(); }}
                  className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFarmers.map(farmer => (
                  <FarmerCard key={farmer._id} farmer={farmer}
                    onConnect={(id) => setFarmers(prev => prev.map(f => f._id === id ? { ...f, requested: true } : f))} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
            ) : connections.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                <div className="text-5xl mb-4">🤝</div>
                <p className="font-bold text-gray-900 text-lg">No connections yet</p>
                <p className="text-gray-400 text-sm mt-2">Start connecting with farmers in your area</p>
                <button onClick={() => setActiveTab('discover')} className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition">
                  Discover Farmers
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map(c => (
                  <ConnectionCard key={c._id} connection={c} onRemove={(id) => setConnections(prev => prev.filter(x => x._id !== id))} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                <div className="text-5xl mb-4">📬</div>
                <p className="font-bold text-gray-900 text-lg">No pending requests</p>
                <p className="text-gray-400 text-sm mt-2">You're all caught up!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {requests.map(req => (
                  <ConnectionRequestCard key={req._id} request={req}
                    onAccept={(id) => setRequests(prev => prev.filter(r => r._id !== id))}
                    onDecline={(id) => setRequests(prev => prev.filter(r => r._id !== id))} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkPage;
