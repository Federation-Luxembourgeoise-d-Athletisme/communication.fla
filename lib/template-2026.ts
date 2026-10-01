import type { Canal, PubType, RecurrenceRule } from "@/lib/domain";

// Rythme du « calendrier type communication 2026 » de la fédération.
export const TEMPLATE_2026: { titre: string; type: PubType; canaux: Canal[]; rule: RecurrenceRule }[] = [
  { titre: "Les résultats du week-end", type: "post", canaux: ["fb", "ig"], rule: { kind: "weekly", dow: 1 } },
  { titre: "Post photos FLA", type: "post", canaux: ["fb", "ig"], rule: { kind: "weekly", dow: 3 } },
  { titre: "Le baromètre de l'athlétisme", type: "story", canaux: ["ig", "fb"], rule: { kind: "weekly", dow: 4 } },
  { titre: "La newsletter des licenciés", type: "newsletter", canaux: ["email"], rule: { kind: "monthly", dow: 4, nth: [3] } },
  { titre: "Le calendrier du mois prochain", type: "post", canaux: ["fb", "ig", "li"], rule: { kind: "last", dow: 4 } },
  { titre: "Le calendrier des formations", type: "post", canaux: ["fb", "ig", "li"], rule: { kind: "monthly", dow: 5, nth: [1] } },
  { titre: "Memories – Point histoire", type: "post", canaux: ["fb", "ig"], rule: { kind: "monthly", dow: 5, nth: [2, 5] } },
  { titre: "Athlète 360°", type: "video", canaux: ["ig", "fb"], rule: { kind: "monthly", dow: 5, nth: [3] } },
  { titre: "Les tips de l'athlétisme", type: "video", canaux: ["ig"], rule: { kind: "monthly", dow: 5, nth: [4] } },
];
