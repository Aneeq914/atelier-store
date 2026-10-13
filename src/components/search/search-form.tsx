import Form from "next/form";
import { SEARCH_HREF } from "@/lib/routes";
import { search } from "@/lib/sample-data";
import { MAX_QUERY_LENGTH } from "@/lib/search";

type Props = {
  query: string;
  /** Focus the field on arrival, only when there's no query yet (e.g. from the header icon). */
  autoFocus?: boolean;
};

/** GET form to /search?q=…; next/form submits it as a client-side navigation. */
export function SearchForm({ query, autoFocus = false }: Props) {
  return (
    <Form action={SEARCH_HREF} role="search" className="flex flex-col gap-3 sm:flex-row">
      <label htmlFor="search-q" className="sr-only">
        {search.label}
      </label>
      <input
        // Remount when the query changes so the field shows the new search.
        key={query}
        id="search-q"
        type="search"
        name="q"
        defaultValue={query}
        placeholder={search.placeholder}
        maxLength={MAX_QUERY_LENGTH}
        autoComplete="off"
        enterKeyHint="search"
        autoFocus={autoFocus}
        // Hide Chrome's blue clear button; it's outside the closed palette.
        className="field sm:flex-1 [&::-webkit-search-cancel-button]:appearance-none"
      />
      <button type="submit" className="btn btn-primary">
        Search
      </button>
    </Form>
  );
}
