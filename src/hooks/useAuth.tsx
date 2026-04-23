import { useEffect, useState } from "react";
import  supabase  from "../supabaseClient";

const useAuth = () => {
  const [session, setSession] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error) {
        setSession(data.session);
        setIsAuthenticated(!!data.session);
        console.log("Current Session:", data.session); // ✅ Debugging
      } else {
        console.error("Error fetching session:", error);
      }
    };

    fetchSession();

    // ✅ Listen for session changes (Login, Logout, Refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAuthenticated(!!session);
      console.log("Auth state changed. New Session:", session); // ✅ Debugging
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return { session, isAuthenticated };
};

export default useAuth;
