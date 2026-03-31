import { useState, useMemo, useEffect, useCallback } from 'react';
import { ConfigProvider, Select, Button, Space, Tag, message } from 'antd';
import { SettingOutlined, StarFilled, FileTextOutlined, TeamOutlined, ExperimentOutlined, ShareAltOutlined, DashboardOutlined } from '@ant-design/icons';
import { allClients as seedClients, allPlans as seedPlans, reportConfigs as seedConfigs, exhibitTemplateConfigs as seedTemplates, savedPlanGroups as seedPlanGroups, fundChangesInProgress, fundChangesExecuted, seedInvestments } from './data/mockData';
import { resolveReportConfig, resolveExhibitPageSetIds } from './data/dataResolvers';
import ConfigTypeSelector from './components/ConfigTypeSelector';
import SinglePlanConfig from './components/SinglePlanConfig';
import MultiPlanConfig from './components/MultiPlanConfig';
import ComboConfig from './components/ComboConfig';
import LoadConfigModal from './components/LoadConfigModal';
import MockDataAdmin from './components/MockDataAdmin';
import BulkDashboard from './components/BulkDashboard';
import irpLogo from './assets/irp-logo.png';
import './App.css';

function App() {
  // --- Mock Data Admin: clients, plans, investments, candidates are stateful + localStorage-persisted ---
  const CLIENTS_KEY = 'irp-saved-clients-v1';
  const PLANS_KEY = 'irp-saved-plans-v1';
  const INVESTMENTS_KEY = 'irp-saved-investments-v2';
  const CANDIDATES_KEY = 'irp-saved-candidates-v1';

  const [allClients, setAllClients] = useState(() => {
    try {
      const stored = localStorage.getItem(CLIENTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const storedIds = new Set(parsed.map(c => c.accountId));
          const missing = seedClients.filter(c => !storedIds.has(c.accountId));
          return [...parsed, ...missing];
        }
      }
    } catch (e) { /* ignore */ }
    return [...seedClients];
  });

  const [allPlans, setAllPlans] = useState(() => {
    try {
      const stored = localStorage.getItem(PLANS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const storedIds = new Set(parsed.map(p => p.ct_PlanID));
          const missing = seedPlans.filter(p => !storedIds.has(p.ct_PlanID));
          return [...parsed, ...missing];
        }
      }
    } catch (e) { /* ignore */ }
    return [...seedPlans];
  });

  const [investments, setInvestments] = useState(() => {
    try {
      const stored = localStorage.getItem(INVESTMENTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge in any seed investments not already stored
          const storedIds = new Set(parsed.map(inv => inv.ct_investmentid));
          const missing = seedInvestments.filter(inv => !storedIds.has(inv.ct_investmentid));
          return [...parsed, ...missing];
        }
      }
    } catch (e) { /* ignore */ }
    return [...seedInvestments];
  });

  const [candidates, setCandidates] = useState(() => {
    try {
      const stored = localStorage.getItem(CANDIDATES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { /* ignore */ }
    return [];
  });

  const FUND_CHANGES_KEY = 'irp-saved-fund-changes-v1';
  const [allFundChanges, setAllFundChanges] = useState(() => {
    try {
      const stored = localStorage.getItem(FUND_CHANGES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { /* ignore */ }
    // Seed from static data — assign to a default plan
    return [
      ...fundChangesInProgress.map(f => ({ ...f, ct_PlanID: 1001, changeType: 'inProgress' })),
      ...fundChangesExecuted.map(f => ({ ...f, ct_PlanID: 1001, changeType: 'executed' })),
    ];
  });

  // Persist mock data state
  useEffect(() => { try { localStorage.setItem(CLIENTS_KEY, JSON.stringify(allClients)); } catch (e) {} }, [allClients]);
  useEffect(() => { try { localStorage.setItem(PLANS_KEY, JSON.stringify(allPlans)); } catch (e) {} }, [allPlans]);
  useEffect(() => { try { localStorage.setItem(INVESTMENTS_KEY, JSON.stringify(investments)); } catch (e) {} }, [investments]);
  useEffect(() => { try { localStorage.setItem(CANDIDATES_KEY, JSON.stringify(candidates)); } catch (e) {} }, [candidates]);
  useEffect(() => { try { localStorage.setItem(FUND_CHANGES_KEY, JSON.stringify(allFundChanges)); } catch (e) {} }, [allFundChanges]);

  const [mockAdminOpen, setMockAdminOpen] = useState(false);

  // Simulated user permission: can this user modify shared report configs & exhibit templates?
  const TEMPLATE_ADMIN_KEY = 'irp-is-template-admin';
  const [isTemplateAdmin, setIsTemplateAdmin] = useState(() => {
    try {
      const stored = localStorage.getItem(TEMPLATE_ADMIN_KEY);
      return stored === 'true';
    } catch (e) { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem(TEMPLATE_ADMIN_KEY, String(isTemplateAdmin)); } catch (e) {}
  }, [isTemplateAdmin]);

  // Client switcher (demo only — in production this comes from CRM context)
  const [selectedClientId, setSelectedClientId] = useState(() => allClients[0]?.accountId);
  const activeClient = useMemo(() => allClients.find(c => c.accountId === selectedClientId) || allClients[0], [selectedClientId, allClients]);
  const clientPlans = useMemo(() => allPlans.filter(p => p.accountId === selectedClientId), [selectedClientId, allPlans]);

  const handleClientChange = (newClientId) => {
    setSelectedClientId(newClientId);
    // Reset all config state for the new client context
    setSelectedPlan(null);
    setConfigType(null);
    setLoadedConfig(null);
    setActiveConfigId(null);
    setActiveConfigName(null);
    setActiveConfigIsPrimary(false);
    setPrimaryConfigName(null);
  };

  const [configType, setConfigType] = useState(null);
  const [period, setPeriod] = useState('Q');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loadConfigOpen, setLoadConfigOpen] = useState(false);
  const [loadedConfig, setLoadedConfig] = useState(null);
  const [loadCounter, setLoadCounter] = useState(0);
  // All configs: persisted in localStorage so saves/renames/deletes survive refresh
  const STORAGE_KEY = 'irp-saved-configs-v4';
  const [allConfigs, setAllConfigs] = useState(() => {
    // Default fund change check maps (used to backfill configs saved before fund-change tracking was added)
    const defaultInProgressChecks = Object.fromEntries(fundChangesInProgress.map(f => [f.id, f.included]));
    const defaultExecutedChecks = Object.fromEntries(fundChangesExecuted.map(f => [f.id, f.included]));
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Migrate: backfill fund changes fields on configs that pre-date fund-change tracking
          const migrated = parsed.map(c => ({
            IncludeFundChanges: true,
            OptInAllFundChanges: false,
            FundChangesInProgress: { ...defaultInProgressChecks },
            FundChangesExecuted: { ...defaultExecutedChecks },
            ...c, // existing fields win — only fills gaps
          }));
          // Merge in any seed configs not already stored (e.g., newly added shared configs)
          const storedIds = new Set(migrated.map(c => c.ReportConfigID));
          const missingSeedConfigs = seedConfigs.filter(sc => !storedIds.has(sc.ReportConfigID));
          return [...migrated, ...missingSeedConfigs];
        }
      }
    } catch (e) { /* ignore parse errors */ }
    return [...seedConfigs];
  });

  // Persist allConfigs to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allConfigs));
    } catch (e) { /* ignore quota errors */ }
  }, [allConfigs]);

  // --- Exhibit Templates: persisted in localStorage ---
  const TEMPLATES_KEY = 'irp-saved-templates-v4';
  const [allTemplates, setAllTemplates] = useState(() => {
    try {
      const stored = localStorage.getItem(TEMPLATES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { /* ignore */ }
    return [...seedTemplates];
  });
  useEffect(() => {
    try {
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(allTemplates));
    } catch (e) { /* ignore */ }
  }, [allTemplates]);

  const handleSaveTemplate = (template) => {
    setAllTemplates(prev => [...prev, template]);
  };
  const handleUpdateTemplate = (templateId, newExhibitIds) => {
    setAllTemplates(prev => prev.map(t =>
      t.ExhibitTemplateID === templateId
        ? { ...t, _sessionIds: [...newExhibitIds], LastSaved: new Date().toISOString(), LastSavedBy: 'You' }
        : t
    ));
  };
  const handleRenameTemplate = (templateId, newName) => {
    setAllTemplates(prev => prev.map(t =>
      t.ExhibitTemplateID === templateId ? { ...t, Name: newName } : t
    ));
  };
  const handleDeleteTemplate = (templateId) => {
    setAllTemplates(prev => prev.filter(t => t.ExhibitTemplateID !== templateId));
  };

  // --- Plan Groups: persisted in localStorage ---
  const PLAN_GROUPS_KEY = 'irp-saved-plan-groups-v1';
  const [allPlanGroups, setAllPlanGroups] = useState(() => {
    try {
      const stored = localStorage.getItem(PLAN_GROUPS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) { /* ignore */ }
    return [...seedPlanGroups];
  });
  useEffect(() => {
    try {
      localStorage.setItem(PLAN_GROUPS_KEY, JSON.stringify(allPlanGroups));
    } catch (e) { /* ignore */ }
  }, [allPlanGroups]);

  const handleSavePlanGroup = (group) => {
    setAllPlanGroups(prev => [...prev, group]);
  };
  const handleUpdatePlanGroup = (groupId, planIds) => {
    setAllPlanGroups(prev => prev.map(g =>
      g.ReportPlanGroupID === groupId
        ? { ...g, ct_PlanIDs: [...planIds] }
        : g
    ));
  };
  const handleRenamePlanGroup = (groupId, newName) => {
    setAllPlanGroups(prev => prev.map(g =>
      g.ReportPlanGroupID === groupId ? { ...g, ReportPlanGroupName: newName } : g
    ));
  };
  const handleDeletePlanGroup = (groupId) => {
    setAllPlanGroups(prev => prev.filter(g => g.ReportPlanGroupID !== groupId));
  };

  // Dashboard view state
  const [dashboardOpen, setDashboardOpen] = useState(false);

  // Track active config (loaded or saved)
  const [activeConfigId, setActiveConfigId] = useState(null);
  const [activeConfigName, setActiveConfigName] = useState(null);
  const [activeConfigIsPrimary, setActiveConfigIsPrimary] = useState(false);

  // Persist plan-to-config assignments so loaded configs survive page reload
  const PLAN_CONFIG_MAP_KEY = 'irp-plan-config-map-v1';
  const [planConfigMap, setPlanConfigMap] = useState(() => {
    try {
      const stored = localStorage.getItem(PLAN_CONFIG_MAP_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem(PLAN_CONFIG_MAP_KEY, JSON.stringify(planConfigMap)); } catch (e) {}
  }, [planConfigMap]);

  // Helper: remember which config was loaded/saved for a plan
  const assignConfigToPlan = useCallback((planId, configId) => {
    if (!planId || !configId) return;
    setPlanConfigMap(prev => ({ ...prev, [planId]: configId }));
  }, []);

  // Track the current primary config name for the selected plan
  const [primaryConfigName, setPrimaryConfigName] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const configs = JSON.parse(stored);
        const primary = configs.find(c => c.Primary && c.ReportConfigType === 1);
        return primary ? primary.ReportConfigName : null;
      }
    } catch (e) { /* ignore */ }
    const primary = seedConfigs.find(c => c.Primary && c.ReportConfigType === 1);
    return primary ? primary.ReportConfigName : null;
  });

  // Per-plan fund changes derived from allFundChanges
  const getFundChangesForPlan = useCallback((planId) => {
    if (!planId) return { inProgress: [], executed: [] };
    const planChanges = allFundChanges.filter(fc => fc.ct_PlanID === planId);
    return {
      inProgress: planChanges.filter(fc => fc.changeType === 'inProgress'),
      executed: planChanges.filter(fc => fc.changeType === 'executed'),
    };
  }, [allFundChanges]);

  const planOptions = useMemo(() =>
    clientPlans.map(p => ({ value: p.ct_PlanID, label: `${p.name} (${p.type})` })),
    [clientPlans]
  );

  const loadConfigById = useCallback((config) => {
    setActiveConfigId(config.ReportConfigID);
    setActiveConfigName(config.ReportConfigName);
    setActiveConfigIsPrimary(config.Primary || false);
    if (config.Primary) {
      setPrimaryConfigName(config.ReportConfigName);
    }
  }, []);

  const handleLoadConfig = (config) => {
    const resolved = resolveReportConfig(config.ReportConfigID);
    loadConfigById(config);
    // Persist plan-to-config assignment for single plan configs
    if (configType === 'single' && selectedPlan) {
      assignConfigToPlan(selectedPlan, config.ReportConfigID);
    }

    // Always attach exhibit template info from the config record
    const templateName = getTemplateName(config.ExhibitTemplateID);
    const exhibitIds = getTemplateExhibitIds(config.ExhibitTemplateID);
    const templateInfo = {
      exhibitTemplateName: templateName,
      exhibitTemplate: config.ExhibitTemplateID ? { ExhibitTemplateID: config.ExhibitTemplateID } : null,
      selectedExhibitIds: exhibitIds,
    };

    if (resolved) {
      setConfigType(resolved.configType);
      setPeriod(resolved.periodCode);
      // Only change the selected plan if the config specifies one (shared configs have null)
      if (resolved.planId != null) {
        setSelectedPlan(resolved.planId);
      }
      setLoadedConfig({
        ...resolved,
        ...templateInfo,
        // Override resolved values with live config record (resolveReportConfig reads seed data,
        // but the user may have saved changes that only exist in allConfigs/localStorage)
        qdiaOptOut: config.QDIACheckOptOut ?? false,
        includeCandidates: config.CandidateInvestments ?? false,
        includeFundChanges: config.IncludeFundChanges,
        optInAllFundChanges: config.OptInAllFundChanges,
        fundChangesInProgressChecks: config.FundChangesInProgress,
        fundChangesExecutedChecks: config.FundChangesExecuted,
        includeInBulk: config.BulkRun ?? true,
        bulkUnlocked: config.BulkTierOverrideID != null || config.BulkPctThresholdID != null,
        bulkTierOverrideId: config.BulkTierOverrideID ?? null,
        bulkPctThresholdId: config.BulkPctThresholdID ?? null,
        _planGroupId: config._planGroupId || null,
        _planGroupName: config._planGroupName || null,
        _planIds: config._planIds || null,
        _selectedConfigIDs: config._selectedConfigIDs || null,
        _aggregateFactSheets: config._aggregateFactSheets || false,
        _replaceSpotlights: config._replaceSpotlights || false,
        _key: Date.now(),
      });
      setLoadCounter(prev => prev + 1);
    } else {
      const configTypeMap = { 1: 'single', 2: 'multi', 3: 'combo', 4: 'clientOnly' };
      setConfigType(configTypeMap[config.ReportConfigType] || 'single');
      setPeriod(config.PeriodType === 1 ? 'Q' : 'M');
      // Still build a loadedConfig for exhibit template restore + all config state
      setLoadedConfig({
        ...templateInfo,
        configType: configTypeMap[config.ReportConfigType] || 'single',
        periodCode: config.PeriodType === 1 ? 'Q' : 'M',
        includeInBulk: config.BulkRun,
        bulkUnlocked: config.BulkTierOverrideID != null || config.BulkPctThresholdID != null,
        bulkTierOverrideId: config.BulkTierOverrideID,
        bulkPctThresholdId: config.BulkPctThresholdID,
        qdiaOptOut: config.QDIACheckOptOut,
        includeCandidates: config.CandidateInvestments,
        includeFundChanges: config.IncludeFundChanges,
        optInAllFundChanges: config.OptInAllFundChanges,
        fundChangesInProgressChecks: config.FundChangesInProgress,
        fundChangesExecutedChecks: config.FundChangesExecuted,
        _planGroupId: config._planGroupId || null,
        _planGroupName: config._planGroupName || null,
        _planIds: config._planIds || null,
        _selectedConfigIDs: config._selectedConfigIDs || null,
        _aggregateFactSheets: config._aggregateFactSheets || false,
        _replaceSpotlights: config._replaceSpotlights || false,
        _key: Date.now(),
      });
      setLoadCounter(prev => prev + 1);
    }
    setLoadConfigOpen(false);
  };

  const handleSaveConfig = ({ name, type, primary, shared, isUpdate, isAdHoc, adHocPeriod, associationOnly, ExhibitTemplateID, BulkRun, BulkTierOverrideID, BulkPctThresholdID, QDIACheckOptOut, CandidateInvestments, IncludeFundChanges, OptInAllFundChanges, FundChangesInProgress, FundChangesExecuted, _planGroupId, _planGroupName, _planIds, SelectedConfigIDs, AggregateFactSheets, ReplaceSpotlights }) => {
    const configTypeId = type === 'CAPTRUST Shared' ? 1 : (configType === 'single' ? 1 : configType === 'multi' ? 2 : configType === 'combo' ? 3 : 4);
    const planId = configType === 'single' ? selectedPlan : null;

    // Association only — just map plan to this config, don't modify the config record
    if (associationOnly && activeConfigId) {
      if (configType === 'single' && selectedPlan) {
        assignConfigToPlan(selectedPlan, activeConfigId);
      }
      setActiveConfigName(name);
      return;
    }

    if (isUpdate && activeConfigId) {
      // Update existing config in-place — persist ALL config state
      setAllConfigs(prev => {
        let updated = prev.map(c => {
          if (c.ReportConfigID === activeConfigId) {
            return {
              ...c,
              ReportConfigName: name,
              Primary: primary || c.Primary,
              LastSaved: new Date().toISOString(),
              PeriodType: period === 'Q' ? 1 : 2,
              ExhibitTemplateID: ExhibitTemplateID ?? c.ExhibitTemplateID,
              BulkRun: BulkRun ?? c.BulkRun,
              BulkTierOverrideID: BulkTierOverrideID !== undefined ? BulkTierOverrideID : c.BulkTierOverrideID,
              BulkPctThresholdID: BulkPctThresholdID !== undefined ? BulkPctThresholdID : c.BulkPctThresholdID,
              QDIACheckOptOut: QDIACheckOptOut ?? c.QDIACheckOptOut,
              CandidateInvestments: CandidateInvestments ?? c.CandidateInvestments,
              IncludeFundChanges: IncludeFundChanges !== undefined ? IncludeFundChanges : c.IncludeFundChanges,
              OptInAllFundChanges: OptInAllFundChanges !== undefined ? OptInAllFundChanges : c.OptInAllFundChanges,
              FundChangesInProgress: FundChangesInProgress ?? c.FundChangesInProgress,
              FundChangesExecuted: FundChangesExecuted ?? c.FundChangesExecuted,
              _planGroupId: _planGroupId !== undefined ? _planGroupId : c._planGroupId,
              _planGroupName: _planGroupName !== undefined ? _planGroupName : c._planGroupName,
              _planIds: _planIds !== undefined ? _planIds : c._planIds,
              _selectedConfigIDs: SelectedConfigIDs !== undefined ? SelectedConfigIDs : c._selectedConfigIDs,
              _aggregateFactSheets: AggregateFactSheets !== undefined ? AggregateFactSheets : c._aggregateFactSheets,
              _replaceSpotlights: ReplaceSpotlights !== undefined ? ReplaceSpotlights : c._replaceSpotlights,
            };
          }
          return c;
        });
        // If setting as primary, clear primary flag on other configs of same type/plan
        if (primary) {
          updated = updated.map(c => {
            if (c.ReportConfigID !== activeConfigId && c.Primary && c.ReportConfigType === configTypeId && c.AccountID === activeClient.accountId) {
              if (configTypeId === 1 && c.ct_PlanID !== planId) return c;
              return { ...c, Primary: false };
            }
            return c;
          });
        }
        return updated;
      });
    } else {
      // Create new config — capture ALL config state
      const newConfig = {
        ReportConfigID: `user-${Date.now()}`,
        ReportConfigName: name,
        ReportConfigType: configTypeId,
        Primary: primary || false,
        BulkRun: BulkRun ?? false,
        LastSaved: new Date().toISOString(),
        UserID: 'you',
        PeriodType: period === 'Q' ? 1 : 2,
        AccountID: shared ? null : activeClient.accountId,
        BulkTierOverrideID: BulkTierOverrideID ?? null,
        BulkPctThresholdID: BulkPctThresholdID ?? null,
        QDIACheckOptOut: QDIACheckOptOut ?? false,
        CandidateInvestments: CandidateInvestments ?? false,
        IncludeFundChanges: IncludeFundChanges ?? true,
        OptInAllFundChanges: OptInAllFundChanges ?? false,
        FundChangesInProgress: FundChangesInProgress ?? null,
        FundChangesExecuted: FundChangesExecuted ?? null,
        ParentReportConfigID: isAdHoc ? activeConfigId : null,
        ExhibitTemplateID: ExhibitTemplateID || null,
        ct_PlanID: shared ? null : planId,
        _displayType: type,
        _savedBy: 'You',
        _isAdHoc: isAdHoc || false,
        _adHocPeriod: adHocPeriod || null,
        _planGroupId: _planGroupId || null,
        _planGroupName: _planGroupName || null,
        _planIds: _planIds || null,
        _selectedConfigIDs: SelectedConfigIDs || null,
        _aggregateFactSheets: AggregateFactSheets || false,
        _replaceSpotlights: ReplaceSpotlights || false,
      };

      setAllConfigs(prev => {
        let updated = [...prev];
        if (primary) {
          updated = updated.map(c => {
            if (c.Primary && c.ReportConfigType === configTypeId && c.AccountID === activeClient.accountId) {
              if (configTypeId === 1 && c.ct_PlanID !== planId) return c;
              return { ...c, Primary: false };
            }
            return c;
          });
        }
        return [...updated, newConfig];
      });
      setActiveConfigId(newConfig.ReportConfigID);
      // Persist plan-to-config assignment for new configs
      if (configType === 'single' && selectedPlan) {
        assignConfigToPlan(selectedPlan, newConfig.ReportConfigID);
      }
    }

    // Persist plan-to-config assignment for existing config updates
    if (isUpdate && activeConfigId && configType === 'single' && selectedPlan) {
      assignConfigToPlan(selectedPlan, activeConfigId);
    }

    setActiveConfigName(name);
    // Preserve Primary if already set (e.g. via "Set as Primary" button) — only override if explicitly setting primary
    const existingConfig = allConfigs.find(c => c.ReportConfigID === activeConfigId);
    const isPrimary = primary || (isUpdate && existingConfig?.Primary) || false;
    setActiveConfigIsPrimary(isPrimary);
    if (isPrimary) {
      setPrimaryConfigName(name);
    }
  };

  const handleRenameConfig = (configId, newName) => {
    setAllConfigs(prev => prev.map(c =>
      c.ReportConfigID === configId
        ? { ...c, ReportConfigName: newName }
        : c
    ));
    // If the renamed config is the currently active one, update the banner
    if (activeConfigName && allConfigs.find(c => c.ReportConfigID === configId)?.ReportConfigName === activeConfigName) {
      setActiveConfigName(newName);
    }
    // If the renamed config is the current primary, update that too
    if (primaryConfigName && allConfigs.find(c => c.ReportConfigID === configId)?.ReportConfigName === primaryConfigName) {
      setPrimaryConfigName(newName);
    }
  };

  const handleDeleteConfig = (configId) => {
    const deleted = allConfigs.find(c => c.ReportConfigID === configId);
    setAllConfigs(prev => prev.filter(c => c.ReportConfigID !== configId));
    // Clear active banner if the deleted config was active
    if (deleted && deleted.ReportConfigName === activeConfigName) {
      setActiveConfigId(null);
      setActiveConfigName(null);
      setActiveConfigIsPrimary(false);
    }
    // Clear primary tracker if the deleted config was primary
    if (deleted && deleted.ReportConfigName === primaryConfigName) {
      setPrimaryConfigName(null);
    }
  };

  // Helper: look up exhibit template from ExhibitTemplateID
  const getTemplate = useCallback((templateId) => {
    if (!templateId) return null;
    return allTemplates.find(t => t.ExhibitTemplateID === templateId) || null;
  }, [allTemplates]);
  const getTemplateName = useCallback((templateId) => {
    const tmpl = getTemplate(templateId);
    return tmpl ? tmpl.Name : null;
  }, [getTemplate]);
  // Resolve exhibit IDs from a template (user-created have _sessionIds, seed templates use junction table)
  const getTemplateExhibitIds = useCallback((templateId) => {
    const tmpl = getTemplate(templateId);
    if (!tmpl) return [];
    if (tmpl._sessionIds) return tmpl._sessionIds;
    return resolveExhibitPageSetIds(templateId);
  }, [getTemplate]);

  // Auto-load primary config when a plan is selected (single plan)
  useEffect(() => {
    if (configType !== 'single' || !selectedPlan) return;
    // Look for Primary: client-owned first, then any config assigned via planConfigMap that was set as Primary
    const primaryForPlan = allConfigs.find(
      c => c.Primary && c.ReportConfigType === 1 && c.ct_PlanID === selectedPlan && c.AccountID === activeClient.accountId
    ) || allConfigs.find(
      c => c.Primary && c.ReportConfigID === planConfigMap[selectedPlan]
    );
    if (primaryForPlan) {
      setActiveConfigId(primaryForPlan.ReportConfigID);
      setActiveConfigName(primaryForPlan.ReportConfigName);
      setActiveConfigIsPrimary(true);
      setPrimaryConfigName(primaryForPlan.ReportConfigName);
      // Build a loadedConfig so SinglePlanConfig can restore exhibit template etc.
      const templateName = getTemplateName(primaryForPlan.ExhibitTemplateID);
      const exhibitIds = getTemplateExhibitIds(primaryForPlan.ExhibitTemplateID);
      setLoadedConfig({
        configType: 'single',
        periodCode: primaryForPlan.PeriodType === 1 ? 'Q' : 'M',
        planId: primaryForPlan.ct_PlanID,
        includeInBulk: primaryForPlan.BulkRun,
        bulkUnlocked: primaryForPlan.BulkTierOverrideID != null || primaryForPlan.BulkPctThresholdID != null,
        bulkTierOverrideId: primaryForPlan.BulkTierOverrideID,
        bulkPctThresholdId: primaryForPlan.BulkPctThresholdID,
        qdiaOptOut: primaryForPlan.QDIACheckOptOut,
        includeCandidates: primaryForPlan.CandidateInvestments,
        includeFundChanges: primaryForPlan.IncludeFundChanges,
        optInAllFundChanges: primaryForPlan.OptInAllFundChanges,
        fundChangesInProgressChecks: primaryForPlan.FundChangesInProgress,
        fundChangesExecutedChecks: primaryForPlan.FundChangesExecuted,
        exhibitTemplateName: templateName,
        exhibitTemplate: primaryForPlan.ExhibitTemplateID ? { ExhibitTemplateID: primaryForPlan.ExhibitTemplateID } : null,
        selectedExhibitIds: exhibitIds,
        _autoLoad: true,
        _key: Date.now(),
      });
      setLoadCounter(prev => prev + 1);
    } else {
      // No primary — check for a previously assigned config (from manual load or save)
      const assignedConfigId = planConfigMap[selectedPlan];
      const assignedConfig = assignedConfigId ? allConfigs.find(c => c.ReportConfigID === assignedConfigId) : null;

      // Also check for most recently saved client-specific config for this plan
      const savedForPlan = allConfigs
        .filter(c => c.ReportConfigType === 1 && c.ct_PlanID === selectedPlan && c.AccountID === activeClient.accountId && !c._isAdHoc)
        .sort((a, b) => new Date(b.LastSaved) - new Date(a.LastSaved))[0];

      // Prefer the assigned config (it was explicitly chosen), then saved, then default
      const autoConfig = assignedConfig || savedForPlan;

      if (autoConfig) {
        setActiveConfigId(autoConfig.ReportConfigID);
        setActiveConfigName(autoConfig.ReportConfigName);
        setActiveConfigIsPrimary(false);
        setPrimaryConfigName(null);
        const templateName = getTemplateName(autoConfig.ExhibitTemplateID);
        const exhibitIds = getTemplateExhibitIds(autoConfig.ExhibitTemplateID);
        setLoadedConfig({
          configType: 'single',
          periodCode: autoConfig.PeriodType === 1 ? 'Q' : 'M',
          planId: autoConfig.ct_PlanID || selectedPlan,
          includeInBulk: autoConfig.BulkRun,
          bulkUnlocked: autoConfig.BulkTierOverrideID != null || autoConfig.BulkPctThresholdID != null,
          bulkTierOverrideId: autoConfig.BulkTierOverrideID,
          bulkPctThresholdId: autoConfig.BulkPctThresholdID,
          qdiaOptOut: autoConfig.QDIACheckOptOut,
          includeCandidates: autoConfig.CandidateInvestments,
          includeFundChanges: autoConfig.IncludeFundChanges,
          optInAllFundChanges: autoConfig.OptInAllFundChanges,
          fundChangesInProgressChecks: autoConfig.FundChangesInProgress,
          fundChangesExecutedChecks: autoConfig.FundChangesExecuted,
          exhibitTemplateName: templateName,
          exhibitTemplate: autoConfig.ExhibitTemplateID ? { ExhibitTemplateID: autoConfig.ExhibitTemplateID } : null,
          selectedExhibitIds: exhibitIds,
          _autoLoad: true,
          _key: Date.now(),
        });
        setLoadCounter(prev => prev + 1);
      } else {
        // No saved or assigned config — check if the plan has a default shared config mapped
        const plan = allPlans.find(p => p.ct_PlanID === selectedPlan);
        const defaultConfigId = plan?.defaultConfigId;
        const defaultConfig = defaultConfigId ? allConfigs.find(c => c.ReportConfigID === defaultConfigId) : null;

        if (defaultConfig) {
          // Load the default shared config as a starter — but don't set it as "active" (it's a template, not saved for this plan yet)
          setActiveConfigId(null);
          setActiveConfigName(null);
          setActiveConfigIsPrimary(false);
          setPrimaryConfigName(null);
          const templateName = getTemplateName(defaultConfig.ExhibitTemplateID);
          const exhibitIds = getTemplateExhibitIds(defaultConfig.ExhibitTemplateID);
          setLoadedConfig({
            configType: 'single',
            periodCode: defaultConfig.PeriodType === 1 ? 'Q' : 'M',
            planId: selectedPlan,
            includeInBulk: defaultConfig.BulkRun,
            bulkUnlocked: defaultConfig.BulkTierOverrideID != null || defaultConfig.BulkPctThresholdID != null,
            bulkTierOverrideId: defaultConfig.BulkTierOverrideID,
            bulkPctThresholdId: defaultConfig.BulkPctThresholdID,
            qdiaOptOut: defaultConfig.QDIACheckOptOut,
            includeCandidates: defaultConfig.CandidateInvestments,
            includeFundChanges: defaultConfig.IncludeFundChanges,
            optInAllFundChanges: defaultConfig.OptInAllFundChanges,
            fundChangesInProgressChecks: defaultConfig.FundChangesInProgress,
            fundChangesExecutedChecks: defaultConfig.FundChangesExecuted,
            exhibitTemplateName: templateName,
            exhibitTemplate: defaultConfig.ExhibitTemplateID ? { ExhibitTemplateID: defaultConfig.ExhibitTemplateID } : null,
            selectedExhibitIds: exhibitIds,
            _autoLoad: true,
            _defaultConfig: true,
            _defaultConfigName: defaultConfig.ReportConfigName,
            _key: Date.now(),
          });
          setLoadCounter(prev => prev + 1);
        } else {
          setActiveConfigId(null);
          setActiveConfigName(null);
          setActiveConfigIsPrimary(false);
          setPrimaryConfigName(null);
        }
      }
    }
  }, [selectedPlan, configType]); // intentionally not including allConfigs to avoid re-triggering on save

  // Auto-load primary config for non-plan types (multi, combo, clientOnly)
  useEffect(() => {
    if (!configType || configType === 'single') return;
    const typeMap = { multi: 2, combo: 3, clientOnly: 4 };
    const dbType = typeMap[configType];
    if (!dbType) return;
    const primaryForType = allConfigs.find(
      c => c.Primary && c.ReportConfigType === dbType && c.AccountID === activeClient.accountId
    );
    if (primaryForType) {
      setActiveConfigId(primaryForType.ReportConfigID);
      setActiveConfigName(primaryForType.ReportConfigName);
      setActiveConfigIsPrimary(true);
      setPrimaryConfigName(primaryForType.ReportConfigName);
      // Build a full loadedConfig so MultiPlanConfig/ComboConfig can restore all state
      const templateName = getTemplateName(primaryForType.ExhibitTemplateID);
      const exhibitIds = getTemplateExhibitIds(primaryForType.ExhibitTemplateID);
      setLoadedConfig({
        configType,
        periodCode: primaryForType.PeriodType === 1 ? 'Q' : 'M',
        includeInBulk: primaryForType.BulkRun,
        bulkUnlocked: primaryForType.BulkTierOverrideID != null || primaryForType.BulkPctThresholdID != null,
        bulkTierOverrideId: primaryForType.BulkTierOverrideID,
        bulkPctThresholdId: primaryForType.BulkPctThresholdID,
        qdiaOptOut: primaryForType.QDIACheckOptOut,
        includeCandidates: primaryForType.CandidateInvestments,
        includeFundChanges: primaryForType.IncludeFundChanges,
        optInAllFundChanges: primaryForType.OptInAllFundChanges,
        fundChangesInProgressChecks: primaryForType.FundChangesInProgress,
        fundChangesExecutedChecks: primaryForType.FundChangesExecuted,
        exhibitTemplateName: templateName,
        exhibitTemplate: primaryForType.ExhibitTemplateID ? { ExhibitTemplateID: primaryForType.ExhibitTemplateID } : null,
        selectedExhibitIds: exhibitIds,
        // Plan group data for multi plan — fall back to first saved plan group for this client
        ...(() => {
          if (primaryForType._planIds) return { _planGroupId: primaryForType._planGroupId, _planGroupName: primaryForType._planGroupName, _planIds: primaryForType._planIds };
          const fallbackGroup = allPlanGroups.find(g => g.AccountID === activeClient.accountId && g.ct_PlanIDs?.length > 0);
          if (fallbackGroup) return { _planGroupId: fallbackGroup.ReportPlanGroupID, _planGroupName: fallbackGroup.ReportPlanGroupName, _planIds: fallbackGroup.ct_PlanIDs };
          return { _planGroupId: null, _planGroupName: null, _planIds: null };
        })(),
        _selectedConfigIDs: primaryForType._selectedConfigIDs || null,
        _aggregateFactSheets: primaryForType._aggregateFactSheets || false,
        _replaceSpotlights: primaryForType._replaceSpotlights || false,
        _autoLoad: true,
        _key: Date.now(),
      });
      setLoadCounter(prev => prev + 1);
    } else {
      setActiveConfigId(null);
      setActiveConfigName(null);
      setActiveConfigIsPrimary(false);
      setPrimaryConfigName(null);
    }
  }, [configType]); // intentionally not including allConfigs to avoid re-triggering on save

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#00437B',
          colorLink: '#3465CD',
          borderRadius: 6,
          fontSize: 14,
        },
      }}
    >
      {/* Demo Banner */}
      <div className="demo-banner">
        <Space>
          <span className="demo-label">Demo Mode</span>
          <span>Interactive Mockup</span>
        </Space>
        <span style={{ opacity: 0.7 }}>v1.4.0</span>
      </div>

      {/* App Header with Logo */}
      <div className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', height: 48 }}>
          <img src={irpLogo} alt="Institutional Reporting Platform" style={{ height: 160, marginTop: -2 }} />
        </div>
        <div className="client-info" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            type="text"
            icon={<DashboardOutlined />}
            onClick={() => setDashboardOpen(!dashboardOpen)}
            style={{ color: dashboardOpen ? '#00437B' : '#3465CD', fontSize: 12, fontWeight: dashboardOpen ? 700 : 400 }}
            size="small"
          >
            Bulk Dashboard
          </Button>
          <div style={{ borderLeft: '1px solid #d9d9d9', height: 16 }} />
          <Button
            type="text"
            icon={<ExperimentOutlined />}
            onClick={() => setMockAdminOpen(true)}
            style={{ color: '#5B325F', fontSize: 12 }}
            size="small"
          >
            Demo Data
          </Button>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>Client:</span>
          <Select
            value={selectedClientId}
            onChange={handleClientChange}
            style={{ width: 200 }}
            size="small"
            options={allClients.map(c => ({ value: c.accountId, label: c.name }))}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="app-content">
        {dashboardOpen ? (
          <BulkDashboard
            allConfigs={allConfigs}
            allClients={allClients}
            allPlans={allPlans}
            investments={investments}
            allTemplates={allTemplates}
            allFundChanges={allFundChanges}
            planConfigMap={planConfigMap}
            onClose={() => setDashboardOpen(false)}
          />
        ) : (
        <>
        {/* Top Config Bar */}
        <div className="config-bar">
          <div className="config-field">
            <label>Report Configuration Type</label>
            <ConfigTypeSelector value={configType} onChange={setConfigType} />
          </div>

          <div className="config-field">
            <label>Period</label>
            <Select
              value={period}
              onChange={setPeriod}
              style={{ width: 160 }}
              options={[
                { value: 'Q', label: 'Quarterly' },
                { value: 'M', label: 'Monthly', disabled: true },
              ]}
            />
          </div>

          {configType === 'single' && (
            <div className="config-field">
              <label>Plan</label>
              <Select
                value={selectedPlan}
                onChange={setSelectedPlan}
                style={{ width: 320 }}
                placeholder="Select a plan..."
                options={planOptions}
                showSearch
                filterOption={(input, option) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
          )}

          <div className="config-field" style={{ marginLeft: 'auto' }}>
            <label>&nbsp;</label>
            <Button
              onClick={() => setLoadConfigOpen(true)}
              disabled={!configType || (configType === 'single' && !selectedPlan)}
              title={!configType ? 'Select a report configuration type first' : (configType === 'single' && !selectedPlan ? 'Select a plan first' : undefined)}
            >
              Load Saved Report Config
            </Button>
          </div>

        </div>

        {/* Active Config Name Banner */}
        {activeConfigName && configType && (
          <div style={{
            background: activeConfigIsPrimary ? '#edf6fb' : '#fff',
            border: `1px solid ${activeConfigIsPrimary ? '#5FB4E5' : '#d9d9d9'}`,
            borderRadius: 8,
            padding: '10px 20px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Space>
              <FileTextOutlined style={{ color: '#00437B' }} />
              <span style={{ fontSize: 13, color: '#8c8c8c' }}>Report Config:</span>
              <strong style={{ fontSize: 14 }}>{activeConfigName}</strong>
              {(() => {
                const cfg = activeConfigId ? allConfigs.find(c => c.ReportConfigID === activeConfigId) : null;
                return cfg && (cfg.AccountID === null || cfg.AccountID === undefined) ? (
                  <Tag color="purple" style={{ fontSize: 11 }}>
                    <ShareAltOutlined style={{ marginRight: 4 }} />
                    Shared
                  </Tag>
                ) : null;
              })()}
              {activeConfigIsPrimary && (
                <Tag color="gold" style={{ fontSize: 11 }}>
                  <StarFilled style={{ marginRight: 4 }} />
                  Primary
                </Tag>
              )}
            </Space>
            <Space size="small">
              {!activeConfigIsPrimary && activeConfigId && (
                <Button
                  size="small"
                  type="link"
                  icon={<StarFilled style={{ color: '#faad14' }} />}
                  onClick={() => {
                    const configTypeId = configType === 'single' ? 1 : configType === 'multi' ? 2 : configType === 'combo' ? 3 : 4;
                    setAllConfigs(prev => prev.map(c => {
                      // Set this config as Primary
                      if (c.ReportConfigID === activeConfigId) return { ...c, Primary: true };
                      // Clear Primary from other configs of same type for this client/plan
                      if (c.Primary && c.ReportConfigType === configTypeId) {
                        // For client configs, match by client
                        if (c.AccountID === activeClient.accountId) {
                          if (configTypeId === 1 && c.ct_PlanID !== selectedPlan) return c;
                          return { ...c, Primary: false };
                        }
                        // For shared configs previously set as primary via planConfigMap
                        if (configTypeId === 1 && planConfigMap[selectedPlan] === c.ReportConfigID) {
                          return { ...c, Primary: false };
                        }
                      }
                      return c;
                    }));
                    // Also persist the plan-to-config assignment
                    if (configType === 'single' && selectedPlan) {
                      assignConfigToPlan(selectedPlan, activeConfigId);
                    }
                    setActiveConfigIsPrimary(true);
                    setPrimaryConfigName(activeConfigName);
                    message.success(`"${activeConfigName}" set as Primary`);
                  }}
                  style={{ fontSize: 12 }}
                >
                  Set as Primary
                </Button>
              )}
              <Button size="small" type="link" onClick={() => setLoadConfigOpen(true)}>
                Switch
              </Button>
            </Space>
          </div>
        )}

        {/* No active config — show default config banner or urgent prompt */}
        {!activeConfigName && configType && (configType !== 'single' || selectedPlan) && (
          loadedConfig?._defaultConfig ? (
            <div style={{
              background: '#edf6fb',
              border: '1px solid #5FB4E5',
              borderRadius: 8,
              padding: '12px 20px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
            }}>
              <Space>
                <FileTextOutlined style={{ color: '#00437B', fontSize: 18 }} />
                <span style={{ color: '#003a8c' }}>
                  <strong>Default config applied:</strong> <em>{loadedConfig._defaultConfigName}</em> &mdash; review the settings below and save as a new Primary config for this plan.
                </span>
              </Space>
              <Button size="small" onClick={() => setLoadConfigOpen(true)}>
                Load Different
              </Button>
            </div>
          ) : (
            <div style={{
              background: '#fff2e8',
              border: '1px solid #ffbb96',
              borderRadius: 8,
              padding: '12px 20px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
            }}>
              <Space>
                <FileTextOutlined style={{ color: '#fa541c', fontSize: 18 }} />
                <span style={{ color: '#ad2102' }}>
                  <strong>No report config loaded.</strong> Every plan must have a <strong>Primary</strong> config &mdash; load an existing one or save a new config below.
                </span>
              </Space>
              <Button type="primary" size="small" style={{ background: '#fa541c', borderColor: '#fa541c' }} onClick={() => setLoadConfigOpen(true)}>
                Load Config
              </Button>
            </div>
          )
        )}

        {/* Config Type Content */}
        {!configType && (
          <div style={{
            textAlign: 'center',
            padding: 60,
            color: '#8c8c8c',
            background: 'white',
            borderRadius: 8,
            border: '1px solid #d9d9d9',
          }}>
            <SettingOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
            <div style={{ fontSize: 16 }}>
              Select a Report Configuration Type to get started
            </div>
            <div style={{ fontSize: 13, marginTop: 8 }}>
              Or load a saved configuration to continue where you left off
            </div>
          </div>
        )}

        {configType === 'single' && (
          <SinglePlanConfig
            key={`single-${loadCounter}`}
            plan={clientPlans.find(p => p.ct_PlanID === selectedPlan)}
            period={period}
            loadedConfig={loadedConfig}
            onSaveConfig={handleSaveConfig}
            currentPrimaryName={primaryConfigName}
            activeConfigName={activeConfigName}
            activeConfigId={activeConfigId}
            savedConfigRecord={activeConfigId ? allConfigs.find(c => c.ReportConfigID === activeConfigId) : null}
            allTemplates={allTemplates}
            allConfigs={allConfigs}
            onSaveTemplate={handleSaveTemplate}
            onUpdateTemplate={handleUpdateTemplate}
            onRenameTemplate={handleRenameTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            clientAccountId={activeClient.accountId}
            planFundChanges={getFundChangesForPlan(selectedPlan)}
            planInvestments={investments.filter(inv => inv.ct_PlanID === selectedPlan)}
            allCandidates={candidates}
            isTemplateAdmin={isTemplateAdmin}
            allPlans={allPlans}
            otherPlansUsingConfig={(() => {
              if (!activeConfigId) return [];
              // Find all plans in this client that use the same config (via planConfigMap, ct_PlanID, or defaultConfigId)
              return clientPlans.filter(p => {
                if (p.ct_PlanID === selectedPlan) return false; // exclude current plan
                // Check planConfigMap
                if (planConfigMap[p.ct_PlanID] === activeConfigId) return true;
                // Check if the config's ct_PlanID matches this plan
                const cfg = allConfigs.find(c => c.ReportConfigID === activeConfigId);
                if (cfg && cfg.ct_PlanID === p.ct_PlanID) return true;
                // Check if plan's defaultConfigId points to this config
                if (p.defaultConfigId === activeConfigId) return true;
                return false;
              });
            })()}
          />
        )}

        {configType === 'multi' && (
          <MultiPlanConfig
            key={`multi-${loadCounter}`}
            period={period}
            plans={clientPlans}
            allPlanGroups={allPlanGroups.filter(g => g.AccountID === activeClient.accountId)}
            clientAccountId={activeClient.accountId}
            onSavePlanGroup={handleSavePlanGroup}
            onUpdatePlanGroup={handleUpdatePlanGroup}
            onRenamePlanGroup={handleRenamePlanGroup}
            onDeletePlanGroup={handleDeletePlanGroup}
            onSaveConfig={handleSaveConfig}
            activeConfigName={activeConfigName}
            activeConfigId={activeConfigId}
            currentPrimaryName={primaryConfigName}
            savedConfigRecord={activeConfigId ? allConfigs.find(c => c.ReportConfigID === activeConfigId) : null}
            allTemplates={allTemplates}
            allConfigs={allConfigs}
            onSaveTemplate={handleSaveTemplate}
            onUpdateTemplate={handleUpdateTemplate}
            onRenameTemplate={handleRenameTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            loadedConfig={loadedConfig}
            allFundChanges={allFundChanges}
            allInvestments={investments}
            allCandidates={candidates}
            isTemplateAdmin={isTemplateAdmin}
            allPlans={allPlans}
          />
        )}

        {configType === 'combo' && (
          <ComboConfig
            period={period}
            loadedConfig={loadedConfig}
            allConfigs={allConfigs}
            allPlans={allPlans}
            allPlanGroups={allPlanGroups}
            allInvestments={investments}
            allFundChanges={allFundChanges}
            clientAccountId={activeClient.accountId}
            onSaveConfig={handleSaveConfig}
            activeConfigName={activeConfigName}
            activeConfigId={activeConfigId}
            currentPrimaryName={primaryConfigName}
            savedConfigRecord={activeConfigId ? allConfigs.find(c => c.ReportConfigID === activeConfigId) : null}
            allTemplates={allTemplates}
            onSaveTemplate={handleSaveTemplate}
            onUpdateTemplate={handleUpdateTemplate}
            onRenameTemplate={handleRenameTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            isTemplateAdmin={isTemplateAdmin}
          />
        )}

        {configType === 'clientOnly' && (
          <div style={{
            background: 'white',
            borderRadius: 8,
            border: '1px solid #d9d9d9',
            padding: 40,
            textAlign: 'center',
          }}>
            <TeamOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.3, color: '#00437B' }} />
            <div style={{ fontSize: 16, marginBottom: 8 }}>
              Client Only / CAPTRUST at Work
            </div>
            <div style={{ fontSize: 13, color: '#8c8c8c', maxWidth: 500, margin: '0 auto' }}>
              This configuration type is for client-level reporting that is not tied to a specific plan.
              It includes CAPTRUST at Work deliverables such as participant engagement, wellness content,
              and employee communication materials.
            </div>
          </div>
        )}
        </>
        )}
      </div>

      <LoadConfigModal
        open={loadConfigOpen}
        onClose={() => setLoadConfigOpen(false)}
        onSelect={handleLoadConfig}
        configs={allConfigs}
        plans={clientPlans}
        onRenameConfig={handleRenameConfig}
        onDeleteConfig={handleDeleteConfig}
        activeConfigType={configType}
        selectedPlanId={selectedPlan}
        clientAccountId={activeClient.accountId}
      />

      <MockDataAdmin
        open={mockAdminOpen}
        onClose={() => setMockAdminOpen(false)}
        allClients={allClients}
        setAllClients={setAllClients}
        allPlans={allPlans}
        setAllPlans={setAllPlans}
        investments={investments}
        setInvestments={setInvestments}
        candidates={candidates}
        setCandidates={setCandidates}
        allConfigs={allConfigs}
        setAllConfigs={setAllConfigs}
        allTemplates={allTemplates}
        setAllTemplates={setAllTemplates}
        allPlanGroups={allPlanGroups}
        setAllPlanGroups={setAllPlanGroups}
        allFundChanges={allFundChanges}
        setAllFundChanges={setAllFundChanges}
        isTemplateAdmin={isTemplateAdmin}
        setIsTemplateAdmin={setIsTemplateAdmin}
      />
    </ConfigProvider>
  );
}

export default App;
