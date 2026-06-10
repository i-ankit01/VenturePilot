'use client'
import { signOut } from "@/actions/auth"

export default function SignOut(){
    async function handleSignOut() {
        await signOut()
    }
    return (
        <button className="border-white border p-2" onClick={handleSignOut}>Sign Out</button>
    )
}