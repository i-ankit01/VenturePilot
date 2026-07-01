import Features from "@/components/landing/Features";
import Hero from "@/components/landing/Hero";
import StartupRoadmap from "@/components/landing/StartupRoadmap";


export default async function Home() {

  return(
    <div>
      <Hero/>
      <Features/>
      <StartupRoadmap/>
    </div>
  )
}
