import { CampaignBanner } from "@/components/home/campaign-banner";
import { CategoryTiles } from "@/components/home/category-tiles";
import { CollectionSplit } from "@/components/home/collection-split";
import { Hero } from "@/components/home/hero";
import { NewArrivals } from "@/components/home/new-arrivals";
import { ProductSpotlight } from "@/components/home/product-spotlight";
import { ServicesStrip } from "@/components/home/services-strip";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryTiles />
      <CollectionSplit />
      <NewArrivals />
      <CampaignBanner />
      <ProductSpotlight />
      <ServicesStrip />
    </>
  );
}
