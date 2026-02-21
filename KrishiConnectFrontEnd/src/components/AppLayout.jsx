import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';

// ============================================================================
// APP LAYOUT – Shared sidebar + Outlet for Home, Profile, etc.
// ============================================================================
const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationCount] = useState(5); // TODO: Fetch from API

  return (
    <div className="bg-gray-50 min-h-screen">
      <LeftSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        notificationCount={notificationCount}
      />
      <div className={`transition-all duration-300 bg-gray-50 min-h-screen ${sidebarOpen ? 'lg:ml-60' : 'lg:ml-20'}`}>
        <Outlet context={{ sidebarOpen, setSidebarOpen }} />
      </div>
    </div>
  );
};

export default AppLayout;
