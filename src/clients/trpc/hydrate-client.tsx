"use client";

import { HydrationBoundary, type DehydratedState } from "@tanstack/react-query";
import type { ReactNode } from "react";

export function HydrateClient(props: {
  state: DehydratedState;
  children: ReactNode;
}) {
  return (
    <HydrationBoundary state={props.state}>
      {props.children}
    </HydrationBoundary>
  );
}
