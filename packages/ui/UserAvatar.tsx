import React from 'react';

interface UserAvatarProps {
  user?: {
    full_name?: string;
    avatar_url?: string;
    email?: string;
  } | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg'
};

export function UserAvatar({ user, size = 'md', className = '', onClick }: UserAvatarProps) {
  if (!user) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full bg-gray-300 flex items-center justify-center ${className} ${onClick ? 'cursor-pointer hover:bg-gray-400 transition-colors' : ''}`}
        onClick={onClick}
      >
        <svg className="w-1/2 h-1/2 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
    );
  }

  const getInitials = () => {
    if (user.full_name) {
      return user.full_name
        .split(' ')
        .map(name => name.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.full_name || user.email || 'User avatar'}
        className={`${sizeClasses[size]} rounded-full object-cover ${className} ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all' : ''}`}
        onClick={onClick}
        onError={(e) => {
          // If image fails to load, replace with initials
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = `
              <div class="${sizeClasses[size]} rounded-full bg-blue-500 flex items-center justify-center text-white font-medium ${className} ${onClick ? 'cursor-pointer hover:bg-blue-600 transition-colors' : ''}">
                ${getInitials()}
              </div>
            `;
          }
        }}
      />
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full bg-blue-500 flex items-center justify-center text-white font-medium ${className} ${onClick ? 'cursor-pointer hover:bg-blue-600 transition-colors' : ''}`}
      onClick={onClick}
    >
      {getInitials()}
    </div>
  );
} 