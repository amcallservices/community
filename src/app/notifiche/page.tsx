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
    <div className="min-h-screen bg-ivory p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-navy/60 hover:text-navy"><Home className="w-6 h-6" /></Link>
          <h1 className="text-2xl font-bold text-navy">Notifiche</h1>
        </div>

        {loading ? (
          <div className="text-navy/60 text-center py-8">Caricamento...</div>
        ) : notifications.length === 0 ? (
          <div className="text-navy/60 text-center py-8">Nessuna notifica</div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <Link 
                key={notif.id} 
                href={notif.postId ? `/community#post-${notif.postId}` : '/community'}
                className="block bg-white rounded-2xl shadow-sm p-4 border border-line hover:bg-ivory2"
              >
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-golddark mt-1" />
                  <div>
                    <p className="text-navy">{notif.message}</p>
                    <p className="text-navy/60 text-sm mt-1">
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
