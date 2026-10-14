export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Override the admin layout for login — no sidebar
  return <>{children}</>;
}
