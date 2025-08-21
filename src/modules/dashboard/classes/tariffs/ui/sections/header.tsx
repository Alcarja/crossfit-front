import { Tag } from "lucide-react";

const Header = () => (
  <div className="mb-6 flex flex-col gap-3">
    <div className="flex items-center gap-3">
      <div className="rounded-2xl border bg-background p-2 shadow-sm">
        <Tag className="h-5 w-5" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Gestión de Tarifas
        </h1>
        <p className="text-sm text-muted-foreground">
          Administra planes y la asignación de atletas.
        </p>
      </div>
    </div>
  </div>
);

export default Header;
