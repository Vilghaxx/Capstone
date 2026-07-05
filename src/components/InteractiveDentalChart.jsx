/**
 * Interactive Dental Chart Component
 * ===================================
 * Production-ready dental chart system with interactive tooth selection
 * Replaces the old DentalChart component with enhanced functionality
 * 
 * Features:
 * - 32 individually clickable teeth mapped to the oral cavity SVG
 * - Hover and selection states with visual feedback
 * - Color-coded tooth statuses (healthy, treated, needs-attention, urgent)
 * - Intelligent tooltip display with tooth information
 * - Professional legend showing all statuses
 * - Fully responsive and accessible
 * - Backward compatible with existing PatientProfile integration
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  TOOTH_REGIONS,
  TOOTH_STATUS_COLORS,
  TOOTH_STATUS_LABELS,
  DEFAULT_TOOTH_STATUS
} from '../utils/toothMapping';
import styles from '../styles/InteractiveDentalChart.module.css';
import oralCavitySvg from '../../202402_Oral_Cavity.svg';

/**
 * InteractiveDentalChart Component
 * 
 * @param {Object} props
 * @param {Object} props.teeth - Tooth data keyed by tooth number (1-32)
 *   Format: { toothNumber: { status, lastTreatment, ... }, ... }
 * @param {Function} props.onToothClick - Callback when tooth is clicked
 * @param {number|null} props.selectedTooth - Currently selected tooth number
 * @param {Function} [props.onHoverTooth] - Optional hover callback
 * @param {boolean} [props.showTitle] - Show component title (default: true)
 * @param {boolean} [props.showLegend] - Show status legend (default: true)
 * @param {boolean} [props.showInstructions] - Show usage instructions (default: false)
 */
const InteractiveDentalChart = ({
  teeth = {},
  onToothClick = () => {},
  selectedTooth = null,
  onHoverTooth = null,
  showTitle = true,
  showLegend = true,
  showInstructions = false
}) => {
  const [hoveredTooth, setHoveredTooth] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false });
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);

  /**
   * Get tooth status with fallback to default
   */
  const getToothStatus = (toothNumber) => {
    const toothData = teeth[toothNumber];
    return toothData?.status || DEFAULT_TOOTH_STATUS;
  };

  /**
   * Get tooth color based on status
   */
  const getToothColor = (status) => {
    return TOOTH_STATUS_COLORS[status] || TOOTH_STATUS_COLORS[DEFAULT_TOOTH_STATUS];
  };

  /**
   * Handle tooth click event
   */
  const handleToothClick = (toothNumber) => {
    if (onToothClick) {
      onToothClick(toothNumber);
    }
  };

  /**
   * Handle tooth mouse enter - show tooltip and update hover state
   */
  const handleToothHover = (toothData, event) => {
    setHoveredTooth(toothData);

    if (onHoverTooth) {
      onHoverTooth(toothData.toothNumber);
    }

    // Calculate tooltip position
    if (svgRef.current && tooltipRef.current) {
      setTimeout(() => {
        const svgRect = svgRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();

        const centerX = svgRect.left + (toothData.centerX / 400) * svgRect.width;
        const centerY = svgRect.top + (toothData.centerY / 400) * svgRect.height;

        let x = centerX - tooltipRect.width / 2;
        let y = centerY - tooltipRect.height - 12;

        // Adjust if tooltip goes off-screen (right)
        if (x + tooltipRect.width > window.innerWidth) {
          x = window.innerWidth - tooltipRect.width - 10;
        }

        // Adjust if tooltip goes off-screen (left)
        if (x < 10) {
          x = 10;
        }

        // Adjust if tooltip goes off-screen (top)
        if (y < 10) {
          y = centerY + 12;
        }

        setTooltipPos({ x, y, visible: true });
      }, 0);
    }
  };

  /**
   * Handle tooth mouse leave - hide tooltip
   */
  const handleToothLeave = () => {
    setHoveredTooth(null);
    setTooltipPos({ ...tooltipPos, visible: false });
  };

  /**
   * Get CSS class for tooth based on status and selection state
   */
  const getToothClass = (toothNumber) => {
    let className = styles.toothRegion;
    const status = getToothStatus(toothNumber);

    // Add status class
    className += ` ${styles[status.replace('-', '')]}`;

    // Add selected class if this is the selected tooth
    if (toothNumber === selectedTooth) {
      className += ` ${styles.selected}`;
    }

    return className;
  };

  /**
   * Format last treatment date
   */
  const formatLastTreatment = (date) => {
    if (!date) return 'No treatment';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div className={styles.container}>
      {showTitle && <h2 className={styles.title}>Dental Chart</h2>}

      {showInstructions && (
        <div className={styles.instructions}>
          Click on a tooth to view details and treatment options
        </div>
      )}

      {/* Main SVG Container */}
      <div className={styles.svgWrapper}>
        <svg
          ref={svgRef}
          viewBox="0 0 400 400"
          className={styles.baseSvg}
          role="img"
          aria-label="Interactive dental chart"
        >
          {/* Base Oral Cavity SVG as background */}
          <image
            href={oralCavitySvg}
            x="0"
            y="0"
            width="400"
            height="400"
            preserveAspectRatio="xMidYMid meet"
          />

           {/* Tooth Region Overlay Layer */}
           <g className={styles.toothLayer} role="presentation">
             {Object.values(TOOTH_REGIONS).map(toothData => (
                <g key={toothData.toothNumber}>
                  {toothData.path ? (
                    <path
                      d={toothData.path}
                      className={getToothClass(toothData.toothNumber)}
                      onClick={() => handleToothClick(toothData.toothNumber)}
                      onMouseEnter={() => handleToothHover(toothData)}
                      onMouseLeave={handleToothLeave}
                      onFocus={() => handleToothHover(toothData)}
                      onBlur={handleToothLeave}
                      data-tooth={toothData.toothNumber}
                      role="button"
                      tabIndex="0"
                      aria-label={`Tooth ${toothData.toothNumber}: ${toothData.name}`}
                      aria-pressed={toothData.toothNumber === selectedTooth}
                    />
                  ) : (
                    <rect
                      x={toothData.bounds.x1}
                      y={toothData.bounds.y1}
                      width={toothData.bounds.x2 - toothData.bounds.x1}
                      height={toothData.bounds.y2 - toothData.bounds.y1}
                      className={getToothClass(toothData.toothNumber)}
                      onClick={() => handleToothClick(toothData.toothNumber)}
                      onMouseEnter={() => handleToothHover(toothData)}
                      onMouseLeave={handleToothLeave}
                      onFocus={() => handleToothHover(toothData)}
                      onBlur={handleToothLeave}
                      data-tooth={toothData.toothNumber}
                      role="button"
                      tabIndex="0"
                      aria-label={`Tooth ${toothData.toothNumber}: ${toothData.name}`}
                      aria-pressed={toothData.toothNumber === selectedTooth}
                    />
                  )}
                </g>
             ))}
           </g>
        </svg>

        {/* Tooltip */}
        {hoveredTooth && tooltipPos.visible && (
          <div
            ref={tooltipRef}
            className={styles.tooltip}
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`
            }}
            role="tooltip"
          >
            <div className={styles.tooltipText}>
              <div className={styles.tooltipNumber}>
                Tooth #{hoveredTooth.toothNumber} ({hoveredTooth.fdi})
              </div>
              <div className={styles.tooltipStatus}>
                {TOOTH_STATUS_LABELS[getToothStatus(hoveredTooth.toothNumber)]}
              </div>
              {teeth[hoveredTooth.toothNumber]?.lastTreatment && (
                <div className={styles.tooltipTreatment}>
                  Last: {formatLastTreatment(
                    teeth[hoveredTooth.toothNumber].lastTreatment
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className={styles.legend} role="region" aria-label="Status legend">
          {Object.entries(TOOTH_STATUS_COLORS).map(([status, color]) => (
            <div key={status} className={styles.legendItem}>
              <div
                className={styles.legendColor}
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <span className={styles.legendLabel}>
                {TOOTH_STATUS_LABELS[status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InteractiveDentalChart;

// Backward compatibility exports for ToothModal and other components
// These map the new naming convention to the old names expected by existing code
export const STATUS_COLORS = TOOTH_STATUS_COLORS;
export const STATUS_LABELS = TOOTH_STATUS_LABELS;
