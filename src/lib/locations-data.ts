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
    directionsHref: 'https://maps.google.com/?q=17.3694,78.5247',
    nearbyCatchmentSlugs: ['kukatpally'],
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
      'Ameerpet, Hyderabad – 500038',
    ],
    mapEmbed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3200.84840352847!2d78.44696155635079!3d17.43712331254024!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9127c03edcaf%3A0x8415d2ae07b161f8!2sCoss%20Cloud%20Solutions%20-%20Data%20Science%20%7C%20Digital%20Marketing%20%7C%20Cyber%20Security%20Course%20%7C%20Software%20Training%20Institute%20in%20Ameerpet!5e0!3m2!1sen!2sin!4v1779166650074!5m2!1sen!2sin',
    directionsHref: 'https://maps.google.com/?q=17.4375,78.4483',
    nearbyCatchmentSlugs: ['kukatpally', 'madhapur-hitec-city'],
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
