import { useQuery } from "@tanstack/react-query";
import { accounts as accountsApi } from "@/services/api";

export function useFirstAccount() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.list,
  });

  return {
    accountId: data[0]?.id ?? null,
    accounts: data,
    isLoading,
  };
}
