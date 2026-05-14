"use client";

import { createContext, useContext } from "react";

type SubscriptionContextValue = { isSubscribed: boolean };

const SubscriptionContext = createContext<SubscriptionContextValue>({
  isSubscribed: false,
});

export function SubscriptionProvider({
  isSubscribed,
  children,
}: {
  isSubscribed: boolean;
  children: React.ReactNode;
}) {
  return (
    <SubscriptionContext.Provider value={{ isSubscribed }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  return useContext(SubscriptionContext);
}
