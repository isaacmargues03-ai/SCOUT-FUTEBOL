import fs from 'fs/promises';
import path from 'path';
import { DependencyTable } from '@/components/dependency-table';
import type { Dependency } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// This is a POC and reads the dev server's package.json.
// In a real-world scenario, you might upload a package.json or connect to a repo.
async function getDependencies(): Promise<Dependency[]> {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    const dependencies = packageJson.dependencies ? Object.entries(packageJson.dependencies).map(([name, version]) => ({
      name,
      version: (version as string).replace(/[\^~]/g, ''),
      type: 'dependency' as const,
      status: 'unscanned' as const,
    })) : [];

    const devDependencies = packageJson.devDependencies ? Object.entries(packageJson.devDependencies).map(([name, version]) => ({
      name,
      version: (version as string).replace(/[\^~]/g, ''),
      type: 'devDependency' as const,
      status: 'unscanned' as const,
    })) : [];

    return [...dependencies, ...devDependencies].sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to read or parse package.json:", error);
    return [];
  }
}

export default async function Home() {
  const allDependencies = await getDependencies();

  return (
    <div className="min-h-screen w-full bg-background font-body">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">
            Dependency Tracker
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Keep your project's dependencies secure and up-to-date with a single click.
          </p>
        </header>

        <DependencyTable initialDependencies={allDependencies} />
      </div>
    </div>
  );
}
