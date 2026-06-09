/* ============================================================
   NDS TalentScore — SI hiring rubrics
   Domain knowledge for the rule-based scoring engine:
   role catalog, certification weights, and skill taxonomy.
   ============================================================ */

import type { Recommendation } from "./types";

/** Radar axes — order matters; Candidate.radar aligns to this. */
export const RADAR_AXES = [
  "Routing & Switching",
  "Network Security",
  "Cloud & Data Center",
  "Automation",
  "Presales / Client",
  "Leadership",
] as const;

/** Full SI role catalog (technical + leadership + business). */
export const ROLES = [
  "Presales Network Security Engineer",
  "Presales Network Engineer",
  "Presales Security Consultant",
  "Post-Sales Network Engineer",
  "Post-Sales Security Engineer",
  "Field Engineer",
  "SOC Engineer",
  "Cloud Engineer",
  "Infrastructure Engineer",
  "Data Center Engineer",
  "Network Operations Engineer",
  "Network Engineer Team Lead",
  "Presales Team Lead",
  "Security Team Lead",
  "Infrastructure Manager",
  "Technical Project Lead",
  "Sales Executive",
  "Account Manager",
  "Solution Sales Specialist",
  "HR Recruiter",
] as const;

export const REC: Record<
  Recommendation,
  { key: Recommendation; label: string; tone: "pos" | "warn" | "neg" }
> = {
  STRONG: { key: "STRONG", label: "Strong Hire", tone: "pos" },
  HIRE: { key: "HIRE", label: "Hire", tone: "pos" },
  CONSIDER: { key: "CONSIDER", label: "Consider", tone: "warn" },
  WEAK: { key: "WEAK", label: "Weak Fit", tone: "warn" },
  REJECT: { key: "REJECT", label: "Reject", tone: "neg" },
};

/** Weights for the five scoring dimensions (sum = 1). Mirrors model v4.2. */
export const SCORE_WEIGHTS = {
  technical: 0.3,
  experience: 0.25,
  certification: 0.2,
  communication: 0.15,
  quality: 0.1,
} as const;

/**
 * Certification weights (impact on the certification dimension).
 * CCIE is the highest; expired certs are penalised at scoring time.
 * Matching is case-insensitive on the keys below.
 */
export const CERT_WEIGHTS: Record<string, { weight: number; level: string; family: string }> = {
  ccie: { weight: 100, level: "Expert", family: "network" },
  jncie: { weight: 96, level: "Expert", family: "network" },
  cissp: { weight: 92, level: "Expert", family: "security" },
  "nse 7": { weight: 88, level: "Expert", family: "security" },
  "nse 8": { weight: 94, level: "Expert", family: "security" },
  pcnse: { weight: 84, level: "Professional", family: "security" },
  ccnp: { weight: 80, level: "Professional", family: "network" },
  jncip: { weight: 80, level: "Professional", family: "network" },
  cisa: { weight: 78, level: "Professional", family: "security" },
  "aws solutions architect pro": { weight: 86, level: "Professional", family: "cloud" },
  "aws solutions architect": { weight: 74, level: "Associate", family: "cloud" },
  "azure administrator": { weight: 66, level: "Associate", family: "cloud" },
  "azure solutions architect": { weight: 80, level: "Professional", family: "cloud" },
  cka: { weight: 76, level: "Professional", family: "cloud" },
  "terraform associate": { weight: 64, level: "Associate", family: "cloud" },
  pmp: { weight: 70, level: "Professional", family: "leadership" },
  "togaf": { weight: 60, level: "Foundation", family: "leadership" },
  ceh: { weight: 62, level: "Professional", family: "security" },
  "nse 5": { weight: 62, level: "Professional", family: "security" },
  "nse 4": { weight: 54, level: "Professional", family: "security" },
  ccna: { weight: 50, level: "Associate", family: "network" },
  "security+": { weight: 46, level: "Associate", family: "security" },
  "splunk": { weight: 48, level: "Associate", family: "security" },
  "itil": { weight: 42, level: "Foundation", family: "leadership" },
  fcf: { weight: 30, level: "Foundation", family: "security" },
  acma: { weight: 40, level: "Associate", family: "network" },
};

/**
 * Skill taxonomy mapped to radar axes. Each entry is matched as a
 * case-insensitive substring against the résumé text.
 */
export const SKILL_TAXONOMY: Record<(typeof RADAR_AXES)[number], string[]> = {
  "Routing & Switching": [
    "routing", "switching", "bgp", "ospf", "mpls", "eigrp", "vlan",
    "cisco", "juniper", "aruba", "sd-wan", "sdwan", "wan", "lan", "spanning tree",
  ],
  "Network Security": [
    "firewall", "fortinet", "fortigate", "palo alto", "pan-os", "check point",
    "zero trust", "vpn", "ipsec", "ids", "ips", "siem", "soc", "edr", "ngfw",
    "firewall migration", "segmentation", "nac", "fortianalyzer", "splunk",
    "threat hunting", "incident response", "mitre", "cspm", "cnapp",
  ],
  "Cloud & Data Center": [
    "aws", "azure", "gcp", "google cloud", "kubernetes", "k8s", "vmware",
    "data center", "datacenter", "openstack", "hyper-v", "cloud", "docker",
    "container", "virtualization", "nutanix", "san", "nas", "storage",
  ],
  Automation: [
    "python", "ansible", "terraform", "automation", "ci/cd", "cicd",
    "scripting", "rest api", "netconf", "yaml", "git", "jenkins", "iac",
    "bash", "powershell", "go", "golang",
  ],
  "Presales / Client": [
    "presales", "pre-sales", "solution design", "bid", "tender", "proposal",
    "rfp", "rfi", "bom", "hld", "lld", "demo", "poc", "stakeholder",
    "client-facing", "customer", "consultant", "account", "solution sales",
  ],
  Leadership: [
    "team lead", "leadership", "managed", "manager", "mentor", "project delivery",
    "p&l", "budget", "vendor management", "capacity planning", "governance",
    "led a team", "headcount", "people management", "project lead",
  ],
};

/** Enterprise/SI keywords that signal seniority & relevant exposure. */
export const ENTERPRISE_KEYWORDS = [
  "enterprise", "bank", "banking", "government", "telco", "telecom",
  "managed services", "data center", "national", "regional", "asean", "apac",
  "migration", "24/7", "noc", "soc", "tenant", "multi-site", "backbone",
];

/** Achievement-signal words that lift the résumé-quality score. */
export const ACHIEVEMENT_WORDS = [
  "reduced", "increased", "improved", "led", "delivered", "designed",
  "migrated", "won", "achieved", "optimized", "automated", "built",
  "%", "win rate", "mttr", "uptime", "sla",
];

/** Map a role to the radar axes it weights most heavily. */
export const ROLE_FOCUS: Record<string, (typeof RADAR_AXES)[number][]> = {
  "Presales Network Security Engineer": ["Network Security", "Presales / Client", "Routing & Switching"],
  "Presales Network Engineer": ["Routing & Switching", "Presales / Client", "Network Security"],
  "Presales Security Consultant": ["Network Security", "Presales / Client", "Leadership"],
  "Post-Sales Network Engineer": ["Routing & Switching", "Automation", "Network Security"],
  "Post-Sales Security Engineer": ["Network Security", "Automation", "Routing & Switching"],
  "Field Engineer": ["Routing & Switching", "Network Security", "Cloud & Data Center"],
  "SOC Engineer": ["Network Security", "Automation", "Cloud & Data Center"],
  "Cloud Engineer": ["Cloud & Data Center", "Automation", "Routing & Switching"],
  "Infrastructure Engineer": ["Cloud & Data Center", "Routing & Switching", "Automation"],
  "Data Center Engineer": ["Cloud & Data Center", "Routing & Switching", "Automation"],
  "Network Operations Engineer": ["Routing & Switching", "Automation", "Network Security"],
  "Network Engineer Team Lead": ["Routing & Switching", "Leadership", "Network Security"],
  "Presales Team Lead": ["Presales / Client", "Leadership", "Network Security"],
  "Security Team Lead": ["Network Security", "Leadership", "Presales / Client"],
  "Infrastructure Manager": ["Leadership", "Cloud & Data Center", "Routing & Switching"],
  "Technical Project Lead": ["Leadership", "Routing & Switching", "Automation"],
};

export const DEFAULT_ROLE_BENCHMARK = [80, 85, 70, 65, 80, 70];

export function seniorityFor(years: number): import("./types").Seniority {
  if (years >= 13) return "Manager";
  if (years >= 10) return "Lead";
  if (years >= 7) return "Senior";
  if (years >= 4) return "Mid-Senior";
  if (years >= 2) return "Mid";
  return "Junior";
}
