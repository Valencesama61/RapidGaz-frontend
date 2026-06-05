export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'linear-gradient(160deg, #fff7ed 0%, #ffedd5 45%, #fed7aa 100%)' }}>
      {children}
    </div>
  )
}
