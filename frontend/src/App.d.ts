import React from 'react';
import type { UserDetails } from './api/types';

export const UserContext: React.Context<{ user: UserDetails | null }>;
export const ThemeModeContext: React.Context<{ mode: 'light' | 'dark'; toggleMode: () => void }>;
export const ActivePanelContext: React.Context<{ activePanel: 'cfp' | 'terciario' | 'videojuegos'; setActivePanel: (panel: string) => void }>;
