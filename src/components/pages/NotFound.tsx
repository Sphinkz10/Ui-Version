import { Home, ArrowLeft } from "lucide-react";

interface NotFoundProps {
  onNavigateHome: () => void;
}

export function NotFound({ onNavigateHome }: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="relative mb-8">
        <h1 className="text-9xl font-black text-slate-100 select-none">404</h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-sky-100 p-4 rounded-full">
            <ArrowLeft className="h-8 w-8 text-sky-600" />
          </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Página não encontrada
      </h2>
      <p className="text-slate-500 max-w-md mb-8">
        Desculpa, não conseguimos encontrar a página que estavas à procura. Tem a certeza que o link está correcto?
      </p>

      <button
        onClick={onNavigateHome}
        className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-700 transition-colors shadow-sm shadow-sky-600/20"
      >
        <Home className="h-5 w-5" />
        Voltar à página inicial
      </button>
    </div>
  );
}
