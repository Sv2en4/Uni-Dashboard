import { Link, NavLink, Outlet } from 'react-router'
import { LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

// Frame for all logged-in pages: small header + page content.
export function AppLayout() {
  return (
    <div className="mx-auto min-h-svh max-w-5xl px-4 pb-16 sm:px-6">
      <header className="flex h-14 items-center justify-between">
        <Link to="/" className="font-semibold tracking-tight">
          Uni-Dashboard
        </Link>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild aria-label="Einstellungen">
            <NavLink to="/einstellungen">
              <Settings />
            </NavLink>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abmelden"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut />
          </Button>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
