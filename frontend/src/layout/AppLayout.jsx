import React from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const drawerWidth = 240;

export default function AppLayout({ children, title }) {
  // Estado para controlar sidebar en móvil si fuera necesario, 
  // por ahora asumimos layout desktop responsive básico con Tailwind
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-[#0a0033] overflow-hidden">
      {/* Background effects global for the app */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0033] to-[#0a0033]"></div>
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-brand-accent/5 blur-[100px]"></div>
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-4 md:p-6 scrollbar-thin scrollbar-thumb-indigo-900 scrollbar-track-transparent">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
