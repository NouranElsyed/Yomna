import React, { useEffect, useRef, useState } from "react";

// حطي هنا لينك الـ Web App بتاع Google Apps Script (شوفي google-sheet-setup.md).
// لو سيبتيه فاضي، الرسايل هتفضل مؤقتة في الصفحة بس.
const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbzEGo8Ur7BWxdAB3BIVoU9kbcOq0dDPOSvuX0L_3AQUCMVpuhM14ihanbADbhvc69Y2kw/exec";

/**
 * WeddingInvite
 * -------------
 * A wedding invitation as a single React component, fully styled with
 * Tailwind (no custom CSS), with the original animations (opening
 * screen, falling hearts, countdown).
 *
 * The opening/cover screen shows a "Save the Date" envelope illustration:
 * an envelope graphic (back + lace flap) behind a tilted couple photo,
 * with the envelope's front flap + wax seal layered on top so the
 * photo looks tucked inside the envelope. A faint castle illustration
 * sits behind the whole "Save the Date" section as a watermark.
 *
 * Required image assets (place in your /public folder):
 *   /envelope-background.webp  – full envelope (back flap + lace edge), sits BEHIND the photo
 *   /envelope-cover.webp       – front pocket flaps + wax seal, sits IN FRONT of the photo
 *   /flower2-decoration.webp   – floral accent, already used elsewhere in this component
 *   /castle-background.webp    – faint architectural watermark behind the Save the Date section
 *   /couple-photo.jpg          – the tilted photo shown peeking out of the envelope
 *
 * Usage:
 *   import WeddingInvite from "./WeddingInvitation";
 *   <WeddingInvite
 *     groomName="Ahmed"
 *     brideName="Yomna"
 *     weddingDateISO="2026-10-15T19:00:00"
 *     venueName="Royal Prince Hall"
 *     venueAddress="Nile Street, Cairo, Egypt"
 *     mapUrl="https://maps.google.com"
 *     couplePhoto="/couple-photo.jpg"
 *   />
 */

function buildCalendarWeeks(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  // Monday-first weekday index (0 = Mon ... 6 = Sun)
  const startOffset = (firstDay.getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function FloatingHearts() {
  const hearts = useRef(
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      symbol: Math.random() > 0.5 ? "♥" : "❤",
      size: 10 + Math.random() * 22,
      left: Math.random() * 100,
      drift: Math.random() * 60 - 30,
      duration: 8 + Math.random() * 10,
      delay: Math.random() * 10,
    })),
  ).current;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {hearts.map((h) => (
        <div
          key={h.id}
          className="absolute top-[-10%] animate-fall-heart text-goldlight opacity-[0.35] drop-shadow-[0_0_4px_rgba(212,175,122,0.3)]"
          style={{
            fontSize: h.size,
            left: `${h.left}%`,
            "--drift": `${h.drift}px`,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
          }}
        >
          {h.symbol}
        </div>
      ))}
    </div>
  );
}

function BurstPetals({ go }) {
  const symbols = ["✦", "❀", "♥", "✿", "❁"];
  const petals = useRef(
    Array.from({ length: 18 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.3;
      const dist = 140 + Math.random() * 180;
      return {
        id: i,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        bx: Math.cos(angle) * dist,
        by: Math.sin(angle) * dist,
        br: Math.random() * 360,
        size: 16 + Math.random() * 16,
      };
    }),
  ).current;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center">
      {petals.map((p) => (
        <span
          key={p.id}
          className={`absolute text-goldlight opacity-0${go ? " animate-burst-out" : ""}`}
          style={{
            "--bx": `${p.bx}px`,
            "--by": `${p.by}px`,
            "--br": `${p.br}deg`,
            fontSize: p.size,
          }}
        >
          {p.symbol}
        </span>
      ))}
    </div>
  );
}

function useCountdown(targetISO) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const target = new Date(targetISO).getTime();

    function tick() {
      const now = Date.now();
      const distance = target - now;
      if (distance < 0) {
        setTimeLeft({ done: true });
        return;
      }
      setTimeLeft({
        done: false,
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetISO]);

  return timeLeft;
}

const floatKeyframesCSS = `
  @keyframes float-flower {
    0%, 100% { transform: translateY(0) rotate(-8deg); }
    50% { transform: translateY(-12px) rotate(-8deg); }
  }
  .animate-float-flower {
    animation: float-flower 10s ease-in-out infinite;
  }

  @keyframes float-photo {
    0%, 100% { transform: translateX(-50%) translateY(-12px) scaleX(-1) rotate(10deg); }
    50% { transform: translateX(-50%) translateY(0) scaleX(-1) rotate(10deg); }
  }
  .animate-float-photo {
    animation: float-photo 10s ease-in-out 5s infinite;
  }
`;

export default function WeddingInvite({
  groomName = "Ahmed",
  brideName = "Yomna",
  weddingDateISO = "2026-10-15T15:00:00",
  weddingDateLabel = "October 15",
  weddingYearLabel = "2026",
  weddingTimeLabel = "3:00 PM",
  venueName = "Heaven Royal Halls",
  hallName = "Cecelia Hall",
  venueAddress = "",
  mapUrl = "https://maps.app.goo.gl/ShC7okxxjvHU7VYH7",
  mapCoords = "31.2317855,29.9450354",
  couplePhoto = "/yomnaAhmed.jpeg",
  weddingDayLabel = "Thursday",
  receptionWelcomeTime = "17:00",
  receptionTime = "19:30",
  backgroundMusicSrc = "/music.mp3",
}) {
  const [coverOpening, setCoverOpening] = useState(false);
  const [coverHidden, setCoverHidden] = useState(false);
  const [showCover, setShowCover] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [burstGo, setBurstGo] = useState(false);

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }

  const [wishName, setWishName] = useState("");
  const [wishMessage, setWishMessage] = useState("");
  const [wishes, setWishes] = useState([]);
  const [wishSent, setWishSent] = useState(false);

  // الرسايل بتظهر بس لو الرابط فيه ?couple=المفتاح_السري
  const coupleKey =
    new URLSearchParams(window.location.search).get("couple") || "";
  const isCouple = coupleKey !== "";

  // تحميل الرسايل المحفوظة في الشيت
  useEffect(() => {
    if (!SHEET_URL || !isCouple) return;
    fetch(`${SHEET_URL}?key=${encodeURIComponent(coupleKey)}`)
      .then((r) => r.json())
      .then((rows) => {
        if (!Array.isArray(rows)) return;
        setWishes(
          rows.map((r, i) => ({
            id: i + 1,
            name: String(r.name ?? ""),
            message: String(r.message ?? ""),
            date: r.date ? new Date(r.date).toLocaleString("en-US") : "",
          })),
        );
      })
      .catch(() => {});
  }, []);

  function handleWishSubmit(e) {
    e.preventDefault();
    if (!wishName.trim() || !wishMessage.trim()) return;
    if (SHEET_URL) {
      fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          name: wishName.trim(),
          message: wishMessage.trim(),
        }),
      }).catch(() => {});
    }
    if (isCouple) {
      setWishes((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: wishName.trim(),
          message: wishMessage.trim(),
          date: new Date().toLocaleString("en-US"),
        },
      ]);
    }
    setWishSent(true);
    setWishName("");
    setWishMessage("");
  }

  const timeLeft = useCountdown(weddingDateISO);

  const weddingDateObj = new Date(weddingDateISO);
  const receptionDay = weddingDateObj.getDate();
  const receptionMonthName = weddingDateObj.toLocaleDateString("en-US", {
    month: "long",
  });
  const receptionYear = weddingDateObj.getFullYear();
  const receptionWeekday = weddingDateObj
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();
  const calendarWeeks = buildCalendarWeeks(
    receptionYear,
    weddingDateObj.getMonth(),
  );

  function handleAddToCalendar() {
    const start = weddingDateObj
      .toISOString()
      .replace(/[-:]/g, "")
      .split(".")[0];
    const end = new Date(weddingDateObj.getTime() + 3 * 60 * 60 * 1000)
      .toISOString()
      .replace(/[-:]/g, "")
      .split(".")[0];
    const details = encodeURIComponent(
      `Wedding reception of ${groomName} & ${brideName} at ${hallName}, ${venueName}`,
    );
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `${groomName} & ${brideName}'s Wedding`,
    )}&dates=${start}Z/${end}Z&details=${details}&location=${encodeURIComponent(
      venueAddress || `${hallName}, ${venueName}`,
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleOpen() {
    // burst
    requestAnimationFrame(() => setBurstGo(true));
    // shrink card
    setCoverOpening(true);
    // reveal main invite
    setTimeout(() => setRevealed(true), 200);
    // fade out cover
    setTimeout(() => setCoverHidden(true), 650);
    // unmount cover
    setTimeout(() => setShowCover(false), 1300);
    // start background music
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-start justify-center overflow-x-hidden bg-[linear-gradient(180deg,#f3ece0_0%,#eee3d0_100%)] font-amiri text-burgundydark [&_*]:box-border">
      <style>{floatKeyframesCSS}</style>

      <audio ref={audioRef} src={backgroundMusicSrc} loop preload="none" />

      <button
        type="button"
        onClick={toggleMusic}
        aria-label={isPlaying ? "Pause music" : "Play music"}
        className="fixed bottom-5 right-5 z-[200] flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#5e1a24,#3d1017)] text-goldlight shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition-transform active:scale-90"
      >
        <span
          className={`text-[1.3rem] ${isPlaying ? "animate-pulse" : ""}`}
        >
          {isPlaying ? "♪" : "♫"}
        </span>
      </button>

      {showCover && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_30%,#7a1f2c_0%,#3d1017_65%,#2a0a0f_100%)] p-5 transition-opacity duration-[600ms] ease-in-out ${
            coverHidden ? "pointer-events-none invisible opacity-0" : ""
          }`}
        >
          <FloatingHearts />

          <div
            className={`relative z-[2] w-full max-w-[480px] overflow-visible rounded-[14px] border border-[#e3d6bd] bg-cream px-[30px] pb-10 pt-14 text-center shadow-[0_25px_70px_rgba(0,0,0,0.5)] transition-[transform,opacity] duration-500 ease-out ${
              coverOpening ? "scale-[0.15] opacity-0" : ""
            }`}
          >
            <BurstPetals go={burstGo} />

            <img
              src="/flower2-decoration.webp"
              alt=""
              className="pointer-events-none absolute left-[-22px] top-[-22px] z-0 w-[120px] max-w-[32%] opacity-95"
            />
            <img
              src="/flower2-decoration.webp"
              alt=""
              className="pointer-events-none absolute bottom-[-22px] right-[-22px] z-0 w-[120px] max-w-[32%] rotate-180 opacity-95"
            />

            <div className="relative z-[2]">
              <div className="absolute left-1/2 top-[-65px] z-[2] flex h-16 w-16 animate-pulse-heart items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#5e1a24_0%,#3d1017_100%)] shadow-[0_8px_20px_rgba(94,26,36,0.4)]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-[26px] w-[26px] fill-white"
                >
                  <path d="M12 21s-6.7-4.35-9.3-8.1C.9 10.1 1.4 6.6 4.2 5c2.2-1.25 4.7-.6 6.1 1.3.6.8 1 .8 1.4 0C13.1 4.4 15.6 3.75 17.8 5c2.8 1.6 3.3 5.1 1.5 7.9C18.7 16.65 12 21 12 21z" />
                </svg>
              </div>

              <div className="mt-14 text-burgundy">
                <div className="font-aref text-[2.5rem] leading-tight">
                  {groomName}
                </div>
                <div className="my-1 font-amiri text-[1.1rem] leading-tight">
                  &amp;
                </div>
                <div className="font-aref text-[2.5rem] leading-tight">
                  {brideName}
                </div>
              </div>

              <div className="mt-4 mb-[14px] flex items-center justify-center gap-2">
                <span className="h-px w-[52px] bg-gold opacity-60"></span>
                <span className="text-[0.85rem] text-gold">✦</span>
                <span className="h-px w-[52px] bg-gold opacity-60"></span>
              </div>

              <div className="mb-[18px] font-amiri text-[1.05rem] tracking-[0.5px] text-[#8a6a45]">
                {weddingDateLabel}, {weddingYearLabel}
              </div>
              <div className="mb-[26px] text-base text-[#9c8460]">
                With all our love, they invite you
              </div>

              <button
                className="inline-block rounded-full bg-[linear-gradient(135deg,#5e1a24,#3d1017)] px-12 py-[13px] font-amiri text-[1.05rem] font-bold tracking-[1px] text-goldlight shadow-[0_8px_20px_rgba(94,26,36,0.4)] transition-transform duration-200 active:scale-95"
                onClick={handleOpen}
              >
                Open Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`flex w-full justify-center px-[10px] py-5 transition-[opacity,transform] duration-500 delay-150 ease-in-out ${
          revealed ? "scale-100 opacity-100" : "scale-[0.92] opacity-0"
        }`}
      >
        <div className="relative w-full max-w-[520px] overflow-hidden rounded-[14px] border border-[#e3d6bd] bg-cream shadow-[0_20px_60px_rgba(94,26,36,0.25)]">
          {/* Save the Date section: envelope illustration + couple names */}
          <div className="relative overflow-hidden px-5 pb-10 pt-10 text-center">
            {/* faint castle illustration, sits behind everything in this section */}
            <img
              src="/castle-background.webp"
              alt=""
              className="pointer-events-none absolute bottom-0 left-1/2 z-0 w-[420px] max-w-none -translate-x-1/2 opacity-[0.12]"
            />

            <div className="relative z-[1]">
              <div className="mb-8 font-amiri text-[0.8rem] tracking-[5px] text-burgundy">
                SAVE&nbsp;THE&nbsp;DATE
              </div>

              <div className="relative mx-auto flex h-[300px] w-full max-w-[300px] items-end justify-center">
                {/* back of envelope + lace flap */}
                <img
                  src="/envelope-background.webp"
                  alt=""
                  className="pointer-events-none absolute bottom-0 left-1/2 z-0 w-[260px] -translate-x-1/2"
                />

                {/* floral accent, peeking above the envelope opening, floats up/down */}
                <img
                  src="/flower2-decoration.webp"
                  alt=""
                  className="animate-float-flower pointer-events-none absolute bottom-[70px] left-[1%] z-[2] w-[120px] opacity-95"
                />

                {/* tilted couple photo, tucked into the envelope, mirrored horizontally,
                    floats in the opposite phase from the flower */}
                <img
                  src={couplePhoto}
                  alt={`${groomName} & ${brideName}`}
                  className="animate-float-photo absolute bottom-[70px] left-[55%] z-[1] w-[140px] rounded-[2px] border-[5px] border-white object-cover shadow-[0_10px_20px_rgba(0,0,0,0.25)]"
                  style={{ aspectRatio: "2 / 3" }}
                />

                {/* front pocket flaps + wax seal, layered on top so the photo looks tucked in */}
                <img
                  src="/envelope-cover.webp"
                  alt=""
                  className="pointer-events-none absolute bottom-0 left-1/2 z-[3] w-[260px] -translate-x-1/2"
                />
              </div>

              <div className="mt-10 text-burgundy">
                <div className="font-aref text-[2.6rem] leading-tight">
                  {groomName}
                </div>
                <div className="my-1 font-amiri text-[1.2rem] leading-tight">
                  &amp;
                </div>
                <div className="font-aref text-[2.6rem] leading-tight">
                  {brideName}
                </div>
              </div>
            </div>
          </div>

          {/* Ceremony Info card: couple names, ceremony time & day,
              with floral decoration spilling over the bottom-right corner */}
          <div className="relative px-5 pb-8 pt-2">
            <div className="relative overflow-visible rounded-[16px] bg-[linear-gradient(180deg,#5e1a24_0%,#3d1017_100%)] px-6 py-8 text-center shadow-[0_15px_40px_rgba(94,26,36,0.3)]">
              <div className="mb-5 text-[0.85rem] font-bold tracking-[3px] text-goldlight">
                CEREMONY&nbsp;INFO
              </div>

              <p className="mx-auto mb-8 max-w-[300px] text-[0.85rem] leading-[1.7] text-[#e8d9c0]">
                Please join us as we celebrate
                <br />
                the beginning of our life together
              </p>

              <div className="mb-8 font-aref text-[2rem] leading-tight text-goldlight">
                {groomName}
                <div className="my-2 font-amiri text-[1rem]">&amp;</div>
                {brideName}
              </div>

              <div className="text-[0.8rem] tracking-[2px] text-goldlight">
                WEDDING&nbsp;CEREMONY
              </div>
              <div className="mb-4 text-[0.95rem] text-[#e8d9c0]">
                {venueName}
                <br />
                {hallName}
              </div>

              <div className="flex items-center justify-center gap-8 text-[0.85rem] tracking-[1px] text-[#e8d9c0]">
                <div>
                  <div className="text-[0.7rem] opacity-70">AT</div>
                  <div className="font-bold">{weddingTimeLabel}</div>
                </div>
                <div>
                  <div className="text-[0.7rem] opacity-70">DAY</div>
                  <div className="font-bold">{weddingDayLabel}</div>
                </div>
              </div>

              {/* floral decoration spilling over the bottom-right corner */}
              <img
                src="/flower2-decoration.webp"
                alt=""
                className="pointer-events-none absolute bottom-[-14px] right-[-14px] z-[2] w-[140px] rotate-[6deg] opacity-95"
              />
            </div>
          </div>

          <div className="relative overflow-hidden bg-[linear-gradient(180deg,#5e1a24_0%,#3d1017_100%)] px-6 py-9 text-center">
            <img
              src="/flower2-decoration.webp"
              alt=""
              className="pointer-events-none absolute left-[-30px] top-6 z-0 w-[150px] opacity-90"
            />

            <div className="relative z-[1]">
              <div className="mb-6 text-[0.85rem] font-bold tracking-[3px] text-goldlight">
                RECEPTION&nbsp;INFO
              </div>

              <div className="mb-6 font-amiri text-[1.15rem] font-bold uppercase tracking-[1px] text-[#f2e6cf]">
                The reception will take place at:
              </div>

              <div className="mb-5 flex items-center justify-center gap-3 text-[0.85rem] tracking-[2px] text-[#e8d9c0]">
                <span className="font-bold">{receptionWeekday}</span>
                <span className="opacity-50">·</span>
                <span>{weddingTimeLabel.replace(/\s?[AP]M/i, "")}</span>
              </div>

              <div className="mb-6 flex items-center justify-center gap-4">
                <span className="font-aref text-[3rem] leading-none text-goldlight">
                  {receptionDay}
                </span>
                <span className="h-12 w-px bg-[rgba(212,175,122,0.4)]"></span>
                <span className="text-left text-[0.95rem] uppercase tracking-[1px] text-[#e8d9c0]">
                  {receptionMonthName}
                  <br />
                  {receptionYear}
                </span>
              </div>

              <div className="mx-auto mb-7 flex max-w-[260px] justify-around text-[0.8rem] text-[#e8d9c0]">
                <div>
                  <div className="mb-1 tracking-[1px] opacity-75">
                    WELCOME
                  </div>
                  <div className="font-bold">{receptionWelcomeTime}</div>
                </div>
                <div>
                  <div className="mb-1 tracking-[1px] opacity-75">
                    RECEPTION
                  </div>
                  <div className="font-bold">{receptionTime}</div>
                </div>
              </div>

              {/* Countdown */}
              <div className="mb-8">
                <div className="mb-3 text-[0.8rem] tracking-[1px] text-[#e8d9c0] opacity-75">
                  Countdown
                </div>
                {timeLeft?.done ? (
                  <div className="font-aref text-[1.2rem] text-goldlight">
                    The day is here 🎉
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <div className="min-w-[56px] rounded-lg bg-cream px-[6px] py-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                      <span className="block text-[1.3rem] font-bold text-burgundy">
                        {timeLeft?.days ?? "--"}
                      </span>
                      <span className="text-[0.62rem] tracking-[1px] text-[#9c8460]">
                        Days
                      </span>
                    </div>
                    <div className="min-w-[56px] rounded-lg bg-cream px-[6px] py-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                      <span className="block text-[1.3rem] font-bold text-burgundy">
                        {timeLeft?.hours ?? "--"}
                      </span>
                      <span className="text-[0.62rem] tracking-[1px] text-[#9c8460]">
                        Hours
                      </span>
                    </div>
                    <div className="min-w-[56px] rounded-lg bg-cream px-[6px] py-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                      <span className="block text-[1.3rem] font-bold text-burgundy">
                        {timeLeft?.minutes ?? "--"}
                      </span>
                      <span className="text-[0.62rem] tracking-[1px] text-[#9c8460]">
                        Minutes
                      </span>
                    </div>
                    <div className="min-w-[56px] rounded-lg bg-cream px-[6px] py-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                      <span className="block text-[1.3rem] font-bold text-burgundy">
                        {timeLeft?.seconds ?? "--"}
                      </span>
                      <span className="text-[0.62rem] tracking-[1px] text-[#9c8460]">
                        Seconds
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mx-auto max-w-[300px] rounded-[12px] bg-cream px-4 py-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="mb-3 font-aref text-[1.2rem] italic text-burgundy">
                  {receptionMonthName} {receptionYear}
                </div>
                <div className="mb-2 grid grid-cols-7 border-b border-[#d8c39a] pb-2 text-[0.7rem] tracking-[1px] text-[#9c8460]">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-2 text-[0.8rem] text-burgundydark">
                  {calendarWeeks.flat().map((day, idx) =>
                    day === null ? (
                      <div key={idx}></div>
                    ) : day === receptionDay ? (
                      <div key={idx} className="flex justify-center">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-burgundy text-[0.72rem] font-bold text-goldlight">
                          {day}
                        </span>
                      </div>
                    ) : (
                      <div key={idx}>{day}</div>
                    ),
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCalendar}
                className="mt-6 text-[0.85rem] font-bold uppercase tracking-[1px] text-goldlight underline underline-offset-4"
              >
                Add to Calendar
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden px-5 pb-10 pt-9 text-center">
            <img
              src="/castle-background.webp"
              alt=""
              className="pointer-events-none absolute bottom-0 left-1/2 z-0 w-[420px] max-w-none -translate-x-1/2 opacity-[0.1]"
            />

            <div className="relative z-[1]">
              <div className="mb-2 font-amiri text-[0.95rem] font-bold tracking-[2px] text-burgundy">
                WEDDING&nbsp;RECEPTION&nbsp;VENUE
              </div>
              <div
                className={`text-[0.95rem] text-burgundydark ${venueAddress ? "mb-1" : "mb-5"}`}
              >
                {venueName}
                <br />
                {hallName}
              </div>
              {venueAddress && (
                <div className="mb-5 text-[0.85rem] text-[#7a5c3e]">
                  {venueAddress}
                </div>
              )}

              <div className="mx-auto mb-5 max-w-[420px] overflow-hidden rounded-[12px] border border-[#e3d6bd] shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
                <iframe
                  title="Wedding reception venue map"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    mapCoords || `${venueName} ${venueAddress}`.trim(),
                  )}&z=17&output=embed`}
                  className="h-[260px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>

              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[0.85rem] font-bold text-burgundy underline underline-offset-4"
              >
                ➹ Get directions
              </a>
            </div>
          </div>

          <div className="relative overflow-hidden px-5 pb-10 pt-9 text-center">
            <img
              src="/flower2-decoration.webp"
              alt=""
              className="pointer-events-none absolute bottom-[-10px] left-[-30px] z-0 w-[150px] rotate-[-10deg] opacity-95"
            />

            <div className="relative z-[1] mx-auto max-w-[420px] rounded-[16px] border border-[#e6d7b8] bg-white/70 px-6 py-8 shadow-[0_10px_30px_rgba(94,26,36,0.1)]">
              <div className="mb-6 font-aref text-[1.5rem] text-burgundy">
                Guestbook
              </div>

              <form onSubmit={handleWishSubmit} className="text-left">
                <input
                  type="text"
                  placeholder="Enter your name*"
                  required
                  value={wishName}
                  onChange={(e) => setWishName(e.target.value)}
                  className="mb-3 w-full rounded-md border border-[#c9a876] bg-transparent px-[14px] py-[10px] font-amiri text-[0.95rem] text-burgundydark placeholder:text-[#b9a281] focus:border-burgundy focus:outline-none"
                />
                <textarea
                  placeholder="Enter your wishes*"
                  required
                  rows={4}
                  value={wishMessage}
                  onChange={(e) => setWishMessage(e.target.value)}
                  className="mb-4 w-full resize-none rounded-md border border-[#c9a876] bg-transparent px-[14px] py-[10px] font-amiri text-[0.95rem] text-burgundydark placeholder:text-[#b9a281] focus:border-burgundy focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-full bg-[linear-gradient(135deg,#5e1a24,#3d1017)] px-7 py-[11px] text-[0.85rem] font-bold tracking-[1px] text-goldlight shadow-[0_4px_14px_rgba(94,26,36,0.3)] transition-transform duration-150 active:scale-[0.97]"
                  >
                    Send Wishes
                  </button>
                </div>
              </form>
              {wishSent && (
                <p className="mt-4 text-center text-[0.9rem] text-burgundy">
                  Thank you! Your wishes were sent to the couple ♥
                </p>
              )}
            </div>

            {isCouple && (
            <div className="relative z-[1] mx-auto mt-8 max-h-[320px] max-w-[420px] space-y-3 overflow-y-auto pr-1 text-left">
              {wishes
                .slice()
                .reverse()
                .map((w) => (
                  <div
                    key={w.id}
                    className="rounded-[10px] border border-[#e6d7b8] bg-white/80 px-4 py-3 shadow-[0_2px_10px_rgba(94,26,36,0.06)]"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="font-bold text-burgundy">
                        {w.name}
                      </span>
                      <span className="whitespace-nowrap text-[0.72rem] text-[#9c8460]">
                        {w.date}
                      </span>
                    </div>
                    <p className="text-[0.88rem] leading-[1.6] text-burgundydark">
                      {w.message}
                    </p>
                  </div>
                ))}
              {wishes.length === 0 && (
                <p className="text-center text-[0.85rem] text-[#9c8460]">
                  No wishes yet.
                </p>
              )}
            </div>
            )}
          </div>

          <footer className="bg-burgundydark p-[18px] text-center">
            <p className="text-[0.78rem] tracking-[1px] text-goldlight">
              Looking forward to your presence ✦ {weddingYearLabel}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}