import React, { createContext, useContext, useState } from 'react';

// Context for storing whether the current user is an admin.  The state is
// managed at the top level of the application.  When the password is
// successfully verified the flag becomes true until the session expires or
// the user locks the admin mode.
const AdminContext = createContext({
  isAdmin: false,
  setIsAdmin: () => {},
});

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  return (
    <AdminContext.Provider value={{ isAdmin, setIsAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}