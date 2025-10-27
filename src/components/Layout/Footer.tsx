/**
 * Footer Component
 *
 * Data source attribution and last updated information.
 * Displays at the bottom of each module.
 */

import React from 'react';
import type { DataSource } from '../../types';

interface FooterProps {
  dataSources: DataSource[];
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ dataSources, className = '' }) => {
  // Format timestamp to Hungarian locale
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Find the most recent update
  const mostRecentUpdate = dataSources.reduce((latest, current) => {
    const currentDate = new Date(current.lastUpdate);
    const latestDate = new Date(latest.lastUpdate);
    return currentDate > latestDate ? current : latest;
  }, dataSources[0]);

  return (
    <footer className={`data-source-footer ${className}`}>
      <div className="space-y-1">
        {/* Last Update */}
        <p className="data-source-timestamp">
          Utolsó frissítés: {formatTimestamp(mostRecentUpdate.lastUpdate)}
        </p>

        {/* Data Sources */}
        <div className="flex flex-wrap items-center gap-2">
          <span>Források:</span>
          {dataSources.map((source, index) => (
            <React.Fragment key={source.name}>
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 hover:text-cyan-700 hover:underline"
                >
                  {source.name}
                </a>
              ) : (
                <span>{source.name}</span>
              )}
              {index < dataSources.length - 1 && <span>, </span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </footer>
  );
};
