"use client";
import { useRevealOnScroll } from "./hooks/useRevealOnScroll";
import AnnouncementBar from "./components/AnnouncementBar";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import MarqueeBand from "./components/MarqueeBand";
import AboutSection from "./components/AboutSection";
import PillarsSection from "./components/PillarsSection";
import EndorsementSection from "./components/EndorsementSection";
import ConstituencySection from "./components/ConstituencySection";
import BlogSection from "./components/BlogSection";
import GallerySection from "./components/GallerySection";
import RegisterSection from "./components/RegisterSection";
import EventsSection from "./components/EventsSection";
import Footer from "./components/Footer";


export default function Home() {
  const revealRef = useRevealOnScroll();

  return (
    <div ref={revealRef}>
      <AnnouncementBar />
      <Navbar />
      <HeroSection />
      <MarqueeBand />
      <AboutSection />
      <PillarsSection />
      <EndorsementSection />
      <ConstituencySection />
      <BlogSection />
      <GallerySection />
      <RegisterSection />
      <EventsSection />
      <Footer />
    </div>
  );
}
