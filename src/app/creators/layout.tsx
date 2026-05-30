import React from "react";
import TerminalLayout from "@/components/layout/TerminalLayout";

export default function CreatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TerminalLayout>
      <div className="py-6">
        {children}
      </div>
    </TerminalLayout>
  );
}
