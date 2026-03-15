import { LoadingCardScaffold } from "@/components/loading/loading-card-scaffold";
import { RouteLoadingShell } from "@/components/loading/route-loading-shell";
import { LoadingTableBlock } from "@/components/loading/skeleton-presets";

export default function AdminUsuariosLoading() {
  return (
    <RouteLoadingShell size="full">
      <LoadingCardScaffold
        variant="flat-mobile"
        headerLines={["h-7 w-32", "h-4 w-full max-w-sm"]}
      >
        <LoadingTableBlock headerCount={9} rowCount={8} columnsClassName="md:grid-cols-3 xl:grid-cols-9" />
      </LoadingCardScaffold>
    </RouteLoadingShell>
  );
}
