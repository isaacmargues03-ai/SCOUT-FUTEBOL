"use server";

import axios from 'axios';
import type { Dependency, OutdatedResult, VulnerabilityResult, LicenseResult, ScanResult } from '@/lib/types';

type SimpleDep = Pick<Dependency, 'name' | 'version'>;

const COMPATIBLE_LICENSES = ['MIT', 'ISC', 'Apache-2.0', 'BSD-3-Clause', 'BSD-2-Clause', 'Unlicense', '0BSD'];

async function fetchNpmData(packageName: string, version?: string): Promise<any> {
  const url = version 
    ? `https://registry.npmjs.org/${packageName}/${version}`
    : `https://registry.npmjs.org/${packageName}`;
  try {
    const response = await axios.get(url, { timeout: 5000 });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn(`Package not found: ${packageName}`);
    } else {
      console.error(`Failed to fetch data for ${packageName}:`, error);
    }
    return null;
  }
}

export async function checkOutdated(deps: SimpleDep[]): Promise<ScanResult<OutdatedResult>> {
  const results = await Promise.allSettled(
    deps.map(async (dep) => {
      const data = await fetchNpmData(dep.name);
      if (!data) return { name: dep.name, latestVersion: 'Error', isOutdated: false };

      const latestVersion = data['dist-tags']?.latest;
      return {
        name: dep.name,
        latestVersion: latestVersion || dep.version,
        isOutdated: latestVersion && latestVersion !== dep.version,
      };
    })
  );

  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<OutdatedResult>).value);
}

export async function scanVulnerabilities(deps: SimpleDep[]): Promise<ScanResult<VulnerabilityResult>> {
  const results = await Promise.allSettled(
    deps.map(async (dep) => {
      const data = await fetchNpmData(dep.name, dep.version);
      let isVulnerable = false;
      let vulnerabilityDetails;

      if (data?.deprecated) {
        isVulnerable = true;
        vulnerabilityDetails = `Deprecated: ${data.deprecated}`;
      } else if (Math.random() < 0.05) { // Simulate a random vulnerability for demo purposes
        isVulnerable = true;
        vulnerabilityDetails = 'A critical simulated vulnerability was found.';
      }
      
      return {
        name: dep.name,
        isVulnerable,
        vulnerabilityDetails,
      };
    })
  );

  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<VulnerabilityResult>).value);
}

export async function checkLicenses(deps: SimpleDep[]): Promise<ScanResult<LicenseResult>> {
  const results = await Promise.allSettled(
    deps.map(async (dep) => {
      const data = await fetchNpmData(dep.name, dep.version);
      const license = data?.license || 'N/A';
      let licenseIssue;

      if (license !== 'N/A' && !COMPATIBLE_LICENSES.includes(license)) {
        licenseIssue = `License "${license}" may require review.`;
      }
      
      return {
        name: dep.name,
        license,
        licenseIssue,
      };
    })
  );

  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<LicenseResult>).value);
}
