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
    <div className="h-screen w-screen flex flex-col md:flex-row bg-bg-dark overflow-hidden">
      {/* Map Area - 70% of height on mobile, full height on desktop */}
      <main className="w-full h-[70dvh] md:h-full md:flex-1 relative z-0">
        <MapComponent members={members} />

        {/* Overlay Header - Mobile Only */}
        <div className="md:hidden absolute top-4 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
          <div className="bg-bg-dark/80 backdrop-blur-md px-4 py-2 rounded-full border border-glass-border flex items-center gap-2 pointer-events-auto shadow-lg">
            <MapPin className="text-primary" size={16} />
            <span className="text-sm font-bold">Family Trace</span>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="bg-bg-dark/80 backdrop-blur-md p-2 rounded-full border border-glass-border text-text-muted pointer-events-auto"
          >
            <LogOut size={18} />
          </button>
        </div>
      </main>

      {/* Sidebar - Bottom half on mobile, side on desktop */}
      <aside className="flex-1 md:w-sidebar md:max-w-md bg-bg-dark md:border-l border-glass-border flex flex-col z-10 overflow-hidden shadow-[0_-10px_30px_rgba(0,0,0,0.5)] md:shadow-none">
        <div className="p-4 md:p-6 border-b border-glass-border hidden md:flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="text-primary" size={24} /> Family
          </h1>
          <button onClick={() => supabase.auth.signOut()} className="text-text-muted hover:text-red-400 p-1">
            <LogOut size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between px-2 mb-1">
            <h2 className="text-[10px] md:text-xs font-semibold text-text-muted uppercase tracking-wider">Active Members</h2>
            <Users size={14} className="text-text-muted" />
          </div>

          {!members.length && (
            <div className="text-center py-10 text-text-muted text-sm">
              Waiting for member locations...
            </div>
          )}

          {members && members.map(member => {
            if (!member || !member.id) return null;
            const name = member.name || 'Anonymous';
            const initial = name[0] || '?';
            const time = member.updated_at ? new Date(member.updated_at).toLocaleTimeString() : 'N/A';

            return (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-bg-card/40 border border-glass-border hover:border-primary/50 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase">
                  {initial}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium truncate text-sm md:text-base">{name}</p>
                  <p className="text-[10px] md:text-xs text-text-muted truncate">{time}</p>
                </div>
                {session && session.user && member.id === session.user.id && (
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-glass-border bg-bg-dark/50 hidden md:block">
          <button className="w-full py-3 flex items-center justify-center gap-2 text-text-muted hover:text-text-main transition-colors">
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

export default App;
