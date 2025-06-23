"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ClientForm } from "@/components/clients/client-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Client } from "@/types/client";

export default function EditClientPage() {
  const params = useParams();
  const clientId = params.id as string;

  const {
    data: client,
    isLoading,
    error,
  } = useQuery<Client>({
    queryKey: ["client", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) throw new Error("Failed to fetch client");
      return response.json();
    },
  });

  if (error) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              Failed to load client. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Client</CardTitle>
          <CardDescription>
            Update the client&apos;s information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <ClientForm client={client} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
