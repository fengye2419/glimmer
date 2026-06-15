interface Props {
  message: string
  onRetry?: () => void
}

export default function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="error-state card">
      <p>{message}</p>
      {onRetry && (
        <button className="btn primary" onClick={onRetry}>
          重试
        </button>
      )}
    </div>
  )
}
