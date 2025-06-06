import React from 'react';
import { UserAvatar } from './UserAvatar';
import { Dropdown } from './Dropdown';

interface User {
  full_name?: string;
  avatar_url?: string;
  email?: string;
}

interface HeaderProps {
  user?: User | null;
  onSignOut: () => void;
  onProfile?: () => void;
  onSettings?: () => void;
  title?: string;
  children?: React.ReactNode;
}

export function Header({ 
  user, 
  onSignOut, 
  onProfile, 
  onSettings, 
  title = "HomeBudget",
  children 
}: HeaderProps) {
  
  const dropdownItems = [
    {
      label: user?.full_name || user?.email || 'User',
      onClick: () => {},
      type: 'button' as const,
      className: 'font-medium text-slate-900 cursor-default hover:bg-transparent px-4 py-3',
      icon: (
        <UserAvatar user={user} size="sm" />
      )
    },
    {
      label: '',
      onClick: () => {},
      type: 'divider' as const
    },
    ...(onProfile ? [{
      label: 'View Profile',
      onClick: onProfile,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }] : []),
    ...(onSettings ? [{
      label: 'Settings',
      onClick: onSettings,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }] : []),
    {
      label: '',
      onClick: () => {},
      type: 'divider' as const
    },
    {
      label: 'Sign Out',
      onClick: onSignOut,
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      )
    }
  ];

  return (
    <header 
      className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                {title}
              </h1>
            </div>
            {/* Navigation */}
            {children && (
              <nav 
                className="hidden md:ml-8 md:flex md:items-center md:space-x-1"
                role="navigation"
                aria-label="Main navigation"
              >
                {children}
              </nav>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            {user ? (
              <Dropdown
                trigger={
                  <button
                    className="flex items-center p-1 rounded-full transition-all duration-200 hover:bg-slate-100/70 focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2"
                    aria-label={`User menu for ${user?.full_name || user?.email}`}
                  >
                    <UserAvatar 
                      user={user} 
                      size="md" 
                      onClick={() => {}} 
                      className="ring-2 ring-transparent hover:ring-slate-300/50"
                    />
                  </button>
                }
                items={dropdownItems}
                align="right"
              />
            ) : (
              <div className="text-sm text-slate-500">
                Not signed in
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation - shown when needed */}
      {children && (
        <div className="md:hidden border-t border-slate-200/60 bg-white/90 backdrop-blur-xl">
          <nav 
            className="px-4 py-2 space-y-1"
            role="navigation"
            aria-label="Mobile navigation"
          >
            {children}
          </nav>
        </div>
      )}
    </header>
  );
} 