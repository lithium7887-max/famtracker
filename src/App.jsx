import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import MapComponent from './components/Map';
import { Users, LogOut, MapPin, Settings } from 'lucide-react';

const App = () => {
  const [session, setSession] = useState(null);
  const [members, setMembers] = useState([]);

  // Basic rendering check to ensure we don't return null and cause a white screen
  console.log("App Rendering - Session:", !!session);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      // Start tracking location
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (!supabase) return;
          const { latitude, longitude } = position.coords;
          updateLocationInSupabase(latitude, longitude);
        },
        (error) => console.error(error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );

      // Fetch member locations
      fetchMembers();

      // Real-time subscription
      const channel = supabase
        .channel('public:locations')
        .on('postgres_changes', { event: '*', table: 'locations' }, () => {
          fetchMembers();
        })
        .subscribe();

      return () => {
        navigator.geolocation.clearWatch(watchId);
        supabase.removeChannel(channel);
      };
    }
  }, [session]);

  const fetchMembers = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, lat, lng, updated_at');
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error("Fetch members error:", err);
    }
  };

  const updateLocationInSupabase = async (lat, lng) => {
    if (!session || !supabase) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          lat,
          lng,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
    } catch (err) {
      console.error("Update location error:", err);
    }
  };

  if (!session) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bg-dark p-6">
        <Auth />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-bg-dark overflow-hidden">
      {/* Background Map - Guaranteed 100% */}
      <div className="absolute inset-0 z-0">
        <MapComponent members={members} />
      </div>

      {/* Floating Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20 pointer-events-none">
        <div className="bg-bg-dark/80 backdrop-blur-md px-4 py-2 rounded-full border border-glass-border flex items-center gap-2 pointer-events-auto shadow-xl">
          <MapPin className="text-primary" size={16} />
          <span className="text-sm font-bold">Family Trace</span>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="bg-bg-dark/80 backdrop-blur-md p-2 rounded-full border border-glass-border text-text-muted hover:text-red-400 pointer-events-auto shadow-xl"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Floating Bottom Card */}
      <aside className="absolute bottom-6 left-4 right-4 max-h-[30dvh] bg-bg-dark/95 backdrop-blur-xl rounded-3xl border border-glass-border flex flex-col z-10 shadow-2xl overflow-hidden pointer-events-auto">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between px-2 mb-1">
            <h2 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Family Members</h2>
            <Users size={14} className="text-text-muted" />
          </div>

          {!members.length && (
            <div className="text-center py-4 text-text-muted text-xs italic">
              Searching for locations...
            </div>
          )}

          {members && members.map(member => {
            if (!member || !member.id) return null;
            const name = member.name || 'Anonymous';
            const initial = name[0] || '?';
            const time = member.updated_at ? new Date(member.updated_at).toLocaleTimeString() : 'N/A';

            return (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase text-xs">
                  {initial}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium truncate text-xs">{name}</p>
                </div>
                {session && session.user && member.id === session.user.id && (
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

export default App;
