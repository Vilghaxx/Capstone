import { useState } from 'react';
import styles from '../styles/DentalChart.module.css';

const STATUS_COLORS = {
  healthy: '#22c55e',
  treated: '#3b82f6',
  'needs-attention': '#eab308',
  urgent: '#ef4444'
};

const STATUS_LABELS = {
  healthy: 'Healthy',
  treated: 'Treated',
  'needs-attention': 'Needs Attention',
  urgent: 'Urgent'
};

const toothPositions = {
  upperRight: [
    { num: 1, x: 85, y: 20 }, { num: 2, x: 70, y: 15 }, { num: 3, x: 55, y: 12 }, { num: 4, x: 40, y: 10 },
    { num: 5, x: 28, y: 10 }, { num: 6, x: 18, y: 12 }, { num: 7, x: 10, y: 18 }, { num: 8, x: 5, y: 28 }
  ],
  upperLeft: [
    { num: 9, x: 5, y: 28 }, { num: 10, x: 5, y: 42 }, { num: 11, x: 10, y: 52 }, { num: 12, x: 18, y: 58 },
    { num: 13, x: 28, y: 60 }, { num: 14, x: 40, y: 60 }, { num: 15, x: 55, y: 58 }, { num: 16, x: 70, y: 55 }
  ],
  lowerRight: [
    { num: 32, x: 85, y: 85 }, { num: 31, x: 70, y: 90 }, { num: 30, x: 55, y: 93 }, { num: 29, x: 40, y: 95 },
    { num: 28, x: 28, y: 95 }, { num: 27, x: 18, y: 93 }, { num: 26, x: 10, y: 87 }, { num: 25, x: 5, y: 77 }
  ],
  lowerLeft: [
    { num: 24, x: 5, y: 77 }, { num: 23, x: 5, y: 63 }, { num: 22, x: 10, y: 53 }, { num: 21, x: 18, y: 47 },
    { num: 20, x: 28, y: 45 }, { num: 19, x: 40, y: 45 }, { num: 18, x: 55, y: 47 }, { num: 17, x: 70, y: 50 }
  ]
};

const allTeeth = [...toothPositions.upperRight, ...toothPositions.upperLeft, ...toothPositions.lowerRight, ...toothPositions.lowerLeft];

const DentalChart = ({ teeth = {}, onToothClick, selectedTooth }) => {
  const [hoveredTooth, setHoveredTooth] = useState(null);

  const getToothColor = (num) => {
    const tooth = teeth[num];
    return STATUS_COLORS[tooth?.status] || STATUS_COLORS.healthy;
  };

  const getToothLabel = (num) => {
    const tooth = teeth[num];
    if (tooth?.lastTreatment) {
      return `${num}: ${tooth.lastTreatment}`;
    }
    return `Tooth ${num}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.legend}>
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} className={styles.legendItem}>
            <span className={styles.legendColor} style={{ background: STATUS_COLORS[status] }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <svg viewBox="0 0 90 105" className={styles.chart}>
        <rect x="0" y="0" width="90" height="105" fill="none" />
        
        <text x="45" y="8" className={styles.quadrantLabel}>Upper Right</text>
        <text x="45" y="68" className={styles.quadrantLabel}>Lower Right</text>
        
        <line x1="45" y1="10" x2="45" y2="65" className={styles.divider} />
        <line x1="5" y1="35" x2="85" y2="35" className={styles.divider} />
        <line x1="5" y1="65" x2="85" y2="65" className={styles.divider} />

        {allTeeth.map(({ num, x, y }) => (
          <g
            key={num}
            className={`${styles.tooth} ${selectedTooth === num ? styles.selected : ''}`}
            onClick={() => onToothClick?.(num)}
            onMouseEnter={() => setHoveredTooth(num)}
            onMouseLeave={() => setHoveredTooth(null)}
          >
            <rect
              x={x}
              y={y}
              width="12"
              height="18"
              rx="2"
              fill={getToothColor(num)}
              stroke={selectedTooth === num ? '#333' : 'white'}
              strokeWidth={selectedTooth === num ? 2 : 1}
            />
            <text
              x={x + 6}
              y={y + 12}
              className={styles.toothNumber}
              fill="white"
              textAnchor="middle"
            >
              {num}
            </text>
            
            {hoveredTooth === num && (
              <g className={styles.tooltip}>
                <rect
                  x={x + 14}
                  y={y - 5}
                  width="60"
                  height="24"
                  rx="3"
                  fill="#333"
                />
                <text
                  x={x + 20}
                  y={y + 10}
                  className={styles.tooltipText}
                  fill="white"
                >
                  {getToothLabel(num)}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

export default DentalChart;
export { STATUS_COLORS, STATUS_LABELS };
