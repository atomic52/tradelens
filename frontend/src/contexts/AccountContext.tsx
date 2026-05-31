import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { accounts as accountsApi } from "@/services/api";
import type { Account } from "@/types";

interface AccountContextValue {
  accounts: Account[];
  accountId: string | null;
  setAccountId: (id: string) => void;
  isLoading: boolean;
}

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.list,
  });

  const [accountId, setAccountIdState] = useState<string | null>(
    () => localStorage.getItem("selectedAccountId")
  );

  // When accounts load, validate stored ID or fall back to first account
  useEffect(() => {
    if (isLoading || accounts.length === 0) return;
    const valid = accounts.find((a) => a.id === accountId);
    if (!valid) {
      const first = accounts[0].id;
      setAccountIdState(first);
      localStorage.setItem("selectedAccountId", first);
    }
  }, [accounts, isLoading]);

  const setAccountId = (id: string) => {
    setAccountIdState(id);
    localStorage.setItem("selectedAccountId", id);
  };

  return (
    <AccountContext.Provider value={{ accounts, accountId, setAccountId, isLoading }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used inside AccountProvider");
  return ctx;
}
