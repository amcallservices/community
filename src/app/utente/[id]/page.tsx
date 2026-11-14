"use client";
import { use } from "react";
import ProfileView from "@/components/ProfileView";

export default function UtentePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ProfileView id={id} />;
}
