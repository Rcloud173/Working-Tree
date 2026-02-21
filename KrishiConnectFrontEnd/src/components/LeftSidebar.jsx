import React, { memo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, Users, Briefcase, MessageSquare, Bell, User, Settings, Menu, ChevronDown, ChevronUp, LogIn, CloudRain, BarChart2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

// ============================================================================
// LEFT SIDEBAR COMPONENT
// ============================================================================
const LeftSidebar = ({ open, setOpen, notificationCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = !!user;
  const profilePhotoUrl =
    (user?.profilePhoto && (typeof user.profilePhoto === 'string' ? user.profilePhoto : user.profilePhoto?.url)) ||
    (user?.avatar && (typeof user.avatar === 'string' ? user.avatar : user.avatar?.url));

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', route: '/' },
    { id: 'network', icon: Users, label: 'Network', route: '/network' },
    { id: 'jobs', icon: Briefcase, label: 'Opportunities', badge: 'New', route: '/opportunities' },
    { id: 'messages', icon: MessageSquare, label: 'Messages', route: '/messages' },
    { id: 'notifications', icon: Bell, label: 'Alerts', badge: notificationCount > 0 ? notificationCount : null, route: '/alerts' },
    { id: 'weather', icon: CloudRain, label: 'Weather', route: '/weather' },
    { id: 'market', icon: BarChart2, label: 'Market', route: '/market' },
    { id: 'profile', icon: User, label: 'Profile', route: '/profile' },
  ];

  // Determine active nav based on current route
  const getActiveNav = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/network')) return 'network';
    if (path.startsWith('/opportunities') || path.startsWith('/jobs')) return 'jobs';
    if (path.startsWith('/messages')) return 'messages';
    if (path.startsWith('/alerts') || path.startsWith('/notifications')) return 'notifications';
    if (path.startsWith('/weather')) return 'weather';
    if (path.startsWith('/market')) return 'market';
    if (path.startsWith('/profile')) return 'profile';
    return 'home';
  };

  const activeNav = getActiveNav();

  const handleNavClick = (item) => {
    navigate(item.route);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-white border-r border-gray-100 z-40 transition-all duration-300 ${open ? 'w-60' : 'w-20'} overflow-hidden shadow-sm`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between min-h-[64px]">
          {open && <span className="text-xl font-black text-green-700 whitespace-nowrap">🌾 KrishiConnect</span>}
          <button
            onClick={() => setOpen(!open)}
            className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500 flex-shrink-0 ml-auto"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative ${
                activeNav === item.id
                  ? 'bg-green-50 text-green-700 font-bold'
                  : 'text-gray-600 hover:bg-gray-50'
              } ${!open ? 'justify-center' : ''}`}
              title={!open ? item.label : ''}
            >
              <item.icon size={19} className="flex-shrink-0" />
              {open && <span className="text-sm flex-1 text-left">{item.label}</span>}
              {open && item.badge && (
                <span className={`text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ${
                  item.badge === 'New' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {item.badge === 'New' ? '!' : item.badge}
                </span>
              )}
              {!open && item.badge && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
              )}
            </button>
          ))}
        </nav>

        {/* Settings & Auth */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <button
            onClick={() => navigate('/settings')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition ${!open ? 'justify-center' : ''}`}
          >
            <Settings size={19} />
            {open && <span className="text-sm">Settings</span>}
          </button>
          {isLoggedIn ? (
            <button
              onClick={() => navigate(user?._id ? `/profile/${user._id}` : '/profile')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-emerald-600 hover:bg-emerald-50 transition ${!open ? 'justify-center' : ''}`}
            >
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-emerald-600" />
                </div>
              )}
              {open && <span className="text-sm font-medium truncate">{user?.name || 'Profile'}</span>}
            </button>
          ) : (
            <Link
              to="/login"
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-emerald-600 hover:bg-emerald-50 transition ${!open ? 'justify-center' : ''}`}
            >
              <LogIn size={19} />
              {open && <span className="text-sm font-medium">Log in</span>}
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile FAB (Floating Action Button) */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed bottom-20 right-4 bg-green-600 text-white p-3 rounded-full shadow-xl hover:bg-green-700 transition z-50"
      >
        <Menu size={22} />
      </button>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      {open && (
        <aside className="lg:hidden fixed left-0 top-0 h-screen bg-white z-50 w-72 shadow-2xl animate-slide-in">
          {/* Logo */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between min-h-[64px]">
            <span className="text-xl font-black text-green-700 whitespace-nowrap">🌾 KrishiConnect</span>
            <button
              onClick={() => setOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500"
            >
              <Menu size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  handleNavClick(item);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative ${
                  activeNav === item.id
                    ? 'bg-green-50 text-green-700 font-bold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon size={19} className="flex-shrink-0" />
                <span className="text-sm flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className={`text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ${
                    item.badge === 'New' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {item.badge === 'New' ? '!' : item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Settings & Auth */}
          <div className="p-3 border-t border-gray-100 space-y-1">
            <button
              onClick={() => {
                navigate('/settings');
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition"
            >
              <Settings size={19} />
              <span className="text-sm">Settings</span>
            </button>
            {isLoggedIn ? (
              <button
                onClick={() => {
                  navigate(user?._id ? `/profile/${user._id}` : '/profile');
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-emerald-600 hover:bg-emerald-50 transition"
              >
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-emerald-600" />
                  </div>
                )}
                <span className="text-sm font-medium truncate">{user?.name || 'Profile'}</span>
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-emerald-600 hover:bg-emerald-50 transition"
              >
                <LogIn size={19} />
                <span className="text-sm font-medium">Log in</span>
              </Link>
            )}
          </div>
        </aside>
      )}
    </>
  );
};

export default memo(LeftSidebar);
