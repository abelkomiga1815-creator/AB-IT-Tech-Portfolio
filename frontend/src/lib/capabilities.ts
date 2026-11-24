import { BarChart3, Code2, Globe, Palette, ShieldCheck, Smartphone, Wrench, type LucideIcon } from "lucide-react";

export interface Capability {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const capabilities: Capability[] = [
  { title: "Software Development", description: "Custom software built around how your organisation actually works.", icon: Code2 },
  { title: "Web Development", description: "Fast, accessible websites and web applications.", icon: Globe },
  { title: "Mobile App Development", description: "Mobile applications for the devices your users carry.", icon: Smartphone },
  { title: "Cybersecurity", description: "Security reviews and hardening for systems that matter.", icon: ShieldCheck },
  { title: "Data Analysis", description: "Turning raw records into decisions and dashboards.", icon: BarChart3 },
  { title: "UI/UX & Graphic Design", description: "Interfaces and visuals with a clear point of view.", icon: Palette },
  { title: "IT Support & Maintenance", description: "Reliable upkeep so your systems keep running.", icon: Wrench },
];
