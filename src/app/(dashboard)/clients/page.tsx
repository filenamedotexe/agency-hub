import { ClientList } from "@/components/clients/client-list";

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground">
          Manage your clients and their information
        </p>
      </div>
      <ClientList />
    </div>
  );
}
