'use client'
import { signOut } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function SignOut(){
    async function handleSignOut() {
        await signOut()
    }
    return (
        <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleSignOut}
            className="group gap-2 border-white/10 bg-white/5 text-white/75 shadow-lg shadow-black/10 hover:border-white/20 hover:bg-white/10 hover:text-white transition-all"
        >
            <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            Sign Out
        </Button>
    )
}