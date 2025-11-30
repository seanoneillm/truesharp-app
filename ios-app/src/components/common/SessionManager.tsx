import React from 'react';
import { useSessionManager } from '../../hooks/useSessionManager';

const SessionManager: React.FC = () => {
  useSessionManager();
  return null;
};

export default SessionManager;