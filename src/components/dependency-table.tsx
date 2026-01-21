"use client";

import * as React from 'react';
import type { Dependency, OutdatedResult, VulnerabilityResult, LicenseResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { checkOutdated, scanVulnerabilities, checkLicenses } from '@/app/actions';
import { AlertTriangle, ArrowUpToLine, CheckCircle2, FlaskConical, Gavel, Loader2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ScanType = 'outdated' | 'vulnerabilities' | 'licenses';

function StatusBadge({ dep }: { dep: Dependency }) {
  if (dep.status === 'unscanned') {
    return <Badge variant="secondary">Not Scanned</Badge>;
  }

  const issues: React.ReactNode[] = [];
  if (dep.isOutdated) {
    issues.push(
      <Badge key="outdated" variant="destructive" className="items-center">
        <ArrowUpToLine className="h-3 w-3 mr-1.5" /> Outdated
      </Badge>
    );
  }
  if (dep.isVulnerable) {
    issues.push(
      <Badge key="vuln" variant="destructive" className="items-center">
        <ShieldAlert className="h-3 w-3 mr-1.5" /> Vulnerable
      </Badge>
    );
  }
  if (dep.licenseIssue) {
    issues.push(
      <Badge key="license" variant="destructive" className="items-center">
        <AlertTriangle className="h-3 w-3 mr-1.5" /> License Risk
      </Badge>
    );
  }

  if (issues.length > 0) {
    return <div className="flex flex-wrap gap-2">{issues}</div>;
  }

  if (dep.status === 'scanned') {
    return (
      <Badge variant="outline" className="border-green-600/50 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 dark:border-green-600/50">
        <CheckCircle2 className="h-3 w-3 mr-1.5" /> OK
      </Badge>
    );
  }
  
  return null;
}

export function DependencyTable({ initialDependencies }: { initialDependencies: Dependency[] }) {
  const [dependencies, setDependencies] = React.useState<Dependency[]>(initialDependencies);
  const [isPending, startTransition] = React.useTransition();
  const [activeScan, setActiveScan] = React.useState<ScanType | null>(null);
  const { toast } = useToast();

  const handleScan = (scanType: ScanType) => {
    setActiveScan(scanType);
    startTransition(async () => {
      try {
        const simpleDeps = dependencies.map(d => ({ name: d.name, version: d.version }));
        let results;
        
        if (scanType === 'outdated') {
          results = await checkOutdated(simpleDeps);
        } else if (scanType === 'vulnerabilities') {
          results = await scanVulnerabilities(simpleDeps);
        } else {
          results = await checkLicenses(simpleDeps);
        }

        setDependencies(prev => 
          prev.map(p => {
            const result = results.find((r: any) => r.name === p.name);
            return { ...p, ...result, status: 'scanned' as const };
          })
        );
        toast({
          title: "Scan Complete",
          description: `Finished checking for ${scanType}.`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Scan Failed",
          description: `An error occurred while scanning for ${scanType}.`,
        });
      } finally {
        setActiveScan(null);
      }
    });
  };

  const getButtonState = (scanType: ScanType) => ({
    isLoading: isPending && activeScan === scanType,
    isDisabled: isPending && activeScan !== scanType,
  });

  const outdatedState = getButtonState('outdated');
  const vulnerabilitiesState = getButtonState('vulnerabilities');
  const licensesState = getButtonState('licenses');

  return (
    <div className="space-y-8">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Analysis Toolkit</CardTitle>
          <CardDescription>Run checks on your project dependencies. Results from multiple scans are combined and displayed below.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => handleScan('outdated')} disabled={outdatedState.isLoading || outdatedState.isDisabled}>
            {outdatedState.isLoading ? <Loader2 className="animate-spin" /> : <ArrowUpToLine />}
            Check for Outdated
          </Button>
          <Button onClick={() => handleScan('vulnerabilities')} disabled={vulnerabilitiesState.isLoading || vulnerabilitiesState.isDisabled}>
            {vulnerabilitiesState.isLoading ? <Loader2 className="animate-spin" /> : <FlaskConical />}
            Scan Vulnerabilities
          </Button>
          <Button onClick={() => handleScan('licenses')} disabled={licensesState.isLoading || licensesState.isDisabled}>
            {licensesState.isLoading ? <Loader2 className="animate-spin" /> : <Gavel />}
            Verify Licenses
          </Button>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Project Dependencies</CardTitle>
          <CardDescription>A list of {dependencies.length} packages found in your project.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Package</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Latest</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="min-w-[200px]">Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dependencies.map((dep) => (
                  <TableRow key={dep.name}>
                    <TableCell className="font-medium font-code">{dep.name}</TableCell>
                    <TableCell className="font-code">{dep.version}</TableCell>
                    <TableCell className="font-code">{dep.latestVersion || 'N/A'}</TableCell>
                    <TableCell>{dep.license || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={dep.type === 'dependency' ? 'outline' : 'secondary'}>
                        {dep.type === 'dependency' ? 'prod' : 'dev'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge dep={dep} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
