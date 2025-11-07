"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch('http://localhost:4000/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (error) {
        setBackendStatus('offline');
      }
    };

    checkBackendHealth();
    // Check every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <main className="flex w-full max-w-4xl flex-col gap-8 p-8">
        <div className="flex flex-col gap-4 text-center items-center">
          <Image 
            src={siteConfig.company.logo}
            alt={siteConfig.company.name}
            width={siteConfig.logos.home.width}
            height={siteConfig.logos.home.height}
            className={siteConfig.logos.home.className}
            priority
          />
          <h1 className="text-5xl font-bold tracking-tight">
            {siteConfig.pages.home.title}
          </h1>
          <p className="text-xl text-muted-foreground">
            {siteConfig.pages.home.subtitle}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/dashboard" className="cursor-pointer group">
            <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Dashboard
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </CardTitle>
                <CardDescription>
                  Access routes, comparison, banking, and pooling features
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
          
          <a
            href={siteConfig.links.apiDocs}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer group"
          >
            <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  API Docs
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span>Test backend endpoints directly</span>
                  {backendStatus === 'checking' && (
                    <Badge variant="outline" className="gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Checking...
                    </Badge>
                  )}
                  {backendStatus === 'online' && (
                    <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Backend Online
                    </Badge>
                  )}
                  {backendStatus === 'offline' && (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Backend Offline
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
          </a>
        </div>
      </main>
    </div>
  );
}
