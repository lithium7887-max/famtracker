import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import MapComponent from './components/Map';
import { Users, LogOut, MapPin, Settings } from 'lucide-react';

function App() {
  const [session, setSession] = useState(null);
  const [members, setMembers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
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
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, lat, lng, updated_at');
    if (error) console.error(error);
    else setMembers(data || []);
  };

  const updateLocationInSupabase = async (lat, lng) => {
    if (!session) return;
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        lat,
        lng,
        updated_at: new Date().toISOString()
      });
    if (error) console.error(error);
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-bg-dark">
      {/* Sidebar */}
      <aside className="w-full md:w-80 glass-morphism m-4 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-glass-border flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="text-primary" /> Family Trace
          </h1>
          <button onClick={() => supabase.auth.signOut()} className="text-text-muted hover:text-red-400">
            <LogOut size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Members</h2>
            <button className="text-primary hover:text-primary-hover p-1">
              <Users size={16} />
            </button>
          </div>

          {members.map(member => (
            <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-glass-border hover:border-primary transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {member.name?.[0] || member.id[0].toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-medium truncate">{member.name || 'Anonymous'}</p>
                <p className="text-xs text-text-muted truncate">
                  {new Date(member.updated_at).toLocaleTimeString()}
                </p>
              </div>
              {member.id === session.user.id && (
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-glass-border">
          <button className="w-full py-3 flex items-center justify-center gap-2 text-text-muted hover:text-text-main transition-colors">
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Map Area */}
      <main className="flex-1 relative m-4 md:ml-0 glass-morphism shadow-2xl overflow-hidden">
        <MapComponent members={members} />
      </main>
    </div>
  );
}

export default App;
