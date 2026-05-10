import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChartSpline,
  GraduationCap,
  LayoutPanelTop,
  MessageCircleQuestion,
  MessagesSquare,
  Sparkles,
  Users,
} from "lucide-react";

const featureCards = [
  {
    title: "Course + Section Management",
    description:
      "Create courses once, split them by section, and keep every class space organized for each semester.",
    icon: GraduationCap,
    accent: "from-[#FCA5D8] to-[#FD64A4]",
  },
  {
    title: "Live Classroom Boards",
    description:
      "Open a board during class so students can post questions in real time while you guide the lesson.",
    icon: LayoutPanelTop,
    accent: "from-[#8F7CFF] to-[#513FDF]",
  },
  {
    title: "Question Flow That Feels Natural",
    description:
      "Collect, answer, and revisit classroom questions in one place without losing the pace of teaching.",
    icon: MessageCircleQuestion,
    accent: "from-[#FFB86C] to-[#FF8C61]",
  },
  {
    title: "Participation Signals",
    description:
      "Track who is active in each section and spot quieter learners who may need extra support.",
    icon: Users,
    accent: "from-[#94E4D3] to-[#56C9C0]",
  },
  {
    title: "Activity Timeline",
    description:
      "Review what happened in class with a clean timeline of posts, replies, and instructor actions.",
    icon: ChartSpline,
    accent: "from-[#C7A7FF] to-[#9A74F9]",
  },
  {
    title: "Playful Academic Experience",
    description:
      "Designed to feel welcoming, focused, and lightweight on both desktop and mobile screens.",
    icon: Sparkles,
    accent: "from-[#FFD8F1] to-[#F7A8CD]",
  },
];

const steps = [
  {
    title: "Create your course",
    description:
      "Professors set up a subject, define course details, and separate students into sections.",
  },
  {
    title: "Open a board in class",
    description:
      "When the lesson starts, open the board for the active section and invite students to ask.",
  },
  {
    title: "Respond and guide discussion",
    description:
      "Answer questions, highlight useful prompts, and keep the class interaction visible to everyone.",
  },
  {
    title: "Review participation later",
    description:
      "After class, check the timeline and participation patterns to understand engagement by section.",
  },
];

const professorBenefits = [
  "Create multiple courses and manage sections without mixing classroom activity together.",
  "Keep the live question board focused on the current class session.",
  "Follow section-level participation to support more informed teaching decisions.",
];

const studentBenefits = [
  "Ask questions during class in a space that feels quick, clear, and less intimidating.",
  "See answers and follow-ups in one board instead of losing context across chat threads.",
  "Stay connected to class activity even when learning from a mobile device.",
];

const timelinePreview = [
  {
    time: "09:00",
    title: "Board opened for CS232 Section 1",
    detail: "Professor Nicha started the interaction board for today's data modeling class.",
    tag: "Live",
    tagClass: "bg-[#FCE7F3] text-[#BE185D]",
  },
  {
    time: "09:07",
    title: "Student question submitted",
    detail: "“Can we compare ER diagrams and relational schema with one example?”",
    tag: "Question",
    tagClass: "bg-[#EDE9FE] text-[#6D28D9]",
  },
  {
    time: "09:10",
    title: "Professor replied",
    detail: "Response posted and pinned so the whole section can refer back during the lesson.",
    tag: "Answer",
    tagClass: "bg-[#DBEAFE] text-[#1D4ED8]",
  },
  {
    time: "09:18",
    title: "Participation updated",
    detail: "Section 1 reached 82% active participation across questions, votes, and replies.",
    tag: "Insight",
    tagClass: "bg-[#DCFCE7] text-[#15803D]",
  },
];

export default function PublicLandingPage() {
  return (
    <main className="relative overflow-hidden bg-[#FFF9FE] text-[#221B44]">
      <div className="absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(circle_at_top_left,_rgba(129,102,255,0.18),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(253,100,164,0.18),_transparent_32%),linear-gradient(180deg,_#FFF6FD_0%,_#FFF9FE_48%,_#FFFFFF_100%)]" />
      <div className="absolute left-[-80px] top-24 -z-10 h-56 w-56 rounded-full bg-[#DCCBFF]/50 blur-3xl" />
      <div className="absolute right-[-60px] top-52 -z-10 h-56 w-56 rounded-full bg-[#FFC3E0]/50 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="sticky top-0 z-20 pt-4">
          <div className="flex items-center justify-between rounded-full border border-white/70 bg-white/80 px-4 py-3 shadow-[0_12px_40px_rgba(124,84,214,0.12)] backdrop-blur md:px-6">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo/logo.png"
                alt="AskAdemy"
                width={124}
                height={56}
                priority
                className="h-auto w-[110px] sm:w-[124px]"
              />
              <span className="hidden rounded-full bg-[#F8EEFF] px-3 py-1 text-[11px] tracking-[0.18em] text-[#8B5CF6] sm:inline-block">
                SMART CLASSROOM
              </span>
            </Link>

            <div className="hidden items-center gap-6 text-sm text-[#5B517D] lg:flex">
              <a href="#features" className="transition hover:text-[#513FDF]">
                Features
              </a>
              <a href="#how-it-works" className="transition hover:text-[#513FDF]">
                How It Works
              </a>
              <a href="#professors" className="transition hover:text-[#513FDF]">
                Professors
              </a>
              <a href="#students" className="transition hover:text-[#513FDF]">
                Students
              </a>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="rounded-full border border-[#E8DDFB] bg-white px-4 py-2 text-sm text-[#5D4A91] transition hover:border-[#C7B4F9] hover:bg-[#FBF7FF] sm:px-5"
              >
                Login
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#513FDF] to-[#FD64A4] px-4 py-2 text-sm text-white shadow-[0_12px_30px_rgba(118,79,223,0.28)] transition hover:brightness-105 sm:px-5"
              >
                Get Started
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </nav>

        <section className="grid gap-12 px-1 pb-20 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-28 lg:pt-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ECDDFB] bg-white px-4 py-2 text-sm text-[#8C63D9] shadow-[0_10px_30px_rgba(135,102,214,0.08)]">
              <Sparkles size={16} />
              AskAdemy | Smart Classroom Interaction Platform
            </div>

            <h1 className="mt-6 text-4xl leading-tight text-[#2A1E58] sm:text-5xl lg:text-6xl">
              Make every classroom question feel seen, answered, and useful.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-8 text-[#655B86] sm:text-lg">
              AskAdemy helps professors create courses, split sections, open live
              boards during class, respond to student questions, and review
              participation through a clear activity timeline.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#513FDF] to-[#FD64A4] px-6 py-3 text-base text-white shadow-[0_16px_34px_rgba(118,79,223,0.28)] transition hover:translate-y-[-1px] hover:brightness-105"
              >
                Login / Get Started
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/public"
                className="inline-flex items-center justify-center rounded-full border border-[#E8DDFB] bg-white px-6 py-3 text-base text-[#5D4A91] transition hover:bg-[#FBF7FF]"
              >
                Explore Public Page
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-[0_18px_45px_rgba(157,117,231,0.10)]">
                <p className="text-2xl text-[#513FDF]">Course</p>
                <p className="mt-1 text-sm text-[#6C648C]">
                  Build subjects and manage sections cleanly
                </p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-[0_18px_45px_rgba(157,117,231,0.10)]">
                <p className="text-2xl text-[#FD64A4]">Board</p>
                <p className="mt-1 text-sm text-[#6C648C]">
                  Run live classroom interaction in one place
                </p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-[0_18px_45px_rgba(157,117,231,0.10)]">
                <p className="text-2xl text-[#8B5CF6]">Timeline</p>
                <p className="mt-1 text-sm text-[#6C648C]">
                  Review engagement and participation later
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-8 top-6 hidden h-24 w-24 rounded-full bg-[#FFD1E6]/60 blur-2xl md:block" />
            <div className="absolute bottom-10 right-0 hidden h-24 w-24 rounded-full bg-[#D7CBFF]/70 blur-2xl md:block" />

            <div className="relative rounded-[36px] border border-white/70 bg-white/88 p-5 shadow-[0_25px_70px_rgba(141,104,227,0.18)] backdrop-blur">
              <div className="rounded-[28px] bg-[linear-gradient(160deg,#F7EEFF_0%,#FFF2F8_52%,#FFFFFF_100%)] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#8E7BB6]">Today&apos;s Session</p>
                    <h2 className="mt-1 text-2xl text-[#2F245A]">
                      CS232 | Section A
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#FCE7F3] px-3 py-1 text-xs text-[#BE185D]">
                    Board Open
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white p-4 shadow-[0_14px_30px_rgba(157,117,231,0.10)]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4EEFF] text-[#6D4BDF]">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-[#7A7198]">Active board</p>
                        <p className="text-lg text-[#2F245A]">Database Design Q&A</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[#6C648C]">
                      Students can ask about lecture concepts, examples, and in-class
                      exercises without losing the teaching flow.
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white p-4 shadow-[0_14px_30px_rgba(157,117,231,0.10)]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0F7] text-[#E1458C]">
                        <MessagesSquare size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-[#7A7198]">Live activity</p>
                        <p className="text-lg text-[#2F245A]">18 new questions</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl bg-[#FBF8FF] p-3 text-sm text-[#5A4F7C]">
                        “Can you explain weak entities with another example?”
                      </div>
                      <div className="rounded-2xl bg-[#FFF5FA] p-3 text-sm text-[#7A4265]">
                        Instructor reply pinned for the whole section
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl bg-[#2D2357] p-4 text-white shadow-[0_14px_30px_rgba(45,35,87,0.18)]">
                    <p className="text-sm text-white/70">Participation</p>
                    <p className="mt-2 text-3xl">82%</p>
                    <p className="mt-1 text-xs text-white/70">Section engagement</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 shadow-[0_14px_30px_rgba(157,117,231,0.10)]">
                    <p className="text-sm text-[#7A7198]">Answered</p>
                    <p className="mt-2 text-3xl text-[#513FDF]">14</p>
                    <p className="mt-1 text-xs text-[#8E84AD]">Questions resolved</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 shadow-[0_14px_30px_rgba(157,117,231,0.10)]">
                    <p className="text-sm text-[#7A7198]">Sections</p>
                    <p className="mt-2 text-3xl text-[#FD64A4]">4</p>
                    <p className="mt-1 text-xs text-[#8E84AD]">Managed per course</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="pb-20 lg:pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm tracking-[0.18em] text-[#9E7BE3]">FEATURES</p>
            <h2 className="mt-3 text-3xl text-[#2D2357] sm:text-4xl">
              Everything needed for a smarter classroom interaction loop
            </h2>
            <p className="mt-4 text-base leading-7 text-[#6B6288]">
              AskAdemy is designed around the real flow of a class: teaching,
              collecting questions, responding quickly, and reflecting on
              participation after the lesson.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="group rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-[0_18px_44px_rgba(157,117,231,0.12)] transition hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(157,117,231,0.18)]"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.accent} text-white shadow-lg`}
                  >
                    <Icon size={24} />
                  </div>
                  <h3 className="mt-5 text-2xl text-[#2D2357]">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#6B6288]">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className="pb-20 lg:pb-24">
          <div className="grid gap-8 rounded-[40px] bg-[linear-gradient(135deg,#F9F1FF_0%,#FFF4F9_55%,#FFFFFF_100%)] p-6 shadow-[0_24px_70px_rgba(141,104,227,0.12)] lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
            <div>
              <p className="text-sm tracking-[0.18em] text-[#9E7BE3]">
                HOW IT WORKS
              </p>
              <h2 className="mt-3 text-3xl text-[#2D2357] sm:text-4xl">
                A simple flow for live learning interaction
              </h2>
              <p className="mt-4 text-base leading-7 text-[#6B6288]">
                The experience stays approachable for both professors and
                students, while still giving structure to every board, section,
                and response.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_16px_40px_rgba(157,117,231,0.12)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F5EEFF] text-[#6D4BDF]">
                    {index + 1}
                  </div>
                  <h3 className="mt-4 text-xl text-[#2D2357]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#6B6288]">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 pb-20 lg:grid-cols-2 lg:pb-24">
          <article
            id="professors"
            className="rounded-[34px] border border-[#E6DCFA] bg-white p-6 shadow-[0_18px_50px_rgba(157,117,231,0.12)] sm:p-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F4EEFF] px-4 py-2 text-sm text-[#6D4BDF]">
              <GraduationCap size={16} />
              For Professors
            </div>
            <h2 className="mt-5 text-3xl text-[#2D2357]">
              Teach with more structure and better visibility
            </h2>
            <p className="mt-4 text-base leading-7 text-[#6B6288]">
              AskAdemy helps instructors run interactive classes without relying
              on scattered tools or informal chat threads.
            </p>
            <div className="mt-6 space-y-3">
              {professorBenefits.map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-2xl bg-[#FBF8FF] px-4 py-4 text-sm leading-7 text-[#5D557E]"
                >
                  {benefit}
                </div>
              ))}
            </div>
          </article>

          <article
            id="students"
            className="rounded-[34px] border border-[#F4D6E6] bg-[linear-gradient(180deg,#FFF8FC_0%,#FFFFFF_100%)] p-6 shadow-[0_18px_50px_rgba(253,100,164,0.10)] sm:p-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF0F7] px-4 py-2 text-sm text-[#D33D86]">
              <Users size={16} />
              For Students
            </div>
            <h2 className="mt-5 text-3xl text-[#2D2357]">
              Ask, learn, and stay part of the classroom conversation
            </h2>
            <p className="mt-4 text-base leading-7 text-[#6B6288]">
              Students get a friendlier path to participation, especially in
              classes where asking out loud can feel difficult.
            </p>
            <div className="mt-6 space-y-3">
              {studentBenefits.map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-2xl bg-white px-4 py-4 text-sm leading-7 text-[#5D557E] shadow-[0_12px_30px_rgba(253,100,164,0.08)]"
                >
                  {benefit}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="pb-20 lg:pb-24">
          <div className="grid gap-8 rounded-[40px] border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(141,104,227,0.12)] lg:grid-cols-[1fr_0.92fr] lg:p-10">
            <div>
              <p className="text-sm tracking-[0.18em] text-[#9E7BE3]">
                ACTIVITY TIMELINE PREVIEW
              </p>
              <h2 className="mt-3 text-3xl text-[#2D2357] sm:text-4xl">
                Replay the session after class with a clean event timeline
              </h2>
              <p className="mt-4 text-base leading-7 text-[#6B6288]">
                Boards should not disappear when the lecture ends. AskAdemy keeps
                a readable record of questions, answers, and engagement signals so
                each section is easier to review.
              </p>

              <div className="mt-8 space-y-4">
                {timelinePreview.map((item) => (
                  <div
                    key={`${item.time}-${item.title}`}
                    className="flex gap-4 rounded-[26px] bg-[#FCFAFF] p-4 shadow-[0_14px_30px_rgba(157,117,231,0.08)]"
                  >
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-[#F1EAFE] px-3 py-1 text-sm text-[#6D4BDF]">
                        {item.time}
                      </div>
                      <div className="mt-2 h-full w-px bg-[#E5DBFA]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg text-[#2D2357]">{item.title}</h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${item.tagClass}`}
                        >
                          {item.tag}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[#6B6288]">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] bg-[linear-gradient(180deg,#2E2357_0%,#533BC8_100%)] p-6 text-white shadow-[0_24px_60px_rgba(83,59,200,0.28)]">
              <p className="text-sm tracking-[0.16em] text-white/70">
                SECTION SNAPSHOT
              </p>
              <h3 className="mt-3 text-3xl">Section A Overview</h3>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[26px] bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm text-white/70">Questions asked</p>
                  <p className="mt-2 text-4xl">18</p>
                </div>
                <div className="rounded-[26px] bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm text-white/70">Replies posted</p>
                  <p className="mt-2 text-4xl">14</p>
                </div>
                <div className="rounded-[26px] bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm text-white/70">Active students</p>
                  <p className="mt-2 text-4xl">27</p>
                </div>
                <div className="rounded-[26px] bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm text-white/70">Participation rate</p>
                  <p className="mt-2 text-4xl">82%</p>
                </div>
              </div>

              <div className="mt-6 rounded-[26px] bg-white/10 p-5 backdrop-blur">
                <p className="text-sm text-white/70">Why this matters</p>
                <p className="mt-3 text-sm leading-7 text-white/90">
                  The platform turns classroom interaction into something visible,
                  reviewable, and useful for both teaching decisions and student
                  confidence.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-14">
          <div className="rounded-[40px] bg-[linear-gradient(135deg,#513FDF_0%,#7E5CF1_42%,#FD64A4_100%)] px-6 py-10 text-center text-white shadow-[0_26px_70px_rgba(118,79,223,0.26)] sm:px-10">
            <p className="text-sm tracking-[0.18em] text-white/75">FINAL CTA</p>
            <h2 className="mt-3 text-3xl sm:text-4xl">
              Ready to bring more interaction into the classroom?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/85">
              Start with AskAdemy and give professors and students one shared
              space for meaningful in-class questions and responses.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base text-[#513FDF] transition hover:bg-[#F9F5FF]"
              >
                Login
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/35 bg-white/10 px-6 py-3 text-base text-white backdrop-blur transition hover:bg-white/20"
              >
                Get Started
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-[#F0E7FB] py-8 text-sm text-[#7A7198]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base text-[#2D2357]">AskAdemy</p>
              <p className="mt-1">Playful academic tools for smarter classroom interaction.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/public" className="transition hover:text-[#513FDF]">
                Public Page
              </Link>
              <Link href="/login" className="transition hover:text-[#513FDF]">
                Login
              </Link>
              <Link href="/register" className="transition hover:text-[#513FDF]">
                Register
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
