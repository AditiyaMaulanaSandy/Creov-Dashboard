import { useMemo, useState } from 'react';

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function PieChart({
  items,
  centerValue,
  centerLabel,
  valueFormatter = value => value,
  className = ''
}) {
  const [activeKey, setActiveKey] = useState('');
  const total = items.reduce((sum, item) => sum + item.value, 0);

  const segments = useMemo(() => {
    const result = items.reduce((acc, item) => {
      const share = total ? item.value / total : 0;
      const dash = share * CIRCUMFERENCE;
      const offset = acc.offset + dash;

      return {
        offset,
        items: [
          ...acc.items,
          {
            ...item,
            dash,
            offset: acc.offset,
            percent: Math.round(share * 100)
          }
        ]
      };
    }, { items: [], offset: 0 });

    return result.items;
  }, [items, total]);

  const activeSegment = segments.find(item => item.key === activeKey);

  return (
    <div className={`interactive-pie ${className}`} onMouseLeave={() => setActiveKey('')}>
      <svg className="interactive-pie-svg" viewBox="0 0 120 120" aria-hidden="true">
        <circle className="interactive-pie-base" cx="60" cy="60" r={RADIUS} />
        {segments.map(segment => (
          <circle
            key={segment.key}
            className={`interactive-pie-segment ${activeKey === segment.key ? 'active' : ''}`}
            cx="60"
            cy="60"
            r={RADIUS}
            stroke={segment.color}
            strokeDasharray={`${segment.dash} ${CIRCUMFERENCE - segment.dash}`}
            strokeDashoffset={-segment.offset}
            onMouseEnter={() => setActiveKey(segment.key)}
            onFocus={() => setActiveKey(segment.key)}
            tabIndex="0"
          />
        ))}
      </svg>

      <span className="interactive-pie-center">
        {activeSegment ? (
          <>
            <strong>{valueFormatter(activeSegment.value)}</strong>
            <small>{activeSegment.label} - {activeSegment.percent}%</small>
          </>
        ) : (
          <>
            <strong>{centerValue}</strong>
            <small>{centerLabel}</small>
          </>
        )}
      </span>
    </div>
  );
}
