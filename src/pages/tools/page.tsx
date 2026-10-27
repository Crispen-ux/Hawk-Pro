import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import PowerCalc from "./_components/power-calc.tsx";
import DelayCalc from "./_components/delay-calc.tsx";
import CableCalc from "./_components/cable-calc.tsx";
import RoomModesCalc from "./_components/room-modes-calc.tsx";
import ImpedanceCalc from "./_components/impedance-calc.tsx";

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-12 lg:px-8 lg:py-16">
      <header className="space-y-3">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.4em] text-primary">
          <span className="h-px w-8 bg-primary" /> Tools
        </p>
        <h1 className="text-balance font-serif text-5xl font-extrabold uppercase leading-[0.92] sm:text-7xl">
          Size your sound.
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Quick calculators for planning a system. Enter figures from your
          equipment's data sheet. Results are estimates, not guarantees.
        </p>
      </header>

      <Tabs defaultValue="power">
        <TabsList className="h-auto w-full justify-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="power">Power and loudness</TabsTrigger>
          <TabsTrigger value="impedance">Impedance</TabsTrigger>
          <TabsTrigger value="delay">Delay</TabsTrigger>
          <TabsTrigger value="cable">Cable loss</TabsTrigger>
          <TabsTrigger value="room">Room modes</TabsTrigger>
        </TabsList>
        <TabsContent value="power" className="pt-6">
          <PowerCalc />
        </TabsContent>
        <TabsContent value="impedance" className="pt-6">
          <ImpedanceCalc />
        </TabsContent>
        <TabsContent value="delay" className="pt-6">
          <DelayCalc />
        </TabsContent>
        <TabsContent value="cable" className="pt-6">
          <CableCalc />
        </TabsContent>
        <TabsContent value="room" className="pt-6">
          <RoomModesCalc />
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap items-center gap-3 border-t pt-8">
        <p className="text-sm text-muted-foreground">
          Want help choosing gear?
        </p>
        <Button asChild>
          <Link to="/shop">Browse the range</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/rentals#enquiry">Request a rental quote</Link>
        </Button>
      </div>
    </div>
  );
}
