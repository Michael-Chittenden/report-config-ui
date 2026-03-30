// ============================================================
// Mock Data for Report Configuration UI Demo
// Structured to mirror the production database schema
// ============================================================

// ===================== LOOKUP TABLES =====================

// --- ReportConfigTypes ---
export const reportConfigTypes = {
  1: 'Single Plan',
  2: 'Multi Plan',
  3: 'Combo',
  4: 'Client Only',
};

// --- PeriodTypes ---
export const periodTypes = {
  1: 'Quarterly',
  2: 'Monthly',
};

// --- ExhibitTemplateTypes ---
export const exhibitMenuTypes = {
  1: 'Single Plan Shared',
  2: 'Multi Plan Shared',
  3: 'Single Plan Client Only',
  4: 'Multi Plan Client Only',
  5: 'Combo Client Only',
};

// --- BulkTierOverride (data availability windows) ---
export const bulkTierOverrides = [
  { id: 1, name: 'Force Tier 1', description: 'Earliest data availability' },
  { id: 2, name: 'Force Tier 2', description: 'Standard data availability' },
  { id: 3, name: 'Force Tier 3', description: 'Extended data availability' },
];

// --- BulkPctThreshold (manager data sufficiency) ---
export const bulkPctThresholds = [
  { id: 1, name: '50% of mgrs available', description: 'Run when at least half of managers have reported' },
  { id: 2, name: '80% of mgrs available', description: 'Run when most managers have reported' },
];

// --- PageSetCategories (Category 8 PL retired) ---
export const pagesetCategories = [
  { id: 1, name: 'Core Shared Pages (Client Level)' },
  { id: 2, name: 'Single Plan Only' },
  { id: 3, name: 'Multi Plan Only' },
  { id: 4, name: 'COMBO (Client) \u2011 Specific Pages' },
  { id: 5, name: 'Optional / Add\u2011On Pages' },
  { id: 6, name: 'Single Plan with Liabilities Only' },
  { id: 7, name: 'Single Plan with DB Only' },
];

// ===================== CLIENTS & PLANS =====================

export const allClients = [
  {
    accountId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Demo Client',
  },
  {
    accountId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'A Different Client',
  },
  {
    accountId: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    name: 'Acme',
  },
];

// Default export for backward compat
export const demoClient = allClients[0];

export const allPlans = [
  // Demo Client plans
  { id: 1001, ct_PlanID: 1001, accountId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'Demo Client DC Plan 1', type: 'DC', vendor: 'Vanguard' },
  { id: 1002, ct_PlanID: 1002, accountId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'Demo Client DC Plan 2', type: 'DC', vendor: 'Fidelity' },
  { id: 1003, ct_PlanID: 1003, accountId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'Demo Client NQ Plan 3', type: 'NQ', vendor: 'TIAA' },
  { id: 1004, ct_PlanID: 1004, accountId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'Demo Client DB Plan 4', type: 'DB', vendor: 'Vanguard' },
  // A Different Client (ADC) plans
  { id: 2001, ct_PlanID: 2001, accountId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012', name: 'ADC 401k Plan A', type: 'DC', vendor: 'Schwab' },
  { id: 2002, ct_PlanID: 2002, accountId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012', name: 'ADC 401k Plan B', type: 'DC', vendor: 'Fidelity' },
  { id: 2003, ct_PlanID: 2003, accountId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012', name: 'ADC 403b Plan C', type: 'DC', vendor: 'TIAA' },
  { id: 2004, ct_PlanID: 2004, accountId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012', name: 'ADC Pension Plan D', type: 'DB', vendor: 'Vanguard' },
  // Acme plans
  { id: 3001, ct_PlanID: 3001, accountId: 'c3d4e5f6-a7b8-9012-cdef-345678901234', name: 'DC Plan X', type: 'DC', vendor: 'Vanguard' },
  { id: 3002, ct_PlanID: 3002, accountId: 'c3d4e5f6-a7b8-9012-cdef-345678901234', name: 'DC Plan Y', type: 'DC', vendor: 'Fidelity' },
  { id: 3003, ct_PlanID: 3003, accountId: 'c3d4e5f6-a7b8-9012-cdef-345678901234', name: 'DC Plan Z', type: 'DC', vendor: 'TIAA' },
  { id: 3004, ct_PlanID: 3004, accountId: 'c3d4e5f6-a7b8-9012-cdef-345678901234', name: 'DC Plan ZZ', type: 'DC', vendor: 'Schwab' },
];

// Backward compat — components that import demoPlans get Demo Client's plans
export const demoPlans = allPlans.filter(p => p.accountId === allClients[0].accountId);

// ===================== SEED INVESTMENTS (from Mock Investments.xlsx) =====================
export const seedInvestments = [
  {"ct_investmentid":1,"ct_PlanID":1001,"Ref":"Investment Red","AssetClass":"Intermediate Core Bond","Order":1},
  {"ct_investmentid":2,"ct_PlanID":1001,"Ref":"Investment Red","AssetClass":"Intermediate Core Bond","Order":2},
  {"ct_investmentid":3,"ct_PlanID":1001,"Ref":"Investment 21","AssetClass":"Intermediate Core Bond","Order":3},
  {"ct_investmentid":4,"ct_PlanID":1001,"Ref":"Investment F","AssetClass":"Intermediate Core Bond","Order":4},
  {"ct_investmentid":5,"ct_PlanID":1001,"Ref":"Investment M","AssetClass":"Intermediate Core Bond","Order":5},
  {"ct_investmentid":6,"ct_PlanID":1001,"Ref":"Investment E","AssetClass":"Intermediate Core Bond","Order":6},
  {"ct_investmentid":7,"ct_PlanID":1001,"Ref":"Investment Cyan","AssetClass":"Intermediate Core Bond","Order":7},
  {"ct_investmentid":8,"ct_PlanID":1001,"Ref":"Investment 5","AssetClass":"Intermediate Core Bond","Order":8},
  {"ct_investmentid":9,"ct_PlanID":1001,"Ref":"Investment O","AssetClass":"Intermediate Core Bond","Order":9},
  {"ct_investmentid":10,"ct_PlanID":1001,"Ref":"Investment 8","AssetClass":"Intermediate Core Bond","Order":10},
  {"ct_investmentid":11,"ct_PlanID":1001,"Ref":"Investment TUV","AssetClass":"Intermediate Core Bond","Order":11},
  {"ct_investmentid":12,"ct_PlanID":1001,"Ref":"Investment TUV","AssetClass":"Intermediate Core Bond","Order":12},
  {"ct_investmentid":13,"ct_PlanID":1001,"Ref":"Investment Black","AssetClass":"Intermediate Core Bond","Order":13},
  {"ct_investmentid":14,"ct_PlanID":1001,"Ref":"Investment J","AssetClass":"Intermediate Core Bond","Order":14},
  {"ct_investmentid":15,"ct_PlanID":1002,"Ref":"Investment 20","AssetClass":"Intermediate Core Bond","Order":1},
  {"ct_investmentid":16,"ct_PlanID":1002,"Ref":"Investment E","AssetClass":"Intermediate Core Bond","Order":2},
  {"ct_investmentid":17,"ct_PlanID":1002,"Ref":"Investment 5","AssetClass":"Intermediate Core Bond","Order":3},
  {"ct_investmentid":18,"ct_PlanID":1002,"Ref":"Investment J","AssetClass":"Intermediate Core Bond","Order":4},
  {"ct_investmentid":19,"ct_PlanID":1002,"Ref":"Investment A","AssetClass":"Intermediate Core Bond","Order":5},
  {"ct_investmentid":20,"ct_PlanID":1002,"Ref":"Investment H","AssetClass":"Intermediate Core Bond","Order":6},
  {"ct_investmentid":21,"ct_PlanID":1002,"Ref":"Investment White","AssetClass":"Intermediate Core Bond","Order":7},
  {"ct_investmentid":22,"ct_PlanID":1002,"Ref":"Investment F","AssetClass":"Intermediate Core Bond","Order":8},
  {"ct_investmentid":23,"ct_PlanID":1002,"Ref":"Investment I","AssetClass":"Intermediate Core Bond","Order":9},
  {"ct_investmentid":24,"ct_PlanID":1002,"Ref":"Investment Black","AssetClass":"Intermediate Core Bond","Order":10},
  {"ct_investmentid":25,"ct_PlanID":1002,"Ref":"Investment Red","AssetClass":"Intermediate Core Bond","Order":11},
  {"ct_investmentid":26,"ct_PlanID":1002,"Ref":"Investment 11","AssetClass":"Intermediate Core Bond","Order":12},
  {"ct_investmentid":27,"ct_PlanID":1002,"Ref":"Investment Pink","AssetClass":"Intermediate Core Bond","Order":13},
  {"ct_investmentid":28,"ct_PlanID":1002,"Ref":"Investment B","AssetClass":"Intermediate Core Bond","Order":14},
  {"ct_investmentid":29,"ct_PlanID":1002,"Ref":"Investment 21","AssetClass":"Intermediate Core Bond","Order":15},
  {"ct_investmentid":30,"ct_PlanID":1002,"Ref":"Investment O","AssetClass":"Intermediate Core Bond","Order":16},
  {"ct_investmentid":31,"ct_PlanID":1002,"Ref":"Investment 17","AssetClass":"Intermediate Core Bond","Order":17},
  {"ct_investmentid":32,"ct_PlanID":1002,"Ref":"Investment 6","AssetClass":"Intermediate Core Bond","Order":18},
  {"ct_investmentid":33,"ct_PlanID":1003,"Ref":"Investment C","AssetClass":"Intermediate Core Bond","Order":1},
  {"ct_investmentid":34,"ct_PlanID":1003,"Ref":"Investment J","AssetClass":"Intermediate Core Bond","Order":2},
  {"ct_investmentid":35,"ct_PlanID":1003,"Ref":"Investment H","AssetClass":"Intermediate Core Bond","Order":3},
  {"ct_investmentid":36,"ct_PlanID":1003,"Ref":"Investment 21","AssetClass":"Intermediate Core Bond","Order":4},
  {"ct_investmentid":37,"ct_PlanID":1003,"Ref":"Investment 2","AssetClass":"Intermediate Core Bond","Order":5},
  {"ct_investmentid":38,"ct_PlanID":1003,"Ref":"Investment QRS","AssetClass":"Intermediate Core Bond","Order":6},
  {"ct_investmentid":39,"ct_PlanID":1003,"Ref":"Investment White","AssetClass":"Intermediate Core Bond","Order":7},
  {"ct_investmentid":40,"ct_PlanID":1003,"Ref":"Investment N","AssetClass":"Intermediate Core Bond","Order":8},
  {"ct_investmentid":41,"ct_PlanID":1003,"Ref":"Investment O","AssetClass":"Intermediate Core Bond","Order":9},
  {"ct_investmentid":42,"ct_PlanID":1003,"Ref":"Investment 18","AssetClass":"Intermediate Core Bond","Order":10},
  {"ct_investmentid":43,"ct_PlanID":1003,"Ref":"Investment Blue","AssetClass":"Intermediate Core Bond","Order":11},
  {"ct_investmentid":44,"ct_PlanID":1003,"Ref":"Investment 11","AssetClass":"Intermediate Core Bond","Order":12},
  {"ct_investmentid":45,"ct_PlanID":1003,"Ref":"Investment N","AssetClass":"Intermediate Core Bond","Order":13},
  {"ct_investmentid":46,"ct_PlanID":1003,"Ref":"Investment 15","AssetClass":"Intermediate Core Bond","Order":14},
  {"ct_investmentid":47,"ct_PlanID":1003,"Ref":"Investment 7","AssetClass":"Intermediate Core Bond","Order":15},
  {"ct_investmentid":48,"ct_PlanID":1003,"Ref":"Investment K","AssetClass":"Intermediate Core Bond","Order":16},
  {"ct_investmentid":49,"ct_PlanID":1003,"Ref":"Investment 4","AssetClass":"Intermediate Core Bond","Order":17},
  {"ct_investmentid":50,"ct_PlanID":1003,"Ref":"Investment Green","AssetClass":"Intermediate Core Bond","Order":18},
  {"ct_investmentid":51,"ct_PlanID":1003,"Ref":"Investment KLM","AssetClass":"Intermediate Core Bond","Order":19},
  {"ct_investmentid":52,"ct_PlanID":1004,"Ref":"Investment A","AssetClass":"Intermediate Core Bond","Order":1},
  {"ct_investmentid":53,"ct_PlanID":1004,"Ref":"Investment Silver","AssetClass":"Intermediate Core Bond","Order":2},
  {"ct_investmentid":54,"ct_PlanID":1004,"Ref":"Investment N","AssetClass":"Intermediate Core Bond","Order":3},
  {"ct_investmentid":55,"ct_PlanID":1004,"Ref":"Investment Pink","AssetClass":"Intermediate Core Bond","Order":4},
  {"ct_investmentid":56,"ct_PlanID":1004,"Ref":"Investment 22","AssetClass":"Intermediate Core Bond","Order":5},
  {"ct_investmentid":57,"ct_PlanID":1004,"Ref":"Investment QRS","AssetClass":"Intermediate Core Bond","Order":6},
  {"ct_investmentid":58,"ct_PlanID":1004,"Ref":"Investment 16","AssetClass":"Intermediate Core Bond","Order":7},
  {"ct_investmentid":59,"ct_PlanID":1004,"Ref":"Investment 4","AssetClass":"Intermediate Core Bond","Order":8},
  {"ct_investmentid":60,"ct_PlanID":1004,"Ref":"Investment 1","AssetClass":"Intermediate Core Bond","Order":9},
  {"ct_investmentid":61,"ct_PlanID":2001,"Ref":"Investment 1","AssetClass":"Intermediate Core Bond","Order":1},
  {"ct_investmentid":62,"ct_PlanID":2001,"Ref":"Investment I","AssetClass":"Intermediate Core Bond","Order":2},
  {"ct_investmentid":63,"ct_PlanID":2001,"Ref":"Investment Blue","AssetClass":"Intermediate Core Bond","Order":3},
  {"ct_investmentid":64,"ct_PlanID":2001,"Ref":"Investment 19","AssetClass":"Intermediate Core Bond","Order":4},
  {"ct_investmentid":65,"ct_PlanID":2001,"Ref":"Investment 21","AssetClass":"Intermediate Core Bond","Order":5},
  {"ct_investmentid":66,"ct_PlanID":2001,"Ref":"Investment N","AssetClass":"Intermediate Core Bond","Order":6},
  {"ct_investmentid":67,"ct_PlanID":2001,"Ref":"Investment 1","AssetClass":"Intermediate Core Bond","Order":7},
  {"ct_investmentid":68,"ct_PlanID":2001,"Ref":"Investment QRS","AssetClass":"Intermediate Core Bond","Order":8},
  {"ct_investmentid":69,"ct_PlanID":2001,"Ref":"Investment 13","AssetClass":"Intermediate Core Bond","Order":9},
  {"ct_investmentid":70,"ct_PlanID":2002,"Ref":"Investment Yellow","AssetClass":"Intermediate Core Bond","Order":1},
  {"ct_investmentid":71,"ct_PlanID":2002,"Ref":"Investment Green","AssetClass":"Intermediate Core Bond","Order":2},
  {"ct_investmentid":72,"ct_PlanID":2002,"Ref":"Investment 5","AssetClass":"Intermediate Core Bond","Order":3},
  {"ct_investmentid":73,"ct_PlanID":2002,"Ref":"Investment 8","AssetClass":"Intermediate Core Bond","Order":4},
  {"ct_investmentid":74,"ct_PlanID":2002,"Ref":"Investment K","AssetClass":"Intermediate Core Bond","Order":5},
  {"ct_investmentid":75,"ct_PlanID":2002,"Ref":"Investment QRS","AssetClass":"Intermediate Core Bond","Order":6},
  {"ct_investmentid":76,"ct_PlanID":2002,"Ref":"Investment 12","AssetClass":"Intermediate Core Bond","Order":7},
  {"ct_investmentid":77,"ct_PlanID":2002,"Ref":"Investment H","AssetClass":"Intermediate Core Bond","Order":8},
  {"ct_investmentid":78,"ct_PlanID":2002,"Ref":"Investment 14","AssetClass":"Intermediate Core Bond","Order":9},
  {"ct_investmentid":79,"ct_PlanID":2002,"Ref":"Investment Cyan","AssetClass":"Intermediate Core Bond","Order":10},
  {"ct_investmentid":80,"ct_PlanID":2002,"Ref":"Investment Pink","AssetClass":"Intermediate Core Bond","Order":11},
  {"ct_investmentid":81,"ct_PlanID":2002,"Ref":"Investment 8","AssetClass":"Intermediate Core Bond","Order":12},
  {"ct_investmentid":82,"ct_PlanID":2002,"Ref":"Investment NOP","AssetClass":"Intermediate Core Bond","Order":13},
  {"ct_investmentid":83,"ct_PlanID":2002,"Ref":"Investment 2","AssetClass":"Intermediate Core Bond","Order":14},
  {"ct_investmentid":84,"ct_PlanID":2003,"Ref":"Investment ABC","AssetClass":"Intermediate Core Bond","Order":1},
  {"ct_investmentid":85,"ct_PlanID":2003,"Ref":"Investment WXY","AssetClass":"Intermediate Core Bond","Order":2},
  {"ct_investmentid":86,"ct_PlanID":2003,"Ref":"Investment WXY","AssetClass":"Intermediate Core Bond","Order":3},
  {"ct_investmentid":87,"ct_PlanID":2003,"Ref":"Investment L","AssetClass":"Intermediate Core Bond","Order":4},
  {"ct_investmentid":88,"ct_PlanID":2003,"Ref":"Investment 1","AssetClass":"Intermediate Core Bond","Order":5},
  {"ct_investmentid":89,"ct_PlanID":2003,"Ref":"Investment Black","AssetClass":"Intermediate Core Bond","Order":6},
  {"ct_investmentid":90,"ct_PlanID":2003,"Ref":"Investment Cyan","AssetClass":"Intermediate Core Bond","Order":7},
  {"ct_investmentid":91,"ct_PlanID":2003,"Ref":"Investment NOP","AssetClass":"Intermediate Core Bond","Order":8},
  {"ct_investmentid":92,"ct_PlanID":2003,"Ref":"Investment M","AssetClass":"Intermediate Core Bond","Order":9},
  {"ct_investmentid":93,"ct_PlanID":2003,"Ref":"Investment F","AssetClass":"Intermediate Core Bond","Order":10},
  {"ct_investmentid":94,"ct_PlanID":2003,"Ref":"Investment NOP","AssetClass":"Intermediate Core Bond","Order":11},
  {"ct_investmentid":95,"ct_PlanID":2003,"Ref":"Investment TUV","AssetClass":"Intermediate Core Bond","Order":12},
  {"ct_investmentid":96,"ct_PlanID":2003,"Ref":"Investment 3","AssetClass":"Intermediate Core Bond","Order":13},
  {"ct_investmentid":97,"ct_PlanID":2003,"Ref":"Investment 4","AssetClass":"Intermediate Core Bond","Order":14},
  {"ct_investmentid":98,"ct_PlanID":2004,"Ref":"Investment 21","AssetClass":"Intermediate Core Bond","Order":1},
  {"ct_investmentid":99,"ct_PlanID":2004,"Ref":"Investment Red","AssetClass":"Intermediate Core Bond","Order":2},
  {"ct_investmentid":100,"ct_PlanID":2004,"Ref":"Investment O","AssetClass":"Intermediate Core Bond","Order":3},
  {"ct_investmentid":101,"ct_PlanID":2004,"Ref":"Investment Yellow","AssetClass":"Intermediate Core Bond","Order":4},
  {"ct_investmentid":102,"ct_PlanID":2004,"Ref":"Investment C","AssetClass":"Intermediate Core Bond","Order":5},
  {"ct_investmentid":103,"ct_PlanID":2004,"Ref":"Investment K","AssetClass":"Intermediate Core Bond","Order":6},
  {"ct_investmentid":104,"ct_PlanID":2004,"Ref":"Investment QRS","AssetClass":"Intermediate Core Bond","Order":7},
  {"ct_investmentid":105,"ct_PlanID":2004,"Ref":"Investment 3","AssetClass":"Intermediate Core Bond","Order":8},
  {"ct_investmentid":106,"ct_PlanID":2004,"Ref":"Investment Blue","AssetClass":"Intermediate Core Bond","Order":9},
  {"ct_investmentid":107,"ct_PlanID":2004,"Ref":"Investment G","AssetClass":"Intermediate Core Bond","Order":10},
  {"ct_investmentid":108,"ct_PlanID":2004,"Ref":"Investment NOP","AssetClass":"Intermediate Core Bond","Order":11},
  {"ct_investmentid":109,"ct_PlanID":2004,"Ref":"Investment 5","AssetClass":"Intermediate Core Bond","Order":12},
  {"ct_investmentid":110,"ct_PlanID":2004,"Ref":"Investment B","AssetClass":"Intermediate Core Bond","Order":13},
  {"ct_investmentid":111,"ct_PlanID":2004,"Ref":"Investment 17","AssetClass":"Intermediate Core Bond","Order":14},
  {"ct_investmentid":112,"ct_PlanID":2004,"Ref":"Investment B","AssetClass":"Intermediate Core Bond","Order":15},
  {"ct_investmentid":113,"ct_PlanID":2004,"Ref":"Investment C","AssetClass":"Intermediate Core Bond","Order":16},
  {"ct_investmentid":114,"ct_PlanID":2004,"Ref":"Investment L","AssetClass":"Intermediate Core Bond","Order":17},
  {"ct_investmentid":115,"ct_PlanID":2004,"Ref":"Investment B","AssetClass":"Intermediate Core Bond","Order":18},
  {"ct_investmentid":116,"ct_PlanID":2004,"Ref":"Investment TUV","AssetClass":"Intermediate Core Bond","Order":19},
  {"ct_investmentid":117,"ct_PlanID":3001,"Ref":"Investment 10","AssetClass":"Intermediate Core Bond","Order":1},
  {"ct_investmentid":118,"ct_PlanID":3001,"Ref":"Investment Yellow","AssetClass":"Intermediate Core Bond","Order":2},
  {"ct_investmentid":119,"ct_PlanID":3001,"Ref":"Investment 15","AssetClass":"Intermediate Core Bond","Order":3},
  {"ct_investmentid":120,"ct_PlanID":3001,"Ref":"Investment M","AssetClass":"Intermediate Core Bond","Order":4},
  {"ct_investmentid":121,"ct_PlanID":3001,"Ref":"Investment 17","AssetClass":"Intermediate Core Bond","Order":5},
  {"ct_investmentid":122,"ct_PlanID":3001,"Ref":"Investment C","AssetClass":"Intermediate Core Bond","Order":6},
  {"ct_investmentid":123,"ct_PlanID":3001,"Ref":"Investment 10","AssetClass":"Intermediate Core Bond","Order":7},
  {"ct_investmentid":124,"ct_PlanID":3001,"Ref":"Investment 4","AssetClass":"Intermediate Core Bond","Order":8},
  {"ct_investmentid":125,"ct_PlanID":3001,"Ref":"Investment 16","AssetClass":"Intermediate Core Bond","Order":9},
  {"ct_investmentid":126,"ct_PlanID":3001,"Ref":"Investment 19","AssetClass":"Intermediate Core Bond","Order":10},
  {"ct_investmentid":127,"ct_PlanID":3001,"Ref":"Investment H","AssetClass":"Intermediate Core Bond","Order":11},
  {"ct_investmentid":128,"ct_PlanID":3001,"Ref":"Investment K","AssetClass":"Intermediate Core Bond","Order":12},
  {"ct_investmentid":129,"ct_PlanID":3001,"Ref":"Investment D","AssetClass":"Intermediate Core Bond","Order":13},
  {"ct_investmentid":130,"ct_PlanID":3001,"Ref":"Investment E","AssetClass":"Intermediate Core Bond","Order":14},
  {"ct_investmentid":131,"ct_PlanID":3001,"Ref":"Investment 19","AssetClass":"Intermediate Core Bond","Order":15},
  {"ct_investmentid":132,"ct_PlanID":3001,"Ref":"Investment ABC","AssetClass":"Intermediate Core Bond","Order":16},
  {"ct_investmentid":133,"ct_PlanID":3001,"Ref":"Investment H","AssetClass":"Intermediate Core Bond","Order":17},
  {"ct_investmentid":134,"ct_PlanID":3001,"Ref":"Investment 3","AssetClass":"Intermediate Core Bond","Order":18},
  {"ct_investmentid":135,"ct_PlanID":3001,"Ref":"Investment 8","AssetClass":"Intermediate Core Bond","Order":19},
  {"ct_investmentid":136,"ct_PlanID":3001,"Ref":"Investment 9","AssetClass":"Intermediate Core Bond","Order":20},
  {"ct_investmentid":137,"ct_PlanID":3001,"Ref":"Investment ABC","AssetClass":"Intermediate Core Bond","Order":21},
  {"ct_investmentid":138,"ct_PlanID":3001,"Ref":"Investment 18","AssetClass":"Intermediate Core Bond","Order":22},
  {"ct_investmentid":139,"ct_PlanID":3001,"Ref":"Investment L","AssetClass":"Intermediate Core Bond","Order":23},
  {"ct_investmentid":140,"ct_PlanID":3002,"Ref":"Investment 22","AssetClass":"Intermediate Core Bond","Order":1},
  {"ct_investmentid":141,"ct_PlanID":3002,"Ref":"Investment B","AssetClass":"Intermediate Core Bond","Order":2},
  {"ct_investmentid":142,"ct_PlanID":3002,"Ref":"Investment 7","AssetClass":"Intermediate Core Bond","Order":3},
  {"ct_investmentid":143,"ct_PlanID":3002,"Ref":"Investment 5","AssetClass":"Intermediate Core Bond","Order":4},
  {"ct_investmentid":144,"ct_PlanID":3002,"Ref":"Investment O","AssetClass":"Intermediate Core Bond","Order":5},
  {"ct_investmentid":145,"ct_PlanID":3002,"Ref":"Investment 14","AssetClass":"Intermediate Core Bond","Order":6},
  {"ct_investmentid":146,"ct_PlanID":3002,"Ref":"Investment TUV","AssetClass":"Intermediate Core Bond","Order":7},
  {"ct_investmentid":147,"ct_PlanID":3002,"Ref":"Investment D","AssetClass":"Intermediate Core Bond","Order":8},
  {"ct_investmentid":148,"ct_PlanID":3002,"Ref":"Investment 11","AssetClass":"Intermediate Core Bond","Order":9},
  {"ct_investmentid":149,"ct_PlanID":3002,"Ref":"Investment 3","AssetClass":"Intermediate Core Bond","Order":10},
  {"ct_investmentid":150,"ct_PlanID":3002,"Ref":"Investment QRS","AssetClass":"Intermediate Core Bond","Order":11},
  {"ct_investmentid":151,"ct_PlanID":3002,"Ref":"Investment C","AssetClass":"Intermediate Core Bond","Order":12},
  {"ct_investmentid":152,"ct_PlanID":3002,"Ref":"Investment QRS","AssetClass":"Intermediate Core Bond","Order":13},
  {"ct_investmentid":153,"ct_PlanID":3002,"Ref":"Investment I","AssetClass":"Intermediate Core Bond","Order":14},
  {"ct_investmentid":154,"ct_PlanID":3002,"Ref":"Investment 20","AssetClass":"Intermediate Core Bond","Order":15},
  {"ct_investmentid":155,"ct_PlanID":3002,"Ref":"Investment 21","AssetClass":"Intermediate Core Bond","Order":16},
  {"ct_investmentid":156,"ct_PlanID":3002,"Ref":"Investment 11","AssetClass":"Intermediate Core Bond","Order":17},
  {"ct_investmentid":157,"ct_PlanID":3002,"Ref":"Investment DEF","AssetClass":"Intermediate Core Bond","Order":18},
  {"ct_investmentid":158,"ct_PlanID":3002,"Ref":"Investment 5","AssetClass":"Intermediate Core Bond","Order":19},
  {"ct_investmentid":159,"ct_PlanID":3002,"Ref":"Investment 13","AssetClass":"Intermediate Core Bond","Order":20},
  {"ct_investmentid":160,"ct_PlanID":3002,"Ref":"Investment Blue","AssetClass":"Intermediate Core Bond","Order":21},
  {"ct_investmentid":161,"ct_PlanID":3002,"Ref":"Investment 7","AssetClass":"Intermediate Core Bond","Order":22},
  {"ct_investmentid":162,"ct_PlanID":3003,"Ref":"Investment L","AssetClass":"Intermediate Core Bond","Order":1},
  {"ct_investmentid":163,"ct_PlanID":3003,"Ref":"Investment 18","AssetClass":"Intermediate Core Bond","Order":2},
  {"ct_investmentid":164,"ct_PlanID":3003,"Ref":"Investment Silver","AssetClass":"Intermediate Core Bond","Order":3},
  {"ct_investmentid":165,"ct_PlanID":3003,"Ref":"Investment 16","AssetClass":"Intermediate Core Bond","Order":4},
  {"ct_investmentid":166,"ct_PlanID":3003,"Ref":"Investment WXY","AssetClass":"Intermediate Core Bond","Order":5},
  {"ct_investmentid":167,"ct_PlanID":3003,"Ref":"Investment 23","AssetClass":"Intermediate Core Bond","Order":6},
  {"ct_investmentid":168,"ct_PlanID":3003,"Ref":"Investment 22","AssetClass":"Intermediate Core Bond","Order":7},
  {"ct_investmentid":169,"ct_PlanID":3003,"Ref":"Investment O","AssetClass":"Intermediate Core Bond","Order":8},
  {"ct_investmentid":170,"ct_PlanID":3003,"Ref":"Investment Silver","AssetClass":"Intermediate Core Bond","Order":9},
  {"ct_investmentid":171,"ct_PlanID":3003,"Ref":"Investment 2","AssetClass":"Intermediate Core Bond","Order":10},
  {"ct_investmentid":172,"ct_PlanID":3003,"Ref":"Investment G","AssetClass":"Intermediate Core Bond","Order":11},
  {"ct_investmentid":173,"ct_PlanID":3003,"Ref":"Investment Red","AssetClass":"Intermediate Core Bond","Order":12},
  {"ct_investmentid":174,"ct_PlanID":3003,"Ref":"Investment Silver","AssetClass":"Intermediate Core Bond","Order":13},
  {"ct_investmentid":175,"ct_PlanID":3003,"Ref":"Investment M","AssetClass":"Intermediate Core Bond","Order":14},
  {"ct_investmentid":176,"ct_PlanID":3003,"Ref":"Investment 5","AssetClass":"Intermediate Core Bond","Order":15},
  {"ct_investmentid":177,"ct_PlanID":3003,"Ref":"Investment M","AssetClass":"Intermediate Core Bond","Order":16},
  {"ct_investmentid":178,"ct_PlanID":3003,"Ref":"Investment I","AssetClass":"Intermediate Core Bond","Order":17},
  {"ct_investmentid":179,"ct_PlanID":3003,"Ref":"Investment C","AssetClass":"Intermediate Core Bond","Order":18},
  {"ct_investmentid":180,"ct_PlanID":3003,"Ref":"Investment 17","AssetClass":"Intermediate Core Bond","Order":19},
  {"ct_investmentid":181,"ct_PlanID":3003,"Ref":"Investment Black","AssetClass":"Intermediate Core Bond","Order":20},
  {"ct_investmentid":182,"ct_PlanID":3003,"Ref":"Investment A","AssetClass":"Intermediate Core Bond","Order":21},
  {"ct_investmentid":183,"ct_PlanID":3003,"Ref":"Investment I","AssetClass":"Intermediate Core Bond","Order":22},
  {"ct_investmentid":184,"ct_PlanID":3003,"Ref":"Investment Pink","AssetClass":"Intermediate Core Bond","Order":23},
  {"ct_investmentid":185,"ct_PlanID":3003,"Ref":"Investment O","AssetClass":"Intermediate Core Bond","Order":24},
  {"ct_investmentid":186,"ct_PlanID":3004,"Ref":"Investment I","AssetClass":"Intermediate Core Bond","Order":1},
  {"ct_investmentid":187,"ct_PlanID":3004,"Ref":"Investment 9","AssetClass":"Intermediate Core Bond","Order":2},
  {"ct_investmentid":188,"ct_PlanID":3004,"Ref":"Investment 5","AssetClass":"Intermediate Core Bond","Order":3},
  {"ct_investmentid":189,"ct_PlanID":3004,"Ref":"Investment 20","AssetClass":"Intermediate Core Bond","Order":4},
  {"ct_investmentid":190,"ct_PlanID":3004,"Ref":"Investment G","AssetClass":"Intermediate Core Bond","Order":5},
  {"ct_investmentid":191,"ct_PlanID":3004,"Ref":"Investment QRS","AssetClass":"Intermediate Core Bond","Order":6},
  {"ct_investmentid":192,"ct_PlanID":3004,"Ref":"Investment E","AssetClass":"Intermediate Core Bond","Order":7},
  {"ct_investmentid":193,"ct_PlanID":3004,"Ref":"Investment 2","AssetClass":"Intermediate Core Bond","Order":8},
  {"ct_investmentid":194,"ct_PlanID":3004,"Ref":"Investment D","AssetClass":"Intermediate Core Bond","Order":9},
  {"ct_investmentid":195,"ct_PlanID":3004,"Ref":"Investment O","AssetClass":"Intermediate Core Bond","Order":10},
  {"ct_investmentid":196,"ct_PlanID":3004,"Ref":"Investment 5","AssetClass":"Intermediate Core Bond","Order":11},
  {"ct_investmentid":197,"ct_PlanID":3004,"Ref":"Investment 3","AssetClass":"Intermediate Core Bond","Order":12},
  {"ct_investmentid":198,"ct_PlanID":3004,"Ref":"Investment O","AssetClass":"Intermediate Core Bond","Order":13},
  {"ct_investmentid":199,"ct_PlanID":3004,"Ref":"Investment HIJ","AssetClass":"Intermediate Core Bond","Order":14},
  {"ct_investmentid":200,"ct_PlanID":3004,"Ref":"Investment K","AssetClass":"Intermediate Core Bond","Order":15},
  {"ct_investmentid":201,"ct_PlanID":3004,"Ref":"Investment 22","AssetClass":"Intermediate Core Bond","Order":16},
  {"ct_investmentid":202,"ct_PlanID":3004,"Ref":"Investment J","AssetClass":"Intermediate Core Bond","Order":17},
  {"ct_investmentid":203,"ct_PlanID":3004,"Ref":"Investment Black","AssetClass":"Intermediate Core Bond","Order":18},
  {"ct_investmentid":204,"ct_PlanID":3004,"Ref":"Investment 23","AssetClass":"Intermediate Core Bond","Order":19},
  {"ct_investmentid":205,"ct_PlanID":3004,"Ref":"Investment DEF","AssetClass":"Intermediate Core Bond","Order":20},
  {"ct_investmentid":206,"ct_PlanID":3004,"Ref":"Investment Pink","AssetClass":"Intermediate Core Bond","Order":21},
  {"ct_investmentid":207,"ct_PlanID":3004,"Ref":"Investment O","AssetClass":"Intermediate Core Bond","Order":22},
  {"ct_investmentid":208,"ct_PlanID":3004,"Ref":"Investment NOP","AssetClass":"Intermediate Core Bond","Order":23},
  {"ct_investmentid":209,"ct_PlanID":3004,"Ref":"Investment 19","AssetClass":"Intermediate Core Bond","Order":24},
  {"ct_investmentid":210,"ct_PlanID":3004,"Ref":"Investment O","AssetClass":"Intermediate Core Bond","Order":25},
  {"ct_investmentid":211,"ct_PlanID":3004,"Ref":"Investment I","AssetClass":"Intermediate Core Bond","Order":26},
  {"ct_investmentid":212,"ct_PlanID":3004,"Ref":"Investment 15","AssetClass":"Intermediate Core Bond","Order":27},
  {"ct_investmentid":213,"ct_PlanID":3004,"Ref":"Investment 22","AssetClass":"Intermediate Core Bond","Order":28},
  {"ct_investmentid":214,"ct_PlanID":3004,"Ref":"Investment 4","AssetClass":"Intermediate Core Bond","Order":29},
  {"ct_investmentid":215,"ct_PlanID":3004,"Ref":"Investment A","AssetClass":"Intermediate Core Bond","Order":30},
  {"ct_investmentid":216,"ct_PlanID":3004,"Ref":"Investment 15","AssetClass":"Intermediate Core Bond","Order":31},
  {"ct_investmentid":217,"ct_PlanID":3004,"Ref":"Investment K","AssetClass":"Intermediate Core Bond","Order":32},
  {"ct_investmentid":218,"ct_PlanID":3004,"Ref":"Investment 21","AssetClass":"Intermediate Core Bond","Order":33},
  {"ct_investmentid":219,"ct_PlanID":3004,"Ref":"Investment Black","AssetClass":"Intermediate Core Bond","Order":34},
  {"ct_investmentid":220,"ct_PlanID":3004,"Ref":"Investment 20","AssetClass":"Intermediate Core Bond","Order":35},
  {"ct_investmentid":221,"ct_PlanID":3004,"Ref":"Investment Yellow","AssetClass":"Intermediate Core Bond","Order":36},
  {"ct_investmentid":222,"ct_PlanID":3004,"Ref":"Investment 20","AssetClass":"Intermediate Core Bond","Order":37},
  {"ct_investmentid":223,"ct_PlanID":3004,"Ref":"Investment Red","AssetClass":"Intermediate Core Bond","Order":38},
  {"ct_investmentid":224,"ct_PlanID":3004,"Ref":"Investment Cyan","AssetClass":"Intermediate Core Bond","Order":39},
  {"ct_investmentid":225,"ct_PlanID":3004,"Ref":"Investment Pink","AssetClass":"Intermediate Core Bond","Order":40},
  {"ct_investmentid":226,"ct_PlanID":3004,"Ref":"Investment I","AssetClass":"Intermediate Core Bond","Order":41},
  {"ct_investmentid":227,"ct_PlanID":3004,"Ref":"Investment 14","AssetClass":"Intermediate Core Bond","Order":42},
  {"ct_investmentid":228,"ct_PlanID":3004,"Ref":"Investment 18","AssetClass":"Intermediate Core Bond","Order":43},
  {"ct_investmentid":229,"ct_PlanID":3004,"Ref":"Investment 16","AssetClass":"Intermediate Core Bond","Order":44},
  {"ct_investmentid":230,"ct_PlanID":3004,"Ref":"Investment White","AssetClass":"Intermediate Core Bond","Order":45},
  {"ct_investmentid":231,"ct_PlanID":3004,"Ref":"Investment 17","AssetClass":"Intermediate Core Bond","Order":46},
  {"ct_investmentid":232,"ct_PlanID":3004,"Ref":"Investment 20","AssetClass":"Intermediate Core Bond","Order":47},
  {"ct_investmentid":233,"ct_PlanID":3004,"Ref":"Investment H","AssetClass":"Intermediate Core Bond","Order":48},
  {"ct_investmentid":234,"ct_PlanID":3004,"Ref":"Investment 6","AssetClass":"Intermediate Core Bond","Order":49},
  {"ct_investmentid":235,"ct_PlanID":3004,"Ref":"Investment Yellow","AssetClass":"Intermediate Core Bond","Order":50},
  {"ct_investmentid":236,"ct_PlanID":3004,"Ref":"Investment 11","AssetClass":"Intermediate Core Bond","Order":51},
  {"ct_investmentid":237,"ct_PlanID":3004,"Ref":"Investment 8","AssetClass":"Intermediate Core Bond","Order":52},
  {"ct_investmentid":238,"ct_PlanID":3004,"Ref":"Investment White","AssetClass":"Intermediate Core Bond","Order":53},
  {"ct_investmentid":239,"ct_PlanID":3004,"Ref":"Investment C","AssetClass":"Intermediate Core Bond","Order":54},
  {"ct_investmentid":240,"ct_PlanID":3004,"Ref":"Investment 3","AssetClass":"Intermediate Core Bond","Order":55},
  {"ct_investmentid":241,"ct_PlanID":3004,"Ref":"Investment 18","AssetClass":"Intermediate Core Bond","Order":56},
  {"ct_investmentid":242,"ct_PlanID":3004,"Ref":"Investment Blue","AssetClass":"Intermediate Core Bond","Order":57},
  {"ct_investmentid":243,"ct_PlanID":3004,"Ref":"Investment 9","AssetClass":"Intermediate Core Bond","Order":58},
  {"ct_investmentid":244,"ct_PlanID":3004,"Ref":"Investment D","AssetClass":"Intermediate Core Bond","Order":59},
  {"ct_investmentid":245,"ct_PlanID":3004,"Ref":"Investment F","AssetClass":"Intermediate Core Bond","Order":60},
  {"ct_investmentid":246,"ct_PlanID":3004,"Ref":"Investment D","AssetClass":"Intermediate Core Bond","Order":61},
  {"ct_investmentid":247,"ct_PlanID":3004,"Ref":"Investment A","AssetClass":"Intermediate Core Bond","Order":62},
  {"ct_investmentid":248,"ct_PlanID":3004,"Ref":"Investment G","AssetClass":"Intermediate Core Bond","Order":63},
  {"ct_investmentid":249,"ct_PlanID":3004,"Ref":"Investment 2","AssetClass":"Intermediate Core Bond","Order":64},
  {"ct_investmentid":250,"ct_PlanID":3004,"Ref":"Investment 4","AssetClass":"Intermediate Core Bond","Order":65},
  {"ct_investmentid":251,"ct_PlanID":3004,"Ref":"Investment Green","AssetClass":"Intermediate Core Bond","Order":66},
  {"ct_investmentid":252,"ct_PlanID":3004,"Ref":"Investment D","AssetClass":"Intermediate Core Bond","Order":67},
  {"ct_investmentid":253,"ct_PlanID":3004,"Ref":"Investment QRS","AssetClass":"Intermediate Core Bond","Order":68},
  {"ct_investmentid":254,"ct_PlanID":3004,"Ref":"Investment E","AssetClass":"Intermediate Core Bond","Order":69},
  {"ct_investmentid":255,"ct_PlanID":3004,"Ref":"Investment I","AssetClass":"Intermediate Core Bond","Order":70},
  {"ct_investmentid":256,"ct_PlanID":3004,"Ref":"Investment KLM","AssetClass":"Intermediate Core Bond","Order":71},
  {"ct_investmentid":257,"ct_PlanID":3004,"Ref":"Investment 15","AssetClass":"Intermediate Core Bond","Order":72},
  {"ct_investmentid":258,"ct_PlanID":3004,"Ref":"Investment 2","AssetClass":"Intermediate Core Bond","Order":73},
  {"ct_investmentid":259,"ct_PlanID":3004,"Ref":"Investment O","AssetClass":"Intermediate Core Bond","Order":74},
  {"ct_investmentid":260,"ct_PlanID":3004,"Ref":"Investment HIJ","AssetClass":"Intermediate Core Bond","Order":75},
  {"ct_investmentid":261,"ct_PlanID":3004,"Ref":"Investment K","AssetClass":"Intermediate Core Bond","Order":76},
  {"ct_investmentid":262,"ct_PlanID":3004,"Ref":"Investment Blue","AssetClass":"Intermediate Core Bond","Order":77},
  {"ct_investmentid":263,"ct_PlanID":3004,"Ref":"Investment Blue","AssetClass":"Intermediate Core Bond","Order":78},
  {"ct_investmentid":264,"ct_PlanID":3004,"Ref":"Investment 15","AssetClass":"Intermediate Core Bond","Order":79},
  {"ct_investmentid":265,"ct_PlanID":3004,"Ref":"Investment 13","AssetClass":"Intermediate Core Bond","Order":80},
  {"ct_investmentid":266,"ct_PlanID":3004,"Ref":"Investment M","AssetClass":"Intermediate Core Bond","Order":81},
  {"ct_investmentid":267,"ct_PlanID":3004,"Ref":"Investment 6","AssetClass":"Intermediate Core Bond","Order":82},
  {"ct_investmentid":268,"ct_PlanID":3004,"Ref":"Investment 6","AssetClass":"Intermediate Core Bond","Order":83},
  {"ct_investmentid":269,"ct_PlanID":3004,"Ref":"Investment D","AssetClass":"Intermediate Core Bond","Order":84},
  {"ct_investmentid":270,"ct_PlanID":3004,"Ref":"Investment 16","AssetClass":"Intermediate Core Bond","Order":85},
  {"ct_investmentid":271,"ct_PlanID":3004,"Ref":"Investment Blue","AssetClass":"Intermediate Core Bond","Order":86},
  {"ct_investmentid":272,"ct_PlanID":3004,"Ref":"Investment Red","AssetClass":"Intermediate Core Bond","Order":87},
  {"ct_investmentid":273,"ct_PlanID":3004,"Ref":"Investment 1","AssetClass":"Intermediate Core Bond","Order":88},
  {"ct_investmentid":274,"ct_PlanID":3004,"Ref":"Investment 14","AssetClass":"Intermediate Core Bond","Order":89},
  {"ct_investmentid":275,"ct_PlanID":3004,"Ref":"Investment Purple","AssetClass":"Intermediate Core Bond","Order":90},
  {"ct_investmentid":276,"ct_PlanID":3004,"Ref":"Investment I","AssetClass":"Intermediate Core Bond","Order":91},
  {"ct_investmentid":277,"ct_PlanID":3004,"Ref":"Investment 7","AssetClass":"Intermediate Core Bond","Order":92},
  {"ct_investmentid":278,"ct_PlanID":3004,"Ref":"Investment HIJ","AssetClass":"Intermediate Core Bond","Order":93},
  {"ct_investmentid":279,"ct_PlanID":3004,"Ref":"Investment O","AssetClass":"Intermediate Core Bond","Order":94},
  {"ct_investmentid":280,"ct_PlanID":3004,"Ref":"Investment 5","AssetClass":"Intermediate Core Bond","Order":95},
  {"ct_investmentid":281,"ct_PlanID":3004,"Ref":"Investment 6","AssetClass":"Intermediate Core Bond","Order":96},
  {"ct_investmentid":282,"ct_PlanID":3004,"Ref":"Investment DEF","AssetClass":"Intermediate Core Bond","Order":97},
  {"ct_investmentid":283,"ct_PlanID":3004,"Ref":"Investment G","AssetClass":"Intermediate Core Bond","Order":98},
  {"ct_investmentid":284,"ct_PlanID":3004,"Ref":"Investment B","AssetClass":"Intermediate Core Bond","Order":99},
  {"ct_investmentid":285,"ct_PlanID":3004,"Ref":"Investment KLM","AssetClass":"Intermediate Core Bond","Order":100},
  {"ct_investmentid":286,"ct_PlanID":3004,"Ref":"Investment TUV","AssetClass":"Intermediate Core Bond","Order":101},
  {"ct_investmentid":287,"ct_PlanID":3004,"Ref":"Investment White","AssetClass":"Intermediate Core Bond","Order":102},
  {"ct_investmentid":288,"ct_PlanID":3004,"Ref":"Investment TUV","AssetClass":"Intermediate Core Bond","Order":103},
  {"ct_investmentid":289,"ct_PlanID":3004,"Ref":"Investment Black","AssetClass":"Intermediate Core Bond","Order":104},
  {"ct_investmentid":290,"ct_PlanID":3004,"Ref":"Investment 11","AssetClass":"Intermediate Core Bond","Order":105},
  {"ct_investmentid":291,"ct_PlanID":3004,"Ref":"Investment 20","AssetClass":"Intermediate Core Bond","Order":106},
  {"ct_investmentid":292,"ct_PlanID":3004,"Ref":"Investment KLM","AssetClass":"Intermediate Core Bond","Order":107},
  {"ct_investmentid":293,"ct_PlanID":3004,"Ref":"Investment 19","AssetClass":"Intermediate Core Bond","Order":108},
  {"ct_investmentid":294,"ct_PlanID":3004,"Ref":"Investment ABC","AssetClass":"Intermediate Core Bond","Order":109},
  {"ct_investmentid":295,"ct_PlanID":3004,"Ref":"Investment K","AssetClass":"Intermediate Core Bond","Order":110},
  {"ct_investmentid":296,"ct_PlanID":3004,"Ref":"Investment N","AssetClass":"Intermediate Core Bond","Order":111},
  {"ct_investmentid":297,"ct_PlanID":3004,"Ref":"Investment 12","AssetClass":"Intermediate Core Bond","Order":112},
  {"ct_investmentid":298,"ct_PlanID":3004,"Ref":"Investment 14","AssetClass":"Intermediate Core Bond","Order":113},
  {"ct_investmentid":299,"ct_PlanID":3004,"Ref":"Investment 7","AssetClass":"Intermediate Core Bond","Order":114},
  {"ct_investmentid":300,"ct_PlanID":3004,"Ref":"Investment 19","AssetClass":"Intermediate Core Bond","Order":115},
];


// ===================== PAGESETS (EXHIBITS) =====================

export const pagesets = [
  // Category 1: Core Shared Pages (Client Level)
  { id: 'ps-1', name: 'Title Page', categoryId: 1, isTab: false },
  { id: 'ps-2', name: 'Table of Contents', categoryId: 1, isTab: false },
  { id: 'ps-3', name: 'CAPTRUST Team Members', categoryId: 1, isTab: false },
  { id: 'ps-4', name: 'Investment Review | Select Commentary', categoryId: 1, isTab: false },
  { id: 'ps-5', name: 'Action Items', categoryId: 1, isTab: false },
  { id: 'ps-6', name: 'Evaluation Methodology', categoryId: 1, isTab: false },
  { id: 'ps-7', name: 'Fact Sheets', categoryId: 1, isTab: false },
  { id: 'ps-8', name: 'Investment Policy Monitor - Active', categoryId: 1, isTab: false },
  { id: 'ps-9', name: 'Investment Policy Monitor - TDF, Passive', categoryId: 1, isTab: false },
  { id: 'ps-10', name: 'TAB - Appendix', categoryId: 1, isTab: true },
  { id: 'ps-11', name: 'TAB - Fund Fact Sheets', categoryId: 1, isTab: true },
  { id: 'ps-12', name: 'TAB - Industry Updates', categoryId: 1, isTab: true },
  { id: 'ps-13', name: 'TAB - Market Commentary', categoryId: 1, isTab: true },
  { id: 'ps-14', name: 'TAB - Plan Investment Review', categoryId: 1, isTab: true },
  { id: 'ps-15', name: 'Market Commentary', categoryId: 1, isTab: false },
  { id: 'ps-16', name: 'TAB - Asset Investment Review', categoryId: 1, isTab: true },
  { id: 'ps-17', name: 'DB Topical Spotlight', categoryId: 1, isTab: false },
  { id: 'ps-18', name: 'DC Topical Spotlight', categoryId: 1, isTab: false },
  { id: 'ps-19', name: 'NQ Topical Spotlight', categoryId: 1, isTab: false },
  { id: 'ps-20', name: 'Action Items | Notes', categoryId: 1, isTab: false },
  { id: 'ps-21', name: 'TAB - Executive Summary', categoryId: 1, isTab: true },
  { id: 'ps-22', name: 'TAB - Due Diligence', categoryId: 1, isTab: true },
  { id: 'ps-23', name: 'TAB - Manager Fact Sheets', categoryId: 1, isTab: true },
  { id: 'ps-24', name: 'MAPS Current Allocations', categoryId: 1, isTab: false },
  { id: 'ps-25', name: 'TAB - MAPS Managed Accounts Portfolio Review', categoryId: 1, isTab: true },
  { id: 'ps-26', name: 'Market Commentary Short', categoryId: 1, isTab: false },
  { id: 'ps-27', name: 'Internal Fee Benchmark', categoryId: 1, isTab: false },
  { id: 'ps-28', name: 'Disclosure', categoryId: 1, isTab: false },

  // Category 2: Single Plan Only
  { id: 'ps-30', name: 'Historical Fund Scores', categoryId: 2, isTab: false },
  { id: 'ps-31', name: 'Historical Asset Valuation Summary', categoryId: 2, isTab: false },
  { id: 'ps-34', name: 'Performance Summary', categoryId: 2, isTab: false },
  { id: 'ps-35', name: 'Asset Valuation Summary', categoryId: 2, isTab: false },
  { id: 'ps-36', name: 'DC Plan Information Summary', categoryId: 2, isTab: false },
  { id: 'ps-37', name: 'DC Fee Comparison', categoryId: 2, isTab: false },
  { id: 'ps-38', name: 'DC Fee Comparison Detail Grid', categoryId: 2, isTab: false },
  { id: 'ps-39', name: 'Expense Analysis - Current', categoryId: 2, isTab: false },
  { id: 'ps-40', name: 'Expense Analysis - Recommended', categoryId: 2, isTab: false },
  { id: 'ps-41', name: 'Mapping Fund Additions', categoryId: 2, isTab: false },
  { id: 'ps-42', name: 'Expense Comparison', categoryId: 2, isTab: false },
  { id: 'ps-43', name: 'Investment Review | Select Commentary with Score', categoryId: 2, isTab: false },
  { id: 'ps-44', name: 'Investment Expense Evaluation', categoryId: 2, isTab: false },
  { id: 'ps-45', name: 'Investment Vehicle Evaluation', categoryId: 2, isTab: false },
  { id: 'ps-46', name: 'Plan Design Review', categoryId: 2, isTab: false },
  { id: 'ps-47', name: 'Exec Sum | Investment Detail', categoryId: 2, isTab: false },
  { id: 'ps-48', name: 'Asset Plan Menu', categoryId: 2, isTab: false },
  { id: 'ps-49', name: 'Plan Design - Summary of Key Plan Design Features', categoryId: 2, isTab: false },
  { id: 'ps-50', name: 'Plan Design - Automatic Enrollment', categoryId: 2, isTab: false },
  { id: 'ps-51', name: 'Plan Design - Automatic Escalation', categoryId: 2, isTab: false },
  { id: 'ps-52', name: 'Plan Design - Qualified Default Investment Option', categoryId: 2, isTab: false },
  { id: 'ps-53', name: 'Plan Design - Employer Contributions', categoryId: 2, isTab: false },
  { id: 'ps-54', name: 'Plan Design - Loans', categoryId: 2, isTab: false },
  { id: 'ps-55', name: 'Plan Design - Other Plan Features', categoryId: 2, isTab: false },
  { id: 'ps-56', name: 'Plan Design - Secure 2.0', categoryId: 2, isTab: false },

  // Category 3: Multi Plan Only
  { id: 'ps-60', name: 'Multi Asset Valuation Summary', categoryId: 3, isTab: false },
  { id: 'ps-61', name: 'Multi Performance Summary', categoryId: 3, isTab: false },
  { id: 'ps-62', name: 'Multi Investment Policy Monitor', categoryId: 3, isTab: false },
  { id: 'ps-63', name: 'Multi Investment Policy Monitor - TDF, Passive', categoryId: 3, isTab: false },
  { id: 'ps-64', name: 'Multi Investment Review | Select Commentary', categoryId: 3, isTab: false },
  { id: 'ps-65', name: 'Multi Plan Menu', categoryId: 3, isTab: false },

  // Category 4: COMBO (Client) - Specific Pages
  { id: 'ps-70', name: 'COMBO Fact Sheets', categoryId: 4, isTab: false },
  { id: 'ps-71', name: 'At Work - Table of Contents', categoryId: 4, isTab: false },
  { id: 'ps-72', name: 'At Work - Goals and Objectives', categoryId: 4, isTab: false },
  { id: 'ps-73', name: 'At Work - Participant Communication and Advice Access', categoryId: 4, isTab: false },
  { id: 'ps-74', name: 'At Work - Retirement Blueprint Results', categoryId: 4, isTab: false },
  { id: 'ps-75', name: 'At Work - Employee Survey Results', categoryId: 4, isTab: false },
  { id: 'ps-76', name: 'At Work - Employee Interactions', categoryId: 4, isTab: false },
  { id: 'ps-77', name: 'At Work - Wellness Content', categoryId: 4, isTab: false },
  { id: 'ps-78', name: 'At Work - Communications to Employees', categoryId: 4, isTab: false },
  { id: 'ps-79', name: 'At Work - Employee Engagement Strategies', categoryId: 4, isTab: false },
  { id: 'ps-80', name: 'At Work - Participant Engagement Calendar', categoryId: 4, isTab: false },
  { id: 'ps-81', name: 'At Work - Action Items and Reminders', categoryId: 4, isTab: false },

  // Category 6: Single Plan with Liabilities Only
  { id: 'ps-90', name: 'NQ Asset/Liability Summary Page', categoryId: 6, isTab: false },
  { id: 'ps-91', name: 'NQ Liability Investment Policy Monitor', categoryId: 6, isTab: false },
  { id: 'ps-93', name: 'NQ Asset Performance Summary', categoryId: 6, isTab: false },
  { id: 'ps-94', name: 'NQ Historical Liability Valuation Summary', categoryId: 6, isTab: false },
  { id: 'ps-95', name: 'TAB - NQ Plan Financing Review', categoryId: 6, isTab: true },
  { id: 'ps-96', name: 'TAB - NQ Benefit Liability Investment Review', categoryId: 6, isTab: true },
  { id: 'ps-97', name: 'NQ Hedging Strategy Review', categoryId: 6, isTab: false },
  { id: 'ps-98', name: 'NQ Investment Policy Monitor - TDF, Passive', categoryId: 6, isTab: false },
  { id: 'ps-99', name: 'NQ Liability Investment Select Commentary', categoryId: 6, isTab: false },
  { id: 'ps-100', name: 'NQ Liability Valuation Summary', categoryId: 6, isTab: false },
  { id: 'ps-101', name: 'NQ Liability Plan Menu', categoryId: 6, isTab: false },

  // Category 7: Single Plan with DB Only
  { id: 'ps-110', name: 'DB Investment Policy Summary', categoryId: 7, isTab: false },
  { id: 'ps-111', name: 'DB Summary and Recommendations', categoryId: 7, isTab: false },
  { id: 'ps-112', name: 'DB Evaluation Methodology', categoryId: 7, isTab: false },
  { id: 'ps-113', name: 'DB Performance Book', categoryId: 7, isTab: false },
];

// ===================== EXHIBIT TEMPLATE CONFIG =====================
// (ExhibitTemplate in DB — independent reusable entities)

export const exhibitTemplateConfigs = [
  // Client-specific templates (AccountID = owning client)
  { ExhibitTemplateID: 77777, ExhibitTemplateType: 3, Name: 'Demo Client DC Plan', IndvAssetSummaries: false, LastSavedBy: 'Jane Doe', LastSaved: '2025-05-01T09:45:00Z', AccountID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
  { ExhibitTemplateID: 77778, ExhibitTemplateType: 3, Name: 'Demo Client DC Plan 2 Prelim', IndvAssetSummaries: false, LastSavedBy: 'Jane Doe', LastSaved: '2025-05-02T11:30:00Z', AccountID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
  { ExhibitTemplateID: 77779, ExhibitTemplateType: 3, Name: 'Demo Client NQ Plan 3', IndvAssetSummaries: false, LastSavedBy: 'Jane Doe', LastSaved: '2025-04-05T08:15:00Z', AccountID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
  { ExhibitTemplateID: 77780, ExhibitTemplateType: 3, Name: 'Demo Client DB Plan 4', IndvAssetSummaries: false, LastSavedBy: 'Jane Doe', LastSaved: '2025-04-07T13:50:00Z', AccountID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
  { ExhibitTemplateID: 77781, ExhibitTemplateType: 3, Name: 'Demo Client Everything', IndvAssetSummaries: false, LastSavedBy: 'Jane Doe', LastSaved: '2025-06-12T10:05:00Z', AccountID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
  { ExhibitTemplateID: 88888, ExhibitTemplateType: 4, Name: 'Demo Client DC Plan Rollup', IndvAssetSummaries: true, LastSavedBy: 'Jane Doe', LastSaved: '2025-03-10T15:30:00Z', AccountID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
  { ExhibitTemplateID: 66666, ExhibitTemplateType: 5, Name: 'Demo Client Combo', IndvAssetSummaries: false, LastSavedBy: 'Jane Doe', LastSaved: '2025-03-12T17:20:00Z', AccountID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },

  // Shared templates (AccountID = null — visible across all clients)
  { ExhibitTemplateID: 22222, ExhibitTemplateType: 1, Name: 'Raleigh Advisor Template', IndvAssetSummaries: false, LastSavedBy: 'John Smith', LastSaved: '2025-04-21T14:00:00Z', AccountID: null },
  { ExhibitTemplateID: 33333, ExhibitTemplateType: 1, Name: 'XYZ Advisor DC Preferred', IndvAssetSummaries: false, LastSavedBy: 'Bob Johnson', LastSaved: '2025-05-01T10:00:00Z', AccountID: null },
  { ExhibitTemplateID: 44444, ExhibitTemplateType: 1, Name: 'DC Standard', IndvAssetSummaries: false, LastSavedBy: 'Bob Johnson', LastSaved: '2025-05-01T10:30:00Z', AccountID: null },
  { ExhibitTemplateID: 55555, ExhibitTemplateType: 1, Name: 'Sample NQ Template', IndvAssetSummaries: false, LastSavedBy: 'Bob Johnson', LastSaved: '2025-05-01T11:00:00Z', AccountID: null },
  { ExhibitTemplateID: 22223, ExhibitTemplateType: 2, Name: 'Standard DC + Investment Detail', IndvAssetSummaries: true, LastSavedBy: 'Bob Johnson', LastSaved: '2025-04-21T14:30:00Z', AccountID: null },
];

// ===================== EXHIBIT TEMPLATE (JUNCTION) =====================
// Links ExhibitTemplateID → PageSetID with ordering

export const exhibitTemplatePageSets = [
  // ExhibitTemplateID 77777: Demo Client DC Plan
  { ExhibitTemplateID: 77777, PageSetID: 'ps-1', Order: 1 },
  { ExhibitTemplateID: 77777, PageSetID: 'ps-2', Order: 2 },
  { ExhibitTemplateID: 77777, PageSetID: 'ps-18', Order: 3 },
  { ExhibitTemplateID: 77777, PageSetID: 'ps-13', Order: 4 },
  { ExhibitTemplateID: 77777, PageSetID: 'ps-15', Order: 5 },
  { ExhibitTemplateID: 77777, PageSetID: 'ps-14', Order: 6 },
  { ExhibitTemplateID: 77777, PageSetID: 'ps-35', Order: 7 },
  { ExhibitTemplateID: 77777, PageSetID: 'ps-8', Order: 8 },
  { ExhibitTemplateID: 77777, PageSetID: 'ps-9', Order: 9 },
  { ExhibitTemplateID: 77777, PageSetID: 'ps-4', Order: 10 },
  { ExhibitTemplateID: 77777, PageSetID: 'ps-34', Order: 11 },
  { ExhibitTemplateID: 77777, PageSetID: 'ps-7', Order: 12 },
  { ExhibitTemplateID: 77777, PageSetID: 'ps-46', Order: 13 },
  { ExhibitTemplateID: 77777, PageSetID: 'ps-10', Order: 14 },
  { ExhibitTemplateID: 77777, PageSetID: 'ps-3', Order: 15 },
  { ExhibitTemplateID: 77777, PageSetID: 'ps-20', Order: 16 },
  { ExhibitTemplateID: 77777, PageSetID: 'ps-6', Order: 17 },
  { ExhibitTemplateID: 77777, PageSetID: 'ps-28', Order: 18 },

  // ExhibitTemplateID 77778: Demo Client DC Plan 2 Prelim
  { ExhibitTemplateID: 77778, PageSetID: 'ps-1', Order: 1 },
  { ExhibitTemplateID: 77778, PageSetID: 'ps-2', Order: 2 },
  { ExhibitTemplateID: 77778, PageSetID: 'ps-15', Order: 3 },
  { ExhibitTemplateID: 77778, PageSetID: 'ps-8', Order: 4 },
  { ExhibitTemplateID: 77778, PageSetID: 'ps-9', Order: 5 },
  { ExhibitTemplateID: 77778, PageSetID: 'ps-6', Order: 6 },
  { ExhibitTemplateID: 77778, PageSetID: 'ps-28', Order: 7 },

  // ExhibitTemplateID 77779: Demo Client NQ Plan 3
  { ExhibitTemplateID: 77779, PageSetID: 'ps-1', Order: 1 },
  { ExhibitTemplateID: 77779, PageSetID: 'ps-2', Order: 2 },
  { ExhibitTemplateID: 77779, PageSetID: 'ps-3', Order: 3 },
  { ExhibitTemplateID: 77779, PageSetID: 'ps-19', Order: 4 },
  { ExhibitTemplateID: 77779, PageSetID: 'ps-6', Order: 5 },
  { ExhibitTemplateID: 77779, PageSetID: 'ps-28', Order: 6 },

  // ExhibitTemplateID 77780: Demo Client DB Plan 4
  { ExhibitTemplateID: 77780, PageSetID: 'ps-1', Order: 1 },
  { ExhibitTemplateID: 77780, PageSetID: 'ps-2', Order: 2 },
  { ExhibitTemplateID: 77780, PageSetID: 'ps-3', Order: 3 },
  { ExhibitTemplateID: 77780, PageSetID: 'ps-17', Order: 4 },
  { ExhibitTemplateID: 77780, PageSetID: 'ps-6', Order: 5 },
  { ExhibitTemplateID: 77780, PageSetID: 'ps-28', Order: 6 },

  // ExhibitTemplateID 77781: Demo Client Everything
  { ExhibitTemplateID: 77781, PageSetID: 'ps-1', Order: 1 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-2', Order: 2 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-3', Order: 3 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-4', Order: 4 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-5', Order: 5 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-6', Order: 6 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-7', Order: 7 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-8', Order: 8 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-9', Order: 9 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-10', Order: 10 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-11', Order: 11 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-12', Order: 12 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-13', Order: 13 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-14', Order: 14 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-15', Order: 15 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-16', Order: 16 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-17', Order: 17 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-18', Order: 18 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-19', Order: 19 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-20', Order: 20 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-21', Order: 21 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-22', Order: 22 },
  { ExhibitTemplateID: 77781, PageSetID: 'ps-28', Order: 23 },

  // ExhibitTemplateID 88888: Demo Client DC Plan Rollup (multi)
  { ExhibitTemplateID: 88888, PageSetID: 'ps-1', Order: 1 },
  { ExhibitTemplateID: 88888, PageSetID: 'ps-2', Order: 2 },
  { ExhibitTemplateID: 88888, PageSetID: 'ps-12', Order: 3 },
  { ExhibitTemplateID: 88888, PageSetID: 'ps-18', Order: 4 },
  { ExhibitTemplateID: 88888, PageSetID: 'ps-13', Order: 5 },
  { ExhibitTemplateID: 88888, PageSetID: 'ps-15', Order: 6 },
  { ExhibitTemplateID: 88888, PageSetID: 'ps-65', Order: 7 },
  { ExhibitTemplateID: 88888, PageSetID: 'ps-60', Order: 8 },
  { ExhibitTemplateID: 88888, PageSetID: 'ps-62', Order: 9 },
  { ExhibitTemplateID: 88888, PageSetID: 'ps-63', Order: 10 },
  { ExhibitTemplateID: 88888, PageSetID: 'ps-64', Order: 11 },
  { ExhibitTemplateID: 88888, PageSetID: 'ps-61', Order: 12 },
  { ExhibitTemplateID: 88888, PageSetID: 'ps-7', Order: 13 },
  { ExhibitTemplateID: 88888, PageSetID: 'ps-10', Order: 14 },
  { ExhibitTemplateID: 88888, PageSetID: 'ps-3', Order: 15 },
  { ExhibitTemplateID: 88888, PageSetID: 'ps-6', Order: 16 },
  { ExhibitTemplateID: 88888, PageSetID: 'ps-28', Order: 17 },

  // ExhibitTemplateID 66666: Demo Client Combo
  { ExhibitTemplateID: 66666, PageSetID: 'ps-1', Order: 1 },
  { ExhibitTemplateID: 66666, PageSetID: 'ps-2', Order: 2 },
  { ExhibitTemplateID: 66666, PageSetID: 'ps-15', Order: 3 },
  { ExhibitTemplateID: 66666, PageSetID: 'ps-18', Order: 4 },
  { ExhibitTemplateID: 66666, PageSetID: 'ps-70', Order: 5 },
  { ExhibitTemplateID: 66666, PageSetID: 'ps-6', Order: 6 },
  { ExhibitTemplateID: 66666, PageSetID: 'ps-28', Order: 7 },

  // ExhibitTemplateID 22222: Raleigh Advisor Template (shared)
  { ExhibitTemplateID: 22222, PageSetID: 'ps-1', Order: 1 },
  { ExhibitTemplateID: 22222, PageSetID: 'ps-2', Order: 2 },
  { ExhibitTemplateID: 22222, PageSetID: 'ps-3', Order: 3 },
  { ExhibitTemplateID: 22222, PageSetID: 'ps-4', Order: 4 },
  { ExhibitTemplateID: 22222, PageSetID: 'ps-5', Order: 5 },
  { ExhibitTemplateID: 22222, PageSetID: 'ps-7', Order: 6 },
  { ExhibitTemplateID: 22222, PageSetID: 'ps-8', Order: 7 },
  { ExhibitTemplateID: 22222, PageSetID: 'ps-9', Order: 8 },
  { ExhibitTemplateID: 22222, PageSetID: 'ps-15', Order: 9 },
  { ExhibitTemplateID: 22222, PageSetID: 'ps-18', Order: 10 },
  { ExhibitTemplateID: 22222, PageSetID: 'ps-20', Order: 11 },
  { ExhibitTemplateID: 22222, PageSetID: 'ps-6', Order: 12 },
  { ExhibitTemplateID: 22222, PageSetID: 'ps-28', Order: 13 },

  // ExhibitTemplateID 33333: XYZ Advisor DC Preferred (shared)
  { ExhibitTemplateID: 33333, PageSetID: 'ps-1', Order: 1 },
  { ExhibitTemplateID: 33333, PageSetID: 'ps-2', Order: 2 },
  { ExhibitTemplateID: 33333, PageSetID: 'ps-3', Order: 3 },
  { ExhibitTemplateID: 33333, PageSetID: 'ps-4', Order: 4 },
  { ExhibitTemplateID: 33333, PageSetID: 'ps-7', Order: 5 },
  { ExhibitTemplateID: 33333, PageSetID: 'ps-8', Order: 6 },
  { ExhibitTemplateID: 33333, PageSetID: 'ps-15', Order: 7 },
  { ExhibitTemplateID: 33333, PageSetID: 'ps-18', Order: 8 },
  { ExhibitTemplateID: 33333, PageSetID: 'ps-6', Order: 9 },
  { ExhibitTemplateID: 33333, PageSetID: 'ps-28', Order: 10 },

  // ExhibitTemplateID 44444: DC Standard (shared)
  { ExhibitTemplateID: 44444, PageSetID: 'ps-1', Order: 1 },
  { ExhibitTemplateID: 44444, PageSetID: 'ps-2', Order: 2 },
  { ExhibitTemplateID: 44444, PageSetID: 'ps-3', Order: 3 },
  { ExhibitTemplateID: 44444, PageSetID: 'ps-7', Order: 4 },
  { ExhibitTemplateID: 44444, PageSetID: 'ps-8', Order: 5 },
  { ExhibitTemplateID: 44444, PageSetID: 'ps-9', Order: 6 },
  { ExhibitTemplateID: 44444, PageSetID: 'ps-15', Order: 7 },
  { ExhibitTemplateID: 44444, PageSetID: 'ps-18', Order: 8 },
  { ExhibitTemplateID: 44444, PageSetID: 'ps-6', Order: 9 },
  { ExhibitTemplateID: 44444, PageSetID: 'ps-28', Order: 10 },

  // ExhibitTemplateID 55555: Sample NQ Template (shared)
  { ExhibitTemplateID: 55555, PageSetID: 'ps-1', Order: 1 },
  { ExhibitTemplateID: 55555, PageSetID: 'ps-2', Order: 2 },
  { ExhibitTemplateID: 55555, PageSetID: 'ps-3', Order: 3 },
  { ExhibitTemplateID: 55555, PageSetID: 'ps-19', Order: 4 },
  { ExhibitTemplateID: 55555, PageSetID: 'ps-6', Order: 5 },
  { ExhibitTemplateID: 55555, PageSetID: 'ps-28', Order: 6 },

  // ExhibitTemplateID 22223: Standard DC + Investment Detail (shared multi)
  { ExhibitTemplateID: 22223, PageSetID: 'ps-1', Order: 1 },
  { ExhibitTemplateID: 22223, PageSetID: 'ps-2', Order: 2 },
  { ExhibitTemplateID: 22223, PageSetID: 'ps-12', Order: 3 },
  { ExhibitTemplateID: 22223, PageSetID: 'ps-18', Order: 4 },
  { ExhibitTemplateID: 22223, PageSetID: 'ps-15', Order: 5 },
  { ExhibitTemplateID: 22223, PageSetID: 'ps-65', Order: 6 },
  { ExhibitTemplateID: 22223, PageSetID: 'ps-60', Order: 7 },
  { ExhibitTemplateID: 22223, PageSetID: 'ps-47', Order: 8 },
  { ExhibitTemplateID: 22223, PageSetID: 'ps-7', Order: 9 },
  { ExhibitTemplateID: 22223, PageSetID: 'ps-6', Order: 10 },
  { ExhibitTemplateID: 22223, PageSetID: 'ps-28', Order: 11 },
];

// ===================== REPORT CONFIGS =====================
// Seed data cleared — configs are now created via the UI and persisted in localStorage.

// Default fund changes check state (all included by default — matches fundChangesInProgress/Executed .included values)
const defaultInProgressChecks = { 1: true, 2: true, 3: true };
const defaultExecutedChecks = { 4: true, 5: true, 6: true };

export const reportConfigs = [
  // Demo Client — Single Plan configs
  { ReportConfigID: 1111, ReportConfigName: 'IRP Demo DC Plan 1 Config', ReportConfigType: 1, Primary: true, BulkRun: true, LastSaved: '2025-06-15T10:30:00Z', UserID: 'jane.doe', PeriodType: 1, AccountID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', BulkTierOverrideID: null, BulkPctThresholdID: null, QDIACheckOptOut: false, CandidateInvestments: false, ParentReportConfigID: null, ExhibitTemplateID: 77777, ct_PlanID: 1001, IncludeFundChanges: true, OptInAllFundChanges: false, FundChangesInProgress: { ...defaultInProgressChecks }, FundChangesExecuted: { ...defaultExecutedChecks }, _displayType: 'Client Single Plan', _savedBy: 'Jane Doe' },
  { ReportConfigID: 1112, ReportConfigName: 'IRP Demo DC Plan 2 Config', ReportConfigType: 1, Primary: true, BulkRun: true, LastSaved: '2025-06-15T11:00:00Z', UserID: 'jane.doe', PeriodType: 1, AccountID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', BulkTierOverrideID: null, BulkPctThresholdID: null, QDIACheckOptOut: false, CandidateInvestments: false, ParentReportConfigID: null, ExhibitTemplateID: 77778, ct_PlanID: 1002, IncludeFundChanges: true, OptInAllFundChanges: false, FundChangesInProgress: { ...defaultInProgressChecks }, FundChangesExecuted: { ...defaultExecutedChecks }, _displayType: 'Client Single Plan', _savedBy: 'Jane Doe' },
  { ReportConfigID: 1113, ReportConfigName: 'IRP Demo NQ Plan 3 Config', ReportConfigType: 1, Primary: true, BulkRun: true, LastSaved: '2025-06-14T09:15:00Z', UserID: 'jane.doe', PeriodType: 1, AccountID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', BulkTierOverrideID: null, BulkPctThresholdID: null, QDIACheckOptOut: true, CandidateInvestments: false, ParentReportConfigID: null, ExhibitTemplateID: 77779, ct_PlanID: 1003, IncludeFundChanges: true, OptInAllFundChanges: false, FundChangesInProgress: { ...defaultInProgressChecks }, FundChangesExecuted: { ...defaultExecutedChecks }, _displayType: 'Client Single Plan', _savedBy: 'Jane Doe' },
  { ReportConfigID: 1114, ReportConfigName: 'IRP Demo DB Plan 4 Config', ReportConfigType: 1, Primary: true, BulkRun: true, LastSaved: '2025-06-14T09:45:00Z', UserID: 'jane.doe', PeriodType: 1, AccountID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', BulkTierOverrideID: null, BulkPctThresholdID: null, QDIACheckOptOut: false, CandidateInvestments: true, ParentReportConfigID: null, ExhibitTemplateID: 77780, ct_PlanID: 1004, IncludeFundChanges: true, OptInAllFundChanges: false, FundChangesInProgress: { ...defaultInProgressChecks }, FundChangesExecuted: { ...defaultExecutedChecks }, _displayType: 'Client Single Plan', _savedBy: 'Jane Doe' },
  // Demo Client — Multi Plan config
  { ReportConfigID: 2222, ReportConfigName: 'IRP Demo Multi Plan Config', ReportConfigType: 2, Primary: true, BulkRun: true, LastSaved: '2025-06-10T14:00:00Z', UserID: 'jane.doe', PeriodType: 1, AccountID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', BulkTierOverrideID: null, BulkPctThresholdID: null, QDIACheckOptOut: false, CandidateInvestments: false, ParentReportConfigID: null, ExhibitTemplateID: 88888, ct_PlanID: null, IncludeFundChanges: true, OptInAllFundChanges: false, FundChangesInProgress: { ...defaultInProgressChecks }, FundChangesExecuted: { ...defaultExecutedChecks }, _displayType: 'Client Multi Plan', _savedBy: 'Jane Doe', _planGroupId: 101, _planGroupName: 'All DC Plans', _planIds: [1001, 1002] },
  // Demo Client — Combo config
  { ReportConfigID: 3333, ReportConfigName: 'IRP Demo Combo Config', ReportConfigType: 3, Primary: true, BulkRun: false, LastSaved: '2025-06-12T16:30:00Z', UserID: 'jane.doe', PeriodType: 1, AccountID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', BulkTierOverrideID: null, BulkPctThresholdID: null, QDIACheckOptOut: false, CandidateInvestments: false, ParentReportConfigID: null, ExhibitTemplateID: 66666, ct_PlanID: null, IncludeFundChanges: true, OptInAllFundChanges: false, FundChangesInProgress: { ...defaultInProgressChecks }, FundChangesExecuted: { ...defaultExecutedChecks }, _displayType: 'Client Combo Plan', _savedBy: 'Jane Doe' },

  // CAPTRUST Shared report configs (AccountID = null — visible across all clients)
  { ReportConfigID: 9001, ReportConfigName: 'CAPTRUST Standard DC Config', ReportConfigType: 1, Primary: false, BulkRun: true, LastSaved: '2025-05-01T10:00:00Z', UserID: 'bob.johnson', PeriodType: 1, AccountID: null, BulkTierOverrideID: null, BulkPctThresholdID: null, QDIACheckOptOut: false, CandidateInvestments: false, ParentReportConfigID: null, ExhibitTemplateID: 44444, ct_PlanID: null, IncludeFundChanges: true, OptInAllFundChanges: false, FundChangesInProgress: { ...defaultInProgressChecks }, FundChangesExecuted: { ...defaultExecutedChecks }, _displayType: 'CAPTRUST Shared', _savedBy: 'Bob Johnson' },
  { ReportConfigID: 9002, ReportConfigName: 'CAPTRUST Standard NQ Config', ReportConfigType: 1, Primary: false, BulkRun: true, LastSaved: '2025-05-01T11:00:00Z', UserID: 'bob.johnson', PeriodType: 1, AccountID: null, BulkTierOverrideID: null, BulkPctThresholdID: null, QDIACheckOptOut: true, CandidateInvestments: false, ParentReportConfigID: null, ExhibitTemplateID: 55555, ct_PlanID: null, IncludeFundChanges: true, OptInAllFundChanges: false, FundChangesInProgress: { ...defaultInProgressChecks }, FundChangesExecuted: { ...defaultExecutedChecks }, _displayType: 'CAPTRUST Shared', _savedBy: 'Bob Johnson' },
  { ReportConfigID: 9003, ReportConfigName: 'Raleigh Office DC Standard', ReportConfigType: 1, Primary: false, BulkRun: true, LastSaved: '2025-04-21T14:00:00Z', UserID: 'john.smith', PeriodType: 1, AccountID: null, BulkTierOverrideID: null, BulkPctThresholdID: null, QDIACheckOptOut: false, CandidateInvestments: false, ParentReportConfigID: null, ExhibitTemplateID: 22222, ct_PlanID: null, IncludeFundChanges: true, OptInAllFundChanges: true, FundChangesInProgress: { ...defaultInProgressChecks }, FundChangesExecuted: { ...defaultExecutedChecks }, _displayType: 'CAPTRUST Shared', _savedBy: 'John Smith' },
  { ReportConfigID: 9004, ReportConfigName: 'CAPTRUST Standard Multi Plan Config', ReportConfigType: 2, Primary: false, BulkRun: true, LastSaved: '2025-04-21T14:30:00Z', UserID: 'bob.johnson', PeriodType: 1, AccountID: null, BulkTierOverrideID: null, BulkPctThresholdID: null, QDIACheckOptOut: false, CandidateInvestments: false, ParentReportConfigID: null, ExhibitTemplateID: 22223, ct_PlanID: null, IncludeFundChanges: true, OptInAllFundChanges: false, FundChangesInProgress: { ...defaultInProgressChecks }, FundChangesExecuted: { ...defaultExecutedChecks }, _displayType: 'CAPTRUST Shared', _savedBy: 'Bob Johnson' },
];

// ===================== REPORT PLAN GROUPS (Multi Plan) =====================

export const reportPlanGroups = [
  { ReportPlanGroupID: 101, ReportConfigID: 2222, ReportPlanGroupName: 'All DC Plans' },
];

export const reportConfigPlans = [
  { PairingID: 1, ReportPlanGroupID: 101, ct_PlanID: 1001 },
  { PairingID: 2, ReportPlanGroupID: 101, ct_PlanID: 1002 },
];

// Standalone saved plan groups (for Load Group modal)
export const savedPlanGroups = [
  { ReportPlanGroupID: 101, ReportPlanGroupName: 'All DC Plans', ct_PlanIDs: [1001, 1002], AccountID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
  { ReportPlanGroupID: 102, ReportPlanGroupName: 'DB and NQ Plans', ct_PlanIDs: [1003, 1004], AccountID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
];

// ===================== MANAGER ORDER (flat, per-config) =====================

export const managerOrderCustomized = [
  // Config 1111 — Demo Client DC Plan 1 Final
  { ID: 1, ReportConfigID: 1111, Order: 1, CandidateID: null, ct_investmentid: 5001, Ref: 'Vanguard Federal Money Market Investor', AssetClass: 'Money Market', GroupName: 'Fixed Income' },
  { ID: 2, ReportConfigID: 1111, Order: 2, CandidateID: null, ct_investmentid: 5002, Ref: 'Vanguard Retirement Savings Trust III', AssetClass: 'Stable Value', GroupName: 'Fixed Income' },
  { ID: 3, ReportConfigID: 1111, Order: 3, CandidateID: null, ct_investmentid: 5003, Ref: 'Vanguard Institutional Total Bond Market Index Trust', AssetClass: 'Intermediate Core Bond', GroupName: 'Fixed Income' },
  { ID: 4, ReportConfigID: 1111, Order: 4, CandidateID: null, ct_investmentid: 5004, Ref: 'PGIM Total Return Bond Z', AssetClass: 'Intermediate Core-Plus Bond', GroupName: 'Fixed Income' },
  { ID: 5, ReportConfigID: 1111, Order: 5, CandidateID: null, ct_investmentid: 5005, Ref: 'Vanguard Total Intl Bd Idx Admiral', AssetClass: 'Global Bond - USD Hedged', GroupName: 'Fixed Income' },
  { ID: 6, ReportConfigID: 1111, Order: 6, CandidateID: null, ct_investmentid: 5007, Ref: 'Vanguard Target Retirement Income Tr I', AssetClass: 'Target Date Retirement Income', GroupName: 'Target Date Funds' },
  { ID: 7, ReportConfigID: 1111, Order: 7, CandidateID: null, ct_investmentid: 5008, Ref: 'Vanguard Target Retirement 2025 Tr I', AssetClass: 'Target Date 2025', GroupName: 'Target Date Funds' },
  { ID: 8, ReportConfigID: 1111, Order: 8, CandidateID: null, ct_investmentid: 5009, Ref: 'Vanguard Target Retirement 2030 Tr I', AssetClass: 'Target Date 2030', GroupName: 'Target Date Funds' },
  { ID: 9, ReportConfigID: 1111, Order: 9, CandidateID: null, ct_investmentid: 5010, Ref: 'Vanguard Target Retirement 2035 Tr I', AssetClass: 'Target Date 2035', GroupName: 'Target Date Funds' },
  { ID: 10, ReportConfigID: 1111, Order: 10, CandidateID: null, ct_investmentid: 5011, Ref: 'Vanguard Target Retirement 2040 Tr I', AssetClass: 'Target Date 2040', GroupName: 'Target Date Funds' },
  { ID: 11, ReportConfigID: 1111, Order: 11, CandidateID: null, ct_investmentid: 5012, Ref: 'Vanguard Target Retirement 2045 Tr I', AssetClass: 'Target Date 2045', GroupName: 'Target Date Funds' },
  { ID: 12, ReportConfigID: 1111, Order: 12, CandidateID: null, ct_investmentid: 5013, Ref: 'Vanguard Target Retirement 2050 Tr I', AssetClass: 'Target Date 2050', GroupName: 'Target Date Funds' },
  { ID: 13, ReportConfigID: 1111, Order: 13, CandidateID: null, ct_investmentid: 5014, Ref: 'Vanguard Target Retirement 2055 Tr I', AssetClass: 'Target Date 2055', GroupName: 'Target Date Funds' },
  { ID: 14, ReportConfigID: 1111, Order: 14, CandidateID: null, ct_investmentid: 5015, Ref: 'Vanguard Target Retirement 2060 Tr I', AssetClass: 'Target Date 2060', GroupName: 'Target Date Funds' },
  { ID: 15, ReportConfigID: 1111, Order: 15, CandidateID: null, ct_investmentid: 5016, Ref: 'Vanguard Target Retirement 2065 Tr I', AssetClass: 'Target Date 2065+', GroupName: 'Target Date Funds' },
  { ID: 16, ReportConfigID: 1111, Order: 16, CandidateID: null, ct_investmentid: 5019, Ref: 'Vanguard Windsor II Admiral', AssetClass: 'Large Company Value', GroupName: 'Core Equity' },
  { ID: 17, ReportConfigID: 1111, Order: 17, CandidateID: null, ct_investmentid: 5020, Ref: 'Vanguard Value Index I', AssetClass: 'Large Company Value', GroupName: 'Core Equity' },
  { ID: 18, ReportConfigID: 1111, Order: 18, CandidateID: null, ct_investmentid: 5021, Ref: 'Vanguard Institutional 500 Index Trust', AssetClass: 'Large Company Blend', GroupName: 'Core Equity' },
  { ID: 19, ReportConfigID: 1111, Order: 19, CandidateID: null, ct_investmentid: 5022, Ref: 'Vanguard US Growth Admiral', AssetClass: 'Large Company Growth', GroupName: 'Core Equity' },
  { ID: 20, ReportConfigID: 1111, Order: 20, CandidateID: null, ct_investmentid: 5023, Ref: 'Vanguard Growth Index Institutional', AssetClass: 'Large Company Growth', GroupName: 'Core Equity' },
  { ID: 21, ReportConfigID: 1111, Order: 21, CandidateID: null, ct_investmentid: 5024, Ref: 'Vanguard Instl Extended Market Index Trust', AssetClass: 'Medium Company Blend', GroupName: 'Core Equity' },
  { ID: 22, ReportConfigID: 1111, Order: 22, CandidateID: null, ct_investmentid: 5025, Ref: 'American Funds Europacific Growth R6', AssetClass: 'Foreign Large Blend', GroupName: 'Core Equity' },
  { ID: 23, ReportConfigID: 1111, Order: 23, CandidateID: null, ct_investmentid: 5027, Ref: 'Vanguard Inst Total Intl Stock Market Index Trust', AssetClass: 'Foreign Large Blend', GroupName: 'Core Equity' },
  { ID: 24, ReportConfigID: 1111, Order: 24, CandidateID: null, ct_investmentid: 5029, Ref: 'MFS New Discovery Value R4', AssetClass: 'Small Company Value', GroupName: 'Core Equity' },
  { ID: 25, ReportConfigID: 1111, Order: 25, CandidateID: null, ct_investmentid: 5030, Ref: 'Fidelity Small Cap Growth K6', AssetClass: 'Small Company Growth', GroupName: 'Core Equity' },
  { ID: 26, ReportConfigID: 1111, Order: 26, CandidateID: null, ct_investmentid: 5031, Ref: 'Loan Account', AssetClass: 'Loan', GroupName: 'Core Equity' },

  // Config 1300 — DC Plan 2 Prelim (has a candidate)
  { ID: 30, ReportConfigID: 1300, Order: 1, CandidateID: null, ct_investmentid: 5001, Ref: 'Vanguard Federal Money Market Investor', AssetClass: 'Money Market', GroupName: 'Fixed Income' },
  { ID: 31, ReportConfigID: 1300, Order: 2, CandidateID: null, ct_investmentid: 5002, Ref: 'Vanguard Retirement Savings Trust III', AssetClass: 'Stable Value', GroupName: 'Fixed Income' },
  { ID: 32, ReportConfigID: 1300, Order: 3, CandidateID: null, ct_investmentid: 5003, Ref: 'Vanguard Institutional Total Bond Market Index Trust', AssetClass: 'Intermediate Core Bond', GroupName: 'Fixed Income' },
  { ID: 33, ReportConfigID: 1300, Order: 4, CandidateID: null, ct_investmentid: 5004, Ref: 'PGIM Total Return Bond Z', AssetClass: 'Intermediate Core-Plus Bond', GroupName: 'Fixed Income' },
  { ID: 34, ReportConfigID: 1300, Order: 5, CandidateID: 1, ct_investmentid: 6001, Ref: 'PIMCO Income Fund', AssetClass: 'Intermediate Core-Plus Bond', GroupName: 'Fixed Income' },
  { ID: 35, ReportConfigID: 1300, Order: 6, CandidateID: null, ct_investmentid: 5005, Ref: 'Vanguard Total Intl Bd Idx Admiral', AssetClass: 'Global Bond - USD Hedged', GroupName: 'Fixed Income' },

  // Config 1400 — NQ Plan 3
  { ID: 40, ReportConfigID: 1400, Order: 1, CandidateID: null, ct_investmentid: 5021, Ref: 'Vanguard Institutional 500 Index Trust', AssetClass: 'Large Company Blend', GroupName: 'NQ Assets' },
  { ID: 41, ReportConfigID: 1400, Order: 2, CandidateID: null, ct_investmentid: 5003, Ref: 'Vanguard Institutional Total Bond Market Index Trust', AssetClass: 'Intermediate Core Bond', GroupName: 'NQ Assets' },
  { ID: 42, ReportConfigID: 1400, Order: 3, CandidateID: null, ct_investmentid: 5027, Ref: 'Vanguard Inst Total Intl Stock Market Index Trust', AssetClass: 'Foreign Large Blend', GroupName: 'NQ Assets' },

  // Config 1500 — DB Plan 4
  { ID: 50, ReportConfigID: 1500, Order: 1, CandidateID: null, ct_investmentid: 5021, Ref: 'Vanguard Institutional 500 Index Trust', AssetClass: 'Large Company Blend', GroupName: 'DB Core' },
  { ID: 51, ReportConfigID: 1500, Order: 2, CandidateID: null, ct_investmentid: 5003, Ref: 'Vanguard Institutional Total Bond Market Index Trust', AssetClass: 'Intermediate Core Bond', GroupName: 'DB Core' },
  { ID: 52, ReportConfigID: 1500, Order: 3, CandidateID: null, ct_investmentid: 5019, Ref: 'Vanguard Windsor II Admiral', AssetClass: 'Large Company Value', GroupName: 'DB Core' },
  { ID: 53, ReportConfigID: 1500, Order: 4, CandidateID: null, ct_investmentid: 5025, Ref: 'American Funds Europacific Growth R6', AssetClass: 'Foreign Large Blend', GroupName: 'DB Core' },
];

// ===================== CANDIDATE INVESTMENTS =====================

export const reportConfigCandidateInvmts = [
  { ID: 1, ReportConfigID: 1300, ct_investmentid: 6001 },
  { ID: 2, ReportConfigID: 1600, ct_investmentid: 6002 },
  { ID: 3, ReportConfigID: 1600, ct_investmentid: 6003 },
];

// ===================== COMBO CONFIG (junction) =====================

export const comboConfigChildren = [
  { ComboReportConfigID: 5555, ReportConfigID: 1111 },
  { ComboReportConfigID: 5555, ReportConfigID: 2222 },
];

// ===================== FUND CHANGES (from DB) =====================

export const fundChangesInProgress = [
  {
    id: 1,
    included: true,
    currentFund: 'DODIX - Dodge & Cox Income I (Intermediate Core-Plus Bond)',
    percentage: 100,
    replacementFund: 'DOXIX - Dodge & Cox Income X (Intermediate Core-Plus Bond)',
    effectiveDate: '2025-06-15',
  },
  {
    id: 2,
    included: true,
    currentFund: 'JEMWX - JPMorgan Emerging Markets Equity R6 (Emerging Markets)',
    percentage: 100,
    replacementFund: 'VTINX - Vanguard Target Retirement Income Fund (Target Date Retirement Income)',
    effectiveDate: null,
  },
  {
    id: 3,
    included: true,
    currentFund: 'EIPCX - Parametric Commodity Strategy Instl (Commodities)',
    percentage: 100,
    replacementFund: 'PTTRX - PIMCO Total Return Fund',
    effectiveDate: '2025-07-01',
  },
];

export const fundChangesExecuted = [
  { id: 4, included: true, currentFund: 'Old Fund A', percentage: 100, replacementFund: 'New Fund B', effectiveDate: '2025-07-10' },
  { id: 5, included: true, currentFund: 'Old Fund X', percentage: 100, replacementFund: 'New Fund Y', effectiveDate: '2025-07-13' },
  { id: 6, included: true, currentFund: 'Old Fund 123', percentage: 100, replacementFund: 'New Fund 789', effectiveDate: '2025-07-15' },
];
