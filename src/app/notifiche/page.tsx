"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Home } from "lucide-react";

export default function NotifichePage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      loadNotifications(user.email);
    } else {
      setLoading(false);
    }
  }, []);

  const loadNotifications = async (email: string) => {
    try {
      const res = await fetch(`/api/notifications?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-slate-400 hover:text-white"><Home className="w-6 h-6" /></Link>
          <h1 className="text-2xl font-bold text-white">Notifiche</h1>
        </div>

        {loading ? (
          <div className="text-slate-400 text-center py-8">Caricamento...</div>
        ) : notifications.length === 0 ? (
          <div className="text-slate-400 text-center py-8">Nessuna notifica</div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <Link 
                key={notif.id} 
                href={notif.postId ? `/community#post-${notif.postId}` : '/community'}
                className="block bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/20"
              >
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-amber-400 mt-1" />
                  <div>
                    <p className="text-white">{notif.message}</p>
                    <p className="text-slate-500 text-sm mt-1">
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString('it-IT') : ''}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
