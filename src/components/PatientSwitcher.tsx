import React from 'react';
import {
  UserGroupIcon,
  Cancel01Icon,
  Medicine01Icon,
  RefreshIcon,
  UserCheck01Icon,
  ArrowRight01Icon,
} from 'hugeicons-react';
import { useRole } from '../context/RoleContext';

const adherenceTone = (p: number) => {
  if (p >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
  if (p >= 50) return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
  return { bar: 'bg-destructive', text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' };
};

interface PatientSwitcherProps {
  open: boolean;
  onClose: () => void;
}

export const PatientSwitcher: React.FC<PatientSwitcherProps> = ({ open, onClose }) => {
  const {
    role,
    linkedPatients,
    linkedPatientsLoading,
    activePatientId,
    setActivePatientId,
    refreshLinkedPatients,
  } = useRole();

  if (role !== 'caregiver') return null;

  const handleSelect = (id: string) => {
    setActivePatientId(id);
    onClose();
  };

  const handleViewSelf = () => {
    setActivePatientId(null);
    onClose();
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in-0 duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card border-r border-border z-50 flex flex-col shadow-lifted transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <UserGroupIcon size={16} />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">Linked Patients</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Caregiver Mode
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground bg-secondary/80 border border-border rounded-lg tactile-btn"
            aria-label="Close patient list"
          >
            <Cancel01Icon size={16} />
          </button>
        </div>

        {/* Action row */}
        <div className="p-2.5 border-b border-border flex items-center gap-2">
          <button
            onClick={handleViewSelf}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg border text-xs font-medium tactile-btn py-1.5 px-3 ${
              activePatientId === null
                ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                : 'bg-secondary/60 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserCheck01Icon size={14} />
            <span>My Dashboard</span>
          </button>
          <button
            onClick={refreshLinkedPatients}
            className="flex items-center justify-center text-muted-foreground hover:text-foreground bg-secondary/60 border border-border rounded-lg tactile-btn p-2"
            aria-label="Refresh"
          >
            <RefreshIcon size={14} className={linkedPatientsLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto thin-scroll p-3 space-y-2">
          {linkedPatientsLoading && linkedPatients.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <RefreshIcon size={24} className="mx-auto mb-2 opacity-50 animate-spin" />
              <p className="text-xs font-medium">Loading linked patients…</p>
            </div>
          )}

          {!linkedPatientsLoading && linkedPatients.length === 0 && (
            <div className="text-center py-8 px-2">
              <div className="w-10 h-10 rounded-lg bg-secondary border border-border mx-auto flex items-center justify-center mb-2 text-muted-foreground">
                <UserGroupIcon size={18} />
              </div>
              <p className="text-xs font-medium text-foreground">No patients linked yet</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Enter an invite code on your dashboard to start viewing their care plan.
              </p>
            </div>
          )}

          {linkedPatients.map((p) => {
            const tone = adherenceTone(p.adherencePercent);
            const isActive = p.userId === activePatientId;
            return (
              <button
                key={p.userId}
                onClick={() => handleSelect(p.userId)}
                className={`w-full text-left rounded-xl border transition-all p-3 tactile-btn flex items-center gap-3 ${
                  isActive
                    ? 'bg-primary/10 border-primary/40'
                    : 'bg-card border-border hover:bg-secondary/50'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-primary/20 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                  {(p.name || 'P').charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">{p.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tone.bg} ${tone.border} border ${tone.text}`}
                    >
                      {p.adherencePercent}%
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Medicine01Icon size={11} />
                      {p.medicineCount} {p.medicineCount === 1 ? 'med' : 'meds'}
                    </span>
                  </div>
                </div>

                <ArrowRight01Icon
                  size={14}
                  className={isActive ? 'text-primary' : 'text-muted-foreground'}
                />
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default PatientSwitcher;
