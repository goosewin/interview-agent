'use client';

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk();
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      try {
        await handleRedirectCallback({
          redirectUrl: window.location.href,
        });
        router.push("/dashboard");
      } catch (err) {
        console.error("Error handling callback:", err);
        router.push("/sign-in");
      }
    }
    handleCallback();
  }, [handleRedirectCallback, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-semibold">Completing sign in...</h2>
        <p className="text-muted-foreground">You will be redirected shortly.</p>
      </div>
    </div>
  );
} 
