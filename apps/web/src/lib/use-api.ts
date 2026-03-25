"use client";

import { useMemo } from "react";
import { useAuthToken } from "@/components/auth-provider";
import { createApiClient } from "./api-client";

export function useApi() {
  const token = useAuthToken();
  return useMemo(() => createApiClient(token ?? undefined), [token]);
}
