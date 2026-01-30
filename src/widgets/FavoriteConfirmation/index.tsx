/**
 * Favorite Confirmation Widget
 *
 * Success screen shown after adding a venue to favorites with star animation.
 */

import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import '../global.d.js';

export interface FavoriteConfirmationProps {
  venue: {
    id: string;
    name: string;
  };
  widgetSessionId?: string;
}

export function FavoriteConfirmationWidget(props: FavoriteConfirmationProps) {
  const { venue } = props;
  const [showSparkle, setShowSparkle] = useState(true);

  useEffect(() => {
    // Trigger sparkle animation
    setTimeout(() => setShowSparkle(false), 2000);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.animationContainer}>
        <div style={{ ...styles.starIcon, ...(showSparkle ? styles.starSparkle : {}) }}>
          ⭐
        </div>
        {showSparkle && <SparkleEffect />}
      </div>
      
      <h2 style={styles.title}>Saved to Favorites!</h2>
      <p style={styles.venueName}>{venue.name}</p>
      
      <button
        style={styles.actionButton}
        onClick={async () => {
          if (window.openai?.callTool) {
            try {
              await window.openai.callTool({
                toolName: 'find_available_games',
                params: {
                  location: venue.name,
                  date: new Date().toISOString().split('T')[0],
                  max_distance_km: 10,
                },
              });
            } catch (error) {
              console.error('Search error:', error);
            }
          }
        }}
      >
        Check Availability Now
      </button>
    </div>
  );
}

function SparkleEffect() {
  return (
    <div style={styles.sparkleContainer}>
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          style={{
            ...styles.sparkle,
            '--angle': `${(i * 45)}deg`,
            '--delay': `${i * 0.1}s`,
          } as any}
        />
      ))}
    </div>
  );
}

const styles = {
  container: {
    padding: '32px 24px',
    maxWidth: '400px',
    margin: '0 auto',
    textAlign: 'center' as const,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  animationContainer: {
    position: 'relative' as const,
    marginBottom: '24px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starIcon: {
    fontSize: '64px',
    animation: 'starScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  starSparkle: {
    animation: 'starScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), starGlow 2s ease-in-out infinite',
  },
  sparkleContainer: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '120px',
    height: '120px',
  },
  sparkle: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: '4px',
    height: '4px',
    background: '#fbbf24',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%) rotate(var(--angle)) translateX(40px)',
    animation: 'sparkleFade 1.5s var(--delay) ease-out forwards',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#1a1a1a',
  },
  venueName: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '24px',
  },
  actionButton: {
    backgroundColor: '#2c5aa0',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
  },
};

// Add CSS animations
const animationStyles = `
  @keyframes starScale {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes starGlow {
    0%, 100% { filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.5)); }
    50% { filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.8)); }
  }
  
  @keyframes sparkleFade {
    0% {
      opacity: 1;
      transform: translate(-50%, -50%) rotate(var(--angle)) translateX(40px) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) rotate(var(--angle)) translateX(60px) scale(0);
    }
  }
`;

// Inject styles into document if in browser
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = animationStyles;
  document.head.appendChild(styleEl);
}
