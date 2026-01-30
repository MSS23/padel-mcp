/**
 * Hello World Test Widget
 *
 * Simple test widget to validate rendering and hydration in ChatGPT Desktop.
 * Tests basic interactivity with a counter button.
 */

import { h } from 'preact';
import { useState } from 'preact/hooks';
import '../global.d.js';

export interface HelloWorldProps {
  widgetSessionId?: string;
}

export function HelloWorldWidget(props: HelloWorldProps) {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '32px', textAlign: 'center', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '32px', color: '#2c5aa0', marginBottom: '16px' }}>
        Hello ChatGPT Widgets! 🎾
      </h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '32px' }}>
        If you see this, rendering works!
      </p>

      <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '24px' }}>
        <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          Count: <span data-counter>{count}</span>
        </p>
        <button
          style={{
            background: '#2c5aa0',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '16px 32px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
          onClick={() => {
            setCount(count + 1);
            alert(`Button clicked! Count is now: ${count + 1}`);
          }}
          data-action="increment"
        >
          Click Me to Test Interactivity
        </button>
      </div>

      <p style={{ fontSize: '14px', color: '#999', marginTop: '24px' }}>
        {count > 0 ? '✅ Hydration works!' : '⏳ Click button to test hydration'}
      </p>
    </div>
  );
}
