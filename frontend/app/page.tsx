import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <main className="flex w-full max-w-4xl flex-col gap-8 p-8">
        <div className="flex flex-col gap-4 text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            FuelEU Maritime Compliance
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage routes, compare compliance balance, handle banking and pooling operations.
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
            href="http://localhost:4000/routes"
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
                <CardDescription>
                  Test backend endpoints directly (backend must be running)
                </CardDescription>
              </CardHeader>
            </Card>
          </a>
        </div>
      </main>
    </div>
  );
}
