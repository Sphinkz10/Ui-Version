import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // Log exception to Sentry (Phase 4 Observability)
    import("@sentry/react").then((Sentry) => {
      Sentry.captureException(error, {
        extra: { errorInfo },
      });
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
          <Card className="w-full max-w-md shadow-lg border-red-100">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                Algo correu mal
              </CardTitle>
              <CardDescription className="text-slate-500">
                Ocorreu um erro inesperado na aplicação. Já registámos o problema para o resolver o mais depressa possível.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {this.state.error && (
                <div className="bg-slate-100 p-4 rounded-md overflow-auto max-h-32">
                  <p className="text-xs font-mono text-slate-700 whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}
              <Button 
                aria-label="Recarregar a página"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white" 
                onClick={() => window.location.reload()}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Recarregar a Página
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
