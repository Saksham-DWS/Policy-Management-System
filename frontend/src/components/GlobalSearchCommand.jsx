import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { formatCurrencyValue } from "@/lib/currency";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { FileText, Loader2, Search, UserRound, Wallet } from "lucide-react";

export default function GlobalSearchCommand({ open, onOpenChange }) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  const canSearch = open && debouncedQuery.length >= 2;

  const { data, isLoading } = api.search.global.useQuery(
    { q: debouncedQuery, limit: 6 },
    {
      enabled: canSearch,
      staleTime: 15_000,
    },
  );

  const hasResults = useMemo(() => {
    if (!data) return false;
    return (data.users?.length || 0) + (data.policies?.length || 0) + (data.requests?.length || 0) > 0;
  }, [data]);

  const handleSelect = (route) => {
    if (!route) return;
    setLocation(route);
    onOpenChange(false);
    setQuery("");
    setDebouncedQuery("");
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Global Search"
      description="Search users, policies and requests"
      className="sm:max-w-2xl"
    >
      <CommandInput
        placeholder="Search users, policies, requests..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {!canSearch ? (
          <div className="px-4 py-8 text-sm text-muted-foreground">
            Type at least 2 characters to start searching.
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching workspace...
          </div>
        ) : null}

        {canSearch && !isLoading ? <CommandEmpty>No results found.</CommandEmpty> : null}

        {data?.users?.length ? (
          <CommandGroup heading="Users">
            {data.users.map((item) => (
              <CommandItem
                key={`user-${item.id}`}
                value={`user-${item.label}-${item.subtitle}`}
                onSelect={() => handleSelect(item.route)}
              >
                <UserRound className="h-4 w-4" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{item.label}</span>
                  <span className="truncate text-xs text-muted-foreground">{item.subtitle}</span>
                </div>
                <CommandShortcut>USER</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {data?.users?.length && ((data?.policies?.length || 0) > 0 || (data?.requests?.length || 0) > 0) ? (
          <CommandSeparator />
        ) : null}

        {data?.policies?.length ? (
          <CommandGroup heading="Policies">
            {data.policies.map((item) => (
              <CommandItem
                key={`policy-${item.id}`}
                value={`policy-${item.label}-${item.subtitle}`}
                onSelect={() => handleSelect(item.route)}
              >
                <FileText className="h-4 w-4" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{item.label}</span>
                  <span className="truncate text-xs text-muted-foreground">{item.subtitle}</span>
                </div>
                <CommandShortcut>POLICY</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {data?.policies?.length && (data?.requests?.length || 0) > 0 ? <CommandSeparator /> : null}

        {data?.requests?.length ? (
          <CommandGroup heading="Requests">
            {data.requests.map((item) => (
              <CommandItem
                key={`request-${item.id}`}
                value={`request-${item.label}-${item.subtitle}`}
                onSelect={() => handleSelect(item.route)}
              >
                <Wallet className="h-4 w-4" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{item.label}</span>
                  <span className="truncate text-xs text-muted-foreground">{item.subtitle}</span>
                </div>
                <CommandShortcut>{formatCurrencyValue(item.amount || 0, item.currency || "USD")}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {canSearch && !isLoading && hasResults ? (
          <div className="flex items-center gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
            Press Enter to jump to selected result
          </div>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
