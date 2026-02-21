import { NextPageContext } from 'next'

interface ErrorProps {
  statusCode: number | undefined
}

function Error({ statusCode }: ErrorProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'hsl(160, 30%, 4%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: 'hsl(160, 20%, 95%)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 700, marginBottom: '8px' }}>
          {statusCode || 'Error'}
        </h1>
        <p style={{ fontSize: '16px', color: 'hsl(160, 15%, 60%)' }}>
          {statusCode === 404
            ? 'Page not found'
            : 'An unexpected error occurred'}
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: '24px',
            padding: '10px 24px',
            backgroundColor: 'hsl(160, 70%, 40%)',
            color: 'hsl(160, 20%, 98%)',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Go Home
        </a>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? (err as any).statusCode : 404
  return { statusCode }
}

export default Error
