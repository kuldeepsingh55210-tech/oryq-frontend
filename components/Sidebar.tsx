'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';

export type SidebarItem = 'dashboard' | 'history' | 'competitors' | 'hallucinations' | 'settings';

interface SidebarProps {
  activeItem: SidebarItem;
  onItemClick: (item: SidebarItem) => void;
}

export default function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as SidebarItem,
      label: 'Dashboard',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      id: 'history' as SidebarItem,
      label: 'History',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'competitors' as SidebarItem,
      label: 'Competitors',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
        </svg>
      ),
    },
    {
      id: 'hallucinations' as SidebarItem,
      label: 'Hallucinations',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      id: 'settings' as SidebarItem,
      label: 'Settings',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border-color flex flex-col h-full shrink-0 select-none">
      {/* Top Brand Logo Container */}
      <div className="p-6 border-b border-border-color flex items-center gap-3">
        <svg
          className="h-8 w-8 text-accent-blue"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-white tracking-wider leading-none">ORYQ</span>
          <span className="text-[9px] font-black text-slate-500 tracking-widest mt-0.5 uppercase">AI Intelligence</span>
        </div>
      </div>

      {/* Navigation Links Area */}
      <nav className="flex-1 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={`w-full flex items-center gap-3.5 px-6 py-3 text-sm font-semibold transition-all duration-150 border-l-[3px] cursor-pointer ${
                isActive
                  ? 'bg-blue-600/10 text-accent-blue border-accent-blue'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/10 border-transparent'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User profile & bottom CTA container */}
      <div className="p-4 border-t border-border-color space-y-3">
        {user ? (
          <div className="rounded-xl border border-border-color bg-slate-900/60 p-3 flex items-center justify-between">
            <div className="flex flex-col overflow-hidden pr-2">
              <span className="text-xs font-bold text-white truncate">{user.name}</span>
              <span className="text-[10px] text-slate-400 truncate uppercase font-mono">{user.role}</span>
            </div>
            <button
              onClick={logout}
              className="text-xs text-red-400 hover:text-red-300 font-semibold transition"
              title="Log out"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-2 text-xs">
            <Link href="/login" className="text-slate-300 hover:text-white font-medium">
              Log in
            </Link>
            <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-bold">
              Sign up
            </Link>
          </div>
        )}

        <button
          onClick={() => router.push('/')}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent-blue hover:bg-blue-500 text-white py-3 text-sm font-bold shadow-lg transition active:scale-[0.98] cursor-pointer"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>New Scan</span>
        </button>
      </div>
    </aside>
  );
}
