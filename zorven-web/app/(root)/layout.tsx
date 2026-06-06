
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import React from "react";

export default function LandingLayout({children} : {children : React.ReactNode}){
    return(
        <>
        <Header/>
        <main className="z-20 relative pt-0 md:pt-0">
            {children}
        </main>
        <Footer/>
        </>
    )
}