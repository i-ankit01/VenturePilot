import Features from "@/components/landing/Features";
import Hero from "@/components/landing/Hero";
import Pricing from "@/components/landing/Pricing";
import StartupRoadmap from "@/components/landing/StartupRoadmap";


export default async function Home() {

  return(
    <div>
      <Hero/>
      <Features/>
      <StartupRoadmap/>
      <Pricing/>
    </div>
  )
}
