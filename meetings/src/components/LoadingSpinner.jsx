export default function LoadingSpinner({ fullPage = false }) {
  const spinner = <div className="spinner" />;

  if (fullPage) {
    return (
      <div className="loading-fullpage">
        {spinner}
        <p>Loading...</p>
      </div>
    );
  }

  return spinner;
}
