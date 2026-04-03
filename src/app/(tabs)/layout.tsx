import { Dock } from "@/components/dock";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="pb-24 min-h-dvh">{children}</main>
      <Dock />
    </>
  );
}
