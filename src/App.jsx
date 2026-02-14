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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg-dark p-4">
        <Auth />
        <div className="fixed bottom-4 right-4 text-[10px] text-text-muted opacity-50">System Active v2</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-bg-dark overflow-hidden relative">
      {/* Background Map - Reduced to 50% width and centered on mobile */}
      <main className="absolute inset-x-[25%] top-[15%] h-[40%] md:inset-auto md:relative md:flex-1 md:m-4 md:ml-0 md:rounded-xl md:border glass-morphism overflow-hidden z-0 shadow-2xl">
        <MapComponent members={members} />
      </main>

      {/* Brand Header Overlay - Mobile only */}
      <div className="md:hidden absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-[100] pointer-events-none">
        <div className="bg-bg-dark/80 backdrop-blur-md px-4 py-2 rounded-full border border-glass-border flex items-center gap-2 pointer-events-auto shadow-lg">
          <MapPin className="text-primary" size={16} />
          <span className="text-sm font-bold">Family Trace</span>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="bg-bg-dark/80 backdrop-blur-md p-2 rounded-full border border-glass-border text-text-muted hover:text-red-400 pointer-events-auto shadow-lg"
        >
          <LogOut size={18} />
        </button>
      </div>

      <div className="fixed bottom-2 right-2 text-[8px] text-primary font-bold z-[100]">System Active v3</div>

      {/* Sidebar / Bottom Sheet */}
      <aside className="absolute bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto md:w-sidebar md:max-w-md md:m-4 md:rounded-xl md:border glass-morphism flex flex-col z-10 max-h-[45dvh] md:max-h-none">
        {/* Handle for mobile swipe feel */}
        <div className="md:hidden flex justify-center p-2">
          <div className="w-12 h-1.5 bg-glass-border rounded-full" />
        </div>

        <div className="p-3 md:p-6 border-b border-glass-border hidden md:flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="text-primary" size={20} /> Family
          </h1>
          <button onClick={() => supabase.auth.signOut()} className="text-text-muted hover:text-red-400 p-1">
            <LogOut size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between px-2 mb-1">
            <h2 className="text-[10px] md:text-sm font-semibold text-text-muted uppercase tracking-wider">Family Members</h2>
            <Users size={14} className="text-text-muted" />
          </div>

          {members && members.map(member => {
            if (!member || !member.id) return null;
            const name = member.name || 'Anonymous';
            const initial = name[0] || '?';
            const time = member.updated_at ? new Date(member.updated_at).toLocaleTimeString() : 'N/A';

            return (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-bg-card/50 border border-glass-border hover:border-primary transition-colors cursor-pointer backdrop-blur-sm">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase text-sm md:text-base">
                  {initial}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium truncate text-sm md:text-base">{name}</p>
                  <p className="text-[10px] md:text-xs text-text-muted truncate">{time}</p>
                </div>
                {session && session.user && member.id === session.user.id && (
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                )}
              </div>
            );
          })}
        </div>

        <div className="p-2 md:p-4 border-t border-glass-border bg-white-low">
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
