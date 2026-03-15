import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { ThemeProvider } from './context/ThemeContext';
import { trackEvent } from './utils/analytics';
import { api } from './services/api';
import Home from './Home';
import Services from './Services';
import ClientPortal from './ClientPortal';
import ResidentialLandingPage from './ResidentialLandingPage';
import IndustrialLandingPage from './IndustrialLandingPage';
import CommercialLandingPage from './CommercialLandingPage';
import RenovationLandingPage from './RenovationLandingPage';
import About from './About';
import Contact from './Contact';
import { pageMetaDefaults } from './utils/pageMeta';

vi.mock('./utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('./services/api', () => ({
  api: {
    getSetupStatus: vi.fn(),
  },
}));

vi.mock('react-google-recaptcha', async () => {
  const mockReact = await vi.importActual('react');
  const MockReCAPTCHA = mockReact.forwardRef((props, ref) => {
    const {
      sitekey,
      onChange,
      onExpired,
      onErrored,
      className,
    } = props;

    return (
      <div
        ref={ref}
        data-testid="recaptcha-mock"
        data-sitekey={sitekey}
        data-has-change-handler={Boolean(onChange)}
        data-has-expired-handler={Boolean(onExpired)}
        data-has-errored-handler={Boolean(onErrored)}
        className={className}
      >
        reCAPTCHA
      </div>
    );
  });
  MockReCAPTCHA.displayName = 'MockReCAPTCHA';
  return MockReCAPTCHA;
});

const memoryRouterFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

const installMatchMediaMock = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

beforeAll(() => {
  installMatchMediaMock();
  window.scrollTo = vi.fn();
});

beforeEach(() => {
  installMatchMediaMock();
  localStorage.clear();
  api.getSetupStatus.mockResolvedValue({ ok: true, requiresAdminSetup: false });
  document.documentElement.classList.remove('dark');
  document.title = pageMetaDefaults.title;
  document.head.innerHTML = `
    <meta name="description" content="${pageMetaDefaults.description}">
    <meta property="og:title" content="${pageMetaDefaults.title}">
    <meta property="og:description" content="${pageMetaDefaults.description}">
    <meta name="twitter:title" content="${pageMetaDefaults.title}">
    <meta name="twitter:description" content="${pageMetaDefaults.description}">
  `;
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      message: 'Project inquiry received successfully.',
    }),
  });
  vi.clearAllMocks();
});

const renderPublicRoute = (initialPath, element) => render(
  <ThemeProvider>
    <MemoryRouter initialEntries={[initialPath]} future={memoryRouterFutureFlags}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/client-portal" element={<ClientPortal />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signin" element={<div>Public Sign-In Screen</div>} />
        <Route path="/signup" element={<div>Sign-Up Screen</div>} />
        <Route path="/staff/signin" element={<div>Staff Sign-In Screen</div>} />
        <Route path="/projects" element={<div>Projects Route</div>} />
        <Route path="/solutions/industrial" element={<IndustrialLandingPage />} />
        <Route path="/solutions/commercial" element={<CommercialLandingPage />} />
        <Route path="/solutions/renovation" element={<RenovationLandingPage />} />
        <Route path="/solutions/residential" element={<ResidentialLandingPage />} />
        <Route path="*" element={element} />
      </Routes>
    </MemoryRouter>
  </ThemeProvider>
);

describe('public route rendering', () => {
  test('theme toggle persists dark mode state across rerenders', async () => {
    localStorage.setItem('theme', 'light');

    const { unmount } = renderPublicRoute('/', <Home />);

    const themeToggles = screen.getAllByRole('button', { name: /Switch to dark mode/i });
    await userEvent.click(themeToggles[0]);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    unmount();

    renderPublicRoute('/', <Home />);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    expect(localStorage.getItem('theme')).toBe('dark');
    expect(screen.getAllByRole('button', { name: /Switch to light mode/i }).length).toBeGreaterThan(0);
  });

  test('mobile navigation opens and closes cleanly on the home route', async () => {
    localStorage.setItem('theme', 'dark');
    window.innerWidth = 375;

    const { container } = renderPublicRoute('/', <Home />);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    const sidebar = container.querySelector('.sidebar');
    const overlay = container.querySelector('.sidebar-overlay');
    expect(sidebar).not.toHaveClass('active');

    await userEvent.click(screen.getByRole('button', { name: /Open navigation/i }));

    await waitFor(() => {
      expect(sidebar).toHaveClass('active');
      expect(overlay).toHaveClass('active');
      expect(document.body.style.overflow).toBe('hidden');
    });

    await userEvent.click(overlay);

    await waitFor(() => {
      expect(sidebar).not.toHaveClass('active');
      expect(overlay).not.toHaveClass('active');
      expect(document.body.style.overflow).toBe('');
    });
  });

  test('home route renders in dark mode without losing core CTA content', async () => {
    localStorage.setItem('theme', 'dark');

    renderPublicRoute('/', <Home />);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    expect(screen.getByRole('heading', {
      name: /Construction and industrial delivery with one clearer operating view/i,
    })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('link', { name: /Request a site assessment/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', {
      name: /Execution models shaped for four construction environments/i,
    })).toBeInTheDocument();
    expect(screen.getByRole('heading', {
      name: /Core service lines built to keep scopes moving from planning through handoff/i,
    })).toBeInTheDocument();
    expect(screen.getByRole('heading', {
      name: /Field coordination from one operating base/i,
    })).toBeInTheDocument();
  });

  test('home route keeps the brand wordmark beside the logo in the public header', async () => {
    renderPublicRoute('/', <Home />);

    const brandLink = screen.getByRole('link', { name: /Construction Operations Portal/i });
    expect(brandLink).toHaveClass('logo-link');

    const wordmark = within(brandLink).getByText('Construction').closest('.logo-wordmark');
    expect(wordmark).not.toBeNull();
    expect(wordmark).toHaveTextContent('ConstructionOps');
    expect(within(brandLink).getByText('Ops')).toHaveClass('logo-wordmark-accent');
  });

  test('public routes update page title and description metadata', async () => {
    renderPublicRoute('/', <Home />);
    expect(document.title).toBe('Construction Operations Portal | Field-Ready Construction Delivery');
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      'Construction and industrial delivery support with clearer project visibility, site coordination, and field-ready execution across active jobs.'
    );

    renderPublicRoute('/contact', <Contact />);
    expect(document.title).toBe('Contact | Construction Operations Portal');
    expect(document.head.querySelector('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Contact | Construction Operations Portal'
    );

    renderPublicRoute('/solutions/industrial', <IndustrialLandingPage />);
    expect(document.title).toBe('Industrial Delivery | Construction Operations Portal');
    expect(document.head.querySelector('meta[name="twitter:description"]')).toHaveAttribute(
      'content',
      'Industrial project execution for plant upgrades, fabrication support, and maintenance-driven scopes that need tighter coordination around live operations.'
    );
  });

  test('client portal route keeps the shared header balanced and marks the portal nav item active', async () => {
    localStorage.setItem('theme', 'dark');

    renderPublicRoute('/client-portal', <ClientPortal />);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    const brandLink = screen.getByRole('link', { name: /Construction Operations Portal/i });
    expect(within(brandLink).getByText('Construction')).toBeInTheDocument();
    expect(within(brandLink).getByText('Ops')).toBeInTheDocument();

    const headerBanner = screen.getByRole('banner');
    const portalLink = within(headerBanner).getByRole('link', { name: /Client Portal/i });
    expect(portalLink).toHaveAttribute('aria-current', 'page');
    expect(portalLink.closest('li')).toHaveClass('active');
    expect(within(headerBanner).getByRole('link', { name: /^Sign in$/i })).toHaveAttribute('href', '/signin');
    expect(within(headerBanner).getByRole('link', { name: /^Create account$/i })).toHaveAttribute('href', '/signup');

    expect(screen.getAllByRole('button', { name: /Switch to light mode/i }).length).toBeGreaterThan(0);
  });

  test('client portal route explains the hybrid portal value clearly', async () => {
    renderPublicRoute('/client-portal', <ClientPortal />);

    expect(screen.getByRole('heading', {
      name: /Client visibility built into the delivery workflow/i,
    })).toBeInTheDocument();
    expect(screen.getByRole('heading', {
      name: /What the portal already supports/i,
    })).toBeInTheDocument();
    expect(screen.getByText(/Clients use the public account path\. Staff use staff sign-in\./i)).toBeInTheDocument();
    expect(screen.getByText(/Admins control access, password recovery, and setup safeguards/i)).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('link', { name: /Request a site assessment/i })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('link', { name: /^Sign in$/i })).toHaveAttribute('href', '/signin');
    expect(within(screen.getByRole('main')).getByRole('link', { name: /^Create account$/i })).toHaveAttribute('href', '/signup');
    expect(within(screen.getByRole('main')).getByRole('link', { name: /^Staff sign-in$/i })).toHaveAttribute('href', '/staff/signin');
  });

  test('public routes surface the first-admin setup warning when the environment is not initialized', async () => {
    api.getSetupStatus.mockResolvedValueOnce({ ok: true, requiresAdminSetup: true });

    renderPublicRoute('/', <Home />);

    const setupNotice = await screen.findByRole('region', { name: 'Environment setup notice' });
    expect(within(setupNotice).getByText(/still needs its first admin account/i)).toBeInTheDocument();
    expect(within(setupNotice).getByRole('link', { name: /First admin setup/i })).toHaveAttribute('href', '/setup/admin');
    expect(within(setupNotice).getByRole('link', { name: /Staff sign-in/i })).toHaveAttribute('href', '/staff/signin');
  });

  test('services route renders in dark mode with the primary CTA and service copy', async () => {
    localStorage.setItem('theme', 'dark');

    renderPublicRoute('/services', <Services />);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    expect(screen.getByRole('heading', { name: 'Our Services' })).toBeInTheDocument();
    expect(screen.getByText(/General Contracting/i)).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('link', { name: /Request a site assessment/i })).toBeInTheDocument();
  });

  test('industrial landing route keeps the secondary CTA visible in light mode', async () => {
    renderPublicRoute('/solutions/industrial', <IndustrialLandingPage />);

    const secondaryCta = within(screen.getByRole('main')).getByRole('link', { name: /View projects/i });
    expect(secondaryCta).toHaveClass('btn-secondary');
    expect(secondaryCta.closest('.landing-hero-actions')).not.toBeNull();
  });

  test('commercial landing route keeps the shared landing workflow and footer module visible in dark mode', async () => {
    localStorage.setItem('theme', 'dark');

    renderPublicRoute('/solutions/commercial', <CommercialLandingPage />);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    expect(screen.getByRole('heading', {
      name: /Commercial construction support for teams that need coordination without chaos/i,
    })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /What this offer solves/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /How we execute/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', {
      name: /Field coordination from one operating base/i,
    })).toBeInTheDocument();
  });

  test('renovation landing route keeps the shared proof and footer CTA visible in light mode', async () => {
    renderPublicRoute('/solutions/renovation', <RenovationLandingPage />);

    expect(screen.getByRole('heading', {
      name: /Renovation support for projects that need tighter planning before the first wall opens up/i,
    })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Proof points/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', {
      name: /Need a delivery plan that holds up on site/i,
    })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Field coordination from one operating base/i })).toBeInTheDocument();
  });

  test('residential landing route sells owner visibility and portal-backed turnover, not just generic fit-out copy', async () => {
    renderPublicRoute('/solutions/residential', <ResidentialLandingPage />);

    expect(screen.getByRole('heading', {
      name: /Premium residential execution for renovations and fit-outs that need finish quality, owner clarity, and disciplined turnover/i,
    })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /How residential clients stay aligned/i })).toBeInTheDocument();
    expect(screen.getByText(/Selection and approval visibility/i)).toBeInTheDocument();
    expect(screen.getByText(/The portal keeps owner decisions, finish changes, and handoff files in one visible place/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Bright premium residential interior with a renovated living room and minimalist finishes/i)).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getAllByRole('link', { name: /Request a site assessment/i }).length).toBeGreaterThan(0);
  });

  test('contact route keeps its support cards and location module aligned in light mode', async () => {
    renderPublicRoute('/contact', <Contact />);

    expect(screen.getByRole('heading', { name: /Request a Site Assessment/i })).toBeInTheDocument();
    expect(screen.getByTestId('local-recaptcha-bypass')).toBeInTheDocument();
    expect(screen.getByText(/^Required$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enable Local Verification/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Complete Verification to Submit/i })).toBeDisabled();
    expect(screen.getByText(/Next-business-day follow-up\./i)).toBeInTheDocument();
    expect(screen.getByText(/Field coordination from one operating base/i)).toBeInTheDocument();
    expect(screen.queryByText(/portfolio-safe demo territory/i)).not.toBeInTheDocument();
  });

  test('contact route keeps submit gated until local verification is enabled', async () => {
    renderPublicRoute('/contact', <Contact />);

    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const messageInput = screen.getByLabelText(/Project Scope/i);
    const submitButton = screen.getByRole('button', { name: /Complete Verification to Submit/i });

    expect(submitButton).toBeDisabled();
    expect(nameInput).toHaveAttribute('aria-describedby', expect.stringContaining('name-help'));
    expect(emailInput).toHaveAttribute('aria-describedby', expect.stringContaining('email-help'));
    expect(messageInput).toHaveAttribute('aria-describedby', expect.stringContaining('message-help'));

    await userEvent.type(nameInput, 'Local Demo User');
    await userEvent.type(emailInput, 'local@example.com');
    await userEvent.type(messageInput, 'Need coordination support for a live-site upgrade.');

    expect(submitButton).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /Enable Local Verification/i }));

    await waitFor(() => {
      expect(screen.getByText(/Verified/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Local Verification Complete/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /^Request Site Assessment$/i })).toBeEnabled();
    });
  });

  test('contact route accepts prefilled client workspace follow-up context', async () => {
    renderPublicRoute(
      '/contact?projectType=Residential+Renovation&source=client-workspace&message=Need+follow-up+on+homeowner-closeout-package.pdf',
      <Contact />
    );

    expect(await screen.findByText(/prefilled from the client workspace/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Project Type/i)).toHaveValue('Residential Renovation');
    expect(screen.getByLabelText(/Project Scope/i)).toHaveValue('Need follow-up on homeowner-closeout-package.pdf');
  });

  test('contact route adjusts the prefill notice for client approval decisions', async () => {
    renderPublicRoute(
      '/contact?projectType=Commercial+Fit-Out&source=client-workspace&context=approval-approved&message=Approving+permit+set',
      <Contact />
    );

    expect(await screen.findByText(/approval was prefilled from the client workspace/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Project Type/i)).toHaveValue('Commercial Fit-Out');
    expect(screen.getByLabelText(/Project Scope/i)).toHaveValue('Approving permit set');
  });

  test('contact route exposes accessible validation state for required fields', async () => {
    renderPublicRoute('/contact', <Contact />);

    await userEvent.click(screen.getByRole('button', { name: /Enable Local Verification/i }));
    await userEvent.click(screen.getByRole('button', { name: /^Request Site Assessment$/i }));

    expect(screen.getByLabelText(/Full Name/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/Email/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/Project Scope/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  });

  test('contact route submits the local verification token through the local bypass flow', async () => {
    renderPublicRoute('/contact', <Contact />);

    await userEvent.type(screen.getByLabelText(/Full Name/i), 'Local Demo User');
    await userEvent.type(screen.getByLabelText(/Email/i), 'local@example.com');
    await userEvent.type(screen.getByLabelText(/Project Scope/i), 'Need coordination support for a live-site upgrade.');
    await userEvent.click(screen.getByRole('button', { name: /Enable Local Verification/i }));
    await userEvent.click(screen.getByRole('button', { name: /^Request Site Assessment$/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [requestUrl, requestOptions] = global.fetch.mock.calls[0];
    expect(requestUrl).toMatch(/\/api\/contact$/);
    expect(requestOptions.method).toBe('POST');
    expect(JSON.parse(requestOptions.body)).toMatchObject({
      name: 'Local Demo User',
      email: 'local@example.com',
      message: 'Need coordination support for a live-site upgrade.',
      recaptchaToken: 'local-dev-bypass-token',
    });

    await waitFor(() => {
      expect(screen.getByText(/Project inquiry received successfully/i)).toBeInTheDocument();
    });

    expect(trackEvent).toHaveBeenCalledWith(
      'contact_submit',
      expect.objectContaining({
        formId: 'site_assessment',
        projectType: 'not_specified',
      })
    );
    expect(trackEvent).toHaveBeenCalledWith(
      'contact_success',
      expect.objectContaining({
        formId: 'site_assessment',
        projectType: 'not_specified',
      })
    );
  });

  test('contact route keeps client workspace source metadata on submission and offers a return path', async () => {
    renderPublicRoute(
      '/contact?projectType=Industrial+Retrofit&source=client-workspace&context=follow-up-request&message=Need+status+on+permit+set',
      <Contact />
    );

    await userEvent.type(screen.getByLabelText(/Full Name/i), 'Client Follow Up');
    await userEvent.type(screen.getByLabelText(/Email/i), 'client.followup@example.com');
    await userEvent.click(screen.getByRole('button', { name: /Enable Local Verification/i }));
    await userEvent.click(screen.getByRole('button', { name: /^Request Site Assessment$/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [, requestOptions] = global.fetch.mock.calls[0];
    expect(JSON.parse(requestOptions.body)).toMatchObject({
      name: 'Client Follow Up',
      email: 'client.followup@example.com',
      projectType: 'Industrial Retrofit',
      message: 'Need status on permit set',
      source: 'client-workspace',
      context: 'follow-up-request',
      recaptchaToken: 'local-dev-bypass-token',
    });

    expect(await screen.findByRole('link', { name: /Return to client workspace/i })).toHaveAttribute('href', '/client/workspace');
  });

  test('contact route keeps the intake and location modules readable in dark mode', async () => {
    localStorage.setItem('theme', 'dark');

    renderPublicRoute('/contact', <Contact />);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    expect(screen.getByText(/^Quick first contact$/i)).toBeInTheDocument();
    expect(screen.getByText(/What happens next/i)).toBeInTheDocument();
    expect(screen.getByText(/Office and Coverage/i)).toBeInTheDocument();
    expect(screen.getByText(/core service area/i)).toBeInTheDocument();
  });

  test('services route keeps the shared footer CTA and standards visible in light mode', async () => {
    renderPublicRoute('/services', <Services />);

    expect(screen.getByRole('heading', { name: /Request Site Assessment/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Field coordination from one operating base/i })).toBeInTheDocument();
    expect(screen.getByText(/Quick first contact, clear next step\./i)).toBeInTheDocument();
  });

  test('public marketing routes avoid internal demo framing in core copy', async () => {
    renderPublicRoute('/', <Home />);
    expect(screen.queryByText(/These sample engagements are written for portfolio presentation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Portfolio-ready admin experience for future client demos/i)).not.toBeInTheDocument();

    renderPublicRoute('/services', <Services />);
    expect(screen.queryByText(/Portfolio-safe positioning/i)).not.toBeInTheDocument();

    renderPublicRoute('/about', <About />);
    expect(screen.queryByText(/This portfolio presentation frames the company/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Portfolio-safe story/i)).not.toBeInTheDocument();
  });

  test('home route sends the residential expertise card to the dedicated residential solution page', async () => {
    renderPublicRoute('/', <Home />);

    const residentialCard = screen.getByRole('link', { name: /Residential Projects/i });
    expect(residentialCard).toHaveAttribute('href', '/solutions/residential');
  });

  test('home route keeps the residential expertise card in the main sector grid', async () => {
    renderPublicRoute('/', <Home />);

    expect(screen.getByRole('link', { name: /Residential Projects/i })).toBeInTheDocument();
    expect(screen.getByText(/Premium Homes/i)).toBeInTheDocument();
    expect(screen.getByText(/cleaner owner updates and finish coordination/i)).toBeInTheDocument();
  });
});
