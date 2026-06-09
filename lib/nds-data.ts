/* Analytics & dashboard constants — ported from design-reference/data.js */

import { RADAR_AXES, ROLES, REC } from "./rubrics";
import {
  SEED_FUNNEL,
  SEED_ROLE_DEMAND,
  SEED_CERT_HEAT,
  SEED_QUALITY_TREND,
  SEED_KPIS,
} from "./seed";

export { RADAR_AXES, ROLES, REC };

export const NDS = {
  RADAR_AXES,
  ROLES,
  REC,
  funnel: SEED_FUNNEL,
  roleDemand: SEED_ROLE_DEMAND,
  certHeat: SEED_CERT_HEAT,
  qualityTrend: SEED_QUALITY_TREND,
  kpis: SEED_KPIS,
} as const;
