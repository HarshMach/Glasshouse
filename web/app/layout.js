export const metadata = {
  title: 'The GlassHouse',
  description: 'AI-powered news with real-world impact analysis.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
