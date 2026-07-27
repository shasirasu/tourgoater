import pptxgen from "pptxgenjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Tourgoater Project Team";
pptx.subject = "Tourgoater final project presentation";
pptx.title = "Tourgoater — Plan Clearly. Travel Confidently.";
pptx.company = "Tourgoater";
pptx.lang = "en-IN";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-IN",
};
pptx.defineSlideMaster({
  title: "TOUR",
  background: { color: "FFF9F4" },
  objects: [
    { rect: { x: 0, y: 0, w: 13.333, h: 0.08, fill: { color: "F97316" }, line: { color: "F97316" } } },
    { text: { text: "TOURGOATER", options: { x: 0.55, y: 7.12, w: 2.3, h: 0.2, fontSize: 8, bold: true, color: "F97316", charSpacing: 2, margin: 0 } } },
    { text: { text: "FINAL PROJECT  •  WEEK 12", options: { x: 10.2, y: 7.12, w: 2.55, h: 0.2, fontSize: 8, bold: true, color: "64748B", align: "right", margin: 0 } } },
  ],
  slideNumber: { x: 12.82, y: 7.1, color: "94A3B8", fontSize: 8 },
});

const C = { navy: "0F172A", slate: "475569", muted: "64748B", orange: "F97316", darkOrange: "C2410C", teal: "0F766E", pale: "FFF1E6", white: "FFFFFF", line: "E2E8F0", blue: "2563EB", green: "16A34A", red: "DC2626", amber: "D97706" };
const logo = path.join(root, "public", "images", "branding", "tg-logo.png");
const hero = path.join(root, "public", "images", "listings", "place-maharashtra-mahabaleshwar.jpg");
const island = path.join(root, "public", "images", "listings", "place-andaman-nicobar-havelock-island-swaraj-dweep.jpg");

function title(slide, kicker, heading, sub = "") {
  slide.addText(kicker.toUpperCase(), { x: 0.65, y: 0.42, w: 4.5, h: 0.24, fontSize: 10, bold: true, color: C.orange, charSpacing: 2, margin: 0 });
  slide.addText(heading, { x: 0.65, y: 0.78, w: 12, h: 0.62, fontSize: 27, bold: true, color: C.navy, margin: 0, breakLine: false, fit: "shrink" });
  if (sub) slide.addText(sub, { x: 0.67, y: 1.46, w: 11.7, h: 0.35, fontSize: 12, color: C.muted, margin: 0, fit: "shrink" });
}
function pill(slide, text, x, y, w, color = C.orange) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.36, rectRadius: 0.08, fill: { color }, line: { color }, radius: 0.08 });
  slide.addText(text, { x: x + 0.08, y: y + 0.085, w: w - 0.16, h: 0.16, align: "center", fontSize: 8.5, bold: true, color: C.white, margin: 0, fit: "shrink" });
}
function card(slide, x, y, w, h, heading, body, accent = C.orange) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: C.white }, line: { color: C.line, width: 1 }, shadow: { type: "outer", color: "CBD5E1", opacity: 0.18, blur: 2, angle: 45, distance: 1 } });
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.07, h, fill: { color: accent }, line: { color: accent } });
  slide.addText(heading, { x: x + 0.24, y: y + 0.2, w: w - 0.45, h: 0.28, fontSize: 14, bold: true, color: C.navy, margin: 0, fit: "shrink" });
  slide.addText(body, { x: x + 0.24, y: y + 0.58, w: w - 0.46, h: h - 0.75, fontSize: 10.5, color: C.slate, breakLine: false, margin: 0, valign: "top", fit: "shrink", bullet: body.includes("\n") ? { type: "bullet" } : undefined });
}
function note(slide, text) { if (slide.addNotes) slide.addNotes(text); }

// 1 — Cover
{
  const s = pptx.addSlide();
  s.background = { color: C.navy };
  s.addImage({ path: hero, x: 7.35, y: 0, w: 5.98, h: 7.5, transparency: 12 });
  s.addShape(pptx.ShapeType.rect, { x: 6.1, y: 0, w: 3.3, h: 7.5, fill: { color: C.navy, transparency: 15 }, line: { color: C.navy, transparency: 100 } });
  s.addImage({ path: logo, x: 0.7, y: 0.62, w: 0.72, h: 0.72 });
  s.addText("TOURGOATER", { x: 1.52, y: 0.83, w: 2.2, h: 0.3, fontSize: 15, bold: true, color: C.white, charSpacing: 1.5, margin: 0 });
  s.addText("Plan clearly.\nTravel confidently.", { x: 0.72, y: 2.0, w: 6.35, h: 1.65, fontSize: 38, bold: true, color: C.white, breakLine: false, margin: 0, fit: "shrink" });
  s.addText("A full-stack India travel planner with saved trips, live travel search, booking inquiries, admin workflows and email OTP security.", { x: 0.76, y: 3.95, w: 5.65, h: 0.92, fontSize: 15, color: "CBD5E1", margin: 0, breakLine: false, fit: "shrink" });
  pill(s, "FINAL PROJECT", 0.75, 5.45, 1.55);
  pill(s, "WEEK 12", 2.45, 5.45, 1.25, C.teal);
  s.addText("Project Presentation", { x: 0.76, y: 6.16, w: 3.4, h: 0.3, fontSize: 12, color: "94A3B8", margin: 0 });
  note(s, "Introduce Tourgoater as a complete travel planning and booking-inquiry platform. Explain that the project connects planning, saving, communication and administration in one application.");
}

// 2 — Problem
{
  const s = pptx.addSlide("TOUR"); title(s, "01 • Problem", "Travel planning is fragmented", "Travelers move between many websites and lose control of their budget and decisions.");
  card(s, 0.7, 2.1, 3.8, 2.05, "Too many disconnected tools", "Places, flights, hotels, notes and inquiries are handled in separate applications.", C.red);
  card(s, 4.78, 2.1, 3.8, 2.05, "Unclear total cost", "Base trip spending and transport add-ons are often mixed, making the real budget difficult to understand.", C.amber);
  card(s, 8.86, 2.1, 3.8, 2.05, "No continuous follow-up", "After an inquiry, travelers need a simple way to track status and communicate with an administrator.", C.blue);
  s.addShape(pptx.ShapeType.roundRect, { x: 1.45, y: 4.75, w: 10.4, h: 1.1, fill: { color: C.navy }, line: { color: C.navy }, rectRadius: 0.08 });
  s.addText("Design goal", { x: 1.78, y: 5.02, w: 1.4, h: 0.22, fontSize: 10, bold: true, color: "FDBA74", charSpacing: 1.4, margin: 0 });
  s.addText("One application to discover → plan → save → inquire → track", { x: 3.15, y: 4.94, w: 8.05, h: 0.34, fontSize: 19, bold: true, color: C.white, margin: 0, fit: "shrink" });
  note(s, "State the problem in user language: planning is scattered, costs are unclear, and follow-up is disconnected. Then present the design goal shown at the bottom.");
}

// 3 — Journey
{
  const s = pptx.addSlide("TOUR"); title(s, "02 • Product", "One connected traveler journey", "The same plan continues from discovery through admin communication.");
  const steps = [
    ["01", "Discover", "Browse India destinations"], ["02", "Build", "Places + budget + dates"], ["03", "Add", "Optional flight and hotel"],
    ["04", "Save", "Full plan or places"], ["05", "Inquire", "Submit traveler details"], ["06", "Track", "Status, replies, alerts"],
  ];
  steps.forEach(([n,h,b], i) => {
    const x = 0.65 + i * 2.1;
    s.addShape(pptx.ShapeType.ellipse, { x: x + 0.58, y: 2.15, w: 0.72, h: 0.72, fill: { color: i < 4 ? C.orange : C.teal }, line: { color: C.white, width: 2 } });
    s.addText(n, { x: x + 0.73, y: 2.37, w: 0.42, h: 0.16, align: "center", fontSize: 9, bold: true, color: C.white, margin: 0 });
    if (i < 5) s.addShape(pptx.ShapeType.chevron, { x: x + 1.48, y: 2.35, w: 0.43, h: 0.28, fill: { color: "CBD5E1" }, line: { color: "CBD5E1" } });
    s.addText(h, { x, y: 3.12, w: 1.9, h: 0.3, align: "center", fontSize: 14, bold: true, color: C.navy, margin: 0 });
    s.addText(b, { x, y: 3.54, w: 1.9, h: 0.55, align: "center", fontSize: 10, color: C.slate, margin: 0, fit: "shrink" });
  });
  s.addImage({ path: island, x: 0.72, y: 4.67, w: 3.15, h: 1.65 });
  s.addShape(pptx.ShapeType.roundRect, { x: 4.18, y: 4.67, w: 8.42, h: 1.65, fill: { color: C.pale }, line: { color: "FED7AA" }, rectRadius: 0.06 });
  s.addText("Key product decision", { x: 4.52, y: 4.94, w: 2.1, h: 0.26, fontSize: 11, bold: true, color: C.darkOrange, margin: 0 });
  s.addText("Flights and hotels are optional. Travelers can still create and book a plan without either selection, while travel add-ons remain separate from the base stay-and-activity budget.", { x: 4.52, y: 5.32, w: 7.55, h: 0.68, fontSize: 13, color: C.navy, margin: 0, fit: "shrink" });
}

// 4 — Features
{
  const s = pptx.addSlide("TOUR"); title(s, "03 • Main features", "Built for travelers and administrators", "Two connected experiences share one source of truth.");
  s.addText("TRAVELER", { x: 0.75, y: 2.0, w: 2, h: 0.25, fontSize: 10, bold: true, color: C.orange, charSpacing: 2, margin: 0 });
  s.addText("ADMIN", { x: 7.0, y: 2.0, w: 2, h: 0.25, fontSize: 10, bold: true, color: C.teal, charSpacing: 2, margin: 0 });
  card(s, 0.72, 2.42, 5.62, 1.15, "Plan", "Four-step builder • live search • optional add-ons • itinerary", C.orange);
  card(s, 0.72, 3.76, 5.62, 1.15, "Save & edit", "Full plans • saved places • five-second deletion undo", C.orange);
  card(s, 0.72, 5.1, 5.62, 1.15, "Book & track", "In-app inquiry • conversations • status • notification bell", C.orange);
  card(s, 6.97, 2.42, 5.62, 1.15, "Operate", "Dashboard metrics • destination and catalog management", C.teal);
  card(s, 6.97, 3.76, 5.62, 1.15, "Support", "Review inquiry details • reply to each booking conversation", C.teal);
  card(s, 6.97, 5.1, 5.62, 1.15, "Control", "User roles • status workflow • Neon catalog import", C.teal);
}

// 5 — Technology
{
  const s = pptx.addSlide("TOUR"); title(s, "04 • Technology", "A modern full-stack JavaScript system", "Selected for fast development, clear separation of concerns and production portability.");
  const groups = [
    ["Frontend", "React 19\nReact Router 7\nVite 7\nGSAP + Framer Motion", C.orange],
    ["Backend", "Node.js\nExpress 5\nREST APIs\nNodemailer", C.blue],
    ["Data", "SQLite (local)\nPostgreSQL / Neon\nRuntime migrations\nJSON snapshots", C.teal],
    ["Security & APIs", "JWT\nbcrypt\nGmail SMTP OTP\nSerpAPI", C.amber],
  ];
  groups.forEach(([h,b,a],i) => card(s, 0.72 + i*3.12, 2.15, 2.82, 3.55, h, b, a));
  s.addText("Deployment", { x: 1.0, y: 6.22, w: 1.2, h: 0.25, fontSize: 10, bold: true, color: C.muted, margin: 0 });
  ["Vercel", "Neon", "Gmail SMTP", "SerpAPI"].forEach((v,i) => pill(s, v, 2.15+i*1.55, 6.15, 1.28, i===1?C.teal:C.navy));
}

// 6 — Architecture
{
  const s = pptx.addSlide("TOUR"); title(s, "05 • Architecture", "Layered architecture with external integrations", "Each layer has one clear responsibility.");
  const layers = [
    [0.7, 2.2, 2.55, "Browser / React", "Pages • Components\nTheme • Auth state", C.orange],
    [3.65, 2.2, 2.55, "Express REST API", "Validation • Routes\nBusiness rules", C.blue],
    [6.6, 2.2, 2.55, "Data access", "Shared query layer\nRuntime migration", C.teal],
    [9.55, 2.2, 2.55, "Database", "SQLite locally\nNeon in production", C.navy],
  ];
  layers.forEach(([x,y,w,h,b,a],i) => {
    card(s,x,y,w,1.65,h,b,a);
    if(i<3) s.addShape(pptx.ShapeType.chevron,{x:x+w+0.17,y:2.82,w:0.42,h:0.35,fill:{color:"CBD5E1"},line:{color:"CBD5E1"}});
  });
  s.addShape(pptx.ShapeType.line, { x: 4.92, y: 3.86, w: 0, h: 1.18, line: { color: C.blue, width: 2, beginArrowType: "none", endArrowType: "triangle" } });
  card(s, 2.75, 5.05, 2.65, 1.08, "Gmail SMTP", "Signup and reset OTP", C.red);
  card(s, 5.68, 5.05, 2.65, 1.08, "SerpAPI", "Live flights and hotels", C.amber);
  card(s, 8.62, 5.05, 2.65, 1.08, "Vercel", "Frontend + serverless API", C.navy);
  s.addText("JWT bearer token", { x: 1.42, y: 4.28, w: 2.1, h: 0.25, fontSize: 10, bold: true, color: C.orange, margin: 0 });
  s.addText("Environment variables protect credentials and select local or production infrastructure.", { x: 3.38, y: 6.47, w: 6.6, h: 0.28, align: "center", fontSize: 10, color: C.muted, margin: 0 });
  note(s, "Explain the request path from left to right. React calls /api, Express validates the JWT and request, the data layer chooses SQLite or PostgreSQL, and external services are called only by the server.");
}

// 7 — Database
{
  const s = pptx.addSlide("TOUR"); title(s, "06 • Database", "Relational core with immutable trip snapshots", "Foreign keys connect every user-owned record and cascade cleanup safely.");
  const entities = [
    [0.7, 2.1, "users", "id • email • role\npassword_hash • verified", C.navy],
    [3.42, 1.9, "saved_plans", "user_id • destination\nplace_name", C.orange],
    [3.42, 3.35, "saved_trip_plans", "user_id • places_json\nflight_json • hotel_json\nbudget • total", C.orange],
    [6.55, 2.25, "booking_inquiries", "user_id • booking_json\ntraveler details • status\noverall_total", C.teal],
    [9.85, 2.25, "booking_inquiry_messages", "booking_inquiry_id\nsender • message\nread_at", C.blue],
    [0.7, 4.65, "OTP challenges", "signup + password reset\nhash • expiry • attempts", C.red],
    [6.55, 5.05, "catalog_*", "destinations • places • hotels", C.amber],
  ];
  entities.forEach(([x,y,h,b,a]) => card(s,x,y,x===9.85?2.75:2.45,x===0.7&&y>4?1.3:1.45,h,b,a));
  [[3.15,2.72,0.27,-0.08],[3.15,2.78,0.27,1.18],[5.87,4.0,0.68,-0.85],[9.0,2.95,0.85,0]].forEach(([x,y,w,h])=>s.addShape(pptx.ShapeType.line,{x,y,w,h,line:{color:"94A3B8",width:1.5,endArrowType:"triangle"}}));
  s.addText("1 user → many plans and inquiries", { x: 0.78, y: 6.38, w: 3.1, h: 0.24, fontSize: 10, bold: true, color: C.slate, margin: 0 });
  s.addText("1 inquiry → many messages", { x: 9.55, y: 4.45, w: 2.7, h: 0.24, fontSize: 10, bold: true, color: C.slate, margin: 0 });
  note(s, "Point out booking_json and the saved plan JSON fields. They preserve exactly what the traveler selected at that time, even if the catalog changes later.");
}

// 8 — Auth/security
{
  const s = pptx.addSlide("TOUR"); title(s, "07 • Trust & security", "Authentication designed around verified ownership", "Passwords and OTPs are never stored as readable text.");
  const flow = [["1","Sign up","Normalize email"],["2","Send OTP","Gmail SMTP"],["3","Verify","Hashed code + expiry"],["4","Authenticate","JWT bearer token"],["5","Authorize","User or admin role"]];
  flow.forEach(([n,h,b],i)=>{
    const x=0.76+i*2.5;
    s.addShape(pptx.ShapeType.roundRect,{x,y:2.22,w:2.05,h:1.55,fill:{color:i===4?"ECFDF5":C.white},line:{color:i===4?"86EFAC":C.line},rectRadius:0.06});
    s.addText(n,{x:x+0.18,y:2.43,w:0.35,h:0.3,fontSize:18,bold:true,color:i===4?C.green:C.orange,margin:0});
    s.addText(h,{x:x+0.18,y:2.91,w:1.65,h:0.24,fontSize:13,bold:true,color:C.navy,margin:0});
    s.addText(b,{x:x+0.18,y:3.3,w:1.65,h:0.22,fontSize:9.5,color:C.muted,margin:0,fit:"shrink"});
  });
  card(s,0.78,4.48,3.72,1.5,"Protected data","JWT middleware limits plans, bookings and messages to their owner.",C.blue);
  card(s,4.82,4.48,3.72,1.5,"Admin boundary","Admin middleware protects catalog, user and inquiry management.",C.teal);
  card(s,8.86,4.48,3.72,1.5,"Secret handling","SMTP, JWT, database and API credentials remain in environment variables.",C.red);
}

// 9 — Demo
{
  const s = pptx.addSlide("TOUR"); title(s, "08 • Live demonstration", "A focused 5-minute product walkthrough", "Use one traveler account and one admin account in separate browser sessions.");
  const demo = [
    ["00:00", "Sign in", "Show verified login and light/dark preference"],
    ["00:35", "Build a plan", "Select places, budget and optional travel add-ons"],
    ["01:45", "Save & edit", "Save the plan, open Saved Plans and edit it"],
    ["02:35", "Submit inquiry", "Enter traveler details and show completion animation"],
    ["03:25", "Admin action", "Open inquiry, change status and send reply"],
    ["04:20", "Close the loop", "Show user notification and booking conversation"],
  ];
  demo.forEach(([t,h,b],i)=>{
    const y=1.95+i*0.77;
    s.addText(t,{x:0.75,y:y+0.12,w:0.8,h:0.2,fontSize:10,bold:true,color:C.orange,margin:0});
    s.addShape(pptx.ShapeType.ellipse,{x:1.68,y:y+0.08,w:0.28,h:0.28,fill:{color:i<4?C.orange:C.teal},line:{color:C.white,width:1}});
    if(i<5)s.addShape(pptx.ShapeType.line,{x:1.82,y:y+0.35,w:0,h:0.5,line:{color:"CBD5E1",width:2}});
    s.addText(h,{x:2.18,y,w:2.25,h:0.26,fontSize:13,bold:true,color:C.navy,margin:0});
    s.addText(b,{x:4.42,y:y+0.02,w:7.55,h:0.26,fontSize:11,color:C.slate,margin:0,fit:"shrink"});
  });
  s.addShape(pptx.ShapeType.roundRect,{x:8.85,y:6.42,w:3.62,h:0.42,fill:{color:C.navy},line:{color:C.navy},rectRadius:0.04});
  s.addText("Backup: screenshots + README flow",{x:9.02,y:6.55,w:3.25,h:0.16,fontSize:8.5,bold:true,color:C.white,align:"center",margin:0});
  note(s, "Keep the demo short. Prepare accounts before presenting. If a live external API fails, explain the dependency and continue with saved data or screenshots.");
}

// 10 — Challenges
{
  const s = pptx.addSlide("TOUR"); title(s, "09 • Challenges and solutions", "Engineering decisions shaped by real failures", "Each problem produced a reusable improvement in the system.");
  const rows = [
    ["Gmail OTP failed in deployment", "Separated environment-variable names/values, used App Passwords, and added explicit server errors."],
    ["SQLite rejected complex values", "Serialized plan, flight and hotel snapshots to JSON before parameter binding."],
    ["Travel options blocked completion", "Made flights and hotels optional while preserving a clear add-on budget model."],
    ["Accidental plan deletion", "Added optimistic removal with a five-second Undo window before permanent deletion."],
    ["Admin replies were invisible", "Added per-booking messages, read timestamps, polling and an unread notification badge."],
  ];
  s.addText("CHALLENGE",{x:0.78,y:1.94,w:3.25,h:0.24,fontSize:9,bold:true,color:C.red,charSpacing:1.4,margin:0});
  s.addText("SOLUTION",{x:4.75,y:1.94,w:3.25,h:0.24,fontSize:9,bold:true,color:C.teal,charSpacing:1.4,margin:0});
  rows.forEach(([a,b],i)=>{
    const y=2.34+i*0.83;
    s.addShape(pptx.ShapeType.roundRect,{x:0.72,y,w:3.55,h:0.61,fill:{color:"FFF1F2"},line:{color:"FECDD3"},rectRadius:0.04});
    s.addText(a,{x:0.92,y:y+0.17,w:3.15,h:0.22,fontSize:10.5,bold:true,color:"9F1239",margin:0,fit:"shrink"});
    s.addShape(pptx.ShapeType.chevron,{x:4.4,y:y+0.17,w:0.3,h:0.28,fill:{color:"CBD5E1"},line:{color:"CBD5E1"}});
    s.addShape(pptx.ShapeType.roundRect,{x:4.84,y,w:7.72,h:0.61,fill:{color:"F0FDFA"},line:{color:"99F6E4"},rectRadius:0.04});
    s.addText(b,{x:5.05,y:y+0.13,w:7.27,h:0.31,fontSize:10.5,color:"115E59",margin:0,fit:"shrink"});
  });
}

// 11 — Future
{
  const s = pptx.addSlide("TOUR"); title(s, "10 • Future improvements", "From inquiry platform to travel ecosystem", "The roadmap prioritizes reliability before adding commercial capabilities.");
  const stages=[
    ["NOW","Stabilize","Automated tests\nFix ESLint setup\nBundle code splitting\nMonitoring",C.orange],
    ["NEXT","Enhance","Browser push alerts\nMap-based itinerary\nAccessibility audit\nBetter search cache",C.blue],
    ["LATER","Scale","Payment gateway\nProvider booking APIs\nCancellation workflow\nRecommendations",C.teal],
  ];
  stages.forEach(([tag,h,b,a],i)=>{
    const x=0.8+i*4.15;
    pill(s,tag,x,2.05,0.92,a);
    card(s,x,2.62,3.65,3.15,h,b,a);
    if(i<2)s.addShape(pptx.ShapeType.chevron,{x:x+3.77,y:3.92,w:0.3,h:0.34,fill:{color:"CBD5E1"},line:{color:"CBD5E1"}});
  });
  s.addText("Principle: protect traveler trust as functionality grows.",{x:3.45,y:6.3,w:6.45,h:0.34,fontSize:14,bold:true,color:C.navy,align:"center",margin:0});
}

// 12 — Close
{
  const s=pptx.addSlide(); s.background={color:C.navy};
  s.addImage({path:logo,x:6.17,y:0.65,w:1,h:1});
  s.addText("TOURGOATER",{x:5.12,y:1.83,w:3.1,h:0.3,fontSize:14,bold:true,color:C.orange,charSpacing:2,align:"center",margin:0});
  s.addText("One plan. One budget.\nOne conversation.",{x:2.05,y:2.48,w:9.23,h:1.28,fontSize:34,bold:true,color:C.white,align:"center",margin:0,fit:"shrink"});
  s.addText("A working full-stack foundation for confident travel planning across India.",{x:3.12,y:4.12,w:7.1,h:0.5,fontSize:15,color:"CBD5E1",align:"center",margin:0,fit:"shrink"});
  s.addShape(pptx.ShapeType.line,{x:5.25,y:5.1,w:2.84,h:0,line:{color:C.orange,width:3}});
  s.addText("THANK YOU  •  QUESTIONS?",{x:4.22,y:5.5,w:4.9,h:0.3,fontSize:13,bold:true,color:C.white,charSpacing:1.8,align:"center",margin:0});
  s.addText("React • Express • SQLite/PostgreSQL • Gmail OTP • SerpAPI",{x:3.1,y:6.73,w:7.15,h:0.22,fontSize:9,color:"94A3B8",align:"center",margin:0});
  note(s,"Invite questions. If asked about the strongest feature, highlight the complete inquiry loop: traveler submits, admin replies, user receives a persistent notification.");
}

const output = path.join(root, "Tourgoater_Final_Project_Presentation.pptx");
await pptx.writeFile({ fileName: output });
console.log(output);
