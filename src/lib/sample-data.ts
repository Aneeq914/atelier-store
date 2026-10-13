// Placeholder page content (copy and editorial imagery) until it comes from a CMS.
// Products and categories live in the database (src/db/queries/catalog.ts).
// Client components import this file, so it must not import anything from src/db.

import { categoryHref, NEW_ARRIVALS_HREF } from "@/lib/routes";
import { photo, type SampleImage } from "@/lib/sample-images";

export type LinkTile = {
  label: string;
  href: string;
  image: SampleImage;
};

export const hero = {
  eyebrow: "Autumn – Winter",
  title: "The Winter Edit",
  cta: { label: "Discover the collection", href: "/collections/winter" },
  // The first image is the only one shown below 1024px, so it must be dark
  // enough behind the white header.
  images: [
    photo("hero-tailoring", 7265996, "Man in a three-piece suit beneath a globe lamp, black and white", "50% 30%"),
    photo("hero-gown", 19049894, "Model in a black tulle gown before tall lattice doors", "50% 80%"),
  ],
};

export const categoryTiles: LinkTile[] = [
  {
    label: "Handbags",
    href: categoryHref("handbags"),
    image: photo("category-handbags", 15121089, "Ivory top handle bag with gold hardware"),
  },
  {
    label: "Shoes",
    href: categoryHref("shoes"),
    image: photo("category-shoes", 22500809, "Black strappy heeled sandals on a pale floor"),
  },
  {
    label: "Eyewear",
    href: categoryHref("eyewear"),
    image: photo("category-eyewear", 31305965, "Black rimless sunglasses on a white surface"),
  },
  {
    label: "Fragrance",
    href: categoryHref("fragrance"),
    image: photo("category-fragrance-clear", 4735929, "Clear glass perfume bottle with an amber cap"),
  },
];

export const collections: (LinkTile & { cta: string })[] = [
  {
    label: "Women's Collection",
    href: "/collections/women",
    cta: "Shop women",
    image: photo("collection-women", 19313971, "Woman in a camel wrap coat among autumn trees", "50% 30%"),
  },
  {
    label: "Men's Collection",
    href: "/collections/men",
    cta: "Shop men",
    image: photo("collection-men", 10679231, "Man in a beige suit and sunglasses in a wheat field", "50% 30%"),
  },
];

export const campaign = {
  eyebrow: "The campaign",
  title: "Glass & Light",
  body: "Tailoring in motion, photographed against the city's glass facades.",
  cta: { label: "Explore the campaign", href: "/campaign" },
  image: photo("campaign-glass", 18822108, "Woman in black posing against a glass facade", "50% 30%"),
};

export const newArrivals = {
  eyebrow: "Just landed",
  title: "New arrivals",
  intro: "The latest pieces from the atelier, newest first: leather goods, footwear and finishing touches for the season ahead.",
  empty: "New pieces are on their way. Check back soon.",
};

export const search = {
  eyebrow: "Search",
  title: "Search",
  resultsTitle: "Results for",
  label: "Search products",
  placeholder: "Search bags, shoes, colours…",
  sort: "Best match",
  empty: "Nothing matches your search. Try a colour, a material or a category.",
  browse: "Browse the collections",
  suggestions: { eyebrow: "Need inspiration?", title: "New arrivals" },
};

export const authCopy = {
  eyebrow: "Your account",
  signIn: {
    title: "Sign in",
    intro: "Sign in to see your account.",
    submit: "Sign in",
    pending: "Signing in…",
    switchPrompt: "New to Atelier?",
    switchLink: "Create an account",
  },
  signUp: {
    title: "Create an account",
    intro: "Create an account to keep your details in one place.",
    submit: "Create account",
    pending: "Creating account…",
    passwordHint: "At least 8 characters.",
    switchPrompt: "Already have an account?",
    switchLink: "Sign in",
  },
  account: {
    title: "My account",
    overview: "Overview",
    details: "Account details",
    detailsIntro: "Your name is how we greet you. Your email is how you sign in.",
    editDetails: "Edit details",
    save: "Save changes",
    saving: "Saving…",
    emailNote: "Email changes aren't available yet.",
    signOut: "Sign out",
    admin: "Admin",
    adminBody: "You have admin access to manage the store.",
    goToAdmin: "Go to admin",
    shop: { title: "Continue shopping", body: "The latest pieces from the atelier.", link: "Shop new arrivals" },
  },
  admin: { title: "Admin", overview: "Overview", backToStore: "View the store" },
};

export const bagCopy = {
  eyebrow: "Shopping bag",
  title: "Your bag",
  empty: "Your bag is empty.",
  emptyLink: "Shop new arrivals",
  summary: "Summary",
  subtotal: "Subtotal",
  shipping: "Shipping",
  shippingValue: "Complimentary",
  later: "No tax or shipping charges. Payments use a test provider: no real money moves.",
  continue: "Continue shopping",
  remove: "Remove",
  quantity: "Quantity",
  reduced: (stock: number) => `Only ${stock} left, so we've updated your quantity.`,
  soldOut: "This piece has sold out. It isn't included in your subtotal.",
  add: "Add to bag",
  adding: "Adding…",
  added: "Added to bag",
  view: "View bag",
};

export const checkoutCopy = {
  checkout: "Checkout",
  starting: "Starting checkout…",
  signInToCheckout: "Sign in to check out",
  reviewBag: "Update the pieces marked above to continue.",
  cancelled: "Checkout cancelled. Nothing was charged and your bag is just as you left it.",
  order: {
    eyebrow: "Order",
    paidTitle: "Thank you",
    paidIntro: "Your order is confirmed.",
    pendingTitle: "Confirming your payment",
    pendingIntro: "This usually takes a few seconds. Please don't pay again.",
    closedTitle: "Payment didn't go through",
    closedIntro: "Nothing was charged. Your pieces are back in stock for you to try again.",
    failedIntro: "We couldn't confirm this payment. Our client services team will be in touch.",
    backToBag: "Back to your bag",
    continue: "Continue shopping",
    items: "Items",
    total: "Total",
  },
};

export const categoryCollection = {
  eyebrow: "Shop by category",
  empty: "Nothing in this category right now. New pieces arrive often.",
  more: { eyebrow: "Continue browsing", title: "New elsewhere" },
};

export const spotlight = {
  eyebrow: "In focus",
  productSlug: "soft-pouch",
  cta: "Shop the pouch",
  secondary: { label: "View all handbags", href: categoryHref("handbags") },
};

export const services = [
  { title: "Complimentary shipping", body: "On every order, with tracked delivery." },
  { title: "Returns within 30 days", body: "Free collection from your door." },
  { title: "Signature packaging", body: "Every piece arrives gift-ready." },
  { title: "Client advisors", body: "Styling advice by phone or chat." },
];

export const shippingAndReturns = [
  "Complimentary tracked shipping on every order, delivered in 2–4 business days.",
  "Free returns within 30 days. Book a collection from your account or contact a client advisor.",
  "Every piece arrives in signature packaging, ready to give.",
];

export const menuLinks = [
  { label: "New In", href: NEW_ARRIVALS_HREF },
  { label: "Women", href: "/collections/women" },
  { label: "Men", href: "/collections/men" },
  { label: "Handbags", href: categoryHref("handbags") },
  { label: "Shoes", href: categoryHref("shoes") },
  { label: "Accessories", href: categoryHref("accessories") },
  { label: "Fragrance", href: categoryHref("fragrance") },
];

export const footerLinks = [
  {
    title: "Client services",
    links: [
      { label: "Contact us", href: "/contact" },
      { label: "Shipping", href: "/help/shipping" },
      { label: "Returns", href: "/help/returns" },
      { label: "FAQ", href: "/help" },
    ],
  },
  {
    title: "The house",
    links: [
      { label: "About Atelier", href: "/about" },
      { label: "Craftsmanship", href: "/craft" },
      { label: "Sustainability", href: "/sustainability" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/legal/privacy" },
      { label: "Terms of sale", href: "/legal/terms" },
      { label: "Cookie settings", href: "/legal/cookies" },
      { label: "Accessibility", href: "/legal/accessibility" },
    ],
  },
];
