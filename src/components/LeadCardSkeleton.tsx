import React from 'react';

interface LeadCardSkeletonProps {
  count?: number;
}

export const LeadCardSkeleton: React.FC<LeadCardSkeletonProps> = ({ count = 4 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              {/* Circle Avatar */}
              <div className="skeleton-box" style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0 }} />
              
              {/* Name & Phone */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <div className="skeleton-box" style={{ width: '45%', height: '15px' }} />
                <div className="skeleton-box" style={{ width: '30%', height: '11px' }} />
              </div>
            </div>

            {/* WA icon skeleton */}
            <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
          </div>

          {/* Tags skeleton */}
          <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
            <div className="skeleton-box" style={{ width: '65px', height: '22px', borderRadius: '6px' }} />
            <div className="skeleton-box" style={{ width: '50px', height: '22px', borderRadius: '6px' }} />
            <div className="skeleton-box" style={{ width: '90px', height: '22px', borderRadius: '6px' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

