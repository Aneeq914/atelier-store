import type { Metadata } from "next";
import { Suspense } from "react";
import { CollectionHeader } from "@/components/collection/collection-header";
import { CollectionNav } from "@/components/collection/collection-nav";
import { CollectionProducts } from "@/components/collection/collection-products";
import { ServicesStrip } from "@/components/home/services-strip";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductGridSection } from "@/components/product/product-grid-section";
import { SearchForm } from "@/components/search/search-form";
import { getNewArrivals, searchProducts } from "@/db/queries/catalog";
import { NEW_ARRIVALS_HREF } from "@/lib/routes";
import { newArrivals, search } from "@/lib/sample-data";
import { normalizeQuery } from "@/lib/search";

export const metadata: Metadata = {
  title: search.title,
  // Result pages are endless query variations; keep them out of search engines.
  robots: { index: false, follow: true },
};

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <>
      <div className="container-page py-4">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: search.title }]} />
      </div>
      {/* The query lives in the URL, so everything that depends on it streams in;
          the fallback is the same page with an empty search. */}
      <Suspense fallback={<SearchHeader query="" />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
      <ServicesStrip />
    </>
  );
}

function SearchHeader({ query, autoFocus }: { query: string; autoFocus?: boolean }) {
  return (
    <>
      <CollectionHeader
        eyebrow={search.eyebrow}
        title={query ? `${search.resultsTitle} “${query}”` : search.title}
      />
      <div className="container-page pb-8">
        <div className="max-w-2xl">
          <SearchForm query={query} autoFocus={autoFocus} />
        </div>
      </div>
    </>
  );
}

async function SearchResults({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const query = normalizeQuery((await searchParams).q);

  if (!query) {
    const suggestions = await getNewArrivals(4);
    return (
      <>
        <SearchHeader query="" autoFocus />
        <BrowseCollections />
        <ProductGridSection
          id="search-suggestions-title"
          eyebrow={search.suggestions.eyebrow}
          title={search.suggestions.title}
          link={{ label: "View all", href: NEW_ARRIVALS_HREF }}
          products={suggestions}
          // Near the top of the empty search page, so the first row is the largest paint.
          eagerCount={4}
        />
      </>
    );
  }

  const products = await searchProducts(query);
  return (
    <>
      <SearchHeader query={query} />
      {products.length === 0 && <BrowseCollections />}
      <CollectionProducts
        label={`${search.resultsTitle} ${query}`}
        products={products}
        sortLabel={search.sort}
        empty={{
          message: search.empty,
          link: { label: `Shop ${newArrivals.title.toLowerCase()}`, href: NEW_ARRIVALS_HREF },
        }}
      />
    </>
  );
}

function BrowseCollections() {
  return (
    <>
      <p className="container-page type-caption pb-3 text-muted">{search.browse}</p>
      <CollectionNav />
    </>
  );
}
