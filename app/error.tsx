'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'hsl(160, 30%, 4%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: 'hsl(160, 30%, 6%)',
          borderRadius: '12px',
          border: '1px solid hsl(160, 22%, 15%)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            backgroundColor: 'hsl(0, 63%, 31%)',
            color: '#ffffff',
            padding: '16px 24px',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          Something went wrong
        </div>
        <div style={{ padding: '24px' }}>
          <p
            style={{
              margin: '0 0 16px',
              fontSize: '14px',
              color: 'hsl(160, 15%, 60%)',
              fontFamily: 'monospace',
              backgroundColor: 'hsl(160, 25%, 12%)',
              padding: '12px',
              borderRadius: '8px',
              wordBreak: 'break-word',
            }}
          >
            {error.message}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={reset}
              style={{
                flex: 1,
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'hsl(160, 30%, 10%)',
                backgroundColor: 'hsl(160, 70%, 40%)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.reload()
              }}
              style={{
                flex: 1,
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'hsl(160, 20%, 95%)',
                backgroundColor: 'transparent',
                border: '1px solid hsl(160, 22%, 15%)',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
