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
          setUserLocation({ lat: latitude, lng: longitude });
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
    return <Auth />;
  }

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-bg-dark overflow-hidden p-2 md:p-0">
      {/* Main Map Area */}
      <main className="relative flex flex-col order-1 md:order-2 flex-7 md:flex-1 md:m-4 md:ml-0 glass-morphism shadow-2xl overflow-hidden mb-2 md:mb-0">
        <MapComponent members={members} />
      </main>

      {/* Sidebar */}
      <aside className="w-full md:w-80 glass-morphism flex flex-col shadow-2xl order-2 md:order-1 flex-3 md:h-auto md:m-4 overflow-hidden">
        <div className="p-3 md:p-6 border-b border-glass-border flex justify-between items-center bg-white/5">
          <h1 className="text-base md:text-xl font-bold flex items-center gap-2">
            <MapPin className="text-primary" size={18} /> Family
          </h1>
          <button onClick={() => supabase.auth.signOut()} className="text-text-muted hover:text-red-400 p-1">
            <LogOut size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-4">
          <div className="flex items-center justify-between px-2 py-1">
            <h2 className="text-[10px] md:text-xs font-semibold text-text-muted uppercase tracking-wider">Members</h2>
            <Users size={14} className="text-text-muted" />
          </div>

          {members && members.map(member => {
            if (!member || !member.id) return null;
            const name = member.name || 'Anonymous';
            const initial = name[0] || '?';
            const time = member.updated_at ? new Date(member.updated_at).toLocaleTimeString() : 'N/A';

            return (
              <div key={member.id} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg md:rounded-xl bg-bg-card border border-glass-border hover:border-primary transition-colors cursor-pointer">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold uppercase text-xs md:text-base">
                  {initial}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium truncate text-xs md:text-base">{name}</p>
                  <p className="text-[10px] md:text-xs text-text-muted truncate">{time}</p>
                </div>
                {session && session.user && member.id === session.user.id && (
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        <div className="p-2 md:p-4 border-t border-glass-border bg-white/5">
          <button className="w-full py-2 md:py-3 flex items-center justify-center gap-2 text-text-muted hover:text-text-main transition-colors text-xs md:text-base">
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

export default App;
