import LoadingState from "./LoadingState"
import ErrorState from "./ErrorState"

interface DataStateWrapperProps {
  isLoading: boolean;
  error: Error | null;
  children: React.ReactNode;
}

export default function DataStateWrapper({ isLoading, error, children }: DataStateWrapperProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-red-500 text-center">
          <h3 className="text-xl font-semibold mb-2">Error</h3>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}