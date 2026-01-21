export type Dependency = {
  name: string;
  version: string;
  type: 'dependency' | 'devDependency';
  status: 'unscanned' | 'scanning' | 'scanned';
  latestVersion?: string;
  license?: string;
  isOutdated?: boolean;
  isVulnerable?: boolean;
  vulnerabilityDetails?: string;
  licenseIssue?: string;
};

export type ScanResult<T> = (T & { name: string })[];

export type OutdatedResult = {
  name: string;
  latestVersion: string;
  isOutdated: boolean;
};

export type VulnerabilityResult = {
  name: string;
  isVulnerable: boolean;
  vulnerabilityDetails?: string;
};

export type LicenseResult = {
  name: string;
  license: string;
  licenseIssue?: string;
};
