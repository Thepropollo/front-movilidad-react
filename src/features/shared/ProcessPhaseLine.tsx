export type PhaseState = 'done' | 'current' | 'pending' | 'blocked';

export type ProcessPhase = {
  key: string;
  label: string;
  short?: string;
  state: PhaseState;
};

const STATE_LABEL: Record<PhaseState, string> = {
  done: 'Hecho',
  current: 'En curso',
  pending: 'Pendiente',
  blocked: 'No aprobado',
};

type Props = {
  phases: ProcessPhase[];
  compact?: boolean;
};

export default function ProcessPhaseLine({ phases, compact = false }: Props) {
  if (!phases.length) return null;

  return (
    <ol
      className={`phase-line${compact ? ' is-compact' : ''}`}
      aria-label="Fases del trámite"
    >
      {phases.map((phase, index) => (
        <li key={phase.key} className={`phase-line-item is-${phase.state}`}>
          {index > 0 && (
            <span className="phase-line-wire" aria-hidden />
          )}
          <span className="phase-line-dot" aria-hidden />
          <span className="phase-line-copy">
            <strong>{compact ? phase.short || phase.label : phase.label}</strong>
            {!compact && (
              <em>{STATE_LABEL[phase.state] || phase.state}</em>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}
