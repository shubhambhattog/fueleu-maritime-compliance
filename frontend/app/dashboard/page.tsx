"use client";

import { useState } from "react";
import RoutesTab from "@/components/RoutesTab";
import CompareTab from "@/components/CompareTab";
import BankingTab from "@/components/BankingTab";
import PoolingTab from "@/components/PoolingTab";

type Tab = "routes" | "compare" | "banking" | "pooling";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("routes");

  const tabs = [
    { id: "routes" as Tab, label: "Routes" },
    { id: "compare" as Tab, label: "Compare" },
    { id: "banking" as Tab, label: "Banking" },
    { id: "pooling" as Tab, label: "Pooling" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            FuelEU Compliance Dashboard
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          {activeTab === "routes" && <RoutesTab />}
          {activeTab === "compare" && <CompareTab />}
          {activeTab === "banking" && <BankingTab />}
          {activeTab === "pooling" && <PoolingTab />}
        </div>
      </div>
    </div>
  );
}
