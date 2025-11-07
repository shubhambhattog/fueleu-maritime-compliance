"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import RoutesTab from "@/components/RoutesTab";
import CompareTab from "@/components/CompareTab";
import BankingTab from "@/components/BankingTab";
import PoolingTab from "@/components/PoolingTab";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/config/site";
import {
  RoutesTabSkeleton,
  CompareTabSkeleton,
  BankingTabSkeleton,
  PoolingTabSkeleton,
} from "@/components/skeletons";

type Tab = "routes" | "compare" | "banking" | "pooling";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("routes");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
            <Image 
              src={siteConfig.company.logo}
              alt={siteConfig.company.name}
              width={siteConfig.logos.navbar.width}
              height={siteConfig.logos.navbar.height}
              className={siteConfig.logos.navbar.className}
            />
            <h1 className="text-3xl font-bold">
              {siteConfig.pages.dashboard.title}
            </h1>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
          <TabsList className="mb-6">
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="compare">Compare</TabsTrigger>
            <TabsTrigger value="banking">Banking</TabsTrigger>
            <TabsTrigger value="pooling">Pooling</TabsTrigger>
          </TabsList>

          <Card className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <TabsContent value="routes">
              <Suspense fallback={<RoutesTabSkeleton />}>
                <RoutesTab />
              </Suspense>
            </TabsContent>
            <TabsContent value="compare">
              <Suspense fallback={<CompareTabSkeleton />}>
                <CompareTab />
              </Suspense>
            </TabsContent>
            <TabsContent value="banking">
              <Suspense fallback={<BankingTabSkeleton />}>
                <BankingTab />
              </Suspense>
            </TabsContent>
            <TabsContent value="pooling">
              <Suspense fallback={<PoolingTabSkeleton />}>
                <PoolingTab />
              </Suspense>
            </TabsContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}
