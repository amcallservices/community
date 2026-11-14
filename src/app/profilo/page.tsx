"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileView from "@/components/ProfileView";

export default function ProfiloPage() {
  const router = useRouter();
  const [id, setId] = useState<number | null>(null);
  useEffect(() => {
    const s = localStorage.getItem("user");
    if (!s) { router.push("/login"); return; }
    setId(JSON.parse(s).id);
  }, [router]);
  return id ? <ProfileView id={id} /> : null;
}
