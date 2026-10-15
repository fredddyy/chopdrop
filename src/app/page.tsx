import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import "./landing.css";

const FOOD_IMAGE =
  "https://images.unsplash.com/photo-1603496987674-79600a000f55?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900";
const FOOD_IMAGE_ALT =
  "https://images.unsplash.com/photo-1593787614839-9b93c8998f25?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900";
const FOOD_IMAGE_GROUP =
  "https://images.unsplash.com/photo-1638436684761-7e59f8a9072f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=900";

type IconName =
  | "bag"
  | "card"
  | "check"
  | "clock"
  | "copy"
  | "restaurant"
  | "truck"
  | "users";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    bag: (
      <>
        <path d="M6.5 8.5h11l-1 11h-9l-1-11Z" />
        <path d="M9.5 9V6.5a2.5 2.5 0 0 1 5 0V9" />
      </>
    ),
    card: (
      <>
        <rect x="3.5" y="6" width="17" height="12" rx="2" />
        <path d="M3.5 10h17M7 14h3" />
      </>
    ),
    check: <path d="m5 12 4.2 4L19 6.5" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </>
    ),
    copy: (
      <>
        <rect x="7" y="4" width="11" height="14" rx="2" />
        <path d="M7 7H5.5A1.5 1.5 0 0 0 4 8.5v10A1.5 1.5 0 0 0 5.5 20H14a1.5 1.5 0 0 0 1.5-1.5V18" />
      </>
    ),
    restaurant: (
      <>
        <path d="M5 4v7M8 4v7M5 8h3M6.5 11v9M15 4v16M15 4c3 2 3 7 0 9" />
      </>
    ),
    truck: (
      <>
        <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.3" />
        <path d="M3.5 19c.5-4 2.3-6 5.5-6s5 2 5.5 6M15 14c2.7.2 4.3 1.8 4.7 4.5" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    >
      {paths[name]}
    </svg>
  );
}

function Action({
  children,
  variant = "primary",
  href = "#cta",
}: {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "light";
  href?: string;
}) {
  return (
    <a className={`action action-${variant}`} href={href}>
      {children}
      <span aria-hidden="true">→</span>
    </a>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}

function PhoneMockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`phone ${compact ? "phone-compact" : ""}`}>
      <div className="phone-island" />
      <div className="phone-top">
        <span>9:41</span>
        <span className="signal">● ●</span>
      </div>
      <div className="phone-body">
        <div className="phone-greeting">Good morning, Ada</div>
        <div className="phone-title">What&apos;s for lunch?</div>
        <div className="restaurant-card">
          <div>
            <small>The Lunch Kitchen</small>
            <strong>
              Good food.
              <br />
              Zero wahala.
            </strong>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="A plate of rice and chicken" src={FOOD_IMAGE} />
        </div>
        <div className="phone-tabs">
          <span className="active">Popular</span>
          <span>Rice</span>
          <span>Swallow</span>
        </div>
        <div className="meal-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={FOOD_IMAGE_ALT} />
          <div>
            <strong>Smoky jollof &amp; beef</strong>
            <span>Freshly cooked today</span>
            <b>₦3,800</b>
          </div>
        </div>
        <div className="meal-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={FOOD_IMAGE} />
          <div>
            <strong>Fried rice &amp; chicken</strong>
            <span>With plantain</span>
            <b>₦4,200</b>
          </div>
        </div>
      </div>
      <div className="phone-home" />
    </div>
  );
}

function OrderPhone() {
  return (
    <div className="phone order-phone">
      <div className="phone-island" />
      <div className="phone-top">
        <span>9:41</span>
        <span className="signal">● ●</span>
      </div>
      <div className="order-screen">
        <div className="order-mini">Today&apos;s order</div>
        <div className="order-heading">Lunch is sorted.</div>
        <div className="success-icon">
          <Icon name="check" size={26} />
        </div>
        <strong>Paid &amp; confirmed</strong>
        <span>We&apos;ll see you at lunchtime</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="Rice and chicken order" src={FOOD_IMAGE} />
        <b>12:30 PM</b>
        <small>One batch. One smooth delivery.</small>
        <div className="collection-code">COLLECT WITH CODE · CD 028</div>
      </div>
      <div className="phone-home" />
    </div>
  );
}

function Step({
  icon,
  number,
  title,
  copy,
}: {
  icon: IconName;
  number: string;
  title: string;
  copy: string;
}) {
  return (
    <>
      <div className="step-top">
        <span>{number} /</span>
        <Icon name={icon} size={18} />
      </div>
      <h3>{title}</h3>
      <p>{copy}</p>
    </>
  );
}

const steps = [
  {
    icon: "card" as IconName,
    number: "01",
    title: "Everyone Picks Their Meal",
    copy: "Choose from the menu and pay online. No cash collection, no chasing.",
  },
  {
    icon: "restaurant" as IconName,
    number: "02",
    title: "Restaurants Cook to Order",
    copy: "Prepaid group orders go straight to the kitchen. No guesswork, no waste.",
  },
  {
    icon: "truck" as IconName,
    number: "03",
    title: "One Batch Arrives Together",
    copy: "Every meal reaches your location in one coordinated delivery.",
  },
  {
    icon: "copy" as IconName,
    number: "04",
    title: "Your Captain Distributes",
    copy: "Simple collection codes make handing out every meal quick and easy.",
  },
];

const audiences = [
  {
    className: "audience-cream",
    icon: "card" as IconName,
    title: "For Workers",
    copy: "Pick what you want. Pay on your phone. Collect at the set time. No queueing.",
    action: "Start Ordering",
  },
  {
    className: "audience-green",
    icon: "copy" as IconName,
    title: "For Captains",
    copy: "Bring your group together without chasing cash, orders, or restaurants.",
    action: "Become a Captain",
  },
  {
    className: "audience-coral",
    icon: "restaurant" as IconName,
    title: "For Restaurants",
    copy: "Get guaranteed prepaid group orders, cook exactly what is needed, and reduce waste.",
    action: "Partner With Us",
  },
];

export default function Home() {
  return (
    <div className="landing">
      <header className="nav container">
        <Logo size={28} variant="dark" />
        <nav aria-label="Main navigation">
          <a href="#how">How it works</a>
          <a href="#audiences">Who it&apos;s for</a>
          <a href="#about">About us</a>
        </nav>
        <div className="nav-actions">
          <a className="action action-outline nav-app-link" href="/menu">
            Use the App <span aria-hidden="true">→</span>
          </a>
          <Action href="#cta">Order on WhatsApp</Action>
        </div>
        <MobileNav />
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <Eyebrow>
                <span className="status-dot" /> Now serving Ikeja offices
              </Eyebrow>
              <h1>
                Meals for <span>Your Team,</span> <strong>Sorted.</strong>
              </h1>
              <p>
                Everyone picks what they want and pays for themselves. We batch
                the orders and deliver everything together—one smooth drop, zero
                stress.
              </p>
              <div className="button-row">
                <Action>Order on WhatsApp</Action>
                <Action variant="outline" href="#how">
                  See how it works
                </Action>
              </div>
              <div className="trust-row">
                <span>
                  <i>
                    <Icon name="card" size={15} />
                  </i>
                  <b>Pick &amp; pay individually</b>
                </span>
                <span>
                  <i>
                    <Icon name="truck" size={15} />
                  </i>
                  <b>Arrive together</b>
                </span>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-orbit" />
              <div className="hero-phone">
                <PhoneMockup />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="hero-food"
                alt="Freshly prepared rice and chicken"
                src={FOOD_IMAGE}
              />
              <div className="delivery-toast">
                <span className="toast-icon">
                  <Icon name="clock" size={18} />
                </span>
                <div>
                  <strong>12:30. Meals land.</strong>
                  <small>One drop. Right on time.</small>
                </div>
              </div>
              <div className="batch-badge">
                <strong>20–30</strong>
                <span>
                  meals
                  <br />
                  one drop
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Locations ── */}
        <div className="locations">
          <span>Currently serving select areas</span>
          <strong>
            Allen Avenue · Opebi · Computer Village · Alausa · Toyin Street
          </strong>
        </div>

        {/* ── Problem / Why Us ── */}
        <section className="problem section" id="about">
          <div className="container problem-grid">
            <div className="problem-visual">
              <div className="soft-circle" />
              <PhoneMockup compact />
              <div className="payment-toast">
                <span>
                  <Icon name="check" size={17} />
                </span>
                <div>
                  <strong>No chasing payments.</strong>
                  <small>Everyone pays upfront.</small>
                </div>
              </div>
            </div>
            <div className="problem-copy">
              <Eyebrow>Why groups choose us</Eyebrow>
              <h2>No More Food Chaos for Your Team</h2>
              <p>
                Group meals shouldn&apos;t mean collecting cash, fixing wrong
                orders, or wondering if there will be enough. With ChopDrop,
                everyone chooses and prepays for exactly what they want.
              </p>
              <p>
                We bring it all together in one scheduled delivery, ready to
                hand out with simple collection codes. Office lunch is just
                where we&apos;re starting.
              </p>
              <div className="stats">
                <div>
                  <strong>20–30</strong>
                  <span>Meals per drop</span>
                </div>
                <div>
                  <strong>1</strong>
                  <span>Group delivery</span>
                </div>
                <div>
                  <strong>100%</strong>
                  <span>Prepaid orders</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="how section" id="how">
          <div className="container">
            <div className="section-heading">
              <Eyebrow>Office lunch is where we begin</Eyebrow>
              <h2>
                How <strong>ChopDrop</strong> Works
              </h2>
              <p>
                Here&apos;s how one meal run comes together—from individual
                picks to one easy drop.
              </p>
            </div>
            <div className="steps-layout">
              <div className="step-card step-one">
                <Step {...steps[0]} />
              </div>
              <div className="step-card step-two">
                <Step {...steps[1]} />
              </div>
              <div className="how-phone">
                <OrderPhone />
              </div>
              <div className="step-card step-three">
                <Step {...steps[2]} />
              </div>
              <div className="step-card step-four">
                <Step {...steps[3]} />
              </div>
            </div>
            <p className="how-note">
              Office lunch today. Breakfasts, events, estates, and more
              tomorrow.
            </p>
          </div>
        </section>

        {/* ── Audiences ── */}
        <section className="audiences section" id="audiences">
          <div className="container">
            <div className="section-heading compact-heading">
              <Eyebrow>Our first ChopDrop community</Eyebrow>
              <h2>
                Built for <strong>Everyone Who Eats Together</strong>
              </h2>
              <p>
                Starting with the people who make great office meals happen.
              </p>
            </div>
            <div className="audience-grid">
              {audiences.map((audience, index) => (
                <article
                  className={`audience-card ${audience.className}`}
                  key={audience.title}
                >
                  <div className="audience-top">
                    <span className="audience-icon">
                      <Icon name={audience.icon} />
                    </span>
                    <b>0{index + 1}</b>
                  </div>
                  <h3>{audience.title}</h3>
                  <p>{audience.copy}</p>
                  <Action href="#cta">{audience.action}</Action>
                  <small>Let&apos;s talk on WhatsApp</small>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta" id="cta">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="cta-food cta-food-left"
            alt=""
            src={FOOD_IMAGE_GROUP}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="cta-food cta-food-right"
            alt=""
            src={FOOD_IMAGE_ALT}
          />
          <div className="container cta-inner">
            <span>Make mealtime your time</span>
            <h2>
              Ready to Eat <strong>Better Together?</strong>
            </h2>
            <p>
              Bring your group together with food everyone actually chose—no app
              download needed.
            </p>
            <div className="button-row centered">
              <Action>Order on WhatsApp</Action>
              <Action variant="light">Join Waitlist</Action>
            </div>
            <div className="notify">
              <label htmlFor="email">
                Get an email when ChopDrop reaches you.
              </label>
              <div>
                <input
                  id="email"
                  type="email"
                  placeholder="Your email address"
                />
                <button type="button">Notify me →</button>
              </div>
            </div>
            <small>App coming soon · WhatsApp ordering available now</small>
          </div>
        </section>
      </main>

      <footer>
        <div className="container footer-grid">
          <div className="footer-brand">
            <Logo size={28} variant="dark" />
            <p>Good food. Less wahala.</p>
          </div>
          <div>
            <strong>Product</strong>
            <a href="#how">How it works</a>
            <a href="#cta">Order on WhatsApp</a>
            <a href="#audiences">For captains</a>
          </div>
          <div>
            <strong>Company</strong>
            <a href="#about">About ChopDrop</a>
            <a href="#audiences">Restaurant partners</a>
            <a href="#cta">Get in touch</a>
          </div>
          <div>
            <strong>Legal</strong>
            <a href="#cta">Privacy policy</a>
            <a href="#cta">Terms of service</a>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 ChopDrop · Ikeja, Lagos</span>
          <span>Group ordering made simple.</span>
        </div>
      </footer>
    </div>
  );
}
