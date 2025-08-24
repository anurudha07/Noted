'use client';

import { clearToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

const Header=()=>{
    const router=useRouter()
    const logout=()=>{
        clearToken();
        router.replace('/login')
    }

return(
    <header className="w-full p-3 flex items-center justify-end border-b border-gray-800">
        
        <div className="flex justify-end">
            
            <button className="text-sm px-4 py-2 bg-gray-1000 text-white" onClick={logout}>Logout</button>
        </div>
    </header>
)
}

export default Header