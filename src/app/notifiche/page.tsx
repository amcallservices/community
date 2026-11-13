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
    <div className="min-h-screen bg-ink p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-surface/80 hover:text-paper"><Home className="w-6 h-6" /></Link>
          <h1 className="text-2xl font-bold text-paper">Notifiche</h1>
        </div>

        {loading ? (
          <div className="text-surface/80 text-center py-8">Caricamento...</div>
        ) : notifications.length === 0 ? (
          <div className="text-surface/80 text-center py-8">Nessuna notifica</div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <Link 
                key={notif.id} 
                href={notif.postId ? `/community#post-${notif.postId}` : '/community'}
                className="block bg-card p-4 border border-card2 hover:bg-card2"
              >
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-brass mt-1" />
                  <div>
                    <p className="text-paper">{notif.message}</p>
                    <p className="text-surface/80 text-sm mt-1">
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
