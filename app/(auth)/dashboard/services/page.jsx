"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Wrench } from "lucide-react";
import { ServicesList } from "./components/ServicesList";
import { PackagesList } from "./components/PackagesList";

export default function ServicesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="et-text-xl font-semibold">Services & Packages</h1>
        <p className="et-text-sm text-muted-foreground">Manage your services and create packages</p>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="h-9">
          <TabsTrigger value="services" className="h-8 gap-1.5 px-3 et-text-xs">
            <Wrench className="h-3.5 w-3.5" />
            Services
          </TabsTrigger>
          <TabsTrigger value="packages" className="h-8 gap-1.5 px-3 et-text-xs">
            <Package className="h-3.5 w-3.5" />
            Packages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-4">
          <ServicesList />
        </TabsContent>

        <TabsContent value="packages" className="mt-4">
          <PackagesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
