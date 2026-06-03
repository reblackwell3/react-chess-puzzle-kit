import React from 'react';
import { createPortal } from 'react-dom';
import { getAnalysisModalStyles } from './analysisModalStyles';
import { AnalysisContainerRenderProps } from '../core/renderProps';

/** Default full-screen modal shell for analysis (library preset UI). */
export const DefaultAnalysisContainer = ({
  theme,
  onClose,
  onBackdropMouseDown,
  children,
}: AnalysisContainerRenderProps) => {
  const modalTheme = getAnalysisModalStyles(theme);

  const modal = (
    <div style={overlayStyle} onMouseDown={onBackdropMouseDown}>
      <div
        style={{ ...panelStyle, ...modalTheme.panel }}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Puzzle analysis"
        data-rcwc-theme={theme}
      >
        <div style={headerStyle}>
          <h2 style={{ ...titleStyle, ...modalTheme.title }}>Analysis</h2>
          <button
            type="button"
            onClick={onClose}
            style={{ ...closeButtonStyle, ...modalTheme.closeButton }}
          >
            Close
          </button>
        </div>

        {children}
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modal;
  }

  return createPortal(modal, document.body);
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const panelStyle: React.CSSProperties = {
  borderRadius: 8,
  padding: 16,
  width: 'max-content',
  maxWidth: '95vw',
  maxHeight: '95vh',
  overflow: 'auto',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
};

const closeButtonStyle: React.CSSProperties = {
  cursor: 'pointer',
  borderRadius: 4,
  padding: '4px 12px',
  fontSize: 14,
};
