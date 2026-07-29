/**
 * src/lib/locations-data.ts
 *
 * Content config for /locations/{locality} landing pages. Two page types:
 *
 *   - "branch"    → Dilsukhnagar, Ameerpet: real NAP, map, LocalBusiness schema.
 *   - "catchment" → Kukatpally, Madhapur-HITEC City: no branch here, honest
 *                   commute guidance to the nearest real branch instead.
 *
 * Do not add a catchment area without genuinely different audience/commute
 * content — near-duplicate locality pages are a Google doorway-page risk.
 */

export type BranchKey = 'dilsukhnagar' | 'ameerpet'

/** Branch coordinates for per-locality geo meta tags (geo.position / ICBM). */
export const BRANCH_GEO: Record<BranchKey, { lat: string; lng: string }> = {
  dilsukhnagar: { lat: '17.367741', lng: '78.528543' },
  ameerpet: { lat: '17.436986', lng: '78.447128' },
}

export interface NearestBranchInfo {
  branchKey: BranchKey
  label: string
  travelTime: string
  route: string
  whyThisOne: string
}

export interface BranchLocalityConfig {
  type: 'branch'
  slug: string
  branchKey: BranchKey
  name: string
  metaTitle: string
  metaDescription: string
  keywords: string
  badge: string
  h1Pre: string
  h1Accent: string
  h1Post: string
  heroSubtitle: string
  intro: string[]
  directionsHeading: string
  directionsBody: string[]
  addressLines: string[]
  mapEmbed: string
  directionsHref: string
  nearbyCatchmentSlugs: string[]
  /** Owner-confirmed count for the hero stat tile ("N+ STUDENTS TRAINED").
   *  When unset, the page falls back to reviewCount labelled "GOOGLE REVIEWS". */
  studentsTrained?: number
}

export interface CatchmentLocalityConfig {
  type: 'catchment'
  slug: string
  name: string
  metaTitle: string
  metaDescription: string
  keywords: string
  badge: string
  h1Pre: string
  h1Accent: string
  h1Post: string
  heroSubtitle: string
  intro: string[]
  audienceHeading: string
  audienceBody: string[]
  /** Optional second content section for a catchment page covering more than
   *  one distinct sub-area (e.g. Madhapur vs. HITEC City) that shouldn't be
   *  flattened into one generic paragraph. */
  secondaryHeading?: string
  secondaryBody?: string[]
  nearestBranches: NearestBranchInfo[]
  onlineNote: string
  areasCovered: string[]
}

export type LocalityConfig = BranchLocalityConfig | CatchmentLocalityConfig

export const LOCALITIES: LocalityConfig[] = [
  /* ───────────────────────── Dilsukhnagar (branch) ───────────────────────── */
  {
    type: 'branch',
    slug: 'dilsukhnagar',
    branchKey: 'dilsukhnagar',
    name: 'Dilsukhnagar',
    metaTitle: 'IT Training Institute in Dilsukhnagar, Hyderabad',
    metaDescription:
      'Coss Cloud Solutions Dilsukhnagar branch — classroom IT training in Cloud, DevOps, Data Science & more. 5 mins from Dilsukhnagar Metro. Free demo class, 100% placement support.',
    keywords: 'IT training institute Dilsukhnagar, software training Dilsukhnagar Hyderabad, Coss Cloud Solutions Dilsukhnagar, computer courses near Dilsukhnagar metro',
    badge: 'DILSUKHNAGAR BRANCH — LB NAGAR SIDE OF HYDERABAD',
    h1Pre: 'IT Training Institute in ',
    h1Accent: 'Dilsukhnagar',
    h1Post: ', Hyderabad',
    heroSubtitle:
      'Our original Dilsukhnagar centre serves LB Nagar, Kothapet, Malakpet and the whole east/south Hyderabad IT-training belt — classroom batches, real labs, and counsellors on site seven days a week.',
    intro: [
      'Coss Cloud Solutions opened in Dilsukhnagar first, and it remains our flagship classroom centre for students coming from LB Nagar, Kothapet, Malakpet, Nagole, Uppal, Vanasthalipuram and Saidabad. If you\'re based in south or east Hyderabad, this branch is almost certainly your shortest commute for classroom training.',
      'The centre runs the same instructor-led curriculum as our Ameerpet branch — Cloud Computing, DevOps, Data Science, Cyber Security and more — with hands-on labs, mock interviews and placement support built into every batch.',
    ],
    directionsHeading: 'Getting Here',
    directionsBody: [
      'Dilsukhnagar Metro Station (Red Line, Miyapur–LB Nagar) is about a 5-minute walk from the centre — take the exit toward Kamala Nagar / Srinagar Colony.',
      'By road, we\'re just off the Dilsukhnagar main junction, close to the Chaitanyapuri and Kothapet bus stops — most LB Nagar-bound and Uppal-bound city buses stop within walking distance.',
      'Landmark directions: above Bank of Maharashtra in Srinagar Colony, opposite Chai Vaai Cafe and beside Anjana Function Hall.',
    ],
    addressLines: [
      'Flat No. 109, C.B Eastern Homes,',
      'Above Bank of Maharashtra, Srinagar Colony,',
      'Opposite Chai Vaai Cafe, Beside Anjana Function Hall,',
      'Dilsukhnagar, Hyderabad – 500060',
    ],
    mapEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3807.916716367894!2d78.5285426!3d17.3677401!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb98ec55555555%3A0xdd694f49845605aa!2sComplete%20Open%20Source%20Solutions%20(COSS)!5e0!3m2!1sen!2sin!4v1779166538650!5m2!1sen!2sin',
    directionsHref: 'https://maps.google.com/?q=17.367741,78.528543',
    nearbyCatchmentSlugs: ['kukatpally'],
    studentsTrained: 3500,
  },

  /* ─────────────────────────── Ameerpet (branch) ─────────────────────────── */
  {
    type: 'branch',
    slug: 'ameerpet',
    branchKey: 'ameerpet',
    name: 'Ameerpet',
    metaTitle: 'IT Training Institute in Ameerpet, Hyderabad',
    metaDescription:
      'Coss Cloud Solutions Ameerpet branch — Hyderabad\'s IT-training hub. Classroom batches in Cloud, DevOps, Data Science & more, steps from Ameerpet Metro interchange. Free demo class.',
    keywords: 'IT training institute Ameerpet, software training institute Ameerpet Hyderabad, best training institute Ameerpet, Coss Cloud Solutions Ameerpet',
    badge: 'AMEERPET BRANCH — HYDERABAD\'S IT TRAINING HUB',
    h1Pre: 'IT Training Institute in ',
    h1Accent: 'Ameerpet',
    h1Post: ', Hyderabad',
    heroSubtitle:
      'Ameerpet is where Hyderabad comes to learn IT skills, and our branch sits right in the middle of it — a short walk from the Ameerpet Metro interchange, serving Punjagutta, SR Nagar, Begumpet, Somajiguda, Yousufguda, Erragadda and KPHB.',
    intro: [
      'Our Ameerpet centre is built for the volume and pace of Hyderabad\'s best-known training corridor. It\'s the natural choice if you\'re commuting from Punjagutta, SR Nagar, Begumpet, Somajiguda, Yousufguda, Erragadda or KPHB — and it\'s also the most metro-accessible of our two branches, since Ameerpet is where the Red and Blue metro lines meet.',
      'Because so many students travel here from across the city — including Kukatpally, Madhapur and HITEC City — this branch runs the widest batch schedule of the two centres, with weekday, weekend and evening options.',
    ],
    directionsHeading: 'Getting Here',
    directionsBody: [
      'Ameerpet Metro Station is the interchange for the Red Line (Miyapur–LB Nagar) and Blue Line (Raidurg–Nagole) — whichever line you\'re on, you don\'t need to change trains to reach it.',
      'From the station, the centre is a short walk toward Aditya Trade Center — look for Sree Swathi Ankur Building.',
      'By road, we\'re easily reached from SR Nagar and Punjagutta via the Ameerpet main road, with frequent city bus services stopping nearby.',
    ],
    addressLines: [
      '#502, Sree Swathi Ankur Building,',
      'Besides Aditya Trade Center,',
      'Ameerpet, Hyderabad – 500016',
    ],
    mapEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3200.84840352847!2d78.44696155635079!3d17.43712331254024!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9127c03edcaf%3A0x8415d2ae07b161f8!2sCoss%20Cloud%20Solutions%20-%20Data%20Science%20%7C%20Digital%20Marketing%20%7C%20Cyber%20Security%20Course%20%7C%20Software%20Training%20Institute%20in%20Ameerpet!5e0!3m2!1sen!2sin!4v1779166650074!5m2!1sen!2sin',
    directionsHref: 'https://maps.google.com/?q=17.436986,78.447128',
    nearbyCatchmentSlugs: ['kukatpally', 'madhapur-hitec-city'],
    studentsTrained: 1500,
  },

  /* ────────────────────────── Kukatpally (catchment) ─────────────────────── */
  {
    type: 'catchment',
    slug: 'kukatpally',
    name: 'Kukatpally',
    metaTitle: 'IT Training for Students in Kukatpally, Hyderabad',
    metaDescription:
      'Coss Cloud Solutions trains students and freshers from Kukatpally, KPHB and JNTU in Cloud, DevOps, Data Science & more — a direct Red Line ride to our Ameerpet branch, plus weekend & online batches.',
    keywords: 'IT training Kukatpally, software course for freshers Kukatpally, training institute near KPHB, JNTU students IT course, computer classes Kukatpally Hyderabad',
    badge: 'FOR STUDENTS & FRESHERS FROM KUKATPALLY, KPHB & JNTU',
    h1Pre: 'IT Training for Students in ',
    h1Accent: 'Kukatpally',
    h1Post: '',
    heroSubtitle:
      'We don\'t have a branch in Kukatpally — but a large share of our classroom batches are students commuting in from Kukatpally, KPHB and around JNTU, so here\'s exactly how to get to us and what works best for your schedule.',
    intro: [
      'Kukatpally, KPHB and the JNTU College area send us more students than almost any other part of the city — mostly final-year engineering students and recent graduates starting their first serious upskilling course. We want to be upfront: there is no Coss Cloud Solutions branch in Kukatpally itself.',
      'What we do have is a direct, single-line metro ride from Kukatpally to our Ameerpet branch, and batch timings built around a student\'s calendar — weekday mornings when college is light, weekends, and evenings, plus a full online track if commuting daily isn\'t practical during exam season or placement drives.',
    ],
    audienceHeading: 'Built Around a Student Schedule',
    audienceBody: [
      'If you\'re a final-year student or recent graduate, the biggest constraint usually isn\'t distance — it\'s your college and placement-drive calendar. Our Kukatpally-area students mostly pick weekend batches (so class doesn\'t clash with college) or the fully online track during peak semester weeks, switching to classroom sessions at Ameerpet once college winds down.',
      'Because JNTU and the Kukatpally colleges feed a lot of first-time job seekers into our Cloud Computing, DevOps and Data Analytics batches, our placement team is used to coaching students with zero prior internship experience — resume building and mock interviews are part of the course, not an extra.',
    ],
    nearestBranches: [
      {
        branchKey: 'ameerpet',
        label: 'Ameerpet Branch',
        travelTime: 'approx. 20–25 minutes',
        route: 'Direct on the Red Line (Kukatpally/KPHB Colony → Ameerpet) — no line change needed.',
        whyThisOne: 'Closest branch by metro, and where most Kukatpally-area batches actually run.',
      },
      {
        branchKey: 'dilsukhnagar',
        label: 'Dilsukhnagar Branch',
        travelTime: 'approx. 40–45 minutes',
        route: 'Also on the Red Line, several stops further past Ameerpet toward LB Nagar.',
        whyThisOne: 'Worth considering only if you\'re also travelling toward LB Nagar/Kothapet regularly.',
      },
    ],
    onlineNote:
      'Every classroom course we run at Ameerpet is also available as a live online batch with the same trainers and syllabus — a common choice for Kukatpally students during exam weeks.',
    areasCovered: ['Kukatpally', 'KPHB', 'JNTU College', 'Bachupally', 'Nizampet', 'Miyapur'],
  },

  /* ──────────────────── Madhapur & HITEC City (catchment) ────────────────── */
  {
    type: 'catchment',
    slug: 'madhapur-hitec-city',
    name: 'Madhapur & HITEC City',
    metaTitle: 'IT Upskilling for Working Professionals in Madhapur & HITEC City',
    metaDescription:
      'Coss Cloud Solutions trains working IT professionals from Madhapur, HITEC City & Gachibowli in Cloud, DevOps & Data Engineering — weekend batches, a direct Blue Line ride to Ameerpet, or fully online.',
    keywords: 'IT training Madhapur, upskilling course HITEC City, weekend IT course for working professionals Hyderabad, DevOps training near Gachibowli, cloud certification HITEC City',
    badge: 'FOR WORKING PROFESSIONALS IN MADHAPUR & HITEC CITY',
    h1Pre: 'IT Upskilling for Professionals in ',
    h1Accent: 'Madhapur & HITEC City',
    h1Post: '',
    heroSubtitle:
      'We don\'t run a branch inside HITEC City — but a steady stream of our weekend and evening batches are working professionals from Madhapur, HITEC City and Gachibowli upskilling around a full-time job. Here\'s how that actually works.',
    intro: [
      'Madhapur and HITEC City are effectively one tech corridor — home to most of the MNC and IT-park offices in Hyderabad — so we treat them as a single catchment area rather than force two near-identical pages on you. If you work at a company here and want to upskill in Cloud, DevOps, Data Engineering or a related track, this page is for you. To be clear: there is no Coss Cloud Solutions branch in Madhapur or HITEC City itself.',
      'What we do offer is a direct Blue Line metro ride to our Ameerpet branch with no line change, batch timings designed around a 9-to-6 job (weekends and evenings), and a fully online option with the same trainers for weeks when getting out of the office just isn\'t realistic.',
    ],
    audienceHeading: 'Built Around a Working Professional\'s Week',
    audienceBody: [
      'Most students we get from this corridor are 2–8 years into an IT career and upskilling for a specific reason — a cloud migration at work, a DevOps transition, a move into data engineering, or simply staying certifiable in a fast-moving stack. Weekend batches (Saturday–Sunday) are the most common choice, with a smaller evening-weekday track for people whose managers are flexible about a 6:30 pm start.',
      'Because this audience already has hands-on production experience, our trainers pitch these batches differently from our fresher-focused sessions elsewhere — less time on fundamentals, more time on real migration patterns, architecture trade-offs and certification-exam prep.',
    ],
    secondaryHeading: 'If You Work Inside HITEC City\'s Tech Parks',
    secondaryBody: [
      'HITEC City itself is a different audience from residential Madhapur — this is where the large MNC and IT-park campuses sit: Cyber Towers, Mindspace, Raheja IT Park, DLF Cyber City, Q-City and the Wipro Circle stretch toward Gachibowli. If your badge swipes into one of these, you\'re usually optimising for a tight window between a 6 pm wrap-up and a Saturday class, not a long commute.',
      'The metro makes this easy to plan around: HITEC City has its own Blue Line station, one stop past Madhapur, with entrances close to Mindspace and the Cyber Towers cluster — so the walk to the platform is often shorter than the walk across your own campus. From there it\'s a direct ride to Ameerpet with no line change, typically a few minutes longer than from Madhapur station.',
    ],
    nearestBranches: [
      {
        branchKey: 'ameerpet',
        label: 'Ameerpet Branch',
        travelTime: 'approx. 15–20 minutes',
        route: 'Direct on the Blue Line (HITEC City/Madhapur → Ameerpet) — no line change needed.',
        whyThisOne: 'Closest branch by metro, and where our working-professional weekend batches are concentrated.',
      },
      {
        branchKey: 'dilsukhnagar',
        label: 'Dilsukhnagar Branch',
        travelTime: 'approx. 45–50 minutes',
        route: 'Blue Line to Ameerpet, then change to the Red Line toward LB Nagar.',
        whyThisOne: 'Only worth it if Dilsukhnagar is genuinely more convenient for your commute home.',
      },
    ],
    onlineNote:
      'If a Saturday shift or on-call rotation gets in the way, every batch is also available live online — same curriculum, same trainer, so you don\'t lose a week.',
    areasCovered: ['Madhapur', 'HITEC City', 'Gachibowli', 'Kondapur', 'Jubilee Hills', 'Raidurg'],
  },
]

export function getLocalityBySlug(slug: string): LocalityConfig | undefined {
  return LOCALITIES.find((l) => l.slug === slug)
}

/* ─────────────────── Locality × Topic pages (Phase 2 Wave 1) ───────────────────
 *
 * A narrower tier beneath the locality hub pages above:
 * /locations/{locality}/{topic}. Each entry is genuinely bespoke content, not
 * a template with the locality name swapped in — two near-identical pages is
 * exactly the doorway-page pattern Phase 1 dismantled. This is a 2-page pilot
 * (Cloud Computing at Dilsukhnagar and Ameerpet); the shape supports the
 * remaining locality×topic combinations if the pilot performs.
 */

export type TopicKey = 'cloud-computing'

/** Topic → the Course.categorySlug values it covers. Deterministic,
 *  config-driven course matching — no runtime keyword heuristics. */
export const TOPIC_CATEGORY_SLUGS: Record<TopicKey, string[]> = {
  'cloud-computing': ['cloud-computing'],
}

export const TOPIC_LABELS: Record<TopicKey, string> = {
  'cloud-computing': 'Cloud Computing',
}

export interface LocalityTopicConfig {
  localitySlug: string
  branchKey: BranchKey
  topicKey: TopicKey
  /** URL segment for the topic — kept separate from topicKey in case a
   *  future topic needs a URL slug that differs from its internal key. */
  slug: string
  h1: string
  badge: string
  metaTitle: string
  metaDescription: string
  keywords: string
  intro: string[]
  whyThisBranch: string[]
  commuteNote: string
}

export const LOCALITY_TOPIC_PAGES: LocalityTopicConfig[] = [
  /* ───────────────── Dilsukhnagar × Cloud Computing ───────────────── */
  {
    localitySlug: 'dilsukhnagar',
    branchKey: 'dilsukhnagar',
    topicKey: 'cloud-computing',
    slug: 'cloud-computing',
    h1: 'Cloud Computing Training in Dilsukhnagar',
    badge: 'CLOUD COMPUTING BATCHES — DILSUKHNAGAR BRANCH',
    metaTitle: 'Cloud Computing Training in Dilsukhnagar, Hyderabad | AWS, Azure & GCP',
    metaDescription:
      'AWS, Azure and multi-cloud training at our Dilsukhnagar branch — evening weekday batches built for students and career-switchers from Kamala Nagar, Uppal, Saidabad and Karmanghat. Free demo class.',
    keywords: 'cloud computing course Dilsukhnagar, AWS training Dilsukhnagar, cloud certification Dilsukhnagar Hyderabad, evening cloud computing batch Hyderabad',
    intro: [
      'Dilsukhnagar sits in the middle of Hyderabad\'s residential east, and most of the people who walk into our cloud computing batches here aren\'t commuting from an office nearby — they\'re coming in from Kamala Nagar, Uppal, Saidabad and Karmanghat after a college day or a work shift somewhere else in the city. That changes how we schedule this course: fewer daytime slots, more evening weekday classes timed for after 6 pm.',
      'A lot of this branch\'s cloud computing intake is career-switchers rather than IT professionals topping up a skill — students finishing a mechanical, commerce or BSc degree who\'ve decided cloud is where the jobs are, alongside early-career engineers who want an AWS certification their resume doesn\'t yet have. We built the course around that: it starts from cloud fundamentals rather than assuming production experience, but every session is still hands-on inside the actual AWS console, not slides.',
      'Right now AWS Solutions Architect is the track running here, and it\'s consistently the most-requested certification path among Dilsukhnagar students — it\'s the credential recruiters in this part of the city ask for by name.',
    ],
    whyThisBranch: [
      'If you\'re already based in south or east Hyderabad, the case for training here over Ameerpet is mostly about not adding a cross-town commute onto an evening class — Kamala Nagar, Uppal and Saidabad are all a short hop from Dilsukhnagar, not from the Ameerpet side of the city.',
      'The evening batches here also run smaller than our Ameerpet cohorts, which means more one-on-one time at the console during labs, and our placement counsellors on this side of town are used to coaching first-time career-switchers specifically — resume building for someone with zero IT experience looks different from resume building for someone already three years into a tech job.',
    ],
    commuteNote:
      'Evening classes are timed for a 7 pm start, giving Kamala Nagar, Uppal and Saidabad students enough runway to leave work or college and get here comfortably. Dilsukhnagar Metro (Red Line) is a 5-minute walk from the centre, and Chaitanyapuri/Kothapet bus stops are within walking distance for anyone coming from Karmanghat or Vanasthalipuram.',
  },

  /* ────────────────────── Ameerpet × Cloud Computing ────────────────────── */
  {
    localitySlug: 'ameerpet',
    branchKey: 'ameerpet',
    topicKey: 'cloud-computing',
    slug: 'cloud-computing',
    h1: 'Cloud Computing Training in Ameerpet',
    badge: 'CLOUD COMPUTING BATCHES — AMEERPET, HYDERABAD\'S IT CORRIDOR',
    metaTitle: 'Cloud Computing Training in Ameerpet, Hyderabad | AWS, Azure & Multi-Cloud',
    metaDescription:
      'Multi-cloud, AWS and Azure training at our Ameerpet branch — steps from the metro interchange. Morning, evening and hybrid batches for working IT professionals. Free demo class.',
    keywords: 'cloud computing training Ameerpet, AWS certification Ameerpet, multi cloud training Hyderabad, Azure administrator course Ameerpet',
    intro: [
      'Ameerpet is where Hyderabad\'s working IT professionals already commute for training, so our cloud computing batches here run at a different pace than a fresher-focused branch. Being a short walk from the Ameerpet Metro interchange means the people filling these classrooms are mostly commuting straight from a job in Punjagutta, SR Nagar or Begumpet — not starting a first career, but adding or switching a cloud platform.',
      'It also shows up in what people are training for: Multi-Cloud Architecture is the busiest track at this branch, currently running two active batches, alongside AWS Cloud Practitioner, AWS Solutions Architect and Azure Administrator all running at once. That spread reflects the audience — working professionals who increasingly need to speak more than one cloud vendor rather than specialise in only one.',
      'Because this branch draws people already in a live IT job, our trainers pitch the material differently here — less time on "what is a VPC", more on real migration patterns, cost and architecture trade-offs, and exam-specific prep for whichever AWS or Azure certification a person is booked to sit.',
    ],
    whyThisBranch: [
      'Running five cloud tracks concurrently is only possible because Ameerpet is our highest-volume branch — it means a Multi-Cloud batch, an Azure Administrator batch and an AWS Solutions Architect batch can all be full at the same time, so you\'re rarely waiting on a minimum headcount to start.',
      'It\'s also the only branch where we run a hybrid cloud computing option alongside classroom and online — useful if your manager is fine with one weekly WFH day for class but you still want in-person lab time for the rest. And since Ameerpet is where the Red and Blue metro lines meet, it\'s genuinely the most convenient branch for professionals converging here from opposite sides of the city.',
    ],
    commuteNote:
      'Ameerpet Metro Station is the interchange for the Red Line (Miyapur–LB Nagar) and Blue Line (Raidurg–Nagole), so however you\'re travelling in, you won\'t need to change trains to reach it. Morning batches start early enough to leave time for a full office day afterward; evening batches are timed for professionals coming straight from work in Punjagutta, SR Nagar or Begumpet.',
  },
]

export function getLocalityTopicPage(localitySlug: string, topicSlug: string): LocalityTopicConfig | undefined {
  return LOCALITY_TOPIC_PAGES.find((p) => p.localitySlug === localitySlug && p.slug === topicSlug)
}
