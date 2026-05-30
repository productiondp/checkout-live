import React from "react";
import TerminalLayout from "@/components/layout/TerminalLayout";

export default function CreatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TerminalLayout>
      {children}
    </TerminalLayout>
  );
}
