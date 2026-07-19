## Visual Style and Art Direction

Design the website as a **premium spatial operating system for personal digital services**, combining the calm elegance of visionOS, the precision of Linear, the minimalism of Tesla interfaces, the clarity of Raycast, and restrained futuristic HUD elements.

The result should feel like a real next-generation operating system rather than a traditional website, bookmark page, or generic admin dashboard.

All developer-facing instructions, code, component names, and documentation must remain in English. All visible interface content must be displayed in Simplified Chinese.

## Core Design Philosophy

The interface should communicate:

* Precision
* Calmness
* Intelligence
* Reliability
* Spatial depth
* Technical sophistication
* Premium craftsmanship

The website should feel futuristic without looking theatrical.

It should resemble a personal digital command center that a system engineer, AI researcher, or technical creator would confidently keep open on a large 4K display throughout the day.

Prioritize:

* Elegance over decoration
* Clarity over visual density
* Subtlety over spectacle
* Depth over flatness
* Purposeful motion over constant animation
* Usability over visual experimentation

Every visual element must serve a clear functional purpose.

## Overall Visual Identity

Use a dark, spatial, cinematic interface with layered translucent surfaces.

The page should feel as though multiple pieces of intelligent glass are floating in a deep digital environment.

The design should combine:

* visionOS-inspired spatial glass
* Linear-style layout precision
* Tesla-style restraint
* Nothing-inspired technical details
* Raycast-style command interactions
* Minimal futuristic monitoring interfaces
* Subtle spacecraft HUD geometry

Do not directly copy any existing product.

Translate these references into an original and cohesive visual system.

## Background Environment

Use a deep near-black background rather than pure flat black.

Suggested background foundation:

```css
background: #050607;
```

Create depth using several subtle layers:

* A soft radial glow behind the main dashboard content
* Very faint blue-gray ambient light
* A subtle technical grid
* Fine film grain or noise texture
* Large blurred gradient shapes moving extremely slowly
* Soft edge vignetting
* A faint spotlight following the active content area

The background must remain restrained and should never compete with the dashboard content.

Avoid:

* Bright stars
* Space illustrations
* Moving particle fields
* Matrix rain
* Animated code
* Large colorful gradient blobs
* Obvious gaming backgrounds

## Color System

Use a highly controlled color palette.

### Base Colors

```css
--background-primary: #050607;
--background-secondary: #090b0e;
--surface-solid: #101317;
--surface-elevated: rgba(18, 22, 27, 0.72);
--surface-soft: rgba(255, 255, 255, 0.045);
--surface-hover: rgba(255, 255, 255, 0.075);

--border-subtle: rgba(255, 255, 255, 0.075);
--border-visible: rgba(255, 255, 255, 0.12);
--border-highlight: rgba(255, 255, 255, 0.22);

--text-primary: #f5f7fa;
--text-secondary: #a5adb8;
--text-muted: #69727d;
```

### Main Accent

Use a restrained cool-blue accent:

```css
--accent-primary: #72a7ff;
--accent-soft: rgba(114, 167, 255, 0.16);
--accent-glow: rgba(114, 167, 255, 0.28);
```

The primary accent should be used only for:

* Active navigation
* Focus states
* Selected cards
* Interactive highlights
* Important health visualization
* Command palette selection

Do not use the accent color across every border, icon, and heading.

### Status Colors

Use status colors only when status information is being communicated.

```css
--status-healthy: #62d99c;
--status-warning: #f2b766;
--status-critical: #ff6b72;
--status-unknown: #87909b;
```

Status colors must remain slightly desaturated so they fit the premium visual system.

Never communicate status using color alone. Always combine color with a Chinese text label, icon, and clear shape.

## Glass Material System

Use glassmorphism carefully and realistically.

Cards should feel like layered optical materials rather than transparent rectangles with excessive blur.

Each glass panel should include:

* A semi-transparent dark surface
* Moderate background blur
* A thin translucent border
* A slightly brighter top edge
* A soft internal highlight
* A subtle shadow beneath the panel
* Very faint reflected ambient light
* Gentle depth separation from the background

Recommended material style:

```css
background: linear-gradient(
  145deg,
  rgba(255, 255, 255, 0.075),
  rgba(255, 255, 255, 0.025)
);

backdrop-filter: blur(24px) saturate(125%);
border: 1px solid rgba(255, 255, 255, 0.09);
box-shadow:
  0 20px 60px rgba(0, 0, 0, 0.36),
  inset 0 1px 0 rgba(255, 255, 255, 0.08);
```

Use different levels of glass depth:

* Level 1: Main page sections
* Level 2: Interactive cards
* Level 3: Floating menus, dialogs, and command palette
* Level 4: Active tooltips and notifications

Floating elements should become slightly clearer and brighter as their visual elevation increases.

Avoid applying the exact same blur, opacity, and border treatment to every component.

## Spatial Layout

The layout should feel spacious, structured, and intentional.

Use:

* A persistent left navigation rail on desktop
* A compact top status bar
* A large primary dashboard workspace
* Modular service cards
* A clear monitoring summary area
* A dedicated Emby route comparison module
* A restrained activity timeline
* Floating overlays for search, settings, and editing

Desktop layouts should use an adaptive grid rather than fixed-width columns.

Use a maximum content width that still feels appropriate on ultrawide and 4K monitors.

Large screens should not simply stretch all cards horizontally. Introduce controlled whitespace and visual grouping.

Suggested layout hierarchy:

1. Compact top system bar
2. Page title and overall health summary
3. Primary service navigation grid
4. Emby route comparison
5. Health and latency analytics
6. Activity and incident history

The service navigation area should remain the most immediately useful part of the page.

## Navigation Rail

Create a narrow, elegant sidebar inspired by modern operating-system launchers.

The sidebar should contain:

* Dashboard logo
* Main categories
* Favorite services
* Offline services
* Settings shortcut
* Collapse control

Use icons with concise Simplified Chinese labels.

The active navigation item should use:

* A softly illuminated background
* A narrow active indicator
* Slightly brighter text
* A subtle blue-white glow

Do not use large rectangular navigation buttons with heavy borders.

When collapsed, display icons only and reveal labels through tooltips.

## Header Design

The top header should feel like an operating-system status bar.

Include:

* Current section title
* Current date and time
* Auto-refresh state
* Overall service status
* Search trigger
* Notification center
* Settings access
* User avatar or personal identity mark

The header should remain visually lightweight.

Do not make it a large traditional website navigation bar.

Use small typography, precise spacing, and subtle separators.

## Typography

Use a clean modern sans-serif typeface that supports Simplified Chinese well.

Recommended font direction:

* Inter for Latin characters and numbers
* Noto Sans SC, Source Han Sans SC, or a system Chinese sans-serif for Chinese text

Use tabular numbers for:

* Latency
* Uptime
* Health scores
* Timestamps
* Percentages

Typography hierarchy:

* Large page titles: calm and spacious
* Section titles: compact and technical
* Service names: clear and prominent
* Metric values: precise and slightly larger
* Secondary metadata: muted and compact
* Technical values: use monospaced or tabular-number styling where appropriate

Avoid:

* Extremely bold headings
* Oversized marketing typography
* Futuristic display fonts
* Wide letter spacing on Chinese text
* Excessive uppercase English labels

## Service Card Design

Each service card should feel like a small intelligent control surface.

The card must include:

* Service icon
* Chinese display name
* Domain name
* Short Chinese description
* Current health state
* Health score
* Response latency
* Uptime
* Last checked time
* Favorite control
* Open-service action
* More-options menu

Use strong information hierarchy.

The primary service name and current state should be visible immediately.

Technical metadata should remain accessible without overwhelming the card.

### Card Structure

Recommended visual order:

1. Icon and service identity
2. Current status
3. Chinese description
4. Domain
5. Health metrics
6. Last checked time
7. Open action

Use thin separators or spacing rather than placing every metric inside its own box.

### Card Hover Behavior

On pointer hover:

* Lift the card by approximately 4 to 8 pixels
* Slightly brighten the border
* Increase glass clarity
* Reveal a soft light reflection
* Strengthen the shadow
* Move the open-service arrow slightly
* Reveal secondary controls smoothly

The card should not rotate aggressively or follow the pointer with exaggerated 3D motion.

Use only a very slight perspective response.

### Active Card Effect

When selected or focused:

* Add a controlled cool-blue edge highlight
* Increase internal contrast
* Display a clear keyboard focus ring
* Slightly enlarge the service icon background
* Keep all text stable and readable

## Icon System

Use simple line-based icons, preferably from Lucide.

Each service may use a subtle custom icon container.

Suggested icon choices:

* Personal website: UserRound or BriefcaseBusiness
* MoviePilot: Clapperboard or Film
* Emby Global: Play or MonitorPlay
* Emby China: RadioTower or Server
* File transfer: FolderUp or Send
* VPN management: ShieldCheck or Network

Icons should be primarily monochrome.

Use status colors only when the icon directly represents a current service state.

Do not use colorful application-logo tiles unless an actual official logo is intentionally provided.

## Health Visualization

The overall health score should be presented as a sophisticated status instrument.

Avoid a generic circular progress chart.

Create a layered health visualization with:

* A segmented radial ring
* A soft center glow
* A clear numeric percentage
* A Chinese state label
* Small surrounding service statistics
* Smooth transitions when the value changes

The component should feel inspired by precision instrumentation.

Keep the visual clean and readable.

Health charts should use:

* Thin lines
* Soft gradients
* Minimal grid lines
* Precise labels
* Muted inactive data
* Highlighted current values
* Smooth but restrained transitions

Do not use bright filled area charts occupying large portions of the page.

## Emby Route Comparison

Create a visually distinctive comparison panel for:

* Emby 海外线路
* Emby 中国线路

Present the two routes as parallel connection paths.

The panel may include:

* Two horizontal route tracks
* Animated latency indicators
* Current route health
* Availability percentage
* Average latency
* Last successful check
* Dynamic recommended route
* Current fastest route

Use subtle network-line animation to suggest live data movement.

The animation must remain slow and low contrast.

The recommended route may receive:

* A slightly stronger outline
* A small Chinese recommendation badge
* A brighter latency value
* A subtle directional indicator

Do not permanently mark one route as superior. The recommendation must respond to current health and latency data.

## Command Palette

The command palette should be one of the strongest visual experiences on the website.

When opened with `Ctrl + K` or `Command + K`:

* Dim the background slightly
* Increase background blur
* Display a centered floating glass panel
* Animate it using a soft spring transition
* Place focus immediately in the search input
* Show Chinese commands and service results
* Support full keyboard navigation

The palette should feel similar to an operating-system command interface.

Use:

* Large search input
* Clear result groups
* Service icons
* Keyboard shortcut hints
* Recent services
* Quick actions
* Search by domain and tag

Chinese placeholder:

`搜索服务、域名、分类或执行操作……`

Avoid turning the command palette into a large modal with excessive explanatory text.

## Micro-Interactions

Every animation should feel expensive, controlled, and physically believable.

Use:

* Soft spring motion
* Decelerating transitions
* Cross-fade and blur interpolation
* Small scale changes
* Gentle panel elevation
* Magnetic button response
* Smooth number transitions
* Animated status changes
* Subtle icon morphing
* Restrained progress movement

Suggested durations:

* Hover response: 120–180 ms
* Small panel transition: 180–260 ms
* Modal transition: 240–360 ms
* Page-section transition: 300–450 ms
* Background ambient motion: 20–60 seconds

Avoid:

* Flashing
* Rapid pulsing
* Bouncing icons
* Continuous card movement
* Dramatic zooming
* RGB lighting
* Fast rotating gauges
* Excessive parallax
* Large elastic animations

Only unhealthy or changing services may use a very subtle status pulse.

Healthy services should remain calm.

## Pointer Light Effect

Service cards may use a soft pointer-following highlight.

The effect should:

* Follow the pointer gradually
* Appear as a low-opacity radial reflection
* Remain within the card boundaries
* Disappear smoothly when the pointer leaves
* Never reduce text readability

Do not create a strong spotlight or rainbow reflection.

## Buttons

Use compact operating-system-style controls.

Primary buttons should use:

* A dark glass surface
* A restrained accent border
* White text
* A soft internal highlight
* A small icon

Secondary actions should use text buttons or subtle icon buttons.

Avoid:

* Large filled blue buttons everywhere
* Highly rounded pill buttons for every action
* Heavy drop shadows
* Gradient-filled call-to-action buttons
* Marketing-style oversized controls

Use pill styling only for:

* Status badges
* Route labels
* Small filters
* Compact mode selectors

## Charts and Data Display

Charts should feel embedded into the interface rather than inserted from a generic charting library.

Customize charts to use:

* Transparent backgrounds
* Minimal axes
* Thin grid lines
* Compact Chinese labels
* Refined tooltips
* Smooth hover tracking
* Tabular numbers
* Restrained accent colors
* No visible chart-library defaults

Data panels should use subtle alignment guides and precise spacing.

Do not overload the page with too many charts.

Prioritize the most useful information:

* Service availability
* Current latency
* Recent latency trend
* Health history
* Active incidents

## Notifications and Activity

Notifications should appear as compact floating glass cards.

They should enter using:

* Slight vertical movement
* Soft opacity transition
* Small blur transition

Example Chinese messages:

* `Emby 中国线路已恢复`
* `MoviePilot 响应延迟升高`
* `VPN 订阅管理需要登录`
* `全部服务检测已完成`
* `网络连接已恢复`

Severity should be communicated through:

* Icon
* Chinese label
* Narrow accent line
* Restrained status color

Do not use large intrusive alert banners unless there is a critical dashboard-wide failure.

## Loading States

Use sophisticated skeleton states that preserve the exact final layout.

Loading effects should include:

* Subtle moving light
* Low-contrast shimmer
* Stable card dimensions
* No content jumping
* Clear Chinese status text when loading takes longer than expected

Use:

`正在检测服务状态……`

Avoid generic full-screen spinners.

## Responsive Behavior

### Desktop

On large screens:

* Keep the sidebar visible
* Use a multi-column service grid
* Place health summary and route comparison side by side when space permits
* Keep important metrics above the fold
* Use spacious but efficient padding

### Tablet

On tablets:

* Reduce the number of service columns
* Collapse secondary charts
* Preserve the command palette and route comparison
* Convert the sidebar into a compact rail or drawer

### Mobile

On mobile:

* Use a vertical layout
* Keep service cards compact
* Place service status and open action near the top
* Hide nonessential metadata behind expandable sections
* Use a bottom navigation or slide-out drawer
* Preserve touch targets of at least 44 pixels
* Avoid hover-dependent functionality
* Keep the command palette accessible through a prominent search button

The mobile interface must still feel premium and intentional, not like a compressed desktop layout.

## Visual Details

Add subtle high-end details such as:

* Thin illuminated top borders
* Faint material reflections
* Delicate section dividers
* Precision alignment lines
* Small animated status dots
* Quiet depth shadows
* Soft edge highlights
* Tabular numerical transitions
* Context-aware tooltips
* A barely visible grid behind monitoring sections

These details must remain understated.

The user should notice the overall craftsmanship before noticing individual visual effects.

## Forbidden Design Patterns

Do not create:

* A generic SaaS dashboard
* A Bootstrap-style admin panel
* A bright cyberpunk interface
* A hacker terminal
* A gaming launcher
* A cryptocurrency dashboard
* A colorful smart-home interface
* A large marketing landing page
* A page filled with glowing outlines
* Excessive nested cards
* Large empty hero sections
* Constant animated backgrounds
* Rainbow gradients
* Purple-and-blue gradient overload
* Green-on-black terminal styling
* Excessive glass blur
* Overly rounded components
* Dense tables as the primary interface
* Decorative charts without useful information

Do not use fake futuristic text, random coordinates, meaningless technical labels, or decorative data that has no connection to the actual services.

## Final Visual Goal

The final website should feel like a calm, intelligent, personal digital operating system.

It should combine:

* The spatial depth of visionOS
* The structural precision of Linear
* The restraint of Tesla interfaces
* The command efficiency of Raycast
* The technical elegance of Nothing
* The monitoring clarity of a modern infrastructure dashboard

The interface should look premium in screenshots, but it must also remain practical for everyday use.

It should feel visually impressive during the first visit and comfortable after being left open for many hours.

The experience should be:

* Dark
* Spatial
* Precise
* Calm
* Responsive
* Cinematic
* Technically credible
* Highly polished
* Distinctive without being distracting

Do not stop at a static visual mockup. Apply this visual language consistently to the full responsive interface, all service cards, navigation, charts, command palette, health indicators, loading states, notifications, dialogs, and settings panels.
